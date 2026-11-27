"""Local HTTP API for the KDSA Qdrant retrieval pipeline."""

from __future__ import annotations

import json
import os
import shlex
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

from kdsa import config
from kdsa.index import get_client
from kdsa.search import _QUERY_LOCK, deep_search, search

_QDRANT_LOCK = threading.Lock()


def _fmt_timestamp(seconds: float) -> str:
    value = max(0, int(seconds))
    hours, remainder = divmod(value, 3600)
    minutes, secs = divmod(remainder, 60)
    return f"{hours}:{minutes:02d}:{secs:02d}" if hours else f"{minutes}:{secs:02d}"


def _cli_command(query: str, mode: str) -> str:
    command = "deep" if mode == "deep" else "ask"
    return f"uv run python -m kdsa.cli {command} -- {shlex.quote(query)}"


def _excerpt(chunk: Any, score: float) -> dict[str, Any]:
    start = float(chunk.start if chunk.start is not None else chunk.start_sec)
    end = float(chunk.end if chunk.end is not None else chunk.end_sec)
    text = chunk.text.strip()
    return {
        "video_title": chunk.video_title,
        "video_id": chunk.video_id,
        "chunk_index": chunk.chunk_index,
        "start_sec": start,
        "end_sec": end,
        "timestamp": _fmt_timestamp(start),
        "url": chunk.url,
        "score": round(float(score), 4),
        "snippet": text[:420] + ("…" if len(text) > 420 else ""),
        "transcript_text": text,
    }


def _synthesize_answer(query: str, excerpts: list[dict[str, Any]], mode: str) -> tuple[str, str | None]:
    """Synthesize only from retrieved transcript text; report unavailable LLMs plainly."""
    if not excerpts:
        return "No transcript passages were returned for this query.", None
    if not config.GROQ_API_KEY:
        return (
            f"Retrieved {len(excerpts)} transcript passage(s). Answer synthesis is unavailable because "
            "GROQ_API_KEY is not configured. Review the source passages on the right.",
            "GROQ_API_KEY is not configured",
        )

    from openai import OpenAI

    context = "\n\n".join(
        f"[{index}] {item['video_title']} @ {item['timestamp']}:\n{item['transcript_text']}"
        for index, item in enumerate(excerpts, 1)
    )
    system = (
        "You are a teaching assistant for a Java and Data Structures & Algorithms course. "
        "Answer using only the numbered transcript excerpts. Cite factual claims with [n]. "
        "If the excerpts do not support the answer, say that the topic is not covered. "
        "Do not invent code details, explanations, or citations."
    )
    client = OpenAI(
        api_key=config.GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
        timeout=45.0,
        max_retries=1,
    )
    try:
        response = client.chat.completions.create(
            model=config.LLM_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": f"MODE: {mode}\n\nEXCERPTS:\n{context}\n\nQUESTION: {query}"},
            ],
            temperature=0.2,
            max_tokens=800,
        )
        answer = (response.choices[0].message.content or "").strip() if response.choices else ""
        if answer:
            return answer, None
        return "The language model returned an empty answer. Review the retrieved source passages.", "Empty model response"
    except Exception as error:
        return (
            f"Retrieved {len(excerpts)} transcript passage(s), but answer synthesis failed. "
            "Review the source passages on the right.",
            f"Synthesis unavailable ({type(error).__name__})",
        )


def handle_query(payload: dict[str, Any]) -> dict[str, Any]:
    started = time.perf_counter()
    query = str(payload.get("query", "")).strip()
    if not query:
        raise ValueError("Query cannot be empty.")
    if len(query) > 2000:
        raise ValueError("Keep the query under 2,000 characters.")

    mode = str(payload.get("mode", "deep")).lower()
    if mode not in {"standard", "deep"}:
        raise ValueError("Choose Standard or Deep Search.")
    k = min(max(int(payload.get("k", 4 if mode == "standard" else 6)), 1), 14)

    if mode == "deep":
        results, sub_queries = deep_search(query, k=k, score_threshold=0.55, max_per_video=6)
        answer_gate = 0.60
    else:
        results = search(query, k=k, score_threshold=0.0, max_per_video=3)
        sub_queries = [query]
        answer_gate = 0.70

    excerpts = [_excerpt(chunk, score) for chunk, score in results]
    top_score = max((float(item["score"]) for item in excerpts), default=0.0)
    if excerpts and top_score < answer_gate:
        answer = (
            f"The strongest transcript match scored {top_score:.3f}, below the {answer_gate:.2f} "
            "answer threshold. The passages are shown for inspection, but TRACE will not synthesize "
            "an answer from a weak match."
        )
        synthesis_error = None
        covered = False
    else:
        answer, synthesis_error = _synthesize_answer(query, excerpts, mode)
        answer_says_uncovered = "not covered in this playlist" in answer.lower()
        covered = bool(excerpts) and top_score >= answer_gate and not answer_says_uncovered

    return {
        "query": query,
        "mode": mode,
        "covered": covered,
        "top_score": round(top_score, 4),
        "sub_queries": sub_queries,
        "answer": answer,
        "synthesis_error": synthesis_error,
        "excerpts": excerpts,
        "latency_ms": int((time.perf_counter() - started) * 1000),
        "cli_command": _cli_command(query, mode),
        "collection": config.COLLECTION,
        "vectors": _collection_count(),
    }


def _collection_count() -> int | None:
    client = get_client()
    with _QUERY_LOCK, _QDRANT_LOCK:
        try:
            return int(client.count(collection_name=config.COLLECTION).count)
        except Exception:
            return None


class TraceHandler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, body: dict[str, Any]) -> None:
        raw = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self) -> None:
        self._send_json(200, {"ok": True})

    def do_GET(self) -> None:
        if self.path != "/health":
            self._send_json(404, {"error": "Not found"})
            return
        try:
            client = get_client()
            with _QUERY_LOCK, _QDRANT_LOCK:
                info = client.get_collection(collection_name=config.COLLECTION)
                vectors = int(client.count(collection_name=config.COLLECTION).count)
            self._send_json(
                200,
                {
                    "ok": True,
                    "collection": config.COLLECTION,
                    "vectors": vectors,
                    "embed_model": config.EMBED_MODEL,
                    "vector_size": getattr(info.config.params.vectors, "size", None),
                    "distance": getattr(getattr(info.config.params.vectors, "distance", None), "value", None),
                    "synthesis_available": bool(config.GROQ_API_KEY),
                },
            )
        except Exception as error:
            self._send_json(503, {"error": f"Qdrant collection is unavailable ({type(error).__name__})."})

    def do_POST(self) -> None:
        if self.path != "/api/query":
            self._send_json(404, {"error": "Not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length > 16_384:
                self._send_json(413, {"error": "Request body is too large."})
                return
            raw = self.rfile.read(length) if length else b"{}"
            payload = json.loads(raw.decode("utf-8"))
            if not isinstance(payload, dict):
                raise ValueError("Request body must be a JSON object.")
            self._send_json(200, handle_query(payload))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._send_json(400, {"error": "Invalid JSON body."})
        except (ValueError, TypeError) as error:
            self._send_json(400, {"error": str(error)})
        except Exception as error:
            self._send_json(503, {"error": f"Local retrieval failed ({type(error).__name__})."})

    def log_message(self, format: str, *args: Any) -> None:
        pass


def main() -> None:
    port = int(os.getenv("KDSA_API_PORT", "8000"))
    client = get_client()
    from kdsa.search import _get_embedder

    print("Loading local embedding model...", flush=True)
    _get_embedder()
    try:
        with _QUERY_LOCK, _QDRANT_LOCK:
            client.get_collection(collection_name=config.COLLECTION)
            count = client.count(collection_name=config.COLLECTION).count
        status = f"collection={config.COLLECTION}, vectors={count}"
    except Exception as error:
        status = f"collection={config.COLLECTION} unavailable ({type(error).__name__})"
    print(
        f"TRACE API listening on http://127.0.0.1:{port} "
        f"({status}, synthesis={'ready' if config.GROQ_API_KEY else 'off'})",
        flush=True,
    )
    ThreadingHTTPServer(("127.0.0.1", port), TraceHandler).serve_forever()


if __name__ == "__main__":
    main()
