import { useCallback, useRef, useState } from "react";

/** Tracks an element's rendered content-box size via ResizeObserver, so layout that depends
 * on real pixel dimensions (e.g. an SVG chart's viewBox) can redraw instead of being scaled.
 *
 * Uses a callback ref rather than useRef+useEffect specifically so this also works for
 * elements that mount and unmount conditionally (like a hover tooltip) — a plain useEffect
 * with an empty dependency array only ever sees the ref's value at the hook's own mount time,
 * so it silently never attaches when the target element doesn't exist yet on first render. */
export function useElementSize<T extends Element>(fallback: { width: number; height: number }) {
  const [size, setSize] = useState(fallback);
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback((el: T | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentBoxSize?.[0];
      const width = box ? box.inlineSize : entries[0].contentRect.width;
      const height = box ? box.blockSize : entries[0].contentRect.height;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    observer.observe(el);
    observerRef.current = observer;
  }, []);

  return [ref, size] as const;
}
