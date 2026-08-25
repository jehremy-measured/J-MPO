import { useEffect, useRef, useState } from "react";

/** Tracks an element's rendered content-box size via ResizeObserver, so layout that depends
 * on real pixel dimensions (e.g. an SVG chart's viewBox) can redraw instead of being scaled. */
export function useElementSize<T extends Element>(fallback: { width: number; height: number }) {
  const ref = useRef<T>(null);
  const [size, setSize] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentBoxSize?.[0];
      const width = box ? box.inlineSize : entries[0].contentRect.width;
      const height = box ? box.blockSize : entries[0].contentRect.height;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}
