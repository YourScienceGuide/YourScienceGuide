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

function getFillColor(theme: "light" | "dark") {
  return theme === "dark" ? "#fafaf9" : "#0f172a";
}

function getRootFontSizePx() {
  return (
    Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    ) || 16
  );
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [text];
}

export function CanvasText({
  encoded,
  variant = "option",
  className,
}: CanvasTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  const draw = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const layoutWidth = container.clientWidth;
    if (layoutWidth <= 0) return;

    const text = decodeBase64Utf8(encoded);
    const rootPx = getRootFontSizePx();
    const fontSize =
      variant === "prompt"
        ? rootPx * 1.925
        : variant === "body"
          ? rootPx * 0.875
          : rootPx * 1.4875;
    const fontWeight = variant === "prompt" ? 600 : 400;
    const lineHeight = fontSize * 1.5;
    const paddingX = 1;
    const paddingY = 2;
    const font = `${fontWeight} ${fontSize}px var(--font-sans), system-ui, sans-serif`;

    const measure = document.createElement("canvas").getContext("2d");
    if (!measure) return;
    measure.font = font;

    const contentWidth = layoutWidth - paddingX * 2;
    const lines = wrapLines(measure, text, contentWidth);
    const layoutHeight = lines.length * lineHeight + paddingY * 2;

    const dpr = window.devicePixelRatio || 1;
    const bitmapWidth = Math.max(1, Math.ceil(layoutWidth * dpr));
    const bitmapHeight = Math.max(1, Math.ceil(layoutHeight * dpr));

    canvas.width = bitmapWidth;
    canvas.height = bitmapHeight;
    canvas.style.width = `${layoutWidth}px`;
    canvas.style.height = `${layoutHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, bitmapWidth, bitmapHeight);
    ctx.scale(dpr, dpr);
    ctx.font = font;
    ctx.fillStyle = getFillColor(theme);
    ctx.textBaseline = "top";
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    lines.forEach((line, index) => {
      ctx.fillText(line, paddingX, paddingY + index * lineHeight);
    });
  }, [encoded, theme, variant]);

  useEffect(() => {
    draw();

    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(draw);
    });
    resizeObserver.observe(container);

    const onViewportChange = () => requestAnimationFrame(draw);
    window.addEventListener("resize", onViewportChange);
    window.visualViewport?.addEventListener("resize", onViewportChange);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", onViewportChange);
      window.visualViewport?.removeEventListener("resize", onViewportChange);
    };
  }, [draw]);

  return (
    <div ref={containerRef} className={cn("w-full min-w-0", className)}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Question content"
        className="block max-w-full select-none"
      />
    </div>
  );
}
