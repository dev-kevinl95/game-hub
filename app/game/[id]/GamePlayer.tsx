"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

const FALLBACK = { w: 960, h: 600 };
const RATIO = 16 / 9;

export function GamePlayer({
  gameId,
  gameUrl,
  thumbnail,
  title,
}: {
  gameId: number;
  gameUrl: string;
  thumbnail: string | null;
  title: string;
}) {
  const [loading, setLoading] = useState(true);
  const [native, setNative] = useState(FALLBACK);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const counted = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    fetch(`/api/games/${gameId}`, { method: "POST" }).catch(() => {});
  }, [gameId]);

  const measureNative = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
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
        src={gameUrl}
        className="player-iframe"
        allow="fullscreen; autoplay"
        onLoad={() => {
          measureNative();
          setLoading(false);
        }}
        style={{
          width: native.w + "px",
          height: native.h + "px",
          transform: `scale(${scale})`,
          top: offset.y + "px",
          left: offset.x + "px",
        }}
      />
    </div>
  );
}