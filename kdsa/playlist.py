import yt_dlp
from kdsa.models import Video


def list_playlist(url: str) -> tuple[dict, list[Video]]:
    """Fetch playlist metadata and video list in a single extract_flat request."""
    ydl_opts = {
        "extract_flat": True,
        "skip_download": True,
        "quiet": True,
        "no_warnings": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)

    meta = {
        "playlist_id": info.get("id", ""),
        "title": info.get("title", ""),
        "channel": info.get("channel") or info.get("uploader", ""),
        "url": info.get("webpage_url") or url,
    }

    videos: list[Video] = []
    for entry in info.get("entries", []):
        if not entry:
            continue
        title = entry.get("title", "")
        if title in ("[Private video]", "[Deleted video]"):
            continue
        video_id = entry.get("id")
        if not video_id:
            continue
        duration = int(entry.get("duration") or 0)
        videos.append(Video(video_id=video_id, title=title, duration=duration))

    return meta, videos


def check_captions(video: Video) -> Video:
    """Perform per-video caption lookup, mutating the Video object.
    
    Catches all exceptions and records them in video.error.
    """
    url = f"https://www.youtube.com/watch?v={video.video_id}"
    ydl_opts = {
        "skip_download": True,
        "quiet": True,
        "no_warnings": True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        if not info:
            video.error = "No info returned from yt-dlp"
            return video

        if not video.duration and info.get("duration"):
            video.duration = int(info["duration"])

        subtitles = info.get("subtitles") or {}
        auto_subtitles = info.get("automatic_captions") or {}

        # Human English captions ('en' or e.g. 'en-US', 'en-GB')
        video.has_manual = any(
            k == "en" or k.startswith("en-") or k.startswith("en")
            for k in subtitles.keys()
        )
        # Auto-generated English captions ('en', 'en-orig', etc.)
        video.has_auto = any(
            k == "en" or k.startswith("en-") or k.startswith("en")
            for k in auto_subtitles.keys()
        )

    except Exception as e:
        video.error = str(e)

    return video
