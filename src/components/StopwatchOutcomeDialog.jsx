import React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, X, Clock } from "lucide-react";

/**
 * Confirmation modal shown before moving a stopped stopwatch session into History.
 * Lets the user record whether the task for the session was completed or not.
 */
export default function StopwatchOutcomeDialog({
  isOpen,
  onClose,
  onOutcome,
  sessionLabel,
  elapsedText,
  isPaused = false,
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-surface rounded-2xl shadow-2xl border border-border max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-surface-hover"
          aria-label="Close dialog"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        <div className="text-center mb-5">
          <h3
            className="text-xl font-extrabold text-primary tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Session Outcome
          </h3>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Did you complete your task during this session?
          </p>
        </div>

        {/* Session Summary Pill */}
        <div className="mb-6 px-4 py-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-primary truncate">
            {sessionLabel || "Untitled Timer"}
          </span>
          {elapsedText && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-extrabold tabular-nums text-muted-foreground shrink-0"
              style={{ fontFamily: "'Plus Jakarta Sans', monospace" }}
            >
              <Clock size={13} />
              {elapsedText}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onOutcome("completed");
              onClose();
            }}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
          >
            <CheckCircle2 size={18} strokeWidth={2.5} />
            Completed Successfully
          </button>

          <button
            onClick={() => {
              onOutcome("not_completed");
              onClose();
            }}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-[0.98]"
          >
            <XCircle size={18} strokeWidth={2.5} />
            Not Completed
          </button>

          <button
            onClick={onClose}
            className="mt-1 py-2.5 px-4 rounded-xl font-semibold text-sm bg-surface-hover text-primary hover:bg-border transition-colors active:scale-[0.98]"
          >
            {isPaused ? "Cancel" : "Keep Timer Running"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
