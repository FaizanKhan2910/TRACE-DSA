"""Whisper audio transcription backfill for videos without clean English captions."""

from __future__ import annotations

import json
import math
import os
import shutil
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Any

os.environ["HF_HUB_DISABLE_XET"] = "1"

import yt_dlp

from kdsa import config
from kdsa.models import Segment
from kdsa.transcripts import save_transcript

INITIAL_PROMPT = (
    "Java, DSA, recursion, backtracking, binary search, ArrayList, HashMap, "
    "linked list, OOP, polymorphism, time complexity, Big O"
)

BAD_CAPTION_IDS = ("Nckx9qMy_kw", "apGV9Kg7ics")


_JS_RUNTIMES_SUPPORTED: bool | None = None


def supports_js_runtimes() -> bool:
    """Check if yt_dlp supports the js_runtimes option."""
    global _JS_RUNTIMES_SUPPORTED
    if _JS_RUNTIMES_SUPPORTED is None:
        try:
            yt_dlp.YoutubeDL({"quiet": True, "js_runtimes": {"deno": {}}})
            _JS_RUNTIMES_SUPPORTED = True
        except Exception:
            _JS_RUNTIMES_SUPPORTED = False
    return _JS_RUNTIMES_SUPPORTED


def load_transcript_sources() -> dict[str, str]:
    """Load data/transcript_sources.json, initializing youtube-auto for existing transcripts."""
    path = config.DATA_DIR / "transcript_sources.json"
    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            return data

    sources: dict[str, str] = {}
    for tf in sorted(config.TRANSCRIPT_DIR.glob("*.json")):
        sources[tf.stem] = "youtube-auto"
    return sources


def save_transcript_sources(sources: dict[str, str]) -> Path:
    """Persist data/transcript_sources.json."""
    config.DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = config.DATA_DIR / "transcript_sources.json"
    path.write_text(json.dumps(sources, indent=2, ensure_ascii=False), encoding="utf-8")
    return path


def get_free_disk_space_gb(path: Path | None = None) -> float:
    """Return available disk space in gigabytes for the path filesystem."""
    check_path = path or config.TRANSCRIPT_DIR
    check_path.mkdir(parents=True, exist_ok=True)
    usage = shutil.disk_usage(check_path)
    return usage.free / (1024 ** 3)


def load_failed_whisper() -> list[dict[str, Any]]:
    """Load data/failed_whisper.json if present."""
    path = config.DATA_DIR / "failed_whisper.json"
    if path.exists():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(data, list):
                return data
        except Exception:
            return []
    return []


def save_failed_whisper(failed_records: list[dict[str, Any]]) -> Path:
    """Persist data/failed_whisper.json atomically."""
    config.DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = config.DATA_DIR / "failed_whisper.json"
    tmp_path = config.DATA_DIR / ".failed_whisper.json.tmp"
    try:
        tmp_path.write_text(json.dumps(failed_records, indent=2, ensure_ascii=False), encoding="utf-8")
        os.replace(tmp_path, path)
    except Exception:
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except OSError:
                pass
        raise
    return path


def load_transcription_progress() -> dict[str, Any]:
    """Load data/transcription_progress.json if present."""
    path = config.DATA_DIR / "transcription_progress.json"
    if path.exists():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                return data
        except Exception:
            return {}
    return {}


def save_transcription_progress(
    completed_ids: list[str],
    failed_ids: list[str],
    last_processed_id: str = "",
) -> Path:
    """Persist data/transcription_progress.json atomically."""
    config.DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = config.DATA_DIR / "transcription_progress.json"
    progress_data = {
        "completed_ids": completed_ids,
        "failed_ids": failed_ids,
        "last_processed_id": last_processed_id,
        "total_completed": len(completed_ids),
        "total_failed": len(failed_ids),
        "available_disk_gb": round(get_free_disk_space_gb(), 2),
    }
    tmp_path = config.DATA_DIR / ".transcription_progress.json.tmp"
    try:
        tmp_path.write_text(json.dumps(progress_data, indent=2, ensure_ascii=False), encoding="utf-8")
        os.replace(tmp_path, path)
    except Exception:
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except OSError:
                pass
        raise
    return path


def get_whisper_targets() -> list[dict[str, Any]]:
    """Return the 25 target videos (23 failed + 2 bad-caption), sorted shortest-first."""
    playlist_path = config.DATA_DIR / "playlist.json"
    playlist_data = json.loads(playlist_path.read_text(encoding="utf-8"))
    videos = playlist_data["videos"] if isinstance(playlist_data, dict) else playlist_data
    by_id = {v["video_id"]: v for v in videos if isinstance(v, dict) and v.get("video_id")}

    target_ids: list[str] = []
    failed_path = config.DATA_DIR / "failed_transcripts.json"
    if failed_path.exists():
        failed = json.loads(failed_path.read_text(encoding="utf-8"))
        for entry in failed:
            vid = entry.get("video_id")
            if vid and vid not in target_ids:
                target_ids.append(vid)

    for vid in BAD_CAPTION_IDS:
        if vid not in target_ids:
            target_ids.append(vid)

    targets = []
    for vid in target_ids:
        info = by_id.get(vid, {"video_id": vid, "title": vid, "duration": 0})
        targets.append(
            {
                "video_id": vid,
                "title": info.get("title", vid),
                "duration": int(info.get("duration", 0) or 0),
            }
        )

    targets.sort(key=lambda v: v["duration"])
    return targets


def download_audio(
    video_id: str,
    out_dir: Path,
    retry_delays: tuple[int, ...] = (30, 60),
) -> Path:
    """Download bestaudio for video_id into out_dir and return the downloaded file path.

    Retries the download up to 3 times with a 30s then 60s wait on failure.
    Passes js_runtimes={'deno': {}} if supported by yt_dlp.
    """
    url = f"https://www.youtube.com/watch?v={video_id}"
    ydl_opts: dict[str, Any] = {
        "format": "bestaudio/best",
        "outtmpl": str(out_dir / f"{video_id}.%(ext)s"),
        "quiet": True,
        "no_warnings": True,
    }
    if supports_js_runtimes():
        ydl_opts["js_runtimes"] = {"deno": {}}

    max_attempts = len(retry_delays) + 1
    last_err: Exception | None = None

    for attempt in range(max_attempts):
        try:
            # Clean up any partial files from prior attempt
            for f in out_dir.glob(f"{video_id}.*"):
                try:
                    f.unlink()
                except OSError:
                    pass

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

            files = list(out_dir.glob(f"{video_id}.*"))
            if not files:
                raise RuntimeError(f"Audio download produced no file for {video_id}")
            return files[0]
        except Exception as e:
            last_err = e
            if attempt < len(retry_delays):
                delay = retry_delays[attempt]
                print(f"  [download retry] attempt {attempt + 1} failed ({type(e).__name__}). Retrying in {delay}s...")
                time.sleep(delay)

    raise last_err or RuntimeError(f"Failed to download audio for {video_id} after {max_attempts} attempts")


def get_audio_duration_s(path: Path) -> float:
    """Return duration of audio file in seconds using ffprobe."""
    try:
        cmd = [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        val = float(res.stdout.strip())
        if val > 0:
            return val
    except Exception:
        pass
    return 0.0


def transcribe_video(
    video_id: str,
    model_size: str = "small",
    model: Any | None = None,
) -> tuple[list[Segment], float, float]:
    """Download audio, transcribe with faster-whisper, save transcript, and clean up.

    For long audio (> 1 hour), splits into 30-minute slices to keep memory footprint
    small (< 200MB) and prevent macOS out-of-memory kernel kills.

    Returns (segments, elapsed_s, audio_duration_s).
    """
    from faster_whisper import WhisperModel
    from kdsa.transcripts import is_valid_transcript

    if model is None:
        local_path = config.ROOT / "models" / f"whisper-{model_size}"
        actual_model = str(local_path) if (local_path / "model.bin").exists() else model_size
        model = WhisperModel(actual_model, device="cpu", compute_type="int8")

    tmp_dir = Path(tempfile.mkdtemp(prefix=f"kdsa_{video_id}_"))
    try:
        t0 = time.perf_counter()
        audio_path = download_audio(video_id, tmp_dir)
        total_audio_dur = get_audio_duration_s(audio_path)
        CHUNK_THRESHOLD_S = 3600  # split if longer than 1 hour
        CHUNK_SIZE_S = 1800       # 30-minute slices

        segments: list[Segment] = []

        if total_audio_dur <= CHUNK_THRESHOLD_S:
            raw_segments, info = model.transcribe(
                str(audio_path),
                language="en",
                vad_filter=True,
                condition_on_previous_text=False,
                initial_prompt=INITIAL_PROMPT,
            )
            audio_dur = float(getattr(info, "duration", 0.0) or total_audio_dur)
            last_progress_t = time.perf_counter()
            last_reported_audio = 0.0

            for s in raw_segments:
                text = s.text.strip()
                if text:
                    segments.append(Segment(start=float(s.start), end=float(s.end), text=text))

                now = time.perf_counter()
                if (s.end - last_reported_audio >= 300.0) or (now - last_progress_t >= 60.0):
                    last_reported_audio = s.end
                    last_progress_t = now
                    pct = (s.end / audio_dur * 100.0) if audio_dur > 0 else 0.0
                    curr_min = int(s.end) // 60
                    curr_sec = int(s.end) % 60
                    tot_min = int(audio_dur) // 60
                    tot_sec = int(audio_dur) % 60
                    print(
                        f"    [progress] {curr_min}m {curr_sec:02d}s / {tot_min}m {tot_sec:02d}s ({pct:.1f}%) transcribed in {int(now - t0)}s...",
                        flush=True,
                    )
        else:
            audio_dur = total_audio_dur
            num_chunks = int(math.ceil(total_audio_dur / CHUNK_SIZE_S))
            print(
                f"  [long audio] {total_audio_dur / 3600:.1f}h audio detected: processing in {num_chunks} slices ({CHUNK_SIZE_S // 60}m each) to prevent RAM exhaustion...",
                flush=True,
            )

            for chunk_idx in range(num_chunks):
                offset = chunk_idx * CHUNK_SIZE_S
                chunk_len = min(CHUNK_SIZE_S, total_audio_dur - offset)
                chunk_file = tmp_dir / f"chunk_{chunk_idx:03d}.wav"

                cmd = [
                    "ffmpeg",
                    "-y",
                    "-ss",
                    str(offset),
                    "-i",
                    str(audio_path),
                    "-t",
                    str(chunk_len),
                    "-ar",
                    "16000",
                    "-ac",
                    "1",
                    str(chunk_file),
                ]
                subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

                try:
                    raw_segments, _ = model.transcribe(
                        str(chunk_file),
                        language="en",
                        vad_filter=True,
                        condition_on_previous_text=False,
                        initial_prompt=INITIAL_PROMPT,
                    )
                    for s in raw_segments:
                        text = s.text.strip()
                        if text:
                            segments.append(
                                Segment(
                                    start=round(offset + float(s.start), 3),
                                    end=round(offset + float(s.end), 3),
                                    text=text,
                                )
                            )
                finally:
                    chunk_file.unlink(missing_ok=True)

                pct = min(100.0, (offset + chunk_len) / total_audio_dur * 100.0)
                elapsed = time.perf_counter() - t0
                m_done = int(offset + chunk_len) // 60
                m_total = int(total_audio_dur) // 60
                print(
                    f"    [chunk {chunk_idx + 1}/{num_chunks}] {m_done}m / {m_total}m ({pct:.1f}%) transcribed — {len(segments)} segments total ({elapsed:.0f}s elapsed)...",
                    flush=True,
                )

        if not segments:
            raise ValueError(f"Whisper produced 0 valid segments for {video_id}")

        elapsed = time.perf_counter() - t0
        save_transcript(video_id, segments)

        if not is_valid_transcript(video_id):
            raise ValueError(f"Saved transcript validation failed for {video_id}")

        return segments, elapsed, audio_dur
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
