"""Vector indexing with Qdrant + fastembed (BAAI/bge-small-en-v1.5)."""

from __future__ import annotations

import json
import threading
import uuid
from pathlib import Path
from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    PointStruct,
    VectorParams,
)

from kdsa import config

# UUID namespace for deterministic point IDs
_NS = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")  # NAMESPACE_URL

VECTOR_SIZE = 384  # BAAI/bge-small-en-v1.5 output dimension
BATCH_SIZE = 64
_CLIENT_LOCK = threading.Lock()
_CLIENT: QdrantClient | None = None


def get_client() -> QdrantClient:
    """Return a Qdrant client — hosted if QDRANT_URL is set, local otherwise."""
    global _CLIENT
    with _CLIENT_LOCK:
        if _CLIENT is None:
            if config.QDRANT_URL:
                _CLIENT = QdrantClient(url=config.QDRANT_URL)
            else:
                _CLIENT = QdrantClient(path=config.QDRANT_PATH)
        return _CLIENT


def get_or_create_collection(client: QdrantClient, recreate: bool = False) -> None:
    """Ensure the collection exists with cosine distance, recreating if requested."""
    name = config.COLLECTION
    exists = client.collection_exists(name)
    if recreate and exists:
        client.delete_collection(name)
        exists = False
    if not exists:
        client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )


def _chunk_id(video_id: str, chunk_index: int) -> str:
    """Deterministic UUID5 point ID."""
    return str(uuid.uuid5(_NS, f"{video_id}:{chunk_index}"))


def index_chunks(
    chunks: list[dict[str, Any]],
    client: QdrantClient,
    recreate: bool = False,
    batch_size: int = BATCH_SIZE,
) -> int:
    """Embed and upsert chunks into Qdrant.

    Returns total number of points after indexing.
    If not recreate, skips chunks whose IDs already exist in the collection.
    """
    from fastembed import TextEmbedding  # lazy import — slow first load

    get_or_create_collection(client, recreate=recreate)
    name = config.COLLECTION

    # Build set of existing IDs if incremental
    existing_ids: set[str] = set()
    if not recreate:
        # Scroll through all points to collect existing IDs
        offset = None
        while True:
            result, offset = client.scroll(
                collection_name=name,
                limit=1000,
                offset=offset,
                with_payload=False,
                with_vectors=False,
            )
            for pt in result:
                existing_ids.add(str(pt.id))
            if offset is None:
                break

    # Filter to chunks that need embedding
    to_embed = [
        ch for ch in chunks
        if _chunk_id(ch["video_id"], ch["chunk_index"]) not in existing_ids
    ]

    if not to_embed:
        return client.count(collection_name=name).count

    model = TextEmbedding(model_name=config.EMBED_MODEL)

    texts = [
        f"{ch['video_title']}\n{ch['text']}"
        for ch in to_embed
    ]

    # Embed in batches and upsert
    embeddings = list(model.embed(texts))

    for i in range(0, len(to_embed), batch_size):
        batch_chunks = to_embed[i : i + batch_size]
        batch_vecs = embeddings[i : i + batch_size]

        points = [
            PointStruct(
                id=_chunk_id(ch["video_id"], ch["chunk_index"]),
                vector=vec.tolist(),
                payload={
                    "video_id": ch["video_id"],
                    "video_title": ch.get("video_title", ""),
                    "chunk_index": ch["chunk_index"],
                    "start": ch.get("start", 0.0),
                    "end": ch.get("end", 0.0),
                    "text": ch["text"],
                    "url": ch.get("url", ""),
                },
            )
            for ch, vec in zip(batch_chunks, batch_vecs)
        ]
        client.upsert(collection_name=name, points=points)

    return client.count(collection_name=name).count


def load_chunks_jsonl(path: Path) -> list[dict[str, Any]]:
    """Load all chunks from a JSONL file."""
    chunks: list[dict[str, Any]] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                chunks.append(json.loads(line))
    return chunks
