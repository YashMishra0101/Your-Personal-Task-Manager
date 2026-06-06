import React from "react";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle, X } from "lucide-react";

export default function OutcomeDialog({ isOpen, onClose, onOutcome }) {
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
          className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-surface-hover"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-primary mb-6 text-center">
          Task Outcome
        </h3>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onOutcome(true);
              onClose();
            }}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 transition-all shadow-lg shadow-green-500/25 active:scale-[0.98]"
          >
            <CheckCircle size={20} /> Completed Successfully
          </button>
          
          <button
            onClick={() => {
              onOutcome(false);
              onClose();
            }}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/25 active:scale-[0.98]"
          >
            <XCircle size={20} /> Not Completed
          </button>

          <button
            onClick={onClose}
            className="mt-2 py-2.5 px-4 rounded-xl font-medium bg-surface-hover text-primary hover:bg-border transition-colors active:scale-[0.98]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
