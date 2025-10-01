import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  accent?: "default" | "positive" | "warning" | "danger";
};

const ACCENT_CLASS: Record<NonNullable<CardProps["accent"]>, string> = {
  default: "border-[color:var(--card-border)]",
  positive: "border-emerald-300/40",
  warning: "border-amber-300/40",
  danger: "border-rose-400/40",
};

export function Card({ accent = "default", className, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        "relative h-full min-h-0 min-w-0 overflow-hidden",
        "rounded-[24px] border bg-[color:var(--card-bg)] text-[color:var(--theme-foreground)]",
        "shadow-[0_0_0_1px_rgba(0,0,0,0.32)] backdrop-blur-xl",
        ACCENT_CLASS[accent],
        className,
      )}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "flex items-start justify-between gap-3 text-balance",
        "text-[clamp(16px,2vw,28px)] font-medium",
        className,
      )}
    />
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("flex flex-col gap-4", className)} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "mt-auto flex flex-wrap items-center gap-3 text-[clamp(12px,1.5vw,16px)] text-white/80",
        className,
      )}
    />
  );
}
