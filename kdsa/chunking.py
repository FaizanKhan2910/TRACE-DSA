import re

from kdsa.models import Chunk, Segment, Video

# Minimum overlap length (words) for rolling-caption deduplication
_MIN_OVERLAP = 2
# Phrase length (words) for intra-chunk repetition detection
_REP_PHRASE_LEN = 6


def _has_internal_repetition(text: str, phrase_len: int = _REP_PHRASE_LEN) -> bool:
    """Return True if any contiguous phrase of `phrase_len` words occurs twice in text."""
    words = text.split()
    if len(words) < phrase_len * 2:
        return False
    seen: set[tuple[str, ...]] = set()
    for i in range(len(words) - phrase_len + 1):
        phrase = tuple(w.lower() for w in words[i : i + phrase_len])
        if phrase in seen:
            return True
        seen.add(phrase)
    return False


def _dedup_phrases(text: str, phrase_len: int = _REP_PHRASE_LEN) -> str:
    """Remove duplicate runs of `phrase_len`+ words from chunk text.

    Greedy left-to-right: when a phrase seen before is encountered, skip words
    until the token stream advances past the previously-seen occurrence.
    """
    words = text.split()
    if len(words) < phrase_len * 2:
        return text

    result: list[str] = []
    result_lower: list[str] = []
    skip_until = 0  # skip words[i] while i < skip_until

    i = 0
    while i < len(words):
        if i < skip_until:
            i += 1
            continue

        # Build a tuple of `phrase_len` lower-cased words starting at i
        if i + phrase_len > len(words):
            result.extend(words[i:])
            break

        phrase = tuple(w.lower() for w in words[i : i + phrase_len])

        # Search for this phrase in result_lower
        found_at = -1
        for j in range(len(result_lower) - phrase_len + 1):
            if tuple(result_lower[j : j + phrase_len]) == phrase:
                found_at = j
                break

        if found_at >= 0:
            # Measure how far the duplicate run extends
            run = phrase_len
            while (
                i + run < len(words)
                and found_at + run < len(result_lower)
                and words[i + run].lower() == result_lower[found_at + run]
            ):
                run += 1
            # Skip the duplicate run
            skip_until = i + run
        else:
            result.append(words[i])
            result_lower.append(words[i].lower())

        i += 1

    return " ".join(result)


def _collapse_segments_text(segments: list[Segment]) -> str:
    """Join segment texts while collapsing duplicate/rolling repeated text,
    then apply phrase-level deduplication to catch any residual repetitions."""
    acc_words: list[str] = []
    acc_lower: list[str] = []

    for seg in segments:
        words = seg.text.split()
        if not words:
            continue
        words_lower = [w.lower() for w in words]

        if acc_lower:
            # Skip if this segment is an exact repeat of the tail of accumulated words
            if len(words_lower) <= len(acc_lower) and acc_lower[-len(words_lower):] == words_lower:
                continue

            # Find longest suffix of acc_lower matching prefix of words_lower (min 1 word)
            max_k = min(len(acc_lower), len(words_lower))
            overlap = 0
            for k in range(max_k, 0, -1):
                if acc_lower[-k:] == words_lower[:k]:
                    overlap = k
                    break

            words = words[overlap:]
            words_lower = words_lower[overlap:]

        if words:
            acc_words.extend(words)
            acc_lower.extend(words_lower)

    raw = " ".join(acc_words)
    return _dedup_phrases(raw)


def build_chunks(
    video: Video,
    segments: list[Segment],
    window_s: int = 45,
    overlap_s: int = 10,
) -> tuple[list[Chunk], int]:
    """Merge consecutive segments into overlapping time windows and drop short chunks.
    
    Returns (chunks, repeated_count) where repeated_count is the number of chunks
    with internal back-to-back phrase repetitions (6+ words).
    """
    if not segments:
        return [], 0

    chunks: list[Chunk] = []
    repeated_count = 0
    n = len(segments)
    i = 0

    while i < n:
        win_start = segments[i].start
        j = i
        window_segs: list[Segment] = []

        while j < n and (j == i or segments[j].start < win_start + window_s):
            window_segs.append(segments[j])
            j += 1

        win_end = max(s.end for s in window_segs)
        text = _collapse_segments_text(window_segs)

        if len(text.split()) >= 20:
            ch = Chunk(
                video_id=video.video_id,
                video_title=video.title,
                chunk_index=len(chunks),
                start=round(win_start, 3),
                end=round(win_end, 3),
                text=text,
                url=f"https://www.youtube.com/watch?v={video.video_id}&t={int(win_start)}s",
                start_sec=int(win_start),
                end_sec=int(win_end),
            )
            if _has_internal_repetition(text):
                repeated_count += 1
            chunks.append(ch)

        if j >= n:
            break

        next_target = win_end - overlap_s
        next_i = i + 1
        while next_i < n and segments[next_i].start < next_target:
            next_i += 1

        i = next_i

    return chunks, repeated_count
