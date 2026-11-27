"use client";

import Image from "next/image";
import { useState, useRef } from "react";

export function OpticalPortraitStage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 35, hovering: false });

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const ry = (x - 0.5) * 14;
    const rx = -(y - 0.5) * 14;
    setTilt({ rx, ry, gx: x * 100, gy: y * 100, hovering: true });
  };

  const handleLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 35, hovering: false });
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className="portrait-arrive relative flex items-center justify-center w-full h-full min-h-[480px] sm:min-h-[560px] lg:min-h-[580px] select-none"
      style={{ perspective: "1200px" }}
    >
      {/* Volumetric molten amber aura breathing behind the portal */}
      <div
        aria-hidden="true"
        className="absolute w-[360px] sm:w-[480px] lg:w-[560px] aspect-square rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,77,10,0.34) 0%, rgba(255,158,68,0.16) 44%, transparent 72%)",
          filter: "blur(36px)",
          animation: "auraBreath 7s ease-in-out infinite",
        }}
      />

      {/* Outer calibrated SVG degree vernier ring */}
      <svg
        aria-hidden="true"
        viewBox="0 0 500 500"
        className="absolute w-[400px] sm:w-[520px] lg:w-[640px] aspect-square pointer-events-none"
        style={{ animation: "spinSlow 52s linear infinite" }}
      >
        <circle
          cx="250"
          cy="250"
          r="236"
          fill="none"
          stroke="var(--reticle-ring)"
          strokeWidth="1"
          strokeDasharray="3 9"
        />
        <circle
          cx="250"
          cy="250"
          r="212"
          fill="none"
          stroke="var(--reticle-ring-inner)"
          strokeWidth="1.25"
          strokeDasharray="110 38 18 38"
        />
        <text
          x="250"
          y="22"
          textAnchor="middle"
          fill="var(--reticle-text)"
          fontSize="10"
          fontFamily="monospace"
          letterSpacing="3"
        >
          000° · CORPUS LOCK
        </text>
        <text
          x="250"
          y="486"
          textAnchor="middle"
          fill="var(--reticle-text)"
          fontSize="10"
          fontFamily="monospace"
          letterSpacing="3"
        >
          180° · 79.6 HRS
        </text>
        <circle cx="462" cy="250" r="4.5" fill="#ff4d0a" />
        <circle cx="38" cy="250" r="3.5" fill="#1cb67c" />
      </svg>

      {/* Inner counter-rotating laser arc */}
      <svg
        aria-hidden="true"
        viewBox="0 0 420 420"
        className="absolute w-[340px] sm:w-[460px] lg:w-[540px] aspect-square pointer-events-none"
        style={{ animation: "spinReverse 34s linear infinite" }}
      >
        <circle
          cx="210"
          cy="210"
          r="196"
          fill="none"
          stroke="var(--reticle-ring)"
          strokeWidth="1"
          strokeDasharray="24 14"
        />
      </svg>

      {/* 3D Gyroscopic Arch Portrait Bezel */}
      <div
        className="relative z-10 w-[300px] sm:w-[400px] lg:w-auto lg:h-[clamp(520px,72svh,900px)] aspect-[4/5] rounded-t-[999px] rounded-b-[14px] p-[2px] transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${
            tilt.hovering ? 1.02 : 1
          })`,
          background:
            "linear-gradient(155deg, rgba(255,77,10,0.75) 0%, rgba(255,158,68,0.28) 38%, rgba(28,182,124,0.35) 100%)",
          boxShadow:
            "0 30px 90px -20px rgba(0,0,0,0.8), 0 0 45px -8px rgba(255,77,10,0.38)",
        }}
      >
        <div className="relative w-full h-full overflow-hidden rounded-t-[999px] rounded-b-[12px] bg-[#0b0d12]">
          <Image
            src="/assets/creator-portrait.png"
            alt="Kunal Kushwaha — Educator & Systems Engineer behind the 79.6-hour Java + DSA corpus"
            fill
            priority
            className="object-cover object-[center_24%] transition-transform duration-500"
            style={{
              transform: tilt.hovering ? "scale(1.03)" : "scale(1.0)",
              filter: "contrast(1.04) saturate(0.95)",
            }}
          />

          {/* Subtle ambient dark gradient bottom vignette */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#060709]/85 via-[#060709]/30 to-transparent pointer-events-none"
          />
          <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-5 pt-12 bg-gradient-to-t from-[#060709]/90 to-transparent text-left pointer-events-none">
            <div className="font-display text-2xl sm:text-3xl font-bold text-white">Kunal Kushwaha</div>
            <div className="mt-1 font-mono-tech text-xl text-white/75">Java &amp; DSA educator</div>
          </div>

          {/* Dynamic cursor-tracking specular glass sheen */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              opacity: tilt.hovering ? 0.55 : 0.16,
              background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.42), rgba(255,158,68,0.12) 28%, transparent 58%)`,
              mixBlendMode: "screen",
            }}
          />

          {/* Subtle horizontal optical scan glint */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-[#ff4d0a]/12 to-transparent pointer-events-none"
            style={{ animation: "scanSweep 5.5s ease-in-out infinite" }}
          />
        </div>
      </div>

    </div>
  );
}
