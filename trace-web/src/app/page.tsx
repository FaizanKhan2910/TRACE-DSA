"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, Moon, Search, Sparkles, Sun, X, Zap } from "lucide-react";
import { TemporalShaderCanvas } from "@/components/TemporalShaderCanvas";
import { OpticalPortraitStage } from "@/components/OpticalPortraitStage";
import { VectorSpace3D } from "@/components/VectorSpace3D";
import { PipelineBento } from "@/components/PipelineBento";
import { ArchiveConsole, ArchiveConsoleHandle } from "@/components/ArchiveConsole";
import { CorpusAtlas } from "@/components/CorpusAtlas";
import { CreatorStory } from "@/components/CreatorStory";
import { CommandPalette } from "@/components/CommandPalette";
import { MagneticButton } from "@/components/MagneticButton";

function fmtSeconds(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

export default function HomePage() {
  const [theme, setTheme] = useState<"radiant" | "paper">("radiant");
  const [scrollPct, setScrollPct] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const archiveRef = useRef<ArchiveConsoleHandle>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const total = Math.max(1, doc.scrollHeight - window.innerHeight);
      setScrollPct(Math.min(1, Math.max(0, window.scrollY / total)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleQueryTopic = (query: string, mode?: "standard" | "deep") => {
    archiveRef.current?.runExternalQuery(query, mode);
    const el = document.getElementById("query");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const currentVideoTime = fmtSeconds(Math.round(scrollPct * 286537));

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      {/* Subtle film grain surface overlay */}
      <div aria-hidden="true" className="film-grain" />

      {/* Top Scroll Laser Beam */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-transparent pointer-events-none"
      >
        <div
          className="h-full relative transition-[width] duration-75"
          style={{
            width: `${Math.max(2, scrollPct * 100)}%`,
            background: "linear-gradient(90deg, #ff4d0a, #ff9e44, #1cb67c)",
            boxShadow: "0 0 18px rgba(255,77,10,0.9)",
          }}
        >
          <span className="absolute right-0 -top-[3px] h-2 w-2 rounded-full bg-white shadow-[0_0_12px_#ff4d0a]" />
        </div>
      </div>

      {/* Sticky Architectural Navigation Bar */}
      <header className="sticky top-0 z-40 h-[76px] lg:h-[92px] border-b border-[var(--hairline)] bg-[var(--bg-glass)] backdrop-blur-xl">
        <div className="mx-auto w-[96vw] max-w-[2700px] h-full px-5 sm:px-8 flex items-center justify-between gap-4">
          <a href="#system" className="flex items-center gap-3 group shrink-0">
            <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-sm bg-[#111216] border border-[var(--hairline-strong)] text-[#ff4d0a] grid place-items-center font-mono-tech text-xl lg:text-2xl font-bold shadow-[0_0_20px_rgba(255,77,10,0.3)] group-hover:border-[#ff4d0a] transition">
              ▦
            </div>
            <div>
              <div className="font-display font-bold text-xl lg:text-2xl tracking-tight leading-none">
                TRACE
              </div>
              <div className="font-mono-tech text-sm sm:text-base lg:text-xl text-[var(--ink-muted)] mt-1 leading-none">
                {currentVideoTime} / 79:35:37
              </div>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-lg xl:text-xl 2xl:text-2xl font-medium text-[var(--ink-secondary)]">
            <a href="#manifold" className="hover:text-[var(--ember)] transition">
              3D Manifold
            </a>
            <a href="#pipeline" className="hover:text-[var(--ember)] transition">
              Proof & timeline
            </a>
            <a href="#query" className="hover:text-[var(--ember)] transition">
              Live Console
            </a>
            <a href="#atlas" className="hover:text-[var(--ember)] transition">
              69-Lecture Atlas
            </a>
            <a href="#creator" className="hover:text-[var(--ember)] transition">
              Man Behind It
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="cmd-open-btn"
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:inline-flex items-center gap-2.5 px-4 py-2.5 rounded-sm border border-[var(--hairline-strong)] bg-[var(--bg-card)] hover:border-[var(--ember)] transition font-mono-tech text-base xl:text-lg 2xl:text-xl text-[var(--ink-secondary)] cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[var(--ember)]" />
              <span>Search corpus</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--hairline)] text-base xl:text-lg 2xl:text-xl">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setTheme((t) => (t === "radiant" ? "paper" : "radiant"))}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-sm border border-[var(--hairline-strong)] bg-[var(--bg-card)] hover:border-[var(--ember)] transition font-mono-tech text-base xl:text-lg 2xl:text-xl cursor-pointer"
              aria-label="Toggle radiant dark or paper light polarity"
            >
              {theme === "radiant" ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#ff9e44]" />
                  <span className="hidden xl:inline">PAPER</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#ff4d0a]" />
                  <span className="hidden xl:inline">RADIANT</span>
                </>
              )}
            </button>

            <MagneticButton
              href="#query"
              className="btn-ember-glow hidden sm:inline-flex items-center gap-1.5 px-5 py-3 rounded-sm font-mono-tech text-base xl:text-lg 2xl:text-xl"
            >
              Query Engine ↗
            </MagneticButton>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-sm border border-[var(--hairline-strong)] bg-[var(--bg-card)] cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[var(--hairline)] bg-[var(--bg-surface)] px-5 py-4 space-y-2.5 font-mono-tech text-xl">
            {[
              { href: "#manifold", label: "01 // Live 3D Vector Manifold" },
              { href: "#pipeline", label: "02 // Results & timeline" },
              { href: "#query", label: "03 // Live Archive Console" },
              { href: "#atlas", label: "04 // 69-Lecture Corpus Atlas" },
              { href: "#creator", label: "05 // Man Behind Corpus" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 border-b border-[var(--hairline)] last:border-0 hover:text-[var(--ember)]"
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setPaletteOpen(true);
              }}
              className="w-full py-2.5 rounded-sm border border-[var(--ember)] text-[var(--ember)] font-semibold"
            >
              Open ⌘K Search Palette
            </button>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* HERO SECTION WITH THREE.JS GLSL SHADER + GYROSCOPIC PORTRAIT */}
        <section
          id="system"
          className="relative h-[calc(100svh-76px)] lg:h-[calc(100svh-92px)] min-h-[600px] border-b border-[var(--hairline)] flex items-center overflow-hidden"
        >
          <TemporalShaderCanvas theme={theme} />

          <div className="relative z-10 mx-auto w-[96vw] max-w-[2700px] h-full px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Hero copy */}
            <div className="hero-copy lg:col-span-6 space-y-7 order-2 lg:order-1 flex flex-col justify-center py-10 lg:py-12">
              <div className="hero-eyebrow inline-flex flex-wrap items-center gap-2.5 font-mono-tech text-xl uppercase tracking-[0.12em] text-[var(--ink-secondary)]">
                <span className="h-2 w-2 rounded-full bg-[var(--ember)] shadow-[0_0_12px_var(--ember)]" />
                <span>69 lessons · 79.6 hours · every answer linked to its source</span>
              </div>

              <h1 className="hero-heading font-display font-extrabold tracking-[-0.045em] leading-[0.95] text-[clamp(3rem,6.1vw,7.5rem)]">
                <span className="block">Find the moment</span>
                <span className="block">you need in 79.6 hours</span>
                <span className="block">
                  <span className="font-serif-editorial italic font-normal text-[var(--tungsten)] tracking-[-0.02em]">
                    of Java and DSA lessons.
                  </span>
                </span>
              </h1>

              <p className="hero-description max-w-2xl text-xl sm:text-2xl leading-relaxed text-[var(--ink-secondary)]">
                Search the full playlist, jump straight to the explanation you need, and check the answer against the original video.
                {" "}<code className="font-mono-tech text-xl px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--hairline)] text-[var(--ember)]">
                  ?t=Xs
                </code> takes you directly to the cited moment.
              </p>

              <div className="hero-actions flex flex-wrap items-center gap-3 pt-1">
                <MagneticButton
                  href="#query"
                  className="btn-ember-glow font-mono-tech text-xl px-5 py-3.5 rounded-sm inline-flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Search the lessons ↗
                </MagneticButton>
                <MagneticButton
                  href="#manifold"
                  className="font-mono-tech text-xl px-5 py-3.5 rounded-sm border border-[var(--hairline-strong)] bg-[var(--bg-card)] backdrop-blur-md hover:border-[var(--ember)] transition inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[var(--ember)]" />
                  Explore the lesson map
                </MagneticButton>
                <a
                  href="#atlas"
                  className="font-mono-tech text-xl px-4 py-3.5 rounded-sm text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition"
                >
                  Browse 69 Lectures ↓
                </a>
              </div>

              <div className="hero-status inline-flex items-center gap-2.5 px-3.5 py-2 rounded-sm border border-[#1cb67c]/35 bg-[#1cb67c]/10 font-mono-tech text-xl text-[var(--emerald)]">
                <span className="h-2 w-2 rounded-full bg-[#1cb67c] shadow-[0_0_10px_#1cb67c] animate-pulse" />
                <span>Runs on a local index · no paid vector database required</span>
              </div>
            </div>

            {/* Hero Optical Portrait Portal (5 cols) */}
            <div className="lg:col-span-6 order-1 lg:order-2 h-full">
              <OpticalPortraitStage />
            </div>
          </div>
        </section>

        {/* DUAL-DIRECTION LUMINOUS MARQUEE TICKER */}
        <div className="marquee-container border-b border-[var(--hairline)] bg-[#090b0f] text-[#f4f0e8] overflow-hidden py-3.5 space-y-2 select-none">
          <div className="marquee-track font-mono-tech text-lg tracking-[0.14em] uppercase">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex items-center gap-10 pr-10">
                <span>LOCAL-FIRST RAG</span>
                <span className="text-[#ff4d0a]">✦</span>
                <span>THREE.JS VECTOR MANIFOLD</span>
                <span className="text-[#1cb67c]">●</span>
                <span>25 WHISPER 30M RESCUES</span>
                <span className="text-[#ff4d0a]">✦</span>
                <span>7,055 BGE-SMALL VECTORS</span>
                <span className="text-[#1cb67c]">●</span>
                <span>90.0% EVAL HIT@5</span>
                <span className="text-[#ff4d0a]">✦</span>
                <span>RRF 4-QUERY EXPANSION</span>
                <span className="text-[#1cb67c]">●</span>
              </div>
            ))}
          </div>
          <div className="marquee-track-reverse font-mono-tech text-lg tracking-[0.16em] text-[#aaa79f] uppercase">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex items-center gap-10 pr-10">
                <span>W9QJ8HaRvJQ · 4H 01M BINARY SEARCH MARATHON</span>
                <span className="text-[#ff9e44]">/</span>
                <span>9D-vP-jcc-Y · 5H 02M BINARY TREES INTERVIEW MARATHON</span>
                <span className="text-[#ff9e44]">/</span>
                <span>CVA85JuJEn0 · AVL SELF-BALANCING ROTATIONS</span>
                <span className="text-[#ff9e44]">/</span>
                <span>CORPUS BY KUNAL KUSHWAHA · ZERO PAYWALLS</span>
                <span className="text-[#ff9e44]">/</span>
              </div>
            ))}
          </div>
        </div>

        {/* CHAPTER 01 — INTERACTIVE THREE.JS QDRANT VECTOR MANIFOLD */}
        <VectorSpace3D theme={theme} onQueryTopic={handleQueryTopic} />

        {/* CHAPTER 02 — PROJECT RESULTS AND VIDEO TIMELINE */}
        <PipelineBento onQueryTopic={handleQueryTopic} />

        {/* CHAPTER 03 — WORKABLE LIVE QDRANT + GROQ ARCHIVE CONSOLE */}
        <ArchiveConsole ref={archiveRef} />

        {/* CHAPTER 04 — 69-LECTURE CORPUS ATLAS */}
        <CorpusAtlas onQueryTopic={handleQueryTopic} />

        {/* CHAPTER 05 — STORYTELLING FINALE: KUNAL KUSHWAHA BEHIND THE CORPUS */}
        <CreatorStory />
      </main>

      {/* TECHNICAL COLOPHON FOOTER */}
      <footer className="border-t border-[var(--hairline)] bg-[var(--bg-surface)] py-8">
        <div className="mx-auto w-[96vw] max-w-[2700px] px-5 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono-tech text-lg text-[var(--ink-muted)]">
          <div>
            <strong className="text-[var(--ink-primary)]">TRACE // RAG_MACHINE</strong> · Next.js + Three.js + Qdrant + Whisper AI
          </div>
          <div>
            79.6 HRS · 69 LECTURES · 7,055 VECTORS · 90.0% HIT@5
          </div>
          <a href="#system" className="text-[var(--ember)] hover:underline">
            Back to Top ↑
          </a>
        </div>
      </footer>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onQueryTopic={handleQueryTopic}
      />
    </div>
  );
}
