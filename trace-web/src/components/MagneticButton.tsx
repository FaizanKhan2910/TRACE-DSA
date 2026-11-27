"use client";

import { useRef, useState } from "react";

interface MagneticButtonProps {
  href?: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function MagneticButton({
  href,
  onClick,
  className = "",
  children,
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = (e: React.PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.18;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.22;
    setOffset({
      x: Math.max(-8, Math.min(8, dx)),
      y: Math.max(-8, Math.min(8, dy)),
    });
  };

  const handleLeave = () => setOffset({ x: 0, y: 0 });

  const style: React.CSSProperties = {
    transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
    transition:
      offset.x === 0 && offset.y === 0
        ? "transform 340ms cubic-bezier(0.16, 1, 0.3, 1)"
        : "transform 90ms ease-out",
  };

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={style}
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={style}
      className={className}
    >
      {children}
    </button>
  );
}
