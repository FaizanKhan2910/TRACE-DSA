"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowUpRight, GitBranch } from "lucide-react";
import { TIMELINE_BEATS } from "@/data/pipelineAndStory";

export function CreatorStory() {
  const [activeBeatId, setActiveBeatId] = useState<string>(TIMELINE_BEATS[3].id);
  const currentBeat =
    TIMELINE_BEATS.find((b) => b.id === activeBeatId) || TIMELINE_BEATS[0];

  return (
    <section
      id="creator"
      className="relative border-t border-[var(--hairline)] py-20 lg:py-24 overflow-hidden"
    >
      <div className="mx-auto w-[96vw] max-w-[2700px] px-5 sm:px-8">
        <div className="border-b border-[var(--hairline)] pb-7">
          <div className="font-mono-tech text-lg uppercase tracking-[0.16em] text-[var(--ember)]">
            ABOUT KUNAL // THE EDUCATOR BEHIND THE LESSONS
          </div>
          <h2 className="font-display text-[clamp(2rem,4.2vw,3.5rem)] font-bold tracking-[-0.04em] leading-[1.03] mt-3 max-w-4xl">
            A course worth returning to:{" "}
            <span className="font-normal text-[var(--tungsten)]">
              Meet Kunal Kushwaha.
            </span>
          </h2>
        </div>

        {/* Editorial Dual Column Story + Studio Hardware Topology Plates */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 cols: Story Beats + Interactive Career Changelog Scrubber */}
          <div className="lg:col-span-7 space-y-6">
            <p className="text-xl sm:text-xl leading-relaxed text-[var(--ink-secondary)]">
              This searchable archive follows Kunal Kushwaha&apos;s Java and DSA lessons. Search for a concept, read a concise answer with source passages, and return to the lesson at its timestamp. Kunal also shares programming lessons and open-source learning resources for developers.
            </p>

            {/* 3 Narrative Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="glow-card rounded-md p-4">
                <div className="font-mono-tech text-lg text-[var(--ember)] font-bold">
                  01 / OPEN LEARNING
                </div>
                <div className="font-display font-bold text-2xl mt-2">24.2K★</div>
                <p className="text-xl text-[var(--ink-secondary)] mt-1 leading-relaxed">
                  <code className="font-mono-tech text-lg text-[var(--tungsten)]">DSA-Bootcamp-Java</code> &amp;{" "}
                  <code className="font-mono-tech text-lg text-[var(--tungsten)]">DevOps-Bootcamp</code> open-sourced with 200K+ WeMakeDevs builders.
                </p>
              </div>
              <div className="glow-card rounded-md p-4">
                <div className="font-mono-tech text-lg text-[var(--cobalt)] font-bold">
                  02 / ENGINEERING
                </div>
                <div className="font-display font-bold text-2xl mt-2">GSoC + CNCF</div>
                <p className="text-xl text-[var(--ink-secondary)] mt-1 leading-relaxed">
                  Red Hat <code className="font-mono-tech text-lg text-[var(--tungsten)]">fabric8io</code>, Quarkus Mentor, CNCF Thanos intern, Meta{" "}
                  <code className="font-mono-tech text-lg text-[var(--tungsten)]">Jest</code> &amp; GitHub Star.
                </p>
              </div>
              <div className="glow-card rounded-md p-4">
                <div className="font-mono-tech text-lg text-[var(--emerald)] font-bold">
                  03 / LONG-FORM LESSONS
                </div>
                <div className="font-display font-bold text-2xl mt-2">Up to 5h 02m</div>
                <p className="text-xl text-[var(--ink-secondary)] mt-1 leading-relaxed">
                  Long whiteboard sessions with explanations and worked examples throughout.
                </p>
              </div>
            </div>

            {/* Interactive Milestone Commit Scrubber */}
            <div className="rounded-md border border-[var(--hairline-strong)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between gap-2 font-mono-tech text-lg tracking-[0.12em] text-[var(--ink-muted)] mb-4">
                <span className="inline-flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-[var(--ember)]" />
                  CAREER & TEACHING MILESTONES
                </span>
                <span className="text-[var(--emerald)]">OPEN RESOURCES</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {TIMELINE_BEATS.map((beat) => {
                  const active = beat.id === currentBeat.id;
                  return (
                    <button
                      key={beat.id}
                      type="button"
                      onClick={() => setActiveBeatId(beat.id)}
                      className={`font-mono-tech text-lg px-3 py-1.5 rounded-sm border transition cursor-pointer ${
                        active
                          ? "bg-[var(--ember)] text-[#090a0d] border-[var(--ember)] font-bold shadow-[0_0_16px_var(--glow-ember)]"
                          : "bg-[var(--bg-card)] text-[var(--ink-secondary)] border-[var(--hairline)] hover:border-[var(--hairline-strong)]"
                      }`}
                    >
                      {beat.year}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-sm border border-[var(--hairline)] bg-[var(--bg-card)] p-5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono-tech text-lg">
                  <span className="text-[var(--ember)] font-semibold">{currentBeat.tag}</span>
                  <span className="text-[var(--ink-muted)]">{currentBeat.role}</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink-primary)]">
                  {currentBeat.headline}
                </h3>
                <p className="text-xl text-[var(--ink-secondary)] leading-relaxed">
                  {currentBeat.summary}
                </p>
                <div className="pt-2 font-mono-tech text-lg text-[var(--emerald)]">
                  ✓ VERIFIED: {currentBeat.proof}
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 cols: Bespoke Plates + Ecosystem Links */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-md border border-[var(--hairline-strong)] bg-[var(--bg-card)] overflow-hidden shadow-[var(--shadow-card)]">
              <div className="px-4 py-2.5 border-b border-[var(--hairline)] flex items-center justify-between font-mono-tech text-lg text-[var(--ink-muted)]">
                <span>ENGINEERING BACKGROUND</span>
                <span>OPEN SOURCE</span>
              </div>
              <div className="relative aspect-[16/9] bg-[#0a0c10]">
                <Image
                  src="/assets/infra-blocks.png"
                  alt="Modular cloud-native topology still-life representing distributed systems engineering"
                  fill
                  className="object-cover"
                />
                <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_rgba(6,7,9,0.55)]" />
              </div>
            </div>

            <div className="rounded-md border border-[var(--hairline)] bg-[var(--bg-card)] p-5 space-y-3">
              <div className="font-mono-tech text-lg tracking-[0.14em] uppercase text-[var(--ink-muted)]">
                LEARNING RESOURCES
              </div>
              {[
                { label: "DSA-Bootcamp-Java (24.2K★)", href: "https://github.com/kunal-kushwaha/DSA-Bootcamp-Java" },
                { label: "DevOps-Bootcamp (2.4K★)", href: "https://github.com/kunal-kushwaha/DevOps-Bootcamp" },
                { label: "WeMakeDevs Global Community", href: "https://www.wemakedevs.org" },
                { label: "TechWithKunal Platform", href: "https://www.techwithkunal.com" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-sm border border-[var(--hairline)] bg-[var(--bg-surface)] hover:border-[var(--ember)] transition font-mono-tech text-xl group"
                >
                  <span className="group-hover:text-[var(--ember)] transition">{link.label}</span>
                  <ArrowUpRight className="w-4 h-4 text-[var(--ink-muted)] group-hover:text-[var(--ember)]" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
