import { TraceExcerpt, TraceQueryResponse } from "@/types/trace";

export function formatTimestamp(seconds: number | undefined | null): string {
  if (seconds === undefined || seconds === null || isNaN(seconds)) {
    return "Timestamp unavailable";
  }
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  }
  return `${m}:${String(rem).padStart(2, "0")}`;
}

export function normalizeExcerpt(raw: Record<string, unknown>, index: number): TraceExcerpt {
  const startSec = typeof raw.start_sec === "number" ? raw.start_sec : Number(raw.start ?? 0) || 0;
  const endSec = typeof raw.end_sec === "number" ? raw.end_sec : Number(raw.end ?? 0) || 0;
  const score = typeof raw.score === "number" ? raw.score : 0;
  const videoId = typeof raw.video_id === "string" ? raw.video_id.trim() : "";
  const videoTitle = typeof raw.video_title === "string" && raw.video_title.trim()
    ? raw.video_title.trim()
    : "DSA Lecture Excerpt";

  const rawTimestamp = typeof raw.timestamp === "string" ? raw.timestamp.trim() : "";
  // Check if genuine timestamp metadata exists
  const timestamp = rawTimestamp && rawTimestamp !== "0:00" && rawTimestamp !== "Timestamp unavailable"
    ? rawTimestamp
    : startSec > 0
    ? formatTimestamp(startSec)
    : rawTimestamp === "0:00" && startSec === 0 && endSec > 0
    ? "0:00"
    : rawTimestamp || "Timestamp unavailable";

  let url = typeof raw.url === "string" ? raw.url.trim() : "";
  if (!url && videoId) {
    url = `https://www.youtube.com/watch?v=${videoId}${startSec > 0 ? `&t=${Math.floor(startSec)}s` : ""}`;
  }

  const snippet = typeof raw.snippet === "string"
    ? raw.snippet
    : typeof raw.text === "string"
    ? raw.text
    : "";

  const transcriptText = typeof raw.transcript_text === "string"
    ? raw.transcript_text
    : snippet;

  return {
    rank: typeof raw.rank === "number" ? raw.rank : index + 1,
    score,
    video_id: videoId,
    video_title: videoTitle,
    chunk_index: typeof raw.chunk_index === "number" ? raw.chunk_index : index,
    start_sec: startSec,
    end_sec: endSec,
    timestamp,
    url,
    snippet,
    transcript_text: transcriptText,
  };
}

export function normalizeQueryResponse(
  raw: unknown,
  fallbackQuery: string,
  fallbackMode: "standard" | "deep",
  latencyMs: number
): TraceQueryResponse {
  if (!raw || typeof raw !== "object") {
    return {
      ok: false,
      query: fallbackQuery,
      mode: fallbackMode,
      answer: "Unable to parse response from retrieval service.",
      excerpts: [],
      sub_queries: [fallbackQuery],
      top_score: 0,
      latency_ms: latencyMs,
      error: "Invalid JSON response from server.",
    };
  }

  const obj = raw as Record<string, unknown>;

  const rawExcerpts = Array.isArray(obj.excerpts)
    ? obj.excerpts
    : Array.isArray(obj.results)
    ? obj.results
    : [];

  const excerpts: TraceExcerpt[] = rawExcerpts.map((item: unknown, idx: number) =>
    normalizeExcerpt((item && typeof item === "object" ? item : {}) as Record<string, unknown>, idx)
  );

  const topScore = typeof obj.top_score === "number"
    ? obj.top_score
    : excerpts.length > 0
    ? Math.max(...excerpts.map((e: TraceExcerpt) => e.score))
    : 0;

  const subQueries = Array.isArray(obj.sub_queries) && obj.sub_queries.length > 0
    ? obj.sub_queries.map((q: unknown) => String(q))
    : [typeof obj.query === "string" ? obj.query : fallbackQuery];

  return {
    ok: obj.ok !== false,
    query: typeof obj.query === "string" ? obj.query : fallbackQuery,
    mode: obj.mode === "deep" || obj.mode === "standard" ? (obj.mode as "standard" | "deep") : fallbackMode,
    answer: typeof obj.answer === "string" ? obj.answer : "",
    excerpts,
    results: excerpts,
    sub_queries: subQueries,
    top_score: topScore,
    backend: typeof obj.backend === "string" ? obj.backend : "live-qdrant",
    collection: typeof obj.collection === "string" ? obj.collection : undefined,
    vectors: typeof obj.vectors === "number" ? obj.vectors : undefined,
    latency_ms: latencyMs,
    synthesis_error: typeof obj.synthesis_error === "string" ? obj.synthesis_error : null,
    error: typeof obj.error === "string" ? obj.error : undefined,
    error_type: typeof obj.error_type === "string" ? obj.error_type : undefined,
  };
}
