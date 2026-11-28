"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { AlertTriangle, ExternalLink, Loader2, Pause, Play } from "lucide-react";

type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  loadVideoById: (options: { videoId: string; startSeconds: number }) => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

type YouTubeEvent = { target: YouTubePlayer; data: number };
type YouTubeApi = {
  Player: new (
    element: HTMLElement,
    options: {
      events: {
        onReady: (event: YouTubeEvent) => void;
        onStateChange: (event: YouTubeEvent) => void;
        onError: (event: YouTubeEvent) => void;
        onAutoplayBlocked: () => void;
      };
    }
  ) => YouTubePlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number };
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YouTubeApi> | null = null;

function loadYouTubeApi(): Promise<YouTubeApi> {
  if (typeof window !== "undefined" && window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      apiPromise = null;
      reject(new Error("The embedded player service did not respond."));
    }, 15_000);
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      window.clearTimeout(timeout);
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("The embedded player could not initialize."));
    };

    let script = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    if (!script) {
      script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timeout);
        apiPromise = null;
        reject(new Error("The embedded player service could not be loaded."));
      };
      document.head.appendChild(script);
    }
  });
  return apiPromise;
}

function playerErrorMessage(code: number): string {
  if (code === 100) return "This lecture is private, removed, or unavailable.";
  if (code === 101 || code === 150) return "The owner of this lecture has disabled embedded playback.";
  if (code === 153) return "The embedded player could not verify this page. Check the site's referrer policy.";
  if (code === 2) return "The retrieved video ID is not accepted by the player.";
  if (code === 5) return "The browser could not play this video in its embedded player.";
  return "This lecture could not be played inline.";
}

export interface InlineLecturePlayerHandle {
  seekTo: (seconds: number) => void;
  seekBy: (seconds: number) => void;
}

interface InlineLecturePlayerProps {
  videoId: string;
  startSeconds: number;
  title: string;
  timestamp: string;
  url?: string;
  onTimeUpdate: (seconds: number) => void;
}

export const InlineLecturePlayer = forwardRef<InlineLecturePlayerHandle, InlineLecturePlayerProps>(function InlineLecturePlayer({
  videoId,
  startSeconds,
  title,
  timestamp,
  url,
  onTimeUpdate,
}, ref) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const timeUpdateRef = useRef(onTimeUpdate);
  const titleRef = useRef(title);
  const timestampRef = useRef(timestamp);
  const [status, setStatus] = useState<"loading" | "playing" | "paused" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds) => playerRef.current?.seekTo(Math.max(0, seconds), true),
    seekBy: (seconds) => playerRef.current?.seekTo(Math.max(0, playerRef.current.getCurrentTime() + seconds), true),
  }), []);

  const hasGenuineTimestamp = timestamp && timestamp !== "Timestamp unavailable";
  const startSecClamped = hasGenuineTimestamp ? Math.max(0, Math.floor(startSeconds)) : 0;
  const externalWatchUrl = url || (videoId ? `https://www.youtube.com/watch?v=${videoId}${hasGenuineTimestamp && startSecClamped > 0 ? `&t=${startSecClamped}s` : ""}` : "");

  useEffect(() => {
    timeUpdateRef.current = onTimeUpdate;
    titleRef.current = title;
    timestampRef.current = timestamp;
  }, [onTimeUpdate, title, timestamp]);

  useEffect(() => {
    let disposed = false;
    let pollTimer = 0;
    queueMicrotask(() => {
      if (!disposed) {
        setStatus("loading");
        setError(null);
      }
    });

    loadYouTubeApi()
      .then((youtube) => {
        if (disposed || !mountRef.current) return;
        const iframe = document.createElement("iframe");
        const params = new URLSearchParams({
          autoplay: "1",
          controls: "1",
          enablejsapi: "1",
          fs: "1",
          origin: window.location.origin,
          playsinline: "1",
          rel: "0",
          start: String(startSecClamped),
        });
        iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
        iframe.title = `${titleRef.current} · ${timestampRef.current}`;
        iframe.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        iframe.allowFullscreen = true;
        iframe.className = "absolute inset-0 h-full w-full border-0";
        mountRef.current.replaceChildren(iframe);

        const player = new youtube.Player(iframe, {
          events: {
            onReady: (event) => {
              playerRef.current = event.target;
              event.target.loadVideoById({ videoId, startSeconds: startSecClamped });
              setStatus("loading");
            },
            onStateChange: (event) => {
              if (!window.YT) return;
              const { PLAYING, PAUSED, ENDED, BUFFERING } = window.YT.PlayerState;
              if (event.data === PLAYING) {
                setStatus("playing");
                if (pollTimer) window.clearInterval(pollTimer);
                pollTimer = window.setInterval(() => {
                  if (playerRef.current) timeUpdateRef.current(playerRef.current.getCurrentTime());
                }, 800);
              } else if (event.data === PAUSED || event.data === ENDED) {
                setStatus("paused");
                if (pollTimer) window.clearInterval(pollTimer);
              } else if (event.data === BUFFERING) {
                setStatus("loading");
              }
            },
            onError: (event) => {
              if (pollTimer) window.clearInterval(pollTimer);
              setError(playerErrorMessage(event.data));
              setStatus("error");
            },
            onAutoplayBlocked: () => setStatus("paused"),
          },
        });
        playerRef.current = player;
      })
      .catch((reason: unknown) => {
        if (disposed) return;
        setError(reason instanceof Error ? reason.message : "The embedded player could not be loaded.");
        setStatus("error");
      });

    return () => {
      disposed = true;
      if (pollTimer) window.clearInterval(pollTimer);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId, startSecClamped]);

  return (
    <div className="overflow-hidden rounded-lg border border-white/15 bg-[#07080b] shadow-[0_18px_56px_rgba(0,0,0,0.55)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/35 px-4 py-3">
        <div className="min-w-0">
          <div className="font-mono-tech text-sm uppercase tracking-[0.14em] text-[#34d399]">
            TRACE // INLINE LECTURE PLAYER
          </div>
          <div className="mt-1 truncate font-display text-lg font-semibold text-white">{title}</div>
        </div>
        <div className="flex items-center gap-2">
          {externalWatchUrl && (
            <a
              href={externalWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded border border-white/20 bg-white/5 px-2.5 py-1 font-mono-tech text-xs text-[#d7d3ca] hover:border-[#ff4d0a] hover:text-[#ff9e44] transition"
              title="Open video directly on YouTube"
            >
              <span>YouTube</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <div className="inline-flex shrink-0 items-center gap-2 rounded border border-[#ff4d0a]/40 bg-[#ff4d0a]/10 px-2.5 py-1 font-mono-tech text-sm text-[#ff9e44]">
            {status === "playing" ? <Play className="h-3.5 w-3.5 fill-current" /> : status === "paused" ? <Pause className="h-3.5 w-3.5" /> : null}
            {status === "loading" ? "LOADING" : status === "playing" ? "PLAYING" : status === "paused" ? "PAUSED" : "UNAVAILABLE"}
            <span className="text-white/50">·</span>
            <span>{hasGenuineTimestamp ? `@ ${timestamp}` : "Timestamp unavailable"}</span>
          </div>
        </div>
      </div>

      <div className="relative aspect-video bg-[#030405]">
        <div ref={mountRef} className="absolute inset-0 h-full w-full [&_iframe]:h-full [&_iframe]:w-full" />
        {status === "loading" && !error && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#ff9e44]" />
            <span className="font-mono-tech text-sm tracking-[0.12em] text-white/80">
              BUFFERING SOURCE {hasGenuineTimestamp ? `AT ${timestamp}` : ""}
            </span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0b0d11] px-6 text-center">
            <AlertTriangle className="h-7 w-7 text-[#ff9e44]" />
            <div className="font-display text-lg font-semibold text-white">Inline playback unavailable</div>
            <p className="max-w-lg text-sm leading-relaxed text-[#c4c0b7]">{error} This source remains selected in TRACE; try another retrieved lecture.</p>
            {externalWatchUrl && (
              <a
                href={externalWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded border border-[#ff4d0a] bg-[#ff4d0a]/15 px-3 py-1.5 font-mono-tech text-sm text-[#ffbd73] hover:bg-[#ff4d0a] hover:text-[#090a0d] transition"
              >
                Open on YouTube ↗
              </a>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-black/30 px-4 py-3">
        <span className="font-mono-tech text-xs text-white/55">PLAYBACK CONTROLS</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => playerRef.current?.seekTo(Math.max(0, playerRef.current.getCurrentTime() - 15), true)} className="player-control">−15s</button>
          <button type="button" onClick={() => playerRef.current?.seekTo(playerRef.current.getCurrentTime() + 15, true)} className="player-control">+15s</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-black/30 px-4 py-2 font-mono-tech text-xs text-[#aaa79f]">
        <span>VIDEO ID · {videoId || "N/A"}</span>
        <span>{hasGenuineTimestamp ? `CHUNK START · ${startSecClamped}s` : "TIMESTAMP · UNAVAILABLE"}</span>
      </div>
    </div>
  );
});
