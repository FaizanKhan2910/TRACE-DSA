import json
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

import yt_dlp

from kdsa import config
from kdsa.models import Segment
from kdsa.quality import score_segments


class NoCaptionsError(ValueError):
    """Raised when a video has no English json3 captions."""


def _find_json3_url(info: dict[str, Any]) -> str | None:
    """Return the highest-priority original-language English json3 caption URL."""
    subtitles = info.get("subtitles") or {}
    auto_captions = info.get("automatic_captions") or {}

    for formats in (subtitles.get("en") or [], auto_captions.get("en-orig") or []):
        for fmt in formats:
            if fmt.get("ext") == "json3" and fmt.get("url"):
                return str(fmt["url"])

    for fmt in auto_captions.get("en") or []:
        url = fmt.get("url")
        if fmt.get("ext") == "json3" and url and "tlang=" not in str(url):
            return str(url)

    return None


def _parse_json3(raw: str | bytes | dict[str, Any]) -> list[Segment]:
    """Parse YouTube json3 caption payload into a list of Segment objects."""
    data = json.loads(raw) if isinstance(raw, (str, bytes)) else raw
    segments: list[Segment] = []

    for event in data.get("events", []):
        segs = event.get("segs")
        if not segs:
            continue

        raw_text = "".join(s.get("utf8", "") for s in segs)
        text = re.sub(r"[\s\xa0]+", " ", raw_text).strip()
        if not text:
            continue

        start = event.get("tStartMs", 0) / 1000.0
        duration = event.get("dDurationMs", 0) / 1000.0
        segments.append(Segment(start=start, end=start + duration, text=text))

    return segments


def fetch_transcript_with_quality(
    video_id: str, retries: int = 3
) -> tuple[list[Segment], dict[str, Any]]:
    """Fetch, parse, and score English json3 captions for a YouTube video."""
    url = f"https://www.youtube.com/watch?v={video_id}"
    ydl_opts = {
        "skip_download": True,
        "quiet": True,
        "no_warnings": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)

    if not info:
        raise RuntimeError(f"No video info returned for {video_id}")

    caption_url = _find_json3_url(info)
    if not caption_url:
        raise NoCaptionsError(f"No English json3 captions available for {video_id}")

    req = urllib.request.Request(
        caption_url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            )
        },
    )

    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8")
            raw_dict = json.loads(raw)
            segments = _parse_json3(raw_dict)
            score, _, word_count = score_segments(segments)
            quality_info = {
                "score": score,
                "segments": len(segments),
                "words": word_count,
                "metric": "word-list",
            }
            return segments, quality_info
        except urllib.error.HTTPError as exc:
            last_error = exc
            if attempt < retries - 1:
                if exc.code == 429:
                    retry_after = exc.headers.get("Retry-After") if exc.headers else None
                    wait = int(retry_after) if retry_after and retry_after.isdigit() else 10 * (2**attempt)
                    time.sleep(wait)
                else:
                    time.sleep(2**attempt)
        except Exception as exc:
            last_error = exc
            if attempt < retries - 1:
                time.sleep(2**attempt)

    raise RuntimeError(f"Failed to fetch transcript for {video_id}: {last_error}") from last_error


def fetch_transcript(video_id: str, retries: int = 3) -> list[Segment]:
    """Fetch and parse English json3 captions for a YouTube video."""
    segments, _ = fetch_transcript_with_quality(video_id, retries=retries)
    return segments


def is_valid_transcript(video_id: str) -> bool:
    """Return True if the transcript file exists, is valid JSON, and has at least one non-empty segment."""
    path = config.TRANSCRIPT_DIR / f"{video_id}.json"
    if not path.is_file():
        return False
    try:
        if path.stat().st_size == 0:
            return False
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, list) or len(data) == 0:
            return False
        return any(
            isinstance(seg, dict) and bool(str(seg.get("text", "")).strip())
            for seg in data
        )
    except Exception:
        return False


def save_transcript(video_id: str, segments: list[Segment]) -> Path:
    """Save parsed transcript segments as JSON in TRANSCRIPT_DIR atomically.

    Cleans up any partial temporary file if writing or replacement fails.
    """
    config.TRANSCRIPT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = config.TRANSCRIPT_DIR / f"{video_id}.json"
    tmp_path = config.TRANSCRIPT_DIR / f".{video_id}.json.tmp"

    payload = [
        {
            "start": round(seg.start, 3),
            "duration": round(seg.end - seg.start, 3),
            "text": seg.text,
        }
        for seg in segments
    ]

    try:
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, out_path)
    except Exception:
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except OSError:
                pass
        raise

    return out_path
