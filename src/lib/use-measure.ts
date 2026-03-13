"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const defaultRect: DOMRectReadOnly = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  toJSON: () => ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
};

export function useMeasure<T extends Element = HTMLDivElement>() {
  const [rect, setRect] = useState<DOMRectReadOnly>(defaultRect);
  const observerRef = useRef<ResizeObserver | null>(null);

  const cleanupObserver = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;
  }, []);

  const refCallback = useCallback(
    (node: T | null) => {
      cleanupObserver();

      if (!node || typeof ResizeObserver === "undefined") {
        setRect(defaultRect);
        return;
      }

      observerRef.current = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          setRect(entry.contentRect);
        }
      });
      observerRef.current.observe(node);
    },
    [cleanupObserver],
  );

  useEffect(() => cleanupObserver, [cleanupObserver]);

  return [refCallback, rect] as const;
}
