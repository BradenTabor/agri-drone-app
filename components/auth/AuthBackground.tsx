"use client";

import Image from "next/image";
import { useCallback, useState, useSyncExternalStore } from "react";

const HERO_IMAGE = "/auth/hero.jpg";
const HERO_VIDEO = "/auth/hero.mp4";

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function AuthBackground() {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const [videoReady, setVideoReady] = useState(false);

  const handleVideoError = useCallback(() => {
    setVideoReady(false);
  }, []);

  const handleVideoCanPlay = useCallback(() => {
    setVideoReady(true);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {!prefersReducedMotion ? (
        <video
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ opacity: videoReady ? 1 : 0 }}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={HERO_IMAGE}
          onCanPlay={handleVideoCanPlay}
          onError={handleVideoError}
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
      ) : null}

      <div className="auth-hero-vignette absolute inset-0" />
      <div className="auth-film-grain absolute inset-0 opacity-[0.35] mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/35 via-slate-950/50 to-slate-950/82 lg:bg-gradient-to-r lg:from-slate-950/25 lg:via-slate-950/40 lg:to-slate-950/75" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,hsl(142_50%_42%_/_0.18),transparent_52%),radial-gradient(circle_at_82%_88%,rgba(15,23,42,0.55),transparent_48%)]" />
    </div>
  );
}
