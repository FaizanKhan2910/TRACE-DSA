"""TRACE API — Qdrant retrieval and Groq answer generation."""

from __future__ import annotations

import json
import os
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

from kdsa import config
from kdsa.index import get_client
from kdsa.search import search, deep_search


def _json_response(handler, status: int, payload: dict) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.end_headers()
    handler.wfile.write(body)


def _fmt_timestamp(seconds: float) -> str:
    seconds = max(0, int(seconds))
    hours, remainder = divmod(seconds, 3600)
    minutes, secs = divmod(remainder, 60)

    if hours:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes}:{secs:02d}"


def _excerpt(chunk, score: float, rank: int) -> dict:
    start = float(getattr(chunk, "start", 0.0) or 0.0)
    end = float(getattr(chunk, "end", 0.0) or 0.0)
    video_id = getattr(chunk, "video_id", "") or ""
    url = getattr(chunk, "url", "") or ""

    # If the stored URL has no timestamp, append one.
    if url and "t=" not in url:
        separator = "&" if "?" in url else "?"
        url = f"{url}{separator}t={int(start)}"

    return {
        "rank": rank,
        "score": float(score),
        "video_id": video_id,
        "video_title": getattr(chunk, "video_title", "") or "",
        "chunk_index": int(getattr(chunk, "chunk_index", 0) or 0),
        "start_sec": int(start),
        "end_sec": int(end),
        "timestamp": _fmt_timestamp(start),
        "url": url,
        "snippet": getattr(chunk, "text", "") or "",
        "transcript_text": getattr(chunk, "text", "") or "",
    }


def _generate_answer(query: str, excerpts: list[dict], deep: bool) -> str:
    """Generate an answer grounded only in the retrieved transcript excerpts."""
    if not config.GROQ_API_KEY:
        return "Groq answer generation is unavailable: GROQ_API_KEY is not configured."

    import openai
    from openai import OpenAI

    context = "\n\n".join(
        f"[{item['rank']}] {item['video_title']} "
        f"@ {item['timestamp']}:\n{item['transcript_text']}"
        for item in excerpts
    )

    if deep:
        system_prompt = (
            "You are an expert teaching assistant for Kunal Kushwaha's Java and "
            "Data Structures & Algorithms YouTube course. Give a comprehensive "
            "explanation using ONLY the numbered excerpts. Fix obvious caption "
            "errors without inventing facts. Cite excerpt claims as [n]. If the "
            "excerpts only partly cover the question, explain what is covered "
            "and list missing parts under 'Not covered:'. If none of the topics "
            "are mentioned, reply exactly: 'not covered in this playlist'."
        )
    else:
        system_prompt = (
            "You are a teaching assistant for Kunal Kushwaha's Java and Data "
            "Structures & Algorithms YouTube course. Answer using ONLY the "
            "numbered excerpts. Fix obvious caption errors without inventing "
            "facts. Cite claims as [n]. If the excerpts only partly cover the "
            "question, explain what is covered and list missing parts under "
            "'Not covered:'. If none of the topics are mentioned, reply exactly: "
            "'not covered in this playlist'."
        )

    client = OpenAI(
        api_key=config.GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
        timeout=60.0,
        max_retries=2,
    )

    models_to_try = [config.LLM_MODEL]
    fallback_model = "llama-3.3-70b-versatile"
    if fallback_model not in models_to_try:
        models_to_try.append(fallback_model)

    last_error = None

    for model_name in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": f"EXCERPTS:\n{context}\n\nQUESTION: {query}",
                    },
                ],
                temperature=0.2,
                max_tokens=800,
            )

            if response.choices:
                return response.choices[0].message.content or ""
            return ""

        except (openai.APIError, openai.APIConnectionError, openai.APITimeoutError) as exc:
            last_error = exc

    raise RuntimeError(
        f"Groq answer generation failed: {type(last_error).__name__}: {last_error}"
    )


def _handle_query(payload: dict) -> tuple[int, dict]:
    query = str(payload.get("query", "")).strip()
    if not query:
        return 400, {"ok": False, "error": "Query is required"}

    mode = str(payload.get("mode", "standard")).lower()
    deep = mode == "deep"

    try:
        k = int(payload.get("k", 14 if deep else 8))
        k = max(1, min(k, 30))
        # Match the CLI's standard retrieval behavior. The CLI applies its
        # answer-coverage threshold after retrieval; the API must not discard
        # candidate passages before synthesis.
        threshold = float(payload.get("threshold", 0.60 if deep else 0.0))
    except (TypeError, ValueError):
        return 400, {"ok": False, "error": "Invalid k or threshold value"}

    try:
        if deep:
            results, sub_queries = deep_search(
                query,
                k=k,
                score_threshold=threshold,
                max_per_video=6,
            )
        else:
            results = search(
                query,
                k=k,
                score_threshold=threshold,
                max_per_video=3,
            )
            sub_queries = [query]

        excerpts = [
            _excerpt(chunk, score, rank)
            for rank, (chunk, score) in enumerate(results, start=1)
        ]

        if not excerpts:
            return 200, {
                "ok": True,
                "query": query,
                "mode": mode,
                "answer": "not covered in this playlist",
                "excerpts": [],
                "results": [],
                "sub_queries": sub_queries,
                "top_score": 0.0,
            }

        top_score = max(item["score"] for item in excerpts)

        try:
            answer = _generate_answer(query, excerpts, deep)
            synthesis_error = None
        except Exception as exc:
            print(f"TRACE GROQ ERROR: {exc!r}", flush=True)
            traceback.print_exc()
            answer = (
                "I retrieved relevant lecture excerpts, but answer generation "
                "failed. You can still use the transcript excerpts and timestamps."
            )
            synthesis_error = f"{type(exc).__name__}: {exc}"

        response = {
            "ok": True,
            "query": query,
            "mode": mode,
            "answer": answer,
            "excerpts": excerpts,
            "results": excerpts,
            "sub_queries": sub_queries,
            "top_score": top_score,
        }

        if synthesis_error:
            response["synthesis_error"] = synthesis_error

        return 200, response

    except Exception as exc:
        print(f"TRACE QUERY ERROR: {exc!r}", flush=True)
        traceback.print_exc()
        return 500, {
            "ok": False,
            "error": str(exc),
            "error_type": type(exc).__name__,
        }


class TraceHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"TRACE API: {fmt % args}", flush=True)

    def do_OPTIONS(self):
        _json_response(self, 200, {"ok": True})

    def do_GET(self):
        path = urlparse(self.path).path.rstrip("/") or "/"

        if path == "/":
            return _json_response(
                self,
                200,
                {
                    "name": "TRACE API",
                    "status": "running",
                    "health": "/health",
                    "query": "/api/query",
                },
            )

        if path == "/health":
            try:
                client = get_client()
                collection = client.get_collection(config.COLLECTION)
                count = client.count(
                    collection_name=config.COLLECTION,
                    exact=True,
                ).count

                return _json_response(
                    self,
                    200,
                    {
                        "ok": True,
                        "name": "TRACE API",
                        "status": "healthy",
                        "collection": config.COLLECTION,
                        "vectors": count,
                        "embed_model": config.EMBED_MODEL,
                        "vector_size": 384,
                        "distance": str(collection.config.params.vectors.distance),
                        "synthesis_available": bool(config.GROQ_API_KEY),
                    },
                )

            except Exception as exc:
                print(f"QDRANT HEALTH ERROR: {exc!r}", flush=True)
                traceback.print_exc()
                return _json_response(
                    self,
                    503,
                    {
                        "ok": False,
                        "error": str(exc),
                        "error_type": type(exc).__name__,
                        "collection": config.COLLECTION,
                    },
                )

        return _json_response(
            self,
            404,
            {"ok": False, "error": "Endpoint not found"},
        )

    def do_POST(self):
        path = urlparse(self.path).path.rstrip("/")

        if path != "/api/query":
            return _json_response(
                self,
                404,
                {"ok": False, "error": "Endpoint not found"},
            )

        try:
            content_length = int(self.headers.get("Content-Length", 0))

            if content_length <= 0:
                return _json_response(
                    self, 400, {"ok": False, "error": "Request body is empty"}
                )

            if content_length > 1_000_000:
                return _json_response(
                    self, 413, {"ok": False, "error": "Request body too large"}
                )

            payload = json.loads(
                self.rfile.read(content_length).decode("utf-8")
            )

            if not isinstance(payload, dict):
                return _json_response(
                    self, 400, {"ok": False, "error": "JSON body must be an object"}
                )

            status, response = _handle_query(payload)
            return _json_response(self, status, response)

        except json.JSONDecodeError:
            return _json_response(
                self, 400, {"ok": False, "error": "Invalid JSON"}
            )
        except Exception as exc:
            print(f"TRACE REQUEST ERROR: {exc!r}", flush=True)
            traceback.print_exc()
            return _json_response(
                self,
                500,
                {"ok": False, "error": str(exc), "error_type": type(exc).__name__},
            )


def main():
    port = int(
        os.environ.get("PORT", os.environ.get("KDSA_API_PORT", "8000"))
    )

    server = ThreadingHTTPServer(("0.0.0.0", port), TraceHandler)
    print(f"TRACE API running on 0.0.0.0:{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
