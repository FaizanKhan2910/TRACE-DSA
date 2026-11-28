"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Play, Zap } from "lucide-react";

interface PipelineBentoProps {
  onQueryTopic: (query: string, mode?: "standard" | "deep") => void;
}

const SWEEP_NODES = [
  { pos: 18, time: "32:29", label: "Binary Search Overflow", url: "https://www.youtube.com/watch?v=f6UU7V3szVw&t=1949s", q: "Why does Kunal use start + (end - start) / 2 instead of (start + end) / 2 in Binary Search?", demoId: "binary-search-mid" },
  { pos: 41, time: "38:23", label: "AVL LR Double Rotation", url: "https://www.youtube.com/watch?v=CVA85JuJEn0&t=2303s", q: "Explain AVL tree balance factors and the four rotation cases with code logic and time complexity", demoId: "avl-rotations" },
  { pos: 64, time: "38:06", label: "Cyclic Sort 1..N Proof", url: "https://www.youtube.com/watch?v=JfinxytTYFQ&t=2286s", q: "In Cyclic Sort, how does index mapping work for numbers 1 to N and why is time complexity O(N)?", demoId: "cyclic-sort" },
  { pos: 86, time: "36:45", label: "N-Queens Backtracking", url: "https://www.youtube.com/watch?v=nC1rbW2YSz0&t=2205s", q: "How does Kunal solve the N-Queens problem with backtracking and check board conflicts?", demoId: "n-queens" },
];

export function PipelineBento({ onQueryTopic }: PipelineBentoProps) {
  const [sweepPct, setSweepPct] = useState(41);
  const [sweeping, setSweeping] = useState(false);

  // Count-up animated metrics
  const metricsRef = useRef<HTMLDivElement>(null);
  const [counted, setCounted] = useState(false);
  const [vals, setVals] = useState({ hrs: 79.6, whisper: 25, chunks: 7055, hit: 90.0 });

  useEffect(() => {
    const el = metricsRef.current;
    if (!el || counted) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCounted(true);
          const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (prefersReduced) return;
          const start = performance.now();
          const dur = 900;
          const step = (now: number) => {
            const t = Math.min(1, (now - start) / dur);
            const ease = 1 - Math.pow(1 - t, 3);
            setVals({
              hrs: Number((79.6 * ease).toFixed(1)),
              whisper: Math.round(25 * ease),
              chunks: Math.round(7055 * ease),
              hit: Number((90.0 * ease).toFixed(1)),
            });
            if (t < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [counted]);

  const fireSweep = () => {
    if (sweeping) return;
    setSweeping(true);
    let pct = 4;
    const id = window.setInterval(() => {
      pct += 3.2;
      if (pct >= 86) {
        setSweepPct(86);
        setSweeping(false);
        window.clearInterval(id);
      } else {
        setSweepPct(Math.round(pct));
      }
    }, 28);
  };

  const activeNode =
    SWEEP_NODES.reduce((closest, node) =>
      Math.abs(node.pos - sweepPct) < Math.abs(closest.pos - sweepPct) ? node : closest
    ) || SWEEP_NODES[0];

  return (
    <section id="pipeline" className="relative py-20 lg:py-24 overflow-hidden">
      <div className="mx-auto w-[96vw] max-w-[2700px] px-5 sm:px-8">
        {/* Verified Animated Telemetry Strip */}
        <div
          ref={metricsRef}
          id="proof"
          className="grid grid-cols-2 lg:grid-cols-4 border border-[var(--hairline)] rounded-md bg-[var(--bg-card)] backdrop-blur-xl divide-y lg:divide-y-0 lg:divide-x divide-[var(--hairline)] mb-16 overflow-hidden"
        >
          <div className="p-6 sm:p-8 border-r lg:border-r-0 border-[var(--hairline)]">
            <div className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight">
              {vals.hrs} <span className="text-xl sm:text-2xl text-[var(--ember)]">HRS</span>
            </div>
            <div className="font-mono-tech text-lg uppercase tracking-[0.12em] text-[var(--ink-secondary)] mt-2">
              286,537s Linear Video Indexed
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <div className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight">
              {vals.whisper} <span className="text-xl sm:text-2xl text-[var(--ink-muted)]">/ 69</span>
            </div>
            <div className="font-mono-tech text-lg uppercase tracking-[0.12em] text-[var(--ink-secondary)] mt-2">
              Whisper AI 30m Sliced Rescues
            </div>
          </div>
          <div className="p-6 sm:p-8 border-r lg:border-r-0 border-[var(--hairline)]">
            <div className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight">
              {vals.chunks.toLocaleString()}
            </div>
            <div className="font-mono-tech text-lg uppercase tracking-[0.12em] text-[var(--ink-secondary)] mt-2">
              Deduplicated 384d Qdrant Vectors
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <div className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--emerald)]">
              {vals.hit.toFixed(1)}%
            </div>
            <div className="font-mono-tech text-lg uppercase tracking-[0.12em] text-[var(--ink-secondary)] mt-2">
              Verified Eval hit@5 (MRR 0.829)
            </div>
          </div>
        </div>

        {/* Linear Time Collapse Interactive Fiber Scrubber */}
        <div className="mb-16 rounded-md border border-[var(--hairline-strong)] bg-[var(--bg-surface)] p-5 sm:p-7 shadow-[var(--shadow-card)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <div className="font-mono-tech text-lg tracking-[0.14em] uppercase text-[var(--ember)]">
                INTERACTIVE TEMPORAL COLLAPSE // SCRUB OR SWEEP
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold mt-1">
                Drag across the corpus timeline to lock onto exact proofs
              </h3>
            </div>
            <button
              type="button"
              onClick={fireSweep}
              className="btn-ember-glow font-mono-tech text-lg px-4 py-2.5 rounded-sm inline-flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              {sweeping ? "SCANNING CORPUS..." : "Fire Laser Sweep ⚡"}
            </button>
          </div>

          {/* Interactive Track Bar */}
          <div
            className="relative h-20 rounded-sm border border-[var(--hairline)] bg-[#08090d] px-4 flex items-center cursor-ew-resize overflow-hidden select-none"
            onPointerMove={(e) => {
              if (e.buttons === 1 || e.pointerType === "mouse") {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
                setSweepPct(Math.round(pct));
              }
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
              setSweepPct(Math.round(pct));
            }}
          >
            {/* Simulated dense video waveform backdrop */}
            <div className="absolute inset-x-4 flex items-center justify-between gap-[3px] h-10 opacity-45 pointer-events-none">
              {Array.from({ length: 64 }).map((_, i) => {
                const hPct = 24 + ((i * 37) % 68);
                const nearLaser = Math.abs((i / 64) * 100 - sweepPct) < 7;
                return (
                  <span
                    key={i}
                    className="w-[2px] rounded-full transition-colors duration-150"
                    style={{
                      height: `${hPct}%`,
                      backgroundColor: nearLaser ? "#ff4d0a" : "#6f6d67",
                    }}
                  />
                );
              })}
            </div>

            {/* Locked Target Pins */}
            {SWEEP_NODES.map((node) => {
              const isLocked = activeNode.time === node.time;
              return (
                <button
                  key={node.time}
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setSweepPct(node.pos);
                  }}
                  style={{ left: `${node.pos}%` }}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer"
                  aria-label={`${node.label} at ${node.time}`}
                >
                  <span
                    className={`block h-3.5 w-3.5 rounded-full border-2 transition-transform ${
                      isLocked
                        ? "bg-[#1cb67c] border-white scale-125 shadow-[0_0_18px_#1cb67c]"
                        : "bg-[#ff4d0a] border-[#08090d] hover:scale-125"
                    }`}
                  />
                </button>
              );
            })}

            {/* Moving Volcanic Laser Line */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-[#ff4d0a] shadow-[0_0_24px_#ff4d0a,0_0_48px_#ff9e44] pointer-events-none transition-[left] duration-75"
              style={{ left: `${sweepPct}%` }}
            >
              <span className="absolute -top-0.5 -left-[4px] h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_12px_#ff4d0a]" />
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-mono-tech text-xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2 py-0.5 rounded-sm bg-[#1cb67c]/15 text-[var(--emerald)] border border-[#1cb67c]/40">
                SWEEP {sweepPct}% · LOCK @ {activeNode.time}
              </span>
              <span className="font-semibold text-[var(--ink-primary)]">{activeNode.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={activeNode.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-sm border border-[var(--hairline-strong)] hover:border-[var(--ember)] transition inline-flex items-center gap-1 text-lg"
              >
                Watch @ {activeNode.time}
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => onQueryTopic(activeNode.q, "deep")}
                className="px-3 py-1.5 rounded-sm bg-[var(--ember)] text-[#090a0d] font-bold inline-flex items-center gap-1 text-lg cursor-pointer"
              >
                <Zap className="w-3 h-3" />
                Load in Console
              </button>
            </div>
          </div>
        </div>

        </div>
    </section>
  );
}
