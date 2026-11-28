"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Flame, Search, Zap } from "lucide-react";
import { PLAYLIST_VIDEOS } from "@/data/verifiedData";

interface CorpusAtlasProps {
  onQueryTopic: (query: string) => void;
}

const PHASES = [
  { id: 0, label: "All (69)" },
  { id: 1, label: "01 · Foundations (1–12)" },
  { id: 2, label: "02 · Search & Sort (13–22)" },
  { id: 3, label: "03 · Recursion (23–36)" },
  { id: 4, label: "04 · OOP 1–7 (37–43)" },
  { id: 5, label: "05 · Linear DS (44–48)" },
  { id: 6, label: "06 · Trees & HashMaps (49–57)" },
  { id: 7, label: "07 · FAANG Hard (58–69)" },
];

function fmtDur(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m ${String(s).padStart(2, "0")}s`;
}

export function CorpusAtlas({ onQueryTopic }: CorpusAtlasProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<number>(0);
  const [sourceFilter, setSourceFilter] = useState<"all" | "whisper" | "youtube">("all");
  const [marathonOnly, setMarathonOnly] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return PLAYLIST_VIDEOS.filter((v) => {
      if (phaseFilter !== 0 && v.phase !== phaseFilter) return false;
      if (sourceFilter === "whisper" && v.transcript_source !== "whisper") return false;
      if (sourceFilter === "youtube" && v.transcript_source === "whisper") return false;
      if (marathonOnly && v.duration_sec <= 5400) return false;
      if (q && !v.title.toLowerCase().includes(q) && !v.phase_label.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [searchTerm, phaseFilter, sourceFilter, marathonOnly]);

  const displayed = expanded ? filtered : filtered.slice(0, 12);
  const totalHrs = (filtered.reduce((acc, v) => acc + v.duration_sec, 0) / 3600).toFixed(1);

  return (
    <section id="atlas" className="relative py-20 lg:py-24 overflow-hidden">
      <div className="mx-auto w-[96vw] max-w-[2700px] px-5 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between border-b border-[var(--hairline)] pb-6">
          <div>
            <div className="font-mono-tech text-lg uppercase tracking-[0.16em] text-[var(--ember)]">
              LECTURE ATLAS // BROWSE THE COURSE
            </div>
            <h2 className="font-display text-[clamp(2rem,4vw,3.3rem)] font-bold tracking-[-0.04em] leading-[1.03] mt-3">
              Find a lesson by topic.{" "}
              <span className="font-normal text-[var(--tungsten)]">
                All 69 lectures, in one place.
              </span>
            </h2>
          </div>
          <div className="font-mono-tech text-xl text-[var(--ink-secondary)]">
            Showing <strong className="text-[var(--ink-primary)]">{filtered.length}</strong> / 69 lectures ·{" "}
            <strong className="text-[var(--ember)]">{totalHrs} hrs</strong>
          </div>
        </div>

        {/* Search + Source Segmented + Marathon Toggle */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-5 relative flex items-center">
            <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3.5 pointer-events-none" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search 69 lectures (e.g. AVL, Backtracking, Heap, Binary)..."
              className="w-full rounded-sm border border-[var(--hairline-strong)] bg-[var(--bg-card)] pl-10 pr-4 py-2.5 font-mono-tech text-xl outline-none focus:border-[var(--ember)] transition"
            />
          </div>

          <div className="lg:col-span-4 grid grid-cols-3 rounded-sm border border-[var(--hairline)] bg-[var(--bg-card)] p-1 gap-1">
            {[
              { id: "all" as const, label: "All (69)" },
              { id: "whisper" as const, label: "Transcript (25)" },
              { id: "youtube" as const, label: "Captions (44)" },
            ].map((src) => (
              <button
                key={src.id}
                type="button"
                onClick={() => setSourceFilter(src.id)}
                className={`font-mono-tech text-lg py-2 px-1.5 rounded-sm transition cursor-pointer ${
                  sourceFilter === src.id
                    ? "bg-[var(--ember)] text-[#090a0d] font-bold"
                    : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                }`}
              >
                {src.label}
              </button>
            ))}
          </div>

          <div className="lg:col-span-3 flex items-center">
            <button
              type="button"
              onClick={() => setMarathonOnly((m) => !m)}
              className={`w-full font-mono-tech text-lg py-2.5 px-3.5 rounded-sm border transition flex items-center justify-center gap-2 cursor-pointer ${
                marathonOnly
                  ? "border-[var(--ember)] bg-[var(--ember)]/15 text-[var(--ember)] font-bold shadow-[0_0_20px_var(--glow-ember)]"
                  : "border-[var(--hairline-strong)] bg-[var(--bg-card)] text-[var(--ink-secondary)] hover:border-[var(--ember)]"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Long lessons over 90 min (19)
            </button>
          </div>
        </div>

        {/* Phase Tabs */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PHASES.map((ph) => (
            <button
              key={ph.id}
              type="button"
              onClick={() => setPhaseFilter(ph.id)}
              className={`font-mono-tech text-lg px-3 py-1.5 rounded-sm border transition cursor-pointer ${
                phaseFilter === ph.id
                  ? "border-[var(--ember)] bg-[var(--bg-elevated)] text-[var(--ink-primary)] font-semibold"
                  : "border-[var(--hairline)] bg-[var(--bg-card)] text-[var(--ink-secondary)] hover:border-[var(--hairline-strong)]"
              }`}
            >
              {ph.label}
            </button>
          ))}
        </div>

        {/* Clean Responsive Rows (Zero Horizontal Overflow across Mobile/Tablet/Desktop!) */}
        <div className="mt-6 rounded-md border border-[var(--hairline)] bg-[var(--bg-card)] backdrop-blur-xl divide-y divide-[var(--hairline)] overflow-hidden">
          {displayed.length === 0 ? (
            <div className="p-10 text-center font-mono-tech text-xl text-[var(--ink-muted)]">
              No lectures matched your current filters. Clear search or reset phases.
            </div>
          ) : (
            displayed.map((lec) => {
              const isMarathon = lec.duration_sec > 5400;
              const isWhisper = lec.transcript_source === "whisper";
              return (
                <div
                  key={lec.id}
                  className="p-4 sm:px-5 sm:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-[var(--bg-elevated)]/70 transition"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <span className="font-mono-tech text-xl text-[var(--ink-muted)] shrink-0 pt-0.5">
                      #{String(lec.num).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="font-display font-semibold text-xl leading-snug text-[var(--ink-primary)]">
                        {lec.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 font-mono-tech text-lg">
                        <span className="text-[var(--ink-muted)]">{lec.phase_label}</span>
                        <span
                          className={`px-2 py-0.5 rounded-sm border ${
                            isMarathon
                              ? "border-[#ff4d0a]/50 bg-[#ff4d0a]/15 text-[var(--ember)] font-bold"
                              : "border-[var(--hairline)] bg-[var(--bg-surface)] text-[var(--ink-secondary)]"
                          }`}
                        >
                          {fmtDur(lec.duration_sec)}
                          {isMarathon ? " ★ MARATHON" : ""}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-sm border ${
                            isWhisper
                              ? "border-[#1cb67c]/40 bg-[#1cb67c]/10 text-[var(--emerald)]"
                              : "border-[var(--hairline)] bg-[var(--bg-surface)] text-[var(--ink-muted)]"
                          }`}
                        >
                          {isWhisper ? "Whisper AI" : "YT Captions"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-8 md:pl-0">
                    <a
                      href={lec.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono-tech text-lg px-3 py-1.5 rounded-sm border border-[var(--hairline-strong)] hover:border-[var(--ember)] transition inline-flex items-center gap-1"
                    >
                      Watch
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        onQueryTopic(
                          `Summarize key algorithms and edge cases taught in ${lec.title.split(" - ")[0]}`
                        )
                      }
                      className="font-mono-tech text-lg px-3 py-1.5 rounded-sm bg-[var(--ember)]/15 text-[var(--ember)] border border-[var(--ember)]/40 hover:bg-[var(--ember)] hover:text-[#090a0d] font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3 h-3" />
                      Ask about lesson
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {filtered.length > 12 && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="font-mono-tech text-xl px-5 py-2.5 rounded-sm border border-[var(--hairline-strong)] bg-[var(--bg-card)] hover:border-[var(--ember)] transition cursor-pointer"
            >
              {expanded
                ? "Collapse List ↑"
                : `Show All ${filtered.length} Indexed Lectures ↓`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
