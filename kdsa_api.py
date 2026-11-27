
"""TRACE API — HTTP server for the KDSA Qdrant retrieval pipeline."""

from __future__ import annotations

import json
import os
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

from kdsa import config
from kdsa.index import get_client


def _json_response(handler, status, payload):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.end_headers()
    handler.wfile.write(body)


def _collection_count(client):
    result = client.count(
        collection_name=config.COLLECTION,
        exact=True,
    )
    return result.count


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

                collection_info = client.get_collection(
                    collection_name=config.COLLECTION
                )

                vectors = _collection_count(client)

                return _json_response(
                    self,
                    200,
                    {
                        "ok": True,
                        "name": "TRACE API",
                        "status": "healthy",
                        "collection": config.COLLECTION,
                        "vectors": vectors,
                        "embed_model": config.EMBED_MODEL,
                        "vector_size": 384,
                        "distance": str(
                            collection_info.config.params.vectors.distance
                        ),
                        "synthesis_available": bool(config.GROQ_API_KEY),
                    },
                )

            except Exception as exc:
                print(
                    f"QDRANT HEALTH ERROR: {exc!r}",
                    flush=True,
                )
                traceback.print_exc()

                return _json_response(
                    self,
                    503,
                    {
                        "ok": False,
                        "error": str(exc),
                        "error_type": type(exc).__name__,
                        "collection": config.COLLECTION,
                        "qdrant_url_configured": bool(config.QDRANT_URL),
                        "qdrant_api_key_configured": bool(
                            config.QDRANT_API_KEY
                        ),
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
            content_length = int(
                self.headers.get("Content-Length", 0)
            )

            if content_length <= 0:
                return _json_response(
                    self,
                    400,
                    {"ok": False, "error": "Request body is empty"},
                )

            if content_length > 1_000_000:
                return _json_response(
                    self,
                    413,
                    {"ok": False, "error": "Request body too large"},
                )

            payload = json.loads(
                self.rfile.read(content_length).decode("utf-8")
            )

            if not isinstance(payload, dict):
                return _json_response(
                    self,
                    400,
                    {"ok": False, "error": "JSON body must be an object"},
                )

            from kdsa.pipeline import handle_query

            result = handle_query(payload)

            return _json_response(self, 200, result)

        except json.JSONDecodeError:
            return _json_response(
                self,
                400,
                {"ok": False, "error": "Invalid JSON"},
            )

        except Exception as exc:
            print(
                f"TRACE QUERY ERROR: {exc!r}",
                flush=True,
            )
            traceback.print_exc()

            return _json_response(
                self,
                500,
                {
                    "ok": False,
                    "error": str(exc),
                    "error_type": type(exc).__name__,
                },
            )


def main():
    port = int(
        os.environ.get(
            "PORT",
            os.environ.get("KDSA_API_PORT", "8000"),
        )
    )

    server = ThreadingHTTPServer(
        ("0.0.0.0", port),
        TraceHandler,
    )

    print(
        f"TRACE API running on 0.0.0.0:{port}",
        flush=True,
    )

    server.serve_forever()


if __name__ == "__main__":
    main()
