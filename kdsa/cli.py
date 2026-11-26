import json
import re
import time
from dataclasses import asdict
from itertools import zip_longest
from typing import Any, Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from kdsa import config
from kdsa.chunking import build_chunks
from kdsa.models import Chunk, Segment, Video
from kdsa.playlist import check_captions, list_playlist
from kdsa.quality import load_quality_map, save_quality_map, score_segments
from kdsa.transcripts import NoCaptionsError, fetch_transcript_with_quality, save_transcript

app = typer.Typer(help="Kunal Java DSA Course Search CLI")
console = Console()


def format_duration(seconds: int) -> str:
    """Format seconds into HH:MM:SS or MM:SS."""
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    if hours > 0:
        return f"{hours}h {minutes}m {secs}s ({seconds:,}s)"
    return f"{minutes}m {secs}s ({seconds:,}s)"


@app.callback()
def callback():
    """Kunal Java DSA CLI entrypoint."""
    pass


@app.command()
def verify(
    limit: Optional[int] = typer.Option(
        None, "--limit", "-l", help="Limit number of videos to verify"
    ),
    url: str = typer.Option(
        config.PLAYLIST_URL, "--url", "-u", help="Playlist URL to verify"
    ),
):
    """Verify playlist details, caption availability, and durations."""
    console.print(f"[bold cyan]Fetching playlist metadata...[/bold cyan]")
    try:
        meta, videos = list_playlist(url)
    except Exception as e:
        console.print(f"[bold red]Failed to fetch playlist:[/bold red] {e}")
        raise typer.Exit(code=1)

    total_listed = len(videos)
    checked_videos = videos[:limit] if limit is not None else videos
    total_to_check = len(checked_videos)

    console.print(
        f"[green]Listed {total_listed} videos.[/green] Checking captions for {total_to_check} video(s)...\n"
    )

    for idx, video in enumerate(checked_videos, start=1):
        console.print(
            f"[{idx}/{total_to_check}] Checking captions for: [yellow]{video.video_id}[/yellow] - {video.title[:60]}..."
        )
        check_captions(video)
        time.sleep(0.5)

    manual_captions = [v for v in checked_videos if v.has_manual]
    auto_only = [v for v in checked_videos if not v.has_manual and v.has_auto]
    with_captions = [v for v in checked_videos if v.has_manual or v.has_auto]
    without_captions = [v for v in checked_videos if not (v.has_manual or v.has_auto)]

    duration_with_captions = sum(v.duration for v in with_captions)
    duration_checked = sum(v.duration for v in checked_videos)

    # Save to data/playlist.json
    output_path = config.DATA_DIR / "playlist.json"
    output_data = {
        "playlist_id": meta["playlist_id"],
        "title": meta["title"],
        "channel": meta["channel"],
        "url": meta["url"],
        "videos_listed": total_listed,
        "videos_checked": total_to_check,
        "with_captions": len(with_captions),
        "manual_captions": len(manual_captions),
        "auto_only_captions": len(auto_only),
        "without_captions": len(without_captions),
        "duration_with_captions_sec": duration_with_captions,
        "duration_checked_sec": duration_checked,
        "videos": [asdict(v) for v in checked_videos],
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    # Print summary table and panel
    table = Table(title="Playlist Verification Summary", show_header=True, header_style="bold magenta")
    table.add_column("Property", style="cyan", no_wrap=True)
    table.add_column("Value", style="green")

    table.add_row("Playlist Title", meta["title"])
    table.add_row("Channel", meta["channel"])
    table.add_row("Playlist ID", meta["playlist_id"])
    table.add_row("Videos Listed", str(total_listed))
    table.add_row("Videos Checked", str(total_to_check))
    table.add_row(
        "With Captions",
        f"{len(with_captions)} (Manual: {len(manual_captions)}, Auto-only: {len(auto_only)})",
    )
    table.add_row("Duration (with captions)", format_duration(duration_with_captions))
    table.add_row("Duration (all checked)", format_duration(duration_checked))
    table.add_row("Saved To", str(output_path))

    console.print(table)

    if without_captions:
        missing_table = Table(title="Videos Without English Captions", show_header=True, header_style="bold red")
        missing_table.add_column("Video ID", style="yellow", no_wrap=True)
        missing_table.add_column("Title", style="white")
        missing_table.add_column("Error / Note", style="red")
        for v in without_captions:
            missing_table.add_row(v.video_id, v.title, v.error or "No English manual or auto captions")
        console.print(missing_table)
    else:
        console.print("[bold green]All checked videos have English captions![/bold green]\n")


def _load_playlist_videos() -> list[dict]:
    """Load video entries from data/playlist.json (bare list or dict with 'videos')."""
    playlist_path = config.DATA_DIR / "playlist.json"
    if not playlist_path.exists():
        console.print(f"[bold red]Playlist file not found:[/bold red] {playlist_path}")
        raise typer.Exit(code=1)

    with open(playlist_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, list):
        return data
    if isinstance(data, dict) and isinstance(data.get("videos"), list):
        return data["videos"]

    console.print(f"[bold red]Invalid playlist.json format in {playlist_path}[/bold red]")
    raise typer.Exit(code=1)


@app.command()
def fetch(
    limit: Optional[int] = typer.Option(
        None, "--limit", "-l", help="Limit number of videos to fetch"
    ),
    force: bool = typer.Option(
        False, "--force", "-f", help="Re-fetch even if transcript file exists"
    ),
    delay: float = typer.Option(
        1.5, "--delay", "-d", help="Delay in seconds between requests"
    ),
):
    """Fetch and save transcripts for videos listed in data/playlist.json."""
    entries = _load_playlist_videos()
    targets = entries[:limit] if limit is not None else entries
    total = len(targets)

    fetched = 0
    skipped = 0
    failed = 0
    failed_records: list[dict[str, str]] = []
    quality_map = load_quality_map()

    for idx, entry in enumerate(targets, start=1):
        video_id = entry if isinstance(entry, str) else (entry.get("video_id") or entry.get("id") or "")
        title = "" if isinstance(entry, str) else entry.get("title", "")
        if not video_id:
            failed += 1
            console.print(f"[{idx}/{total}] [red]fail[/red] <missing-id> (no video_id in entry)")
            continue

        out_path = config.TRANSCRIPT_DIR / f"{video_id}.json"
        if out_path.exists() and not force:
            skipped += 1
            console.print(f"[{idx}/{total}] [yellow]skip[/yellow] {video_id} (already exists)")
            continue

        try:
            segments, quality_info = fetch_transcript_with_quality(video_id)
            save_transcript(video_id, segments)
            quality_info["metric"] = "word-list"
            quality_map[video_id] = quality_info
            save_quality_map(quality_map)
            fetched += 1
            console.print(f"[{idx}/{total}] [green]ok[/green] {video_id} ({len(segments)} segments)")
        except NoCaptionsError as e:
            skipped += 1
            # Only record if no transcript file exists
            if not out_path.exists():
                failed_records.append({"video_id": video_id, "title": title, "reason": str(e)})
            console.print(f"[{idx}/{total}] [yellow]skip[/yellow] {video_id} ({e})")
        except Exception as e:
            failed += 1
            if not out_path.exists():
                failed_records.append({"video_id": video_id, "title": title, "reason": str(e)})
            console.print(f"[{idx}/{total}] [red]fail[/red] {video_id} ({e})")

        if idx < total and delay > 0:
            time.sleep(delay)

    # Rebuild failed_transcripts.json from scratch — never include videos with existing files
    failed_path = config.DATA_DIR / "failed_transcripts.json"
    with open(failed_path, "w", encoding="utf-8") as f:
        json.dump(failed_records, f, indent=2, ensure_ascii=False)

    console.print(
        f"\n[bold]Summary:[/bold] {fetched} fetched / {skipped} skipped / {failed} failed"
    )


@app.command()
def quality(
    threshold: float = typer.Option(
        0.75, "--threshold", "-t", help="Minimum acceptable quality score"
    ),
):
    """Score cached transcripts and flag any below threshold."""
    transcript_files = sorted(config.TRANSCRIPT_DIR.glob("*.json"))
    if not transcript_files:
        console.print(f"[yellow]No transcript files found in {config.TRANSCRIPT_DIR}[/yellow]")
        raise typer.Exit(code=1)

    title_map: dict[str, str] = {}
    playlist_path = config.DATA_DIR / "playlist.json"
    if playlist_path.exists():
        for entry in _load_playlist_videos():
            if isinstance(entry, dict):
                vid = entry.get("video_id") or entry.get("id") or ""
                if vid:
                    title_map[vid] = entry.get("title", "")

    quality_map = load_quality_map()
    # Always recompute using word-list metric for all transcripts
    for path in transcript_files:
        vid = path.stem
        with open(path, "r", encoding="utf-8") as f:
            raw_segments = json.load(f)
        segments = [
            Segment(
                start=float(s["start"]),
                end=float(s["start"]) + float(s.get("duration", 0.0)),
                text=str(s["text"]),
            )
            for s in raw_segments
        ]
        score, seg_count, word_count = score_segments(segments)
        quality_map[vid] = {
            "score": score,
            "segments": seg_count,
            "words": word_count,
            "metric": "word-list",
        }

    save_quality_map(quality_map)

    rows = []
    for path in transcript_files:
        vid = path.stem
        info = quality_map[vid]
        rows.append(
            (
                vid,
                title_map.get(vid, vid),
                float(info["score"]),
                int(info["segments"]),
                int(info["words"]),
            )
        )

    rows.sort(key=lambda r: r[2])

    table = Table(title=f"Transcript Quality (threshold={threshold:.2f})", show_header=True, header_style="bold magenta")
    table.add_column("Video ID", style="yellow", no_wrap=True)
    table.add_column("Title", style="white")
    table.add_column("Score", justify="right")
    table.add_column("Metric", justify="center")
    table.add_column("Segments", justify="right")
    table.add_column("Words", justify="right")
    table.add_column("Status", justify="center")

    good_count = 0
    bad_count = 0
    for vid, title, score, seg_count, word_count in rows:
        is_good = score >= threshold
        metric = quality_map.get(vid, {}).get("metric", "word-list")
        if is_good:
            good_count += 1
            status = "[green]OK[/green]"
            score_str = f"[green]{score:.4f}[/green]"
        else:
            bad_count += 1
            status = "[bold red]FLAG[/bold red]"
            score_str = f"[red]{score:.4f}[/red]"
        table.add_row(vid, title[:50], score_str, metric, str(seg_count), str(word_count), status)

    console.print(table)

    failed_count = 0
    failed_path = config.DATA_DIR / "failed_transcripts.json"
    if failed_path.exists():
        with open(failed_path, "r", encoding="utf-8") as f:
            failed_data = json.load(f)
            if isinstance(failed_data, list):
                failed_count = len(failed_data)

    console.print(
        f"\n[bold]Summary:[/bold] {good_count} good / {bad_count} bad / {failed_count} failed"
    )


@app.command()
def chunk(
    include_bad: bool = typer.Option(
        False, "--include-bad", help="Include transcripts flagged as low quality"
    ),
    threshold: float = typer.Option(
        0.75, "--threshold", "-t", help="Quality threshold for skipping bad transcripts"
    ),
    window_s: int = typer.Option(45, "--window-s", help="Chunk window duration in seconds"),
    overlap_s: int = typer.Option(10, "--overlap-s", help="Chunk overlap duration in seconds"),
):
    """Chunk cached transcripts into time-windowed JSONL records."""
    from kdsa.transcribe import load_transcript_sources

    entries = _load_playlist_videos()
    title_map: dict[str, str] = {}
    for entry in entries:
        if isinstance(entry, dict):
            vid = entry.get("video_id") or entry.get("id") or ""
            if vid:
                title_map[vid] = entry.get("title", "")

    transcript_files = sorted(config.TRANSCRIPT_DIR.glob("*.json"))
    if not transcript_files:
        console.print(f"[yellow]No transcript files found in {config.TRANSCRIPT_DIR}[/yellow]")
        raise typer.Exit(code=1)

    quality_map = load_quality_map()
    sources = load_transcript_sources()
    skipped_bad: list[str] = []

    out_path = config.DATA_DIR / "chunks.jsonl"
    total_chunks = 0
    total_words = 0
    total_repeated = 0
    per_video_counts: list[tuple[str, str, int]] = []

    with open(out_path, "w", encoding="utf-8") as out_f:
        for path in transcript_files:
            video_id = path.stem
            q_info = quality_map.get(video_id)
            is_whisper = sources.get(video_id) == "whisper"
            if (
                not include_bad
                and not is_whisper
                and q_info is not None
                and float(q_info.get("score", 1.0)) < threshold
            ):
                skipped_bad.append(video_id)
                continue

            video_title = title_map.get(video_id, video_id)
            with open(path, "r", encoding="utf-8") as f:
                raw_segments = json.load(f)

            segments = [
                Segment(
                    start=float(s["start"]),
                    end=float(s["start"]) + float(s.get("duration", 0.0)),
                    text=str(s["text"]),
                )
                for s in raw_segments
            ]

            video = Video(video_id=video_id, title=video_title)
            chunks, repeated = build_chunks(video, segments, window_s=window_s, overlap_s=overlap_s)
            total_repeated += repeated
            for ch in chunks:
                record = {
                    "video_id": ch.video_id,
                    "video_title": ch.video_title,
                    "chunk_index": ch.chunk_index,
                    "start": ch.start,
                    "end": ch.end,
                    "text": ch.text,
                    "url": ch.url,
                }
                out_f.write(json.dumps(record, ensure_ascii=False) + "\n")
                total_words += len(ch.text.split())

            total_chunks += len(chunks)
            per_video_counts.append((video_id, video_title, len(chunks)))

    avg_words = (total_words / total_chunks) if total_chunks else 0.0
    rep_pct = (total_repeated / total_chunks * 100) if total_chunks else 0.0

    table = Table(title="Chunking Summary", show_header=True, header_style="bold magenta")
    table.add_column("Video ID", style="yellow", no_wrap=True)
    table.add_column("Title", style="white")
    table.add_column("Chunks", style="green", justify="right")

    for vid, title, count in per_video_counts:
        table.add_row(vid, title[:65], str(count))

    console.print(table)
    if skipped_bad:
        console.print(
            f"[yellow]Skipped {len(skipped_bad)} low-quality transcript(s) (< {threshold:.2f}):[/yellow] "
            + ", ".join(skipped_bad)
        )
    console.print(
        f"\n[bold]Total chunks:[/bold] {total_chunks} | "
        f"[bold]Avg words/chunk:[/bold] {avg_words:.1f} | "
        f"[bold]Chunks with internal repetition:[/bold] {total_repeated} ({rep_pct:.1f}%) | "
        f"[bold]Saved to:[/bold] {out_path}"
    )


@app.command()
def index(
    recreate: bool = typer.Option(
        False, "--recreate", help="Drop and recreate the Qdrant collection before indexing"
    ),
):
    """Embed chunks from data/chunks.jsonl and upsert into Qdrant."""
    from kdsa.index import get_client, index_chunks, load_chunks_jsonl

    chunks_path = config.DATA_DIR / "chunks.jsonl"
    if not chunks_path.exists():
        console.print(f"[bold red]chunks.jsonl not found:[/bold red] {chunks_path}")
        raise typer.Exit(code=1)

    chunks = load_chunks_jsonl(chunks_path)
    console.print(f"[cyan]Loaded {len(chunks)} chunks from {chunks_path}[/cyan]")

    if recreate:
        console.print("[yellow]--recreate: dropping and recreating collection...[/yellow]")

    console.print(f"[cyan]Connecting to Qdrant at {config.QDRANT_PATH}...[/cyan]")
    client = get_client()

    console.print(f"[cyan]Embedding with {config.EMBED_MODEL} (first run downloads model)...[/cyan]")
    with console.status("[bold green]Embedding and upserting...", spinner="dots"):
        total = index_chunks(chunks, client, recreate=recreate)

    console.print(f"\n[bold green]Done![/bold green] Collection [yellow]{config.COLLECTION}[/yellow] now has [bold]{total}[/bold] points.")


def _fmt_timestamp(seconds: float) -> str:
    s = int(seconds)
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    if h:
        return f"{h}:{m:02d}:{sec:02d}"
    return f"{m}:{sec:02d}"


@app.command()
def search(
    query: str = typer.Argument(..., help="Search query"),
    k: int = typer.Option(8, "--k", help="Number of results to return"),
    no_llm: bool = typer.Option(False, "--no-llm", help="Print retrieved chunks only, skip LLM"),
):
    """Search the indexed chunks for a query and print ranked results."""
    from kdsa.search import search as _search

    console.print(f"[cyan]Searching:[/cyan] {query!r}\n")
    results = _search(query, k=k)

    if not results:
        console.print("[yellow]No results found.[/yellow]")
        raise typer.Exit()

    table = Table(show_header=True, header_style="bold magenta", expand=False)
    table.add_column("#", style="dim", no_wrap=True)
    table.add_column("Score", justify="right", no_wrap=True)
    table.add_column("Video ID", style="yellow", no_wrap=True)
    table.add_column("Time", justify="right", no_wrap=True)
    table.add_column("Title")
    table.add_column("Snippet")

    for rank, (chunk, score) in enumerate(results, 1):
        snippet = chunk.text[:200].replace("\n", " ")
        table.add_row(
            str(rank),
            f"{score:.3f}",
            chunk.video_id,
            _fmt_timestamp(chunk.start),
            chunk.video_title[:30],
            snippet,
        )

    console.print(table)
    console.print()
    for rank, (chunk, _) in enumerate(results, 1):
        console.print(f"[dim][[{rank}]][/dim] {chunk.url}")


def _detect_comparison_query(query: str) -> tuple[str, str] | None:
    """Detect comparison queries like 'difference between X and Y' or 'X vs Y'."""
    q = query.strip().rstrip("?.,")
    patterns = [
        r"(?:(?:what\s+is|explain)\s+)?(?:the\s+)?difference\s+between\s+(.+?)\s+and\s+(.+)",
        r"(?:compare)\s+(.+?)\s+(?:and|with|to)\s+(.+)",
        r"(.+?)\s+vs\.?\s+(.+)",
        r"(.+?)\s+versus\s+(.+)",
    ]
    for pattern in patterns:
        m = re.search(pattern, q, re.IGNORECASE)
        if m:
            side_a, side_b = m.group(1).strip(), m.group(2).strip()
            if side_a and side_b:
                return side_a, side_b
    return None


def _merge_comparison_results(
    results_full: list[tuple[Chunk, float]],
    results_a: list[tuple[Chunk, float]],
    results_b: list[tuple[Chunk, float]],
    limit: int = 8,
    max_per_video: int = 3,
) -> list[tuple[Chunk, float]]:
    """Merge search results for comparison queries, ensuring both sides get excerpts and max 3 per video."""
    merged: list[tuple[Chunk, float]] = []
    seen_chunks: set[tuple[str, int]] = set()
    per_video: dict[str, int] = {}

    for pair in zip_longest(results_full, results_a, results_b):
        for item in pair:
            if item is None:
                continue
            chunk, score = item
            cid = (chunk.video_id, chunk.chunk_index)
            if cid in seen_chunks:
                continue
            if per_video.get(chunk.video_id, 0) >= max_per_video:
                continue
            seen_chunks.add(cid)
            per_video[chunk.video_id] = per_video.get(chunk.video_id, 0) + 1
            merged.append((chunk, score))
            if len(merged) >= limit:
                return merged

    return merged


def _print_chunks(results: list[tuple[Any, float]]) -> None:
    """Print retrieved chunks and sources (used for --no-llm and network fallback)."""
    for rank, (chunk, score) in enumerate(results, 1):
        console.print(
            Panel(
                f"[dim]{chunk.url}[/dim]\n\n{chunk.text[:400]}",
                title=f"[{rank}] {chunk.video_title[:50]} @ {_fmt_timestamp(chunk.start)} (score={score:.3f})",
                border_style="dim",
            )
        )
    console.print("\n[bold]Sources:[/bold]")
    for rank, (chunk, score) in enumerate(results, 1):
        console.print(
            f"  [{rank}] [yellow]{chunk.video_title[:60]}[/yellow] "
            f"@ {_fmt_timestamp(chunk.start)} — {chunk.url}"
        )


@app.command()
def ask(
    query: str = typer.Argument(..., help="Question to ask"),
    k: int = typer.Option(8, "--k", help="Number of chunks to retrieve"),
    threshold: float = typer.Option(
        0.70, "--threshold", "-t", help="Minimum top retrieval score required to answer"
    ),
    no_llm: bool = typer.Option(False, "--no-llm", help="Print retrieved chunks only, skip LLM"),
    deep: bool = typer.Option(False, "--deep", help="Enable multi-query decomposition and deep retrieval"),
    max_per_video: int | None = typer.Option(
        None, "--max-per-video", help="Maximum chunks to retrieve per video"
    ),
):
    """Answer a question using retrieved chunks and LLM."""
    from kdsa.search import search as _search, deep_search as _deep_search

    console.print(f"[cyan]Query:[/cyan] {query!r}\n")

    mpv = max_per_video if max_per_video is not None else (6 if deep else 3)
    if deep:
        effective_k = max(k, 14)
        results, sub_queries = _deep_search(query, k=effective_k, score_threshold=0.60, max_per_video=mpv)
        console.print("[bold cyan]Deep Search Plan:[/bold cyan]")
        for sq_idx, sq in enumerate(sub_queries, 1):
            console.print(f"  [dim]{sq_idx}. {sq}[/dim]")
        console.print()
    else:
        comparison_pair = _detect_comparison_query(query)
        if comparison_pair:
            side_a, side_b = comparison_pair
            results_full = _search(query, k=k, max_per_video=mpv)
            results_a = _search(side_a, k=k, max_per_video=mpv)
            results_b = _search(side_b, k=k, max_per_video=mpv)
            results = _merge_comparison_results(results_full, results_a, results_b, limit=k, max_per_video=mpv)
        else:
            results = _search(query, k=k, max_per_video=mpv)

    if not results:
        console.print("not covered in this playlist")
        raise typer.Exit()

    top_score = max(r[1] for r in results)
    if top_score < threshold:
        console.print("not covered in this playlist")
        raise typer.Exit()

    if no_llm:
        _print_chunks(results)
        raise typer.Exit()

    # Build context for LLM
    excerpts = "\n\n".join(
        f"[{i}] {chunk.video_title} @ {_fmt_timestamp(chunk.start)}:\n{chunk.text}"
        for i, (chunk, _) in enumerate(results, 1)
    )

    if deep:
        system_prompt = (
            "You are an expert teaching assistant for Kunal Kushwaha's Java and Data Structures & Algorithms "
            "YouTube course. Provide a comprehensive, in-depth explanation answering all facets of the user's question "
            "using ONLY the numbered excerpts provided.\n"
            "Instructions:\n"
            "- Synthesize across all excerpts to cover every part of the question (definitions, index mapping formulas, step-by-step logic, complexities, problem variations).\n"
            "- The excerpts are auto-captions and may contain transcription errors; fix obvious mis-hearings without inventing facts not in the excerpts.\n"
            "- Use only facts stated in the excerpts. Do not add external knowledge, even if correct.\n"
            "- If parts of the question are only partially covered, thoroughly answer what is present, then explicitly list what is missing under 'Not covered:'.\n"
            "- Cite [n] for claims made from excerpt n.\n"
            "- If none of the topics are mentioned in the excerpts, reply exactly: 'not covered in this playlist'."
        )
    else:
        system_prompt = (
            "You are a teaching assistant for Kunal Kushwaha's Java and Data Structures & Algorithms "
            "YouTube course. Answer the user's question using ONLY the numbered excerpts provided. "
            "The excerpts are auto-captions and may contain transcription errors; fix obvious mis-hearings "
            "without inventing information not in the excerpts. "
            "Use only facts stated in the excerpts. Do not add standard knowledge, even if it is correct. "
            "If the excerpts only partly cover the question, answer the covered part, then list what is missing "
            "under 'Not covered:'. Cite [n] only for claims the excerpt states. "
            "If none of the topics are mentioned in the excerpts, reply exactly: "
            "'not covered in this playlist'."
        )
    user_content = f"EXCERPTS:\n{excerpts}\n\nQUESTION: {query}"

    if not config.GROQ_API_KEY:
        console.print("[bold red]GROQ_API_KEY not set.[/bold red] Set it in .env or environment.")
        raise typer.Exit(code=1)

    import openai
    from openai import OpenAI

    client = OpenAI(
        api_key=config.GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
        timeout=60.0,
        max_retries=3,
    )

    console.print("[bold]Answer:[/bold]\n")
    models_to_try = [config.LLM_MODEL]
    if config.LLM_MODEL != "llama-3.3-70b-versatile":
        models_to_try.append("llama-3.3-70b-versatile")

    for attempt_idx, model_name in enumerate(models_to_try):
        try:
            stream = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                stream=True,
                temperature=0.2,
                max_tokens=800,
            )
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                    console.print(chunk.choices[0].delta.content, end="")
            break
        except (openai.RateLimitError, openai.APIStatusError) as e:
            if attempt_idx < len(models_to_try) - 1:
                continue
            console.print(
                f"[yellow]LLM service error ({type(e).__name__}, model={model_name}): {e}. "
                f"Showing retrieved chunks and sources instead:[/yellow]\n"
            )
            _print_chunks(results)
            raise typer.Exit()
        except (
            openai.APIConnectionError,
            openai.APITimeoutError,
            openai.AuthenticationError,
        ) as e:
            console.print(
                f"[yellow]LLM service error ({type(e).__name__}, model={model_name}): {e}. "
                f"Showing retrieved chunks and sources instead:[/yellow]\n"
            )
            _print_chunks(results)
            raise typer.Exit()

    console.print("\n\n[bold]Sources:[/bold]")
    for rank, (chunk, score) in enumerate(results, 1):
        console.print(
            f"  [{rank}] [yellow]{chunk.video_title[:60]}[/yellow] "
            f"@ {_fmt_timestamp(chunk.start)} — {chunk.url}"
        )


@app.command()
def deep(
    query: str = typer.Argument(..., help="Question to research deeply across lectures"),
    k: int = typer.Option(14, "--k", help="Number of chunks to retrieve"),
    threshold: float = typer.Option(
        0.60, "--threshold", "-t", help="Minimum top retrieval score required to answer"
    ),
    max_per_video: int = typer.Option(6, "--max-per-video", help="Maximum chunks from a single video"),
    no_llm: bool = typer.Option(False, "--no-llm", help="Print retrieved chunks only, skip LLM"),
):
    """Deep multi-query research mode: decomposes queries and fuses multi-lecture excerpts."""
    ask(query=query, k=k, threshold=threshold, no_llm=no_llm, deep=True, max_per_video=max_per_video)


@app.command()
def eval(
    eval_path: str = typer.Option("data/eval.json", "--eval", help="Path to eval.json"),
    k: int = typer.Option(5, "--k", help="Retrieve top-k to evaluate against"),
):
    """Evaluate retrieval quality using data/eval.json (hit@1/3/5, MRR)."""
    from kdsa.search import search as _search
    import os

    eval_file = config.ROOT / eval_path
    if not eval_file.exists():
        console.print(f"[bold red]Eval file not found:[/bold red] {eval_file}")
        raise typer.Exit(code=1)

    with open(eval_file, "r", encoding="utf-8") as f:
        questions = json.load(f)

    total = len(questions)
    hits1 = hits3 = hits5 = 0
    rr_sum = 0.0
    misses: list[dict] = []

    for idx, item in enumerate(questions, 1):
        q = item["question"]
        raw_exp = item.get("expected", item.get("expected_video_id"))
        expected_set = set(raw_exp) if isinstance(raw_exp, list) else {raw_exp}
        results = _search(q, k=k)
        video_ids = [chunk.video_id for chunk, _ in results]

        rank = None
        for r, vid in enumerate(video_ids, 1):
            if vid in expected_set:
                rank = r
                break

        if rank == 1:
            hits1 += 1
        if rank is not None and rank <= 3:
            hits3 += 1
        if rank is not None and rank <= 5:
            hits5 += 1

        if rank is not None:
            rr_sum += 1.0 / rank
        else:
            misses.append({"question": q, "expected": raw_exp, "got": video_ids[:3]})

        console.print(
            f"[{idx:02d}/{total}] rank={rank or '-':<3} hit@5={'✓' if rank and rank<=5 else '✗'}  {q[:60]}"
        )

    mrr = rr_sum / total if total else 0.0

    table = Table(title="Retrieval Evaluation Results", show_header=True, header_style="bold magenta")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", justify="right", style="bold")
    table.add_row("Total questions", str(total))
    table.add_row("hit@1", f"{hits1/total:.3f} ({hits1}/{total})")
    table.add_row("hit@3", f"{hits3/total:.3f} ({hits3}/{total})")
    table.add_row("hit@5", f"{hits5/total:.3f} ({hits5}/{total})")
    table.add_row("MRR", f"{mrr:.3f}")

    console.print()
    console.print(table)

    if misses:
        console.print(f"\n[bold red]Misses ({len(misses)}):[/bold red]")
        for m in misses:
            console.print(f"  Q: {m['question'][:70]}")
            console.print(f"     expected={m['expected']}  got={m['got']}")

    if hits5 / total < 0.85:
        console.print(
            f"\n[bold yellow]hit@5={hits5/total:.3f} < 0.85 — consider re-chunking with different window_s[/bold yellow]"
        )


@app.command()
def transcribe(
    limit: Optional[int] = typer.Option(
        None, "--limit", "-l", help="Limit number of videos to transcribe"
    ),
    model: str = typer.Option(
        "small", "--model", "-m", help="Whisper model size (e.g. small, base, medium)"
    ),
    min_disk_gb: float = typer.Option(
        config.MIN_DISK_SPACE_GB, "--min-disk-gb", help="Minimum required free disk space in GB before processing each video"
    ),
    force: bool = typer.Option(
        False, "--force", "-f", help="Force re-transcription of already completed videos"
    ),
):
    """Transcribe failed and bad-caption videos using faster-whisper (shortest-first)."""
    from faster_whisper import WhisperModel
    from kdsa.transcribe import (
        get_free_disk_space_gb,
        get_whisper_targets,
        load_failed_whisper,
        load_transcript_sources,
        save_failed_whisper,
        save_transcript_sources,
        save_transcription_progress,
        transcribe_video,
    )
    from kdsa.transcripts import is_valid_transcript

    targets = get_whisper_targets()
    if not targets:
        console.print("[green]No target videos to transcribe.[/green]")
        raise typer.Exit()

    sources = load_transcript_sources()
    save_transcript_sources(sources)

    # Disk space check at startup
    avail_disk_gb = get_free_disk_space_gb(config.TRANSCRIPT_DIR)
    console.print(
        f"[cyan]Available disk space:[/cyan] {avail_disk_gb:.2f} GB "
        f"(safety threshold: {min_disk_gb:.2f} GB)"
    )
    if avail_disk_gb < min_disk_gb:
        console.print(
            f"[bold red]Disk space warning:[/bold red] Available storage ({avail_disk_gb:.2f} GB) is below "
            f"the safety threshold ({min_disk_gb:.2f} GB). Aborting before transcription."
        )
        raise typer.Exit(code=1)

    # Determine completed and pending videos
    if force:
        completed = []
        pending = list(targets)
    else:
        completed = [
            t for t in targets
            if sources.get(t["video_id"]) == "whisper" and is_valid_transcript(t["video_id"])
        ]
        pending = [
            t for t in targets
            if not (sources.get(t["video_id"]) == "whisper" and is_valid_transcript(t["video_id"]))
        ]

    total_target_dur = sum(t["duration"] for t in targets)
    pending_dur = sum(t["duration"] for t in pending)
    skipped_count = len(completed)

    console.print(
        f"[cyan]Whisper targets:[/cyan] {len(targets)} total ({format_duration(total_target_dur)}), "
        f"{skipped_count} already completed/skipped, {len(pending)} pending ({format_duration(pending_dur)})"
    )

    if not pending:
        console.print("[green]All target videos are already transcribed with Whisper.[/green]")
        console.print("\n[bold cyan]Transcription Summary:[/bold cyan]")
        console.print(
            f"  Total: {len(targets)} | Completed: 0 | Skipped: {skipped_count} | "
            f"Failed: 0 | Remaining: 0"
        )
        raise typer.Exit()

    to_run = pending[:limit] if limit is not None else pending
    console.print(f"[cyan]Loading WhisperModel({model!r}, device='cpu', compute_type='int8')...[/cyan]")
    whisper_model = WhisperModel(model, device="cpu", compute_type="int8")

    done_count = 0
    failed_this_run: list[str] = []
    failed_records_map: dict[str, dict[str, Any]] = {
        rec["video_id"]: rec for rec in load_failed_whisper() if isinstance(rec, dict) and "video_id" in rec
    }
    all_completed_ids: list[str] = [t["video_id"] for t in completed]
    stopped_due_to_disk = False

    for idx, item in enumerate(to_run, 1):
        vid = item["video_id"]
        title = item["title"]
        dur = item["duration"]

        # Check available disk space before starting each video
        curr_disk_gb = get_free_disk_space_gb(config.TRANSCRIPT_DIR)
        if curr_disk_gb < min_disk_gb:
            console.print(
                f"\n[bold red]Disk space safety limit reached:[/bold red] "
                f"{curr_disk_gb:.2f} GB available, safety threshold is {min_disk_gb:.2f} GB."
            )
            console.print(
                f"[yellow]Stopping gracefully before processing {vid} to prevent disk exhaustion.[/yellow]"
            )
            stopped_due_to_disk = True
            break

        # Double check whether transcript already exists and is valid (if not force)
        if not force and sources.get(vid) == "whisper" and is_valid_transcript(vid):
            console.print(f"\n[{idx}/{len(to_run)}] Skipping [yellow]{vid}[/yellow] — already transcribed.")
            if vid not in all_completed_ids:
                all_completed_ids.append(vid)
            continue

        console.print(
            f"\n[{idx}/{len(to_run)}] Transcribing [yellow]{vid}[/yellow] "
            f"({format_duration(dur)}) [dim][disk free: {curr_disk_gb:.2f} GB][/dim] — {title[:55]}..."
        )
        try:
            segments, elapsed, audio_dur = transcribe_video(vid, model_size=model, model=whisper_model)
            eff_dur = audio_dur if audio_dur > 0 else float(dur)
            rtf = (elapsed / eff_dur) if eff_dur > 0 else 0.0
            est_remaining = rtf * sum(t["duration"] for t in pending[idx:])

            # Verify transcript exists and is valid before marking completed
            if not is_valid_transcript(vid):
                raise ValueError(f"Transcript validation failed for {vid}: invalid or empty transcript file")

            sources[vid] = "whisper"
            save_transcript_sources(sources)

            if vid in failed_records_map:
                del failed_records_map[vid]
                save_failed_whisper(list(failed_records_map.values()))

            if vid not in all_completed_ids:
                all_completed_ids.append(vid)

            done_count += 1
            save_transcription_progress(
                completed_ids=all_completed_ids,
                failed_ids=list(failed_records_map.keys()),
                last_processed_id=vid,
            )

            console.print(
                f"  [green]ok[/green] {len(segments)} segments in {elapsed:.1f}s "
                f"(audio {eff_dur:.1f}s, RTF={rtf:.3f}x)"
            )
            if idx == 1:
                est_all = rtf * total_target_dur
                console.print(
                    f"  [bold cyan]Estimated total time for all {len(targets)} videos:[/bold cyan] "
                    f"{format_duration(int(est_all))} (remaining {len(pending) - 1}: {format_duration(int(est_remaining))})"
                )
        except Exception as exc:
            err_msg = str(exc).splitlines()[0] if str(exc).strip() else ""
            if err_msg:
                console.print(f"[red]{vid} ({type(exc).__name__}): {err_msg}[/red]")
            else:
                console.print(f"[red]{vid} ({type(exc).__name__})[/red]")

            failed_records_map[vid] = {
                "video_id": vid,
                "title": title,
                "error_type": type(exc).__name__,
                "error": str(exc),
            }
            save_failed_whisper(list(failed_records_map.values()))
            failed_this_run.append(vid)

            save_transcription_progress(
                completed_ids=all_completed_ids,
                failed_ids=list(failed_records_map.keys()),
                last_processed_id=vid,
            )
            continue

    remaining_count = len(targets) - len(all_completed_ids)
    console.print("\n[bold cyan]Transcription Summary:[/bold cyan]")
    console.print(
        f"  Total: {len(targets)} | Completed: {done_count} | Skipped: {skipped_count} | "
        f"Failed: {len(failed_this_run)} | Remaining: {remaining_count}"
    )
    if failed_this_run:
        console.print(f"[bold red]Failed IDs:[/bold red] {', '.join(failed_this_run)}")
    if stopped_due_to_disk:
        console.print(
            f"[bold yellow]Note:[/bold yellow] Pipeline stopped early due to low disk space threshold ({min_disk_gb:.2f} GB). "
            f"Free up disk space and run again to resume."
        )


@app.command()
def build(
    delay: float = typer.Option(1.5, "--delay", "-d", help="Delay between caption requests"),
    threshold: float = typer.Option(0.75, "--threshold", "-t", help="Quality threshold"),
    window_s: int = typer.Option(45, "--window-s", help="Chunk window duration in seconds"),
    overlap_s: int = typer.Option(10, "--overlap-s", help="Chunk overlap duration in seconds"),
):
    """Run the full incremental pipeline: fetch -> quality -> chunk -> index."""
    console.rule("[bold cyan]Step 1/4: Fetch[/bold cyan]")
    fetch(limit=None, force=False, delay=delay)
    console.rule("[bold cyan]Step 2/4: Quality[/bold cyan]")
    quality(threshold=threshold)
    console.rule("[bold cyan]Step 3/4: Chunk[/bold cyan]")
    chunk(include_bad=False, threshold=threshold, window_s=window_s, overlap_s=overlap_s)
    console.rule("[bold cyan]Step 4/4: Index[/bold cyan]")
    index(recreate=False)


if __name__ == "__main__":
    app()
