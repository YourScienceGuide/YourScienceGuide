"use client";

import { useEffect, useRef, useState } from "react";

import { useTheme } from "@/components/theme-provider";
import { decodeBase64Utf8 } from "@/lib/ai-guard/encode";
import { cn } from "@/lib/utils";

type CanvasTextProps = {
  encoded: string;
  variant?: "prompt" | "option";
  className?: string;
  maxWidth?: number;
};

function getFillColor(theme: "light" | "dark") {
  return theme === "dark" ? "#fafaf9" : "#0f172a";
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
  maxWidth = 560,
}: CanvasTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [height, setHeight] = useState(variant === "prompt" ? 48 : 24);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const text = decodeBase64Utf8(encoded);
    const fontSize = variant === "prompt" ? 18 : 14;
    const lineHeight = fontSize * 1.45;
    const padding = 2;
    const font = `${variant === "prompt" ? 600 : 400} ${fontSize}px var(--font-sans), system-ui, sans-serif`;

    const measure = document.createElement("canvas").getContext("2d");
    if (!measure) return;
    measure.font = font;

    const lines = wrapLines(measure, text, maxWidth - padding * 2);
    const contentHeight = lines.length * lineHeight + padding * 2;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.ceil(maxWidth * dpr);
    canvas.height = Math.ceil(contentHeight * dpr);
    canvas.style.width = `${maxWidth}px`;
    canvas.style.height = `${contentHeight}px`;
    setHeight(contentHeight);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.font = font;
    ctx.fillStyle = getFillColor(theme);
    ctx.textBaseline = "top";

    lines.forEach((line, index) => {
      ctx.fillText(line, padding, padding + index * lineHeight);
    });
  }, [encoded, maxWidth, variant, theme]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Question content"
      className={cn("block max-w-full select-none", className)}
      style={{ height }}
    />
  );
}
