"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const HERO_IMAGE = "/auth/hero.jpg";
const HERO_VIDEO_WEBM = "/auth/hero.webm";
const HERO_VIDEO_MP4 = "/auth/hero.mp4";

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

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
  // Defer mounting (and therefore fetching) the hero video until the browser
  // is idle so the static poster paints first and the video never competes
  // with the initial form render / LCP.
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const idleWindow = window as IdleWindow;
    let idleHandle = 0;
    let timeoutHandle = 0;

    const startLoading = () => setShouldLoadVideo(true);

    if (typeof idleWindow.requestIdleCallback === "function") {
      idleHandle = idleWindow.requestIdleCallback(startLoading, { timeout: 2500 });
    } else {
      timeoutHandle = window.setTimeout(startLoading, 600);
    }

    return () => {
      if (idleHandle && typeof idleWindow.cancelIdleCallback === "function") {
        idleWindow.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle) {
        window.clearTimeout(timeoutHandle);
      }
    };
  }, [prefersReducedMotion]);

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
      {!prefersReducedMotion && shouldLoadVideo ? (
        <video
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ opacity: videoReady ? 1 : 0 }}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onCanPlay={handleVideoCanPlay}
          onError={handleVideoError}
        >
          <source src={HERO_VIDEO_WEBM} type="video/webm" />
          <source src={HERO_VIDEO_MP4} type="video/mp4" />
        </video>
      ) : null}

      <div className="auth-hero-vignette absolute inset-0" />
      <div className="auth-film-grain absolute inset-0 opacity-[0.35] mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/35 via-slate-950/50 to-slate-950/82 lg:bg-gradient-to-r lg:from-slate-950/25 lg:via-slate-950/40 lg:to-slate-950/75" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,hsl(142_50%_42%_/_0.18),transparent_52%),radial-gradient(circle_at_82%_88%,rgba(15,23,42,0.55),transparent_48%)]" />
    </div>
  );
}
