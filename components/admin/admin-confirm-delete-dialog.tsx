"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type AdminConfirmDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmPhrase: string;
  confirmText: string;
  onConfirmTextChange: (value: string) => void;
  onConfirm: () => void;
  saving?: boolean;
  confirmLabel?: string;
};

export function AdminConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmPhrase,
  confirmText,
  onConfirmTextChange,
  onConfirm,
  saving = false,
  confirmLabel = "Delete permanently",
}: AdminConfirmDeleteDialogProps) {
  const phraseMatches =
    confirmText.trim() === confirmPhrase && confirmPhrase.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-1 text-left">{description}</div>
          </DialogDescription>
        </DialogHeader>
        <Input
          value={confirmText}
          onChange={(e) => onConfirmTextChange(e.target.value)}
          placeholder={confirmPhrase}
          aria-label="Confirmation phrase"
          autoComplete="off"
          className="font-mono text-sm"
        />
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!phraseMatches || saving}
            className="border-red-300 text-red-800 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
            onClick={onConfirm}
          >
            {saving ? "Deleting…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
