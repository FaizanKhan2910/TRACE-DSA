"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Search, Sparkles, X } from "lucide-react";
import { PLAYLIST_VIDEOS, RAG_DEMOS } from "@/data/verifiedData";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onQueryTopic: (query: string, mode?: "standard" | "deep") => void;
}

export function CommandPalette({ open, onClose, onQueryTopic }: CommandPaletteProps) {
  const [term, setTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => inputRef.current?.focus(), 20);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = term.trim().toLowerCase();
    const demoHits = RAG_DEMOS.filter(
      (d) =>
        !q ||
        d.short_label.toLowerCase().includes(q) ||
        d.query.toLowerCase().includes(q)
    ).slice(0, 4);

    const lectureHits = PLAYLIST_VIDEOS.filter(
      (v) =>
        !q ||
        v.title.toLowerCase().includes(q) ||
        String(v.num).includes(q) ||
        v.transcript_source.toLowerCase().includes(q)
    ).slice(0, 8);

    return { demoHits, lectureHits };
  }, [term]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global TRACE search palette"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--hairline)]">
          <Search className="w-4 h-4 text-[var(--ember)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search 69 lectures or try a sample question..."
            className="flex-1 bg-transparent font-mono-tech text-xl outline-none text-[var(--ink-primary)] placeholder-[var(--ink-muted)]"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-sm border border-[var(--hairline)] hover:border-[var(--ember)] cursor-pointer"
            aria-label="Close palette"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-[var(--hairline)] p-2 space-y-2">
          {results.demoHits.length > 0 && (
            <div className="pt-1">
              <div className="px-3 py-1 font-mono-tech text-lg text-[var(--ember)] uppercase">
                Verified RAG Queries
              </div>
              {results.demoHits.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    onQueryTopic(d.query, d.mode === "deep" ? "deep" : "standard");
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-sm hover:bg-[var(--bg-elevated)] flex items-center justify-between gap-2 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--ember)] shrink-0" />
                    <span className="text-xl font-medium truncate">{d.query}</span>
                  </div>
                  <span className="font-mono-tech text-lg text-[var(--emerald)] shrink-0">
                    RUN RAG
                  </span>
                </button>
              ))}
            </div>
          )}

          {results.lectureHits.length > 0 && (
            <div className="pt-2">
              <div className="px-3 py-1 font-mono-tech text-lg text-[var(--ink-muted)] uppercase">
                Indexed Lectures ({results.lectureHits.length})
              </div>
              {results.lectureHits.map((v) => (
                <a
                  key={v.id}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="px-3 py-2 rounded-sm hover:bg-[var(--bg-elevated)] flex items-center justify-between gap-2 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono-tech text-lg text-[var(--ember)]">
                      #{String(v.num).padStart(2, "0")}
                    </span>
                    <span className="text-xl truncate">{v.title}</span>
                  </div>
                  <span className="font-mono-tech text-lg text-[var(--ink-muted)] inline-flex items-center gap-1 shrink-0">
                    {v.transcript_source}
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
