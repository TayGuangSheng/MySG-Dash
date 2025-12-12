"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type AspectRatioWrapperProps = {
  ratioWidth?: number;
  ratioHeight?: number;
  className?: string;
  children: ReactNode;
};

const BASE_UNIT = 100;
const MIN_VIEWPORT_PADDING = 12;
const VIEWPORT_PADDING_RATIO = 0.02;
const MAX_PADDING_RATIO = 0.06;
const MOBILE_BREAKPOINT = 900;

export default function AspectRatioWrapper({
  ratioWidth = 16,
  ratioHeight = 9,
  className,
  children,
}: AspectRatioWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const clampedWidth = Math.max(ratioWidth, 1);
  const clampedHeight = Math.max(ratioHeight, 1);
  const designWidth = clampedWidth * BASE_UNIT;
  const designHeight = clampedHeight * BASE_UNIT;

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const fit = () => {
      const { innerWidth, innerHeight } = window;
      setIsMobile(innerWidth < MOBILE_BREAKPOINT);
      const basePadding = Math.min(innerWidth, innerHeight) * VIEWPORT_PADDING_RATIO;
      const maxPadding = Math.min(innerWidth, innerHeight) * MAX_PADDING_RATIO;
      const viewportPadding = Math.min(Math.max(basePadding, MIN_VIEWPORT_PADDING), maxPadding);
      const availableWidth = Math.max(innerWidth - viewportPadding * 2, 0);
      const availableHeight = Math.max(innerHeight - viewportPadding * 2, 0);
      const scale = Math.min(availableWidth / designWidth, availableHeight / designHeight);

      node.style.setProperty("--aspect-scale", scale.toString());
      node.style.setProperty("--aspect-padding", `${viewportPadding}px`);
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
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 flex overflow-auto",
        isMobile ? "items-start justify-center" : "items-center justify-center",
      )}
      style={{ padding: "var(--aspect-padding, 0px)" }}
    >
      <div
        className={cn(
          "origin-center",
          !isMobile && "[transform:scale(var(--aspect-scale,1))]",
          className,
        )}
        style={{
          width: isMobile ? "100%" : `${designWidth}px`,
          height: isMobile ? "auto" : `${designHeight}px`,
          transform: isMobile ? "none" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
