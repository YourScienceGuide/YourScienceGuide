"use client";

import { useCallback, useEffect, useRef } from "react";

import { useTheme } from "@/components/theme-provider";
import { decodeBase64Utf8 } from "@/lib/ai-guard/encode";
import { cn } from "@/lib/utils";

type CanvasTextProps = {
  encoded: string;
  variant?: "prompt" | "option" | "body";
  className?: string;
};

/** Matches required-readings list rows (layout + `text-sm` typography) */
export const canvasTextFrameClassName =
  "flex w-full min-w-0 max-w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-md border border-amber-200/80 bg-white px-4 py-3 text-sm text-slate-800 dark:border-amber-900/40 dark:bg-stone-900/80 dark:text-stone-200";

function getContentMetrics(container: HTMLElement) {
  const style = getComputedStyle(container);
  const paddingLeft = parseFloat(style.paddingLeft) || 0;
  const paddingRight = parseFloat(style.paddingRight) || 0;
  const layoutWidth = Math.max(
    1,
    Math.floor(container.clientWidth - paddingLeft - paddingRight),
  );

  const fontSize = parseFloat(style.fontSize) || 14;
  const lineHeightPx = parseFloat(style.lineHeight);
  const lineHeight = Number.isFinite(lineHeightPx)
    ? lineHeightPx
    : fontSize * 1.25;

  return {
    layoutWidth,
    font: style.font,
    lineHeight,
    color: style.color,
  };
}

function breakLongWord(
  ctx: CanvasRenderingContext2D,
  word: string,
  maxWidth: number,
): string[] {
  if (ctx.measureText(word).width <= maxWidth) return [word];
  const parts: string[] = [];
  let chunk = "";
  for (const char of word) {
    const next = chunk + char;
    if (ctx.measureText(next).width > maxWidth && chunk) {
      parts.push(chunk);
      chunk = char;
    } else {
      chunk = next;
    }
  }
  if (chunk) parts.push(chunk);
  return parts.length > 0 ? parts : [word];
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];

  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = "";
    for (const word of words) {
      const segments = breakLongWord(ctx, word, maxWidth);
      for (const segment of segments) {
        const next = current ? `${current} ${segment}` : segment;
        if (ctx.measureText(next).width > maxWidth && current) {
          lines.push(current);
          current = segment;
        } else {
          current = next;
        }
      }
    }
    if (current) lines.push(current);
  }

  return lines.length > 0 ? lines : [text];
}

export function CanvasText({
  encoded,
  variant: _variant = "option",
  className,
}: CanvasTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  const draw = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const { layoutWidth, font, lineHeight, color } = getContentMetrics(container);
    if (layoutWidth <= 0) return;

    const text = decodeBase64Utf8(encoded);

    const measure = document.createElement("canvas").getContext("2d");
    if (!measure) return;
    measure.font = font;

    const lines = wrapLines(measure, text, layoutWidth);
    const textHeight = lines.length * lineHeight;

    const dpr = window.devicePixelRatio || 1;
    const bitmapWidth = Math.max(1, Math.round(layoutWidth * dpr));
    const bitmapHeight = Math.max(1, Math.round(textHeight * dpr));

    canvas.width = bitmapWidth;
    canvas.height = bitmapHeight;
    canvas.style.width = "100%";
    canvas.style.height = `${textHeight}px`;
    canvas.style.maxWidth = "100%";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, bitmapWidth, bitmapHeight);
    ctx.scale(dpr, dpr);
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, layoutWidth, textHeight);
    ctx.clip();

    lines.forEach((line, index) => {
      ctx.fillText(line, 0, index * lineHeight);
    });
    ctx.restore();
  }, [encoded, theme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame = 0;
    const scheduleDraw = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };

    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) scheduleDraw();
    });

    const resizeObserver = new ResizeObserver(scheduleDraw);
    resizeObserver.observe(container);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [draw]);

  return (
    <div
      ref={containerRef}
      className={cn(canvasTextFrameClassName, className)}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Question content"
        className="block h-auto min-w-0 w-full max-w-full flex-1 select-none"
      />
    </div>
  );
}
