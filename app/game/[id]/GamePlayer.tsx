"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

const FALLBACK = { w: 960, h: 600 };
const RATIO = 16 / 9;

export function GamePlayer({
  gameId,
  playUrl,
  thumbnail,
  title,
}: {
  gameId: number;
  playUrl: string;
  thumbnail: string | null;
  title: string;
}) {
  const [loading, setLoading] = useState(true);
  const [native, setNative] = useState(FALLBACK);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const counted = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    fetch(`/api/games/${gameId}`, { method: "POST" }).catch(() => {});
  }, [gameId]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  }, []);

  const measureNative = useCallback(() => {
    let doc: Document | null;
    try {
      doc = iframeRef.current?.contentDocument ?? null;
    } catch {
      doc = null;
    }
    if (!doc?.documentElement) return;
    const de = doc.documentElement;
    const nw = de.scrollWidth || de.clientWidth;
    const nh = de.scrollHeight || de.clientHeight;
    if (nw > 0 && nh > 0) setNative({ w: nw, h: nh });
  }, []);

  const applyScale = useCallback(() => {
    const box = containerRef.current;
    if (!box) return;
    const boxW = box.clientWidth || box.offsetWidth;
    if (!boxW) return;
    const boxH = boxW / RATIO;
    const s = Math.min(boxW / native.w, boxH / native.h);
    setScale(s);
    setOffset({
      x: Math.round((boxW - native.w * s) / 2),
      y: Math.round((boxH - native.h * s) / 2),
    });
  }, [native.w, native.h]);

  useEffect(() => {
    if (loading) return;
    const timers = [500, 1200].map((ms) => self.setTimeout(measureNative, ms));
    return () => timers.forEach((t) => self.clearTimeout(t));
  }, [loading, measureNative]);

  useEffect(() => {
    if (loading) return;
    applyScale();
    self.addEventListener("resize", applyScale);
    return () => self.removeEventListener("resize", applyScale);
  }, [loading, native.w, native.h, applyScale]);

  return (
    <div ref={containerRef} className="player">
      <div className="player-mobile">
        <div className="player-mobile-box">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={title}
              width={160}
              height={120}
              className="player-mobile-icon"
              unoptimized
            />
          ) : (
            <span className="player-mobile-emoji">🎮</span>
          )}
          <p className="player-mobile-title">{title}</p>
          <p className="player-mobile-note">
            Para jugarlo, ábrelo desde un escritorio.
          </p>
        </div>
      </div>
      {loading && <div className="player-loading">Cargando juego...</div>}
      <iframe
        ref={iframeRef}
        src={playUrl}
        className="player-iframe"
        allow="fullscreen; autoplay"
        onLoad={() => {
          measureNative();
          setLoading(false);
        }}
        style={
          isFullscreen
            ? {
                width: native.w + "px",
                height: native.h + "px",
                transform: "translate(-50%, -50%)",
                top: "50%",
                left: "50%",
              }
            : {
                width: native.w + "px",
                height: native.h + "px",
                transform: `scale(${scale})`,
                top: offset.y + "px",
                left: offset.x + "px",
              }
        }
      />
      <button
        type="button"
        onClick={toggleFullscreen}
        className="player-fullscreen-btn"
        aria-label={isFullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa"}
        title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
      >
        {isFullscreen ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 9 4 4M4 9V4h5M15 9l5-5M20 9V4h-5M9 15l-5 5M4 15v5h5M15 15l5 5M20 15v-5h-5" />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
          </svg>
        )}
      </button>
    </div>
  );
}