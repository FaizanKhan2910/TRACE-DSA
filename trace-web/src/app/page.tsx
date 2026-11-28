"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, Command, Menu, Search, X } from "lucide-react";
import { ArchiveConsole, ArchiveConsoleHandle } from "@/components/ArchiveConsole";
import { CorpusAtlas } from "@/components/CorpusAtlas";
import { CreatorStory } from "@/components/CreatorStory";
import { CommandPalette } from "@/components/CommandPalette";

const examples = [
  "Explain binary search",
  "How does backtracking work?",
  "What is an AVL rotation?",
];

export default function HomePage() {
  const archiveRef = useRef<ArchiveConsoleHandle>(null);
  const [query, setQuery] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const runQuery = (value: string) => {
    if (!value.trim()) return;
    archiveRef.current?.runExternalQuery(value.trim(), "standard");
    document.getElementById("query")?.scrollIntoView({ behavior: "smooth" });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runQuery(query);
  };

  return (
    <div className="trace-page min-h-screen overflow-x-hidden">
      {/* Crisp Editorial White Header */}
      <header className="sowoo-nav">
        <a href="#home" className="sowoo-brand" aria-label="TRACE home">
          <span className="sowoo-brand-mark">T</span>
          <span className="sowoo-brand-word">TRACE</span>
          <span className="sowoo-brand-count">
            <i /> 69 lectures · 79.6h
          </span>
        </a>

        <nav className="sowoo-desktop-nav" aria-label="Main navigation">
          <a href="#query">Archive Console</a>
          <a href="#atlas">Lecture Atlas</a>
          <a href="#creator">About Kunal</a>
        </nav>

        <div className="sowoo-nav-actions">
          <button
            className="sowoo-nav-search"
            onClick={() => setPaletteOpen(true)}
            type="button"
          >
            <Search size={14} />
            <span>Search</span>
            <kbd>
              <Command size={10} /> K
            </kbd>
          </button>
          <a className="sowoo-nav-cta" href="#query">
            Ask Archive <ArrowRight size={14} />
          </a>
          <button
            className="sowoo-mobile-menu-btn"
            aria-label="Toggle navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="sowoo-mobile-nav" aria-label="Mobile navigation">
            <a href="#query" onClick={() => setMobileMenuOpen(false)}>
              Archive Console
            </a>
            <a href="#atlas" onClick={() => setMobileMenuOpen(false)}>
              Lecture Atlas
            </a>
            <a href="#creator" onClick={() => setMobileMenuOpen(false)}>
              About Kunal
            </a>
          </nav>
        )}
      </header>

      <main>
        {/* FIRST PAGE: Gallery White + Crimson Asymmetric Editorial Hero */}
        <section id="home" className="sowoo-hero-wrap">
          <div className="sowoo-hero-grid">
            {/* Left Column: Statement Headline + Dash Kicker + Crimson Visor Plate */}
            <div className="sowoo-left-col">
              <div className="sowoo-headline-block">
                <h1 className="sowoo-h1 font-display">
                  <span className="sowoo-red">TRACE</span> 79.6 hours of DSA &amp;
                  timestamp proof.
                </h1>
                <div className="sowoo-kicker">
                  <span className="sowoo-dash" aria-hidden="true" />
                  <span>Search, architecture &amp; exact second recall</span>
                </div>
              </div>

              <a href="#query" className="sowoo-plate-card group" aria-label="Explore TRACE Archive">
                <Image
                  src="/assets/hero-visor.jpg"
                  alt="Editorial crimson studio portrait with glowing amber optical visor representing TRACE"
                  fill
                  priority
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </a>
            </div>

            {/* Right Column: Crimson Laser Scan Plate + Editorial Subhead + Workable Search */}
            <div className="sowoo-right-col">
              <a href="#atlas" className="sowoo-plate-card sowoo-plate-right group" aria-label="Browse 69 indexed lectures">
                <Image
                  src="/assets/hero-scan.jpg"
                  alt="Sculptural obsidian profile illuminated by a crimson horizontal laser scan line"
                  fill
                  priority
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </a>

              <div className="sowoo-bottom-copy">
                <h2 className="sowoo-h2 font-display">
                  Your lectures become exact proof.
                </h2>

                <form className="sowoo-search-bar" onSubmit={submit}>
                  <Search size={17} className="text-[#8e7471] shrink-0" aria-hidden="true" />
                  <input
                    aria-label="Search the lecture archive"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Ask “binary search overflow” or “AVL rotation”..."
                  />
                  <button type="submit">
                    Search <ArrowRight size={14} />
                  </button>
                </form>

                <div className="sowoo-chips">
                  <span>TRY:</span>
                  {examples.map((example) => (
                    <button
                      type="button"
                      key={example}
                      onClick={() => {
                        setQuery(example);
                        runQuery(example);
                      }}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <a href="#home" className="sowoo-edge-back" aria-label="Back to top">
            Back to top
          </a>
        </section>

        {/* Clean White Editorial Spec Strip Transition */}
        <section className="sowoo-spec-strip" aria-label="Archive details">
          <div>
            <span>01 / COLLECTION</span>
            <strong>79.6 Hours Indexed</strong>
            <small>69 full Java + DSA lectures</small>
          </div>
          <div>
            <span>02 / SEMANTIC RECALL</span>
            <strong>7,055 Qdrant Vectors</strong>
            <small>90.0% hit@5 with RRF expansion</small>
          </div>
          <div>
            <span>03 / TIMESTAMP SYNC</span>
            <strong>Direct ?t=Xs Playback</strong>
            <small>Jump straight to Kunal&apos;s whiteboard</small>
          </div>
        </section>

        {/* Working Dark Archive Console, 69-Lecture Atlas & Kunal Story */}
        <ArchiveConsole ref={archiveRef} />
        <CorpusAtlas onQueryTopic={(text) => runQuery(text)} />
        <CreatorStory />
      </main>

      <footer className="trace-footer">
        <a href="#home" className="footer-brand">
          TRACE <span>Lecture archive</span>
        </a>
        <span>Built for learning at your own pace.</span>
        <a href="#home">Back to top ↑</a>
      </footer>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onQueryTopic={runQuery}
      />
    </div>
  );
}
