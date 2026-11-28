export interface BackendHealthResponse {
  ok: boolean;
  name?: string;
  status?: string;
  collection?: string;
  vectors?: number;
  embed_model?: string;
  vector_size?: number;
  distance?: string;
  synthesis_available?: boolean;
  liveBackend?: boolean;
  error?: string;
  error_type?: string;
}

export interface TraceExcerpt {
  rank?: number;
  score: number;
  video_id: string;
  video_title: string;
  chunk_index?: number;
  start_sec: number;
  end_sec?: number;
  timestamp: string;
  url: string;
  snippet: string;
  transcript_text?: string;
}

export interface TraceQueryRequest {
  query: string;
  mode?: "standard" | "deep";
  k?: number;
  threshold?: number;
}

export interface TraceQueryResponse {
  ok: boolean;
  query: string;
  mode: "standard" | "deep";
  answer: string;
  excerpts: TraceExcerpt[];
  results?: TraceExcerpt[];
  sub_queries: string[];
  top_score: number;
  backend?: string;
  collection?: string;
  vectors?: number | null;
  latency_ms?: number;
  synthesis_error?: string | null;
  error?: string;
  error_type?: string;
}
