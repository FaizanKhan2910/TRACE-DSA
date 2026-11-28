"""Search helpers: embed a query and retrieve ranked Chunk payloads from Qdrant."""

from __future__ import annotations

import threading
from typing import Any

from kdsa import config
from kdsa.index import get_client
from kdsa.models import Chunk
from kdsa.scope import playlist_video_ids

_EMBEDDER_LOCK = threading.Lock()
_EMBEDDING_RUN_LOCK = threading.Lock()
_QUERY_LOCK = threading.Lock()
_EMBEDDER: Any = None


def _get_embedder():
    """Load the embedding model once for CLI and API searches."""
    global _EMBEDDER
    if _EMBEDDER is None:
        with _EMBEDDER_LOCK:
            if _EMBEDDER is None:
                from fastembed import TextEmbedding

                _EMBEDDER = TextEmbedding(model_name=config.EMBED_MODEL)
    return _EMBEDDER


def _payload_to_chunk(payload: dict[str, Any]) -> Chunk:
    return Chunk(
        video_id=payload.get("video_id", ""),
        video_title=payload.get("video_title", ""),
        chunk_index=int(payload.get("chunk_index", 0)),
        start=float(payload.get("start", 0.0)),
        end=float(payload.get("end", 0.0)),
        text=payload.get("text", ""),
        url=payload.get("url", ""),
        start_sec=int(payload.get("start", 0)),
        end_sec=int(payload.get("end", 0)),
    )


def search(
    query: str,
    k: int = 8,
    video_id: str | None = None,
    score_threshold: float = 0.0,
    max_per_video: int = 3,
) -> list[tuple[Chunk, float]]:
    """Embed *query* and return up to *k* (Chunk, score) pairs.

    Strategy:
    - Over-fetch results, then cap at max *max_per_video* chunks per video.
    - Optionally filter by video_id.
    - Apply score_threshold cutoff.
    """
    allowed_video_ids = playlist_video_ids()
    if not allowed_video_ids:
        # The playlist manifest is required to avoid searching stale or
        # unrelated points left in a shared Qdrant collection.
        return []
    if video_id:
        allowed_video_ids.intersection_update({video_id})
        if not allowed_video_ids:
            return []

    model = _get_embedder()
    with _EMBEDDING_RUN_LOCK:
        vec = list(model.embed([query]))[0].tolist()

    client = get_client()

    from qdrant_client.models import Filter, FieldCondition, MatchAny
    query_filter = Filter(
        must=[
            FieldCondition(
                key="video_id",
                match=MatchAny(any=sorted(allowed_video_ids)),
            )
        ]
    )

    with _QUERY_LOCK:
        hits = client.query_points(
            collection_name=config.COLLECTION,
            query=vec,
            limit=max(k * max_per_video, k * 3, 24),
            query_filter=query_filter,
            with_payload=True,
        ).points

    results: list[tuple[Chunk, float]] = []
    per_video: dict[str, int] = {}

    for hit in hits:
        if hit.score < score_threshold:
            continue
        payload = hit.payload or {}
        vid = payload.get("video_id", "")
        if per_video.get(vid, 0) >= max_per_video:
            continue
        per_video[vid] = per_video.get(vid, 0) + 1
        results.append((_payload_to_chunk(payload), hit.score))
        if len(results) >= k:
            break

    return results


def decompose_query(query: str) -> list[str]:
    """Generate 2-4 focused sub-queries to retrieve theory, code patterns, and complexity."""
    import json
    sub_queries = [query]
    if not config.GROQ_API_KEY:
        return sub_queries

    try:
        from openai import OpenAI
        client = OpenAI(
            api_key=config.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
            timeout=10.0,
            max_retries=2,
        )
        prompt = (
            "You are an expert search query expander for a Data Structures & Algorithms course taught in Java. "
            "Given the user's question, generate 2 to 4 distinct, targeted search queries that will retrieve all necessary code, theory, complexity, and problem variations.\n"
            "Rules:\n"
            "- Return ONLY a JSON list of strings, e.g. [\"query 1\", \"query 2\", \"query 3\"].\n"
            "- Keep queries specific to concepts taught in Java/DSA (e.g. specific algorithm names, data structures, complexity, index formulas, edge cases).\n"
            "- Do not add explanations or markdown text, only the JSON array.\n\n"
            f"User question: {query}"
        )
        resp = client.chat.completions.create(
            model=config.LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=256,
        )
        content = resp.choices[0].message.content.strip() if resp.choices else ""
        if content.startswith("```"):
            content = content.strip("`")
            if content.startswith("json"):
                content = content[4:].strip()
        parsed = json.loads(content)
        if isinstance(parsed, list):
            clean = [str(q).strip() for q in parsed if str(q).strip()]
            for q in clean:
                if q.lower() not in [existing.lower() for existing in sub_queries]:
                    sub_queries.append(q)
    except Exception:
        pass

    return sub_queries[:4]


def deep_search(
    query: str,
    k: int = 14,
    score_threshold: float = 0.60,
    max_per_video: int = 6,
) -> tuple[list[tuple[Chunk, float]], list[str]]:
    """Perform multi-query expansion and Reciprocal Rank Fusion (RRF) retrieval.

    Returns:
        (results, sub_queries)
        where results is a list of (Chunk, vec_score) sorted by fusion relevance.
    """
    sub_queries = decompose_query(query)

    if len(sub_queries) == 1:
        results = search(query, k=k, score_threshold=score_threshold, max_per_video=max_per_video)
        return results, sub_queries

    candidate_lists: list[list[tuple[Chunk, float]]] = []
    for q in sub_queries:
        res = search(q, k=k, score_threshold=0.55, max_per_video=max_per_video)
        if res:
            candidate_lists.append(res)

    if not candidate_lists:
        return [], sub_queries

    # Reciprocal Rank Fusion (RRF)
    chunk_map: dict[tuple[str, int], Chunk] = {}
    rrf_scores: dict[tuple[str, int], float] = {}
    max_vector_scores: dict[tuple[str, int], float] = {}

    for cand_list in candidate_lists:
        for rank, (chunk, vec_score) in enumerate(cand_list, 1):
            key = (chunk.video_id, chunk.chunk_index)
            chunk_map[key] = chunk
            rrf_scores[key] = rrf_scores.get(key, 0.0) + (1.0 / (60.0 + rank))
            max_vector_scores[key] = max(max_vector_scores.get(key, 0.0), vec_score)

    sorted_keys = sorted(
        rrf_scores.keys(),
        key=lambda k_item: (rrf_scores[k_item], max_vector_scores[k_item]),
        reverse=True,
    )

    results: list[tuple[Chunk, float]] = []
    per_video: dict[str, int] = {}

    for key in sorted_keys:
        vec_score = max_vector_scores[key]
        if vec_score < score_threshold:
            continue
        vid = key[0]
        if per_video.get(vid, 0) >= max_per_video:
            continue
        per_video[vid] = per_video.get(vid, 0) + 1
        results.append((chunk_map[key], vec_score))
        if len(results) >= k:
            break

    return results, sub_queries
