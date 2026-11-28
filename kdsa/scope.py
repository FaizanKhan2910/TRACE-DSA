"""Helpers for keeping ingestion and retrieval inside the configured playlist."""

from __future__ import annotations

import json
from typing import Any

from kdsa import config


def load_playlist_manifest() -> dict[str, Any]:
    """Load the runtime playlist, falling back to the deployable manifest."""
    runtime_path = config.DATA_DIR / "playlist.json"
    path = runtime_path if runtime_path.exists() else config.PLAYLIST_MANIFEST
    if not path.exists():
        return {"playlist_id": "", "videos": []}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"playlist_id": "", "videos": []}
    videos = data.get("videos", []) if isinstance(data, dict) else data
    if not isinstance(videos, list):
        videos = []
    return {
        "playlist_id": data.get("playlist_id", "") if isinstance(data, dict) else "",
        "videos": [v for v in videos if isinstance(v, dict) and v.get("video_id")],
    }


def playlist_video_ids() -> set[str]:
    return {str(video["video_id"]) for video in load_playlist_manifest()["videos"]}
