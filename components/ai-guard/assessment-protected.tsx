"use client";

import type { ClipboardEvent, MouseEvent, ReactNode } from "react";

import { cn } from "@/lib/utils";

type AssessmentProtectedProps = {
  children: ReactNode;
  className?: string;
};

function blockClipboard(event: ClipboardEvent) {
  event.preventDefault();
}

function blockContextMenu(event: MouseEvent) {
  event.preventDefault();
}

export function AssessmentProtected({
  children,
  className,
}: AssessmentProtectedProps) {
  return (
    <div
      className={cn("assessment-no-select", className)}
      translate="no"
      data-ysg-assessment="protected"
      data-copy="disabled"
      onCopy={blockClipboard}
      onCut={blockClipboard}
      onContextMenu={blockContextMenu}
    >
      {children}
    </div>
  );
}
