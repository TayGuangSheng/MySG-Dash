"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type AspectRatioWrapperProps = {
  ratioWidth?: number;
  ratioHeight?: number;
  className?: string;
  children: ReactNode;
};

const BASE_UNIT = 100;

export default function AspectRatioWrapper({
  ratioWidth = 16,
  ratioHeight = 9,
  className,
  children,
}: AspectRatioWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clampedWidth = Math.max(ratioWidth, 1);
  const clampedHeight = Math.max(ratioHeight, 1);
  const designWidth = clampedWidth * BASE_UNIT;
  const designHeight = clampedHeight * BASE_UNIT;

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const fit = () => {
      const { innerWidth, innerHeight } = window;
      const scale = Math.min(innerWidth / designWidth, innerHeight / designHeight);
      node.style.setProperty("--aspect-scale", scale.toString());
    };

    fit();

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : undefined;
    resizeObserver?.observe(document.body);
    window.addEventListener("resize", fit);

    return () => {
      window.removeEventListener("resize", fit);
      resizeObserver?.disconnect();
    };
  }, [designWidth, designHeight]);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      <div
        ref={containerRef}
        className={cn(
          "origin-center",
          "[transform:scale(var(--aspect-scale,1))]",
          className,
        )}
        style={{
          width: `${designWidth}px`,
          height: `${designHeight}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
