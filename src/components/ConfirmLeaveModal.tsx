'use client';

import { useEffect, useRef } from 'react';

interface ConfirmLeaveModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Optional heading. Defaults to "Unsaved changes" */
  title?: string;
  /** Optional body. Defaults to a generic unsaved-changes message. */
  message?: string;
  /** Label for the destructive "leave" button. Defaults to "Leave" */
  confirmLabel?: string;
}

export default function ConfirmLeaveModal({
  open,
  onConfirm,
  onCancel,
  title = 'Unsaved changes',
  message = 'You have unsaved changes. If you leave now your changes will be lost.',
  confirmLabel = 'Leave without saving',
}: ConfirmLeaveModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the Cancel button on open so pressing Enter keeps the user on the page.
  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-leave-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-4">
        <h2 id="confirm-leave-title" className="text-lg font-bold text-gray-900">
          {title}
        </h2>
        <p className="text-sm text-gray-600">{message}</p>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
          >
            Keep editing
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
