"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, ExternalLink, Loader2, RefreshCw, ShieldAlert, Sparkles, Terminal } from "lucide-react";
import { TraceExcerpt, BackendHealthResponse } from "@/types/trace";
import { normalizeQueryResponse } from "@/lib/trace-api";
import { InlineLecturePlayer } from "@/components/InlineLecturePlayer";

export interface ArchiveConsoleHandle {
  runExternalQuery: (query: string, mode?: "standard" | "deep") => void;
}

interface QueryResultState {
  query: string;
  mode: "standard" | "deep";
  covered: boolean;
  top_score: number;
  sub_queries: string[];
  answer: string;
  excerpts: TraceExcerpt[];
  latency_ms: number;
  cli_command: string;
  collection: string;
  vectors: number | null;
  synthesis_error?: string | null;
}

const emptyResult: QueryResultState = {
  query: "",
  mode: "deep",
  covered: false,
  top_score: 0,
  sub_queries: [],
  answer: "Enter a Java or DSA question to search the live Kunal Kushwaha lecture index.",
  excerpts: [],
  latency_ms: 0,
  cli_command: "",
  collection: "",
  vectors: null,
};

export const ArchiveConsole = forwardRef<ArchiveConsoleHandle>(function ArchiveConsole(_, ref) {
  const [liveBackend, setLiveBackend] = useState<boolean | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendHealthResponse | null>(null);
  const [probingBackend, setProbingBackend] = useState<boolean>(true);
  const [mode, setMode] = useState<"standard" | "deep">("deep");
  const [question, setQuestion] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [stepLabel, setStepLabel] = useState<string>("CONNECTING TO DEPLOYED TRACE API...");
  const [result, setResult] = useState<QueryResultState>(emptyResult);
  const [streamedText, setStreamedText] = useState<string>(emptyResult.answer);
  const [activeCite, setActiveCite] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState<TraceExcerpt | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [copiedCli, setCopiedCli] = useState<boolean>(false);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<number, boolean>>({});

  const streamTimerRef = useRef<number | null>(null);
  const excerptRefs = useRef<(HTMLDivElement | null)[]>([]);
  const playerAreaRef = useRef<HTMLDivElement | null>(null);
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const [rightPanelHeight, setRightPanelHeight] = useState<number | null>(null);
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const currentCliCommand = question.trim()
    ? `curl -X POST http://127.0.0.1:8000/api/query -H "Content-Type: application/json" -d '{"query": ${JSON.stringify(question.trim())}, "mode": "${mode}"}'`
    : "";

  const checkHealth = () => {
    setProbingBackend(true);
    fetch("/api/trace", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: BackendHealthResponse) => {
        setBackendStatus(d);
        const isLive = Boolean(d.liveBackend && d.ok !== false);
        setLiveBackend(isLive);
        setProbingBackend(false);
        setStepLabel(
          isLive
            ? `QDRANT READY · ${Number(d.vectors ?? 2933).toLocaleString()} VECTORS`
            : d.error || "TRACE API UNAVAILABLE · CHECK BACKEND CONFIGURATION"
        );
      })
      .catch(() => {
        setLiveBackend(false);
        setProbingBackend(false);
        setStepLabel("TRACE API UNAVAILABLE · CHECK BACKEND CONFIGURATION");
      });
  };

  useEffect(() => {
    checkHealth();

    return () => {
      if (streamTimerRef.current) window.clearInterval(streamTimerRef.current);
      controllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const leftPanel = leftPanelRef.current;
    if (!leftPanel || typeof ResizeObserver === "undefined") return;
    const desktopLayout = window.matchMedia("(min-width: 1024px)");

    const syncPanelHeight = () => {
      if (!desktopLayout.matches) {
        setRightPanelHeight((current) => (current === null ? current : null));
        return;
      }
      const nextHeight = Math.ceil(leftPanel.getBoundingClientRect().height);
      setRightPanelHeight((current) => (current === nextHeight ? current : nextHeight));
    };

    const observer = new ResizeObserver(syncPanelHeight);
    observer.observe(leftPanel);
    window.addEventListener("resize", syncPanelHeight);
    syncPanelHeight();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncPanelHeight);
    };
  }, []);

  const animateAnswerStream = (fullText: string) => {
    if (streamTimerRef.current) window.clearInterval(streamTimerRef.current);
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setStreamedText(fullText);
      return;
    }

    const words = fullText.split(" ");
    let idx = 0;
    setStreamedText("");
    streamTimerRef.current = window.setInterval(() => {
      idx += 3;
      if (idx >= words.length) {
        setStreamedText(fullText);
        if (streamTimerRef.current) window.clearInterval(streamTimerRef.current);
      } else {
        setStreamedText(words.slice(0, idx).join(" ") + " ▌");
      }
    }, 24);
  };

  const executeQuery = async (qText: string, nextMode: "standard" | "deep" = mode) => {
    const clean = qText.trim();
    if (!clean) {
      requestIdRef.current += 1;
      controllerRef.current?.abort();
      if (streamTimerRef.current) window.clearInterval(streamTimerRef.current);
      setLoading(false);
      setResult(emptyResult);
      setStreamedText(emptyResult.answer);
      setRequestError("Enter a Java or DSA question before searching.");
      setActiveCite(null);
      setSelectedSource(null);
      return;
    }
    const requestId = ++requestIdRef.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    if (streamTimerRef.current) window.clearInterval(streamTimerRef.current);
    setResult({ ...emptyResult, query: clean, mode: nextMode });
    setStreamedText("");
    setRequestError(null);
    setLoading(true);
    setActiveCite(null);
    setSelectedSource(null);
    setExpandedTranscripts({});
    excerptRefs.current = [];
    setStepLabel(
      nextMode === "deep"
        ? "EXPANDING QUERY · MULTI-VECTOR RETRIEVAL ON QDRANT..."
        : "EMBEDDING QUERY · SEARCHING QDRANT..."
    );

    const startTime = performance.now();

    try {
      const res = await fetch("/api/trace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: clean, mode: nextMode }),
        signal: controller.signal,
      });

      const rawJson = await res.json().catch(() => null);
      const latencyMs = Math.round(performance.now() - startTime);

      if (!res.ok) {
        const errorMsg = rawJson?.error || `Search failed with status ${res.status}`;
        throw new Error(errorMsg);
      }

      const normalized = normalizeQueryResponse(rawJson, clean, nextMode, latencyMs);

      if (requestId !== requestIdRef.current) return;

      const isCovered =
        normalized.answer.trim().toLowerCase() !== "not covered in this playlist" &&
        !normalized.answer.trim().toLowerCase().startsWith("not covered:") &&
        normalized.excerpts.length > 0;

      const updatedResult: QueryResultState = {
        query: normalized.query,
        mode: normalized.mode,
        covered: isCovered,
        // Do not present nearest-neighbor candidates as sources when synthesis
        // says the playlist does not cover the question.
        top_score: isCovered ? normalized.top_score : 0,
        sub_queries: normalized.sub_queries,
        answer: normalized.answer,
        excerpts: isCovered ? normalized.excerpts : [],
        latency_ms: latencyMs,
        cli_command: `curl -X POST http://127.0.0.1:8000/api/query -H "Content-Type: application/json" -d '{"query": ${JSON.stringify(clean)}, "mode": "${nextMode}"}'`,
        collection: normalized.collection || backendStatus?.collection || "dsa_lectures_384",
        vectors: normalized.vectors ?? backendStatus?.vectors ?? 2933,
        synthesis_error: normalized.synthesis_error,
      };

      setResult(updatedResult);
      setActiveCite(null);
      setStepLabel(
        normalized.synthesis_error
          ? `SOURCES RETRIEVED · SYNTHESIS UNAVAILABLE · ${latencyMs}ms`
          : !isCovered
          ? `${normalized.excerpts.length ? "TOPIC PARTIAL/UNCOVERED" : "NO MATCHING PASSAGES"} · ${latencyMs}ms`
          : `LIVE QDRANT · ${normalized.excerpts.length} SOURCES · ${latencyMs}ms`
      );

      animateAnswerStream(normalized.answer);
    } catch (error) {
      if (requestId !== requestIdRef.current || (error instanceof Error && error.name === "AbortError")) return;
      const message = error instanceof Error ? error.message : "Unable to reach the live retrieval API.";
      setRequestError(message);
      setStepLabel("SEARCH FAILED · BACKEND RETRIEVAL ERROR");
      setStreamedText("");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  const handleClear = () => {
    requestIdRef.current += 1;
    controllerRef.current?.abort();
    if (streamTimerRef.current) window.clearInterval(streamTimerRef.current);
    setQuestion("");
    setLoading(false);
    setResult(emptyResult);
    setStreamedText(emptyResult.answer);
    setRequestError(null);
    setActiveCite(null);
    setSelectedSource(null);
    setExpandedTranscripts({});
    setStepLabel(
      liveBackend
        ? `QDRANT READY · ${Number(backendStatus?.vectors ?? 2933).toLocaleString()} VECTORS`
        : "TRACE API UNAVAILABLE"
    );
  };

  useImperativeHandle(ref, () => ({
    runExternalQuery: (queryText: string, queryMode?: "standard" | "deep") => {
      const selectedMode = queryMode || mode;
      if (queryMode) setMode(queryMode);
      setQuestion(queryText);
      executeQuery(queryText, selectedMode);
    },
  }));

  const handleCitationClick = (citeNum: number) => {
    setActiveCite(citeNum);
    const el = excerptRefs.current[citeNum - 1];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const selectSource = (excerpt: TraceExcerpt, index: number) => {
    setSelectedSource(excerpt);
    setActiveCite(index + 1);
    window.requestAnimationFrame(() => {
      playerAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  const returnToSearch = () => {
    const input = document.getElementById("trace-question-input") as HTMLTextAreaElement | null;
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => input?.focus({ preventScroll: true }), 350);
  };

  const syncReceiptWithPlayback = (seconds: number) => {
    if (!selectedSource) return;
    const index = result.excerpts.findIndex((excerpt) => {
      const end = excerpt.end_sec && excerpt.end_sec > 0 ? excerpt.end_sec : excerpt.start_sec + 60;
      return excerpt.video_id === selectedSource.video_id && seconds >= excerpt.start_sec && seconds <= end;
    });
    if (index >= 0) setActiveCite((current) => (current === index + 1 ? current : index + 1));
  };

  const toggleTranscriptExpand = (index: number) => {
    setExpandedTranscripts((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const renderCitedProse = (text: string) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, idx) => {
      const match = /^\[(\d+)\]$/.exec(part);
      if (!match) return <span key={idx}>{part}</span>;
      const citeNum = Number(match[1]);
      const isActive = activeCite === citeNum;
      return (
        <button
          key={idx}
          type="button"
          onClick={() => {
            const excerpt = result.excerpts[citeNum - 1];
            if (excerpt) selectSource(excerpt, citeNum - 1);
            else handleCitationClick(citeNum);
          }}
          className={`inline-flex items-center justify-center mx-1 px-1.5 py-0.5 rounded font-mono-tech text-lg font-bold align-baseline transition cursor-pointer ${
            isActive
              ? "bg-[#ff4d0a] text-[#090a0d] shadow-[0_0_16px_rgba(255,77,10,0.8)]"
              : "bg-[#3b82f6]/25 text-[#93c5fd] border border-[#3b82f6]/50 hover:bg-[#ff4d0a] hover:text-[#090a0d]"
          }`}
        >
          [{citeNum}]
        </button>
      );
    });
  };

  const copyCli = async () => {
    try {
      if (!currentCliCommand) return;
      await navigator.clipboard.writeText(currentCliCommand);
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <section
      id="query"
      className="console-obsidian relative border-y border-white/10 py-20 lg:py-24 overflow-hidden"
    >
      {/* Massive ghost typography backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute -right-10 -top-6 font-display font-extrabold text-[18vw] leading-none tracking-[-0.08em] text-white/[0.025]"
      >
        TRACE
      </div>

      <div className="relative z-10 mx-auto w-[96vw] max-w-[2700px] px-5 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between mb-10">
          <div>
            <div className="font-mono-tech text-lg uppercase tracking-[0.16em] text-[#34d399] flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#1cb67c] shadow-[0_0_12px_#1cb67c] animate-pulse" />
              03 // SEARCH THE VIDEO ARCHIVE
            </div>
            <h2 className="font-display text-[clamp(2.1rem,4.4vw,3.75rem)] font-bold tracking-[-0.04em] leading-[1.02] mt-3 text-[#f4f0e8]">
              Ask a question.{" "}
              <span className="font-serif-editorial italic font-normal text-[#ff9e44]">
                Get the source.
              </span>
            </h2>
          </div>
          <p className="max-w-lg text-xl sm:text-xl leading-relaxed text-[#c4c0b7]">
            Search indexed lesson passages. Ask a Java or DSA question, then inspect grounded answers and jump directly to relevant moments in the course videos.
          </p>
        </div>

        {/* Main Obsidian Hardware Shell */}
        <div className="rounded-xl border border-white/15 bg-[#0e1015]/95 backdrop-blur-2xl shadow-[0_38px_100px_rgba(0,0,0,0.85)] overflow-hidden">
          {/* Top Console Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/10 bg-black/30">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#ff5b1f] to-[#e63900] text-[#090a0d] font-bold flex items-center justify-center shadow-[0_0_24px_rgba(255,77,10,0.55)]">
                ↗
              </div>
              <div>
                <div className="font-display text-xl font-bold tracking-wide text-white">
                  TRACE / ARCHIVE WORKBENCH
                </div>
                <div className="font-mono-tech text-lg text-[#b0ada5]">
                  {backendStatus?.embed_model || "BAAI/bge-small-en-v1.5"} · {backendStatus?.vector_size || 384}d {backendStatus?.distance || "Cosine"} · Groq Synthesis
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Live Backend Connection Indicator */}
              <div
                className={`px-3 py-1 rounded-full border font-mono-tech text-base sm:text-lg inline-flex items-center gap-2 ${
                  probingBackend
                    ? "border-amber-500/40 bg-amber-500/10 text-[#ffbd73]"
                    : liveBackend
                    ? "border-emerald-500/40 bg-emerald-500/10 text-[#34d399]"
                    : "border-red-500/40 bg-red-500/10 text-[#ff6b6b]"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    probingBackend
                      ? "bg-[#ffbd73] animate-pulse"
                      : liveBackend
                      ? "bg-[#1cb67c] shadow-[0_0_8px_#1cb67c] animate-pulse"
                      : "bg-[#ff4d4d]"
                  }`}
                />
                {probingBackend
                  ? "CONNECTING TO TRACE API..."
                  : liveBackend
                  ? backendStatus?.synthesis_available
                    ? "LIVE QDRANT · GROQ SYNTHESIS ONLINE"
                    : "LIVE QDRANT · RETRIEVAL ONLY"
                  : "RAG API OFFLINE"}
              </div>

              {/* Refresh backend status button */}
              <button
                type="button"
                onClick={checkHealth}
                title="Refresh backend status"
                aria-label="Refresh backend status"
                className="p-1.5 rounded border border-white/15 bg-white/5 hover:border-[#ff4d0a] text-[#f4f0e8] transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${probingBackend ? "animate-spin text-[#ff9e44]" : ""}`} />
              </button>
            </div>
          </div>

          {/* Preset Query Chips + Mode Switch + Input */}
          <div className="p-5 sm:p-6 border-b border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-mono-tech text-base sm:text-lg text-[#aaa79f]">
                {backendStatus
                  ? `${backendStatus.collection || "dsa_lectures_384"} · ${Number(backendStatus.vectors ?? 2933).toLocaleString()} VECTORS · ${backendStatus.vector_size ?? 384}D ${backendStatus.distance ?? "Cosine"} · ${backendStatus.embed_model ?? "BAAI/bge-small-en-v1.5"}`
                  : "Checking live backend health…"}
              </div>

              {/* Standard vs Deep Search Toggle */}
              <div className="inline-flex rounded-sm border border-white/15 bg-black/50 p-1">
                {(["standard", "deep"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                      if (question.trim()) executeQuery(question, m);
                    }}
                    className={`font-mono-tech text-lg px-3 py-1.5 rounded-sm transition cursor-pointer ${
                      mode === m
                        ? m === "deep"
                          ? "bg-[#ff4d0a] text-[#090a0d] font-bold shadow-[0_0_16px_rgba(255,77,10,0.45)]"
                          : "bg-[#3b82f6] text-white font-bold"
                        : "text-[#8e8c84] hover:text-white"
                    }`}
                  >
                    {m === "standard" ? "Standard (k=8)" : "Deep Search (RRF Expansion)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeQuery(question, mode);
              }}
              className="rounded-lg border border-white/15 bg-[#07080b] p-3.5 sm:p-4 focus-within:border-[#ff4d0a] focus-within:shadow-[0_0_0_3px_rgba(255,77,10,0.18)] transition flex flex-col sm:flex-row gap-3"
            >
              <textarea
                id="trace-question-input"
                rows={2}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    executeQuery(question, mode);
                  }
                }}
                placeholder="Ask any Java or DSA question (e.g. 'Explain binary search logic', 'Why does start + (end - start)/2 prevent overflow?')..."
                className="flex-1 bg-transparent text-[#f4f0e8] placeholder-[#5a5d66] font-mono-tech text-xl leading-relaxed outline-none resize-none min-h-[46px]"
              />
              <div className="flex items-center gap-2 shrink-0">
                {question.trim() && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="font-mono-tech text-base px-3 py-3 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-[#d7d3ca] transition cursor-pointer"
                  >
                    CLEAR
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-ember-glow font-mono-tech text-xl px-5 py-3 rounded-md inline-flex items-center justify-center gap-2 shrink-0 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {mode === "deep" ? "DEEP RETRIEVING..." : "SEARCHING..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      SEARCH ARCHIVE ↗
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Dynamic Copyable CLI Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-md border border-white/10 bg-black/40 font-mono-tech text-lg">
              <div className="flex items-center gap-2 text-[#34d399] min-w-0">
                <Terminal className="w-3.5 h-3.5 text-[#ff4d0a] shrink-0" />
                <span className="truncate">
                  {currentCliCommand || "Enter a query to preview the matching API / cURL command"}
                </span>
              </div>
              <button
                type="button"
                onClick={copyCli}
                disabled={!currentCliCommand}
                className="px-2.5 py-1 rounded border border-white/15 bg-white/5 hover:border-[#ff4d0a] text-[#f4f0e8] inline-flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-40"
              >
                {copiedCli ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3" />}
                {copiedCli ? "Copied" : "Copy cURL"}
              </button>
            </div>
          </div>

          {/* Split Verified Answer + Excerpt Receipts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
            {/* Left: Query Plan + Streamed Answer */}
            <div ref={leftPanelRef} className="lg:col-span-6 p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono-tech text-lg">
                <span
                  className={result.covered && !result.synthesis_error ? "text-[#34d399]" : "text-[#ff9e44]"}
                >
                  ● {loading ? (mode === "deep" ? "EXPANDING QUERIES · MULTI-VECTOR RETRIEVAL ON QDRANT…" : "EMBEDDING QUERY · SEARCHING QDRANT…") : stepLabel}
                </span>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#c4c0b7]">
                  {result.excerpts.length ? `TOP MATCH: ${result.top_score.toFixed(3)}` : "NO SCORE YET"}
                </span>
              </div>

              {/* Sub-Queries Plan Indicator */}
              <div className="rounded-md border border-white/10 bg-black/35 p-4 space-y-2">
                <div className="font-mono-tech text-lg tracking-[0.1em] text-[#b0ada5]">
                  {result.query && result.mode === "deep"
                    ? `RRF SUB-QUERY EXPANSION PLAN (${result.sub_queries.length})`
                    : result.query
                    ? "DIRECT SINGLE-VECTOR QUERY"
                    : "SUB-QUERY EXPANSION · WAITING FOR SEARCH"}
                </div>
                {result.sub_queries.map((sq, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 font-mono-tech text-xl text-[#d7d3ca]"
                  >
                    <span className="text-[#ff4d0a] font-bold shrink-0">Q{i + 1}</span>
                    <span>{sq}</span>
                  </div>
                ))}
              </div>

              {/* Grounded Answer Prose with Clickable Citations */}
              <div className="rounded-md border border-white/10 bg-[#12151c] p-5">
                <div className="font-mono-tech text-lg tracking-[0.1em] text-[#34d399] mb-3 flex items-center justify-between gap-2">
                  {result.synthesis_error ? (
                    <span className="text-[#ff9e44]">SYNTHESIS ERROR · SHOWING RETRIEVED EXCERPTS</span>
                  ) : result.covered ? (
                    <span>GROUNDED SYNTHESIS // CLICK [N] TO INSPECT PROOF</span>
                  ) : (
                    <span className="text-[#ff9e44] inline-flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {requestError ? "BACKEND RETRIEVAL ERROR" : result.query ? "SYNTHESIS / COVERAGE STATUS" : "GROUNDED ANSWER"}
                    </span>
                  )}
                  {result.latency_ms > 0 && (
                    <span className="font-mono-tech text-sm text-[#8e8c84]">{result.latency_ms}ms</span>
                  )}
                </div>

                {result.synthesis_error && (
                  <div className="mb-4 p-3 rounded bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm font-mono-tech">
                    Note: Groq LLM synthesis encountered an issue ({result.synthesis_error}), but the vector passages below were successfully retrieved from Qdrant.
                  </div>
                )}

                <p className="text-xl leading-[1.75] text-[#ebe7df]">
                  {loading ? (
                    <span className="inline-flex items-center gap-2 text-[#ff9e44]" role="status">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="animate-pulse">
                        {mode === "deep"
                          ? "Executing multi-query RRF search on Qdrant and synthesizing with Groq..."
                          : "Embedding query with BGE-small, searching Qdrant, and synthesizing grounded answer..."}
                      </span>
                    </span>
                  ) : requestError ? (
                    requestError
                  ) : (
                    renderCitedProse(streamedText || result.answer)
                  )}
                </p>

                {result.excerpts.length > 0 && (
                  <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-wrap items-center gap-2">
                    <span className="font-mono-tech text-lg text-[#b0ada5] mr-1">
                      SELECT SOURCE:
                    </span>
                    {result.excerpts.map((ex, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectSource(ex, i)}
                        className={`font-mono-tech text-lg px-2.5 py-1 rounded-sm border transition cursor-pointer ${
                          activeCite === i + 1
                            ? "bg-[#ff4d0a] text-[#090a0d] border-[#ff4d0a] font-bold"
                            : "bg-[#1a2234] text-[#93c5fd] border-[#3b82f6]/40 hover:border-[#ff4d0a]"
                        }`}
                      >
                        [{i + 1}] @ {ex.timestamp}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Retrieved Qdrant Excerpt Cards */}
            <div
              className="lg:col-span-6 min-w-0 p-5 sm:p-6 space-y-3.5 overflow-y-auto"
              style={rightPanelHeight === null ? undefined : { height: rightPanelHeight, maxHeight: rightPanelHeight }}
            >
              <div className="font-mono-tech text-lg tracking-[0.1em] text-[#b0ada5] flex items-center justify-between gap-3">
                <span>RETRIEVED QDRANT EXCERPTS ({result.excerpts.length})</span>
                <span>COLLECTION: {result.collection || backendStatus?.collection || "dsa_lectures_384"} · {result.vectors != null ? result.vectors.toLocaleString() : Number(backendStatus?.vectors ?? 2933).toLocaleString()} VECTORS</span>
              </div>

              {selectedSource ? (
                <div ref={playerAreaRef} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#ff9e44]/35 bg-[#ff9e44]/[0.08] px-4 py-3">
                    <div className="min-w-0">
                      <div className="font-mono-tech text-sm font-bold uppercase tracking-[0.12em] text-[#ffbd73]">
                        Need to search again?
                      </div>
                      <p className="mt-1 text-base leading-relaxed text-[#e4dfd5]">
                        Press <kbd className="rounded border border-white/25 bg-black/40 px-1.5 py-0.5 font-mono-tech text-sm text-white">Esc</kbd> to exit video fullscreen, or click below to return to the search console.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={returnToSearch}
                      className="shrink-0 rounded border border-[#ff9e44]/50 bg-[#ff9e44]/15 px-3 py-2 font-mono-tech text-sm font-bold uppercase tracking-wide text-[#ffbd73] transition hover:bg-[#ff9e44] hover:text-[#090a0d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9e44] cursor-pointer"
                    >
                      ↑ Back to search
                    </button>
                  </div>
                  {/^[A-Za-z0-9_-]{11}$/.test(selectedSource.video_id) ? (
                    <InlineLecturePlayer
                      key={`${selectedSource.video_id}-${selectedSource.start_sec}-${selectedSource.chunk_index ?? 0}`}
                      videoId={selectedSource.video_id}
                      startSeconds={selectedSource.start_sec}
                      title={selectedSource.video_title}
                      timestamp={selectedSource.timestamp}
                      url={selectedSource.url}
                      onTimeUpdate={syncReceiptWithPlayback}
                    />
                  ) : (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-6 text-center">
                      <ShieldAlert className="mx-auto mb-2 h-7 w-7 text-[#ff9e44]" />
                      <p className="font-display font-semibold text-white">No playable video ID on this source</p>
                      <p className="mt-1 font-mono-tech text-sm text-[#c4c0b7]">TRACE received no valid YouTube video ID for this retrieved passage.</p>
                      {selectedSource.url && (
                        <a
                          href={selectedSource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#ff9e44] hover:underline font-mono-tech"
                        >
                          Open link <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div ref={playerAreaRef} className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-[#07080b] px-6 py-5 text-center">
                  <div className="mb-1.5 font-mono-tech text-sm uppercase tracking-[0.16em] text-[#34d399]">TRACE // INLINE PLAYER</div>
                  <p className="font-display text-lg font-semibold text-white">Select a retrieved lecture source</p>
                  <p className="mt-1 text-sm text-[#aaa79f]">The video opens here; matching transcript chunks are listed below.</p>
                </div>
              )}

              {loading ? (
                <div className="rounded-md border border-[#ff4d0a]/30 bg-[#ff4d0a]/[0.04] p-8 text-center space-y-3" role="status">
                  <Loader2 className="w-7 h-7 text-[#ff9e44] mx-auto animate-spin" />
                  <p className="font-display text-xl font-bold text-white">Searching the Qdrant index</p>
                  <p className="font-mono-tech text-lg text-[#aaa79f] animate-pulse">QUERY → 384D EMBEDDING → QDRANT COSINE SEARCH → TRANSCRIPT PASSAGES</p>
                </div>
              ) : requestError ? (
                <div className="rounded-md border border-red-500/30 bg-red-500/5 p-6 text-center space-y-2">
                  <ShieldAlert className="w-7 h-7 text-[#ff9e44] mx-auto" />
                  <p className="font-display font-bold text-white">{requestError.startsWith("Enter ") ? "A query is required" : "Could not retrieve live results"}</p>
                  <p className="text-xl text-[#c4c0b7]">{requestError}</p>
                  {!requestError.startsWith("Enter ") && (
                    <p className="font-mono-tech text-base text-[#aaa79f]">
                      Start the local RAG API with `.venv/bin/python kdsa_api.py`, then refresh backend status.
                    </p>
                  )}
                </div>
              ) : result.excerpts.length === 0 ? (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-6 text-center space-y-2">
                  <ShieldAlert className="w-7 h-7 text-[#ff9e44] mx-auto" />
                  <p className="font-display font-bold text-white">
                    {result.query ? "No matching transcript passages found" : "Search to retrieve real transcript passages"}
                  </p>
                  <p className="text-xl text-[#c4c0b7]">
                    {result.query
                      ? "The Qdrant index returned no matching passages above the score threshold for this query."
                      : "Results, scores, video titles, and timestamps will appear here after a live Qdrant search."}
                  </p>
                </div>
              ) : (
                result.excerpts.map((ex, i) => {
                  const isHighlighted = activeCite === i + 1;
                  const isSelected =
                    selectedSource?.video_id === ex.video_id &&
                    selectedSource.start_sec === ex.start_sec &&
                    selectedSource.chunk_index === ex.chunk_index;
                  const isExpanded = Boolean(expandedTranscripts[i]);
                  const hasGenuineTime = ex.timestamp && ex.timestamp !== "Timestamp unavailable";

                  return (
                    <div
                      key={`${ex.video_id}-${ex.start_sec}-${i}`}
                      ref={(el) => {
                        excerptRefs.current[i] = el;
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Play ${ex.video_title} at ${ex.timestamp} inside TRACE`}
                      aria-pressed={isSelected}
                      onClick={() => selectSource(ex, i)}
                      onKeyDown={(event) => {
                        if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                          event.preventDefault();
                          selectSource(ex, i);
                        }
                      }}
                      className={`rounded-md border p-4 transition duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9e44] ${
                        isSelected || isHighlighted
                          ? "border-[#ff4d0a] bg-[#ff4d0a]/[0.07] shadow-[0_0_26px_rgba(255,77,10,0.22)]"
                          : "border-white/10 bg-[#12151c] hover:border-white/25"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 font-mono-tech text-lg mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#3b82f6] text-white font-bold">
                            [{i + 1}]
                          </span>
                          <span className="text-[#34d399]">score={ex.score.toFixed(3)}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded border ${
                          hasGenuineTime
                            ? "border-[#ff4d0a]/45 bg-[#ff4d0a]/15 text-[#ff9e44]"
                            : "border-white/20 bg-white/5 text-[#aaa79f]"
                        }`}>
                          {isSelected ? "SELECTED · " : "PLAY · "}@ {ex.timestamp}
                        </span>
                      </div>

                      <h4 className="font-display text-xl font-bold text-white mb-2">
                        {ex.video_title}
                      </h4>

                      <div className="bg-black/45 p-3 rounded border border-white/5 space-y-2">
                        <p className="font-mono-tech text-xl leading-relaxed text-[#c6c3ba]">
                          &ldquo;{isExpanded && ex.transcript_text ? ex.transcript_text : ex.snippet}&rdquo;
                        </p>
                        {ex.transcript_text && ex.transcript_text !== ex.snippet && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTranscriptExpand(i);
                            }}
                            className="inline-flex items-center gap-1 font-mono-tech text-sm text-[#ff9e44] hover:underline cursor-pointer"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3.5 h-3.5" /> Collapse full transcript
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3.5 h-3.5" /> Expand full transcript ({ex.transcript_text.length} chars)
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 font-mono-tech text-lg">
                        <span className="text-[#aaa79f]">
                          video_id={ex.video_id || "N/A"}{hasGenuineTime ? ` · t=${ex.start_sec}s` : ""}
                        </span>
                        <div className="flex items-center gap-2">
                          {ex.url && (
                            <a
                              href={ex.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-[#d7d3ca] hover:text-[#ff9e44] inline-flex items-center gap-1"
                              title="Open on YouTube"
                            >
                              <span>YT</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <span className="text-[#34d399]">{isSelected ? "LOADED IN PLAYER" : "SELECT TO PLAY"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
