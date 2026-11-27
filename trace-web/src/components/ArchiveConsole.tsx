"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Check, Copy, Loader2, ShieldAlert, Sparkles, Terminal } from "lucide-react";
import { RagExcerpt } from "@/data/verifiedData";
import { InlineLecturePlayer } from "@/components/InlineLecturePlayer";

export interface ArchiveConsoleHandle {
  runExternalQuery: (query: string) => void;
}

interface QueryResultState {
  query: string;
  mode: "standard" | "deep";
  covered: boolean;
  top_score: number;
  sub_queries: string[];
  answer: string;
  excerpts: RagExcerpt[];
  latency_ms: number;
  cli_command: string;
  collection: string;
  vectors: number | null;
  synthesis_error?: string | null;
}

interface BackendStatus {
  liveBackend: boolean;
  collection?: string;
  vectors?: number;
  embed_model?: string;
  vector_size?: number;
  distance?: string;
  synthesis_available?: boolean;
  error?: string;
}

const emptyResult: QueryResultState = {
  query: "",
  mode: "deep",
  covered: false,
  top_score: 0,
  sub_queries: [],
  answer: "Enter a Java or DSA question to search the local transcript index.",
  excerpts: [],
  latency_ms: 0,
  cli_command: "",
  collection: "",
  vectors: null,
};

const shellQuote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`;
export const ArchiveConsole = forwardRef<ArchiveConsoleHandle>(function ArchiveConsole(_, ref) {
  const [liveBackend, setLiveBackend] = useState<boolean | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [mode, setMode] = useState<"standard" | "deep">("deep");
  const [question, setQuestion] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [stepLabel, setStepLabel] = useState<string>("CONNECTING TO LOCAL QDRANT...");
  const [result, setResult] = useState<QueryResultState>(emptyResult);
  const [streamedText, setStreamedText] = useState<string>(emptyResult.answer);
  const [activeCite, setActiveCite] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState<RagExcerpt | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [copiedCli, setCopiedCli] = useState<boolean>(false);

  const streamTimerRef = useRef<number | null>(null);
  const excerptRefs = useRef<(HTMLDivElement | null)[]>([]);
  const playerAreaRef = useRef<HTMLDivElement | null>(null);
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const [rightPanelHeight, setRightPanelHeight] = useState<number | null>(null);
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const currentCliCommand = question.trim()
    ? `uv run python -m kdsa.cli ${mode === "deep" ? "deep" : "ask"} -- ${shellQuote(question.trim())}`
    : "";

  useEffect(() => {
    fetch("/api/trace", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: BackendStatus) => {
        setBackendStatus(d);
        setLiveBackend(Boolean(d.liveBackend));
        setStepLabel(
          d.liveBackend
            ? `QDRANT READY · ${Number(d.vectors ?? 0).toLocaleString()} VECTORS`
            : "LOCAL QDRANT UNAVAILABLE · START THE KDSA API"
        );
      })
      .catch(() => {
        setLiveBackend(false);
        setStepLabel("LOCAL QDRANT UNAVAILABLE · START THE KDSA API");
      });

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
        setRightPanelHeight((current) => current === null ? current : null);
        return;
      }
      const nextHeight = Math.ceil(leftPanel.getBoundingClientRect().height);
      setRightPanelHeight((current) => current === nextHeight ? current : nextHeight);
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
    excerptRefs.current = [];
    setStepLabel(nextMode === "deep" ? "EXPANDING QUERY · SEARCHING LOCAL QDRANT..." : "EMBEDDING QUERY · SEARCHING LOCAL QDRANT...");

    try {
      const res = await fetch("/api/trace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: clean, mode: nextMode }),
        signal: controller.signal,
      });
      const data = (await res.json()) as QueryResultState & { error?: string };
      if (!res.ok) throw new Error(data.error || "Local retrieval failed.");
      if (requestId !== requestIdRef.current) return;
      setResult(data);
      setActiveCite(null);
      setStepLabel(
        data.synthesis_error
          ? `SOURCES FOUND · SYNTHESIS UNAVAILABLE · ${data.latency_ms}ms`
          : !data.covered
            ? `${data.excerpts.length ? "LOW CONFIDENCE" : "NO MATCHING PASSAGES"} · ${data.latency_ms}ms`
            : `LIVE QDRANT · ${data.excerpts.length} SOURCES · ${data.latency_ms}ms`
      );
      animateAnswerStream(data.answer);
    } catch (error) {
      if (requestId !== requestIdRef.current || (error instanceof Error && error.name === "AbortError")) return;
      const message = error instanceof Error ? error.message : "Unable to reach the local retrieval API.";
      setRequestError(message);
      setStepLabel("SEARCH FAILED · LOCAL RETRIEVAL ERROR");
      setStreamedText("");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
      runExternalQuery: (queryText: string) => {
        setQuestion(queryText);
        executeQuery(queryText, mode);
    },
  }));

  const handleCitationClick = (citeNum: number) => {
    setActiveCite(citeNum);
    const el = excerptRefs.current[citeNum - 1];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const selectSource = (excerpt: RagExcerpt, index: number) => {
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
      const end = excerpt.end_sec ?? excerpt.start_sec;
      return excerpt.video_id === selectedSource.video_id && seconds >= excerpt.start_sec && seconds <= end;
    });
    if (index >= 0) setActiveCite((current) => current === index + 1 ? current : index + 1);
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
            Search indexed lesson passages. Ask a Java or DSA question, then follow a source timestamp to that moment in the video with{" "}
            <code className="font-mono-tech text-xl text-[#ff9e44]">?t=Xs</code>.
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
                  {backendStatus?.embed_model ?? "Local embedding model"} · {backendStatus?.vector_size ?? "—"}d {backendStatus?.distance ?? "similarity"} · RRF Fusion
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Live Backend Indicator */}
              <div
                className={`px-3 py-1 rounded-full border font-mono-tech text-lg inline-flex items-center gap-2 ${
                  liveBackend
                    ? "border-emerald-500/40 bg-emerald-500/10 text-[#34d399]"
                    : "border-amber-500/40 bg-amber-500/10 text-[#ff9e44]"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    liveBackend ? "bg-[#1cb67c] animate-pulse" : "bg-[#ff9e44]"
                  }`}
                />
                {liveBackend === null
                  ? "PROBING LOCAL QDRANT..."
                  : liveBackend
                  ? backendStatus?.synthesis_available
                    ? "LIVE QDRANT · GROQ SYNTHESIS READY"
                    : "LIVE QDRANT · RETRIEVAL ONLY"
                  : "LOCAL QDRANT UNAVAILABLE"}
              </div>
            </div>
          </div>

          {/* Preset Query Chips + Mode Switch + Input */}
          <div className="p-5 sm:p-6 border-b border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-mono-tech text-base sm:text-lg text-[#aaa79f]">
                {backendStatus
                  ? `${backendStatus.collection ?? "QDRANT COLLECTION"} · ${Number(backendStatus.vectors ?? 0).toLocaleString()} VECTORS · ${backendStatus.vector_size ?? "?"}D ${backendStatus.distance ?? "VECTOR"} · ${backendStatus.embed_model ?? "EMBEDDING MODEL"}`
                  : "Checking local vector index…"}
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
                    {m === "standard" ? "Standard (k=4)" : "Deep Search (RRF)"}
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
                placeholder="Ask a question covered by the indexed Java and DSA lessons..."
                className="flex-1 bg-transparent text-[#f4f0e8] placeholder-[#5a5d66] font-mono-tech text-xl leading-relaxed outline-none resize-none min-h-[46px]"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-ember-glow font-mono-tech text-xl px-5 py-3 rounded-md inline-flex items-center justify-center gap-2 shrink-0 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    RETRIEVING...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    SEARCH ARCHIVE ↗
                  </>
                )}
              </button>
            </form>

            {/* Dynamic Copyable CLI Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-md border border-white/10 bg-black/40 font-mono-tech text-lg">
              <div className="flex items-center gap-2 text-[#34d399] min-w-0">
                <Terminal className="w-3.5 h-3.5 text-[#ff4d0a] shrink-0" />
                <span className="truncate">
                  {currentCliCommand || "Enter a query to preview the matching CLI command"}
                </span>
              </div>
              <button
                type="button"
                onClick={copyCli}
                disabled={!currentCliCommand}
                className="px-2.5 py-1 rounded border border-white/15 bg-white/5 hover:border-[#ff4d0a] text-[#f4f0e8] inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedCli ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3" />}
                {copiedCli ? "Copied" : "Copy CLI"}
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
                  ● {loading ? (mode === "deep" ? "EXPANDING QUERIES · SEARCHING LOCAL QDRANT…" : "EMBEDDING QUERY · SEARCHING LOCAL QDRANT…") : stepLabel}
                </span>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#c4c0b7]">
                  {result.excerpts.length ? `TOP MATCH: ${result.top_score.toFixed(3)}` : "NO SCORE YET"}
                </span>
              </div>

              {/* Expanded Sub-Queries */}
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
                <div className="font-mono-tech text-lg tracking-[0.1em] text-[#34d399] mb-3 flex items-center gap-2">
                  {result.synthesis_error ? (
                    <span className="text-[#ff9e44]">SYNTHESIS UNAVAILABLE · REVIEW LIVE SOURCES</span>
                  ) : result.covered ? (
                    <span>GROUNDED SYNTHESIS // CLICK [N] TO INSPECT PROOF</span>
                  ) : (
                    <span className="text-[#ff9e44] inline-flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {requestError ? "LOCAL RETRIEVAL ERROR" : result.query ? "SYNTHESIS / COVERAGE STATUS" : "GROUNDED ANSWER"}
                    </span>
                  )}
                </div>
                <p className="text-xl leading-[1.75] text-[#ebe7df]">
                  {loading ? (
                    <span className="inline-flex items-center gap-2 text-[#ff9e44]" role="status">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="animate-pulse">Embedding query, searching Qdrant, and collecting source receipts…</span>
                    </span>
                  ) : requestError ? requestError : renderCitedProse(streamedText || result.answer)}
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
                <span>COLLECTION: {result.collection || backendStatus?.collection || "—"} · {result.vectors != null ? result.vectors.toLocaleString() : Number(backendStatus?.vectors ?? 0).toLocaleString()} VECTORS</span>
              </div>

              {selectedSource ? (
                <div ref={playerAreaRef} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#ff9e44]/35 bg-[#ff9e44]/[0.08] px-4 py-3">
                    <div className="min-w-0">
                      <div className="font-mono-tech text-sm font-bold uppercase tracking-[0.12em] text-[#ffbd73]">
                        Need to search again?
                      </div>
                      <p className="mt-1 text-base leading-relaxed text-[#e4dfd5]">
                        Press <kbd className="rounded border border-white/25 bg-black/40 px-1.5 py-0.5 font-mono-tech text-sm text-white">Esc</kbd> to exit video fullscreen, then scroll up to the question box. You can also jump there now.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={returnToSearch}
                      className="shrink-0 rounded border border-[#ff9e44]/50 bg-[#ff9e44]/15 px-3 py-2 font-mono-tech text-sm font-bold uppercase tracking-wide text-[#ffbd73] transition hover:bg-[#ff9e44] hover:text-[#090a0d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9e44]"
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
                      onTimeUpdate={syncReceiptWithPlayback}
                    />
                  ) : (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-6 text-center">
                      <ShieldAlert className="mx-auto mb-2 h-7 w-7 text-[#ff9e44]" />
                      <p className="font-display font-semibold text-white">No playable video ID on this source</p>
                      <p className="mt-1 font-mono-tech text-sm text-[#c4c0b7]">TRACE received no valid YouTube video ID for this retrieved passage.</p>
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
                  <p className="font-display text-xl font-bold text-white">Searching the local transcript index</p>
                  <p className="font-mono-tech text-lg text-[#aaa79f] animate-pulse">QUERY → EMBEDDING → QDRANT → SOURCE RECEIPTS</p>
                </div>
              ) : requestError ? (
                <div className="rounded-md border border-red-500/30 bg-red-500/5 p-6 text-center space-y-2">
                  <ShieldAlert className="w-7 h-7 text-[#ff9e44] mx-auto" />
                  <p className="font-display font-bold text-white">{requestError.startsWith("Enter ") ? "A query is required" : "Could not retrieve live results"}</p>
                  <p className="text-xl text-[#c4c0b7]">{requestError}</p>
                  {!requestError.startsWith("Enter ") && <p className="font-mono-tech text-base text-[#aaa79f]">Start the local service with: uv run python kdsa_api.py</p>}
                </div>
              ) : result.excerpts.length === 0 ? (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-6 text-center space-y-2">
                  <ShieldAlert className="w-7 h-7 text-[#ff9e44] mx-auto" />
                  <p className="font-display font-bold text-white">
                    {result.query ? "No transcript passages found" : "Search to retrieve real transcript passages"}
                  </p>
                  <p className="text-xl text-[#c4c0b7]">
                    {result.query ? "The local Qdrant index returned no matching passages for this query." : "Results, scores, video titles, and timestamps will appear here after a live Qdrant search."}
                  </p>
                </div>
              ) : (
                result.excerpts.map((ex, i) => {
                  const isHighlighted = activeCite === i + 1;
                  const isSelected =
                    selectedSource?.video_id === ex.video_id &&
                    selectedSource.start_sec === ex.start_sec &&
                    selectedSource.chunk_index === ex.chunk_index;
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
                        <span className="px-2 py-0.5 rounded border border-[#ff4d0a]/45 bg-[#ff4d0a]/15 text-[#ff9e44]">
                          {isSelected ? "SELECTED · " : "PLAY · "}@ {ex.timestamp}
                        </span>
                      </div>

                      <h4 className="font-display text-xl font-bold text-white mb-2">
                        {ex.video_title}
                      </h4>
                      <p className="font-mono-tech text-xl leading-relaxed text-[#c6c3ba] bg-black/45 p-3 rounded border border-white/5">
                        &ldquo;{ex.snippet}&rdquo;
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-2 font-mono-tech text-lg">
                        <span className="text-[#aaa79f]">video_id={ex.video_id} · t={ex.start_sec}s</span>
                        <span className="text-[#34d399]">{isSelected ? "LOADED IN TRACE PLAYER" : "SELECT TO PLAY INLINE"}</span>
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
