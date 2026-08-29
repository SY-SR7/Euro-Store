'use client';

import * as React from 'react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
  destructive?: boolean;
  confirmDisabled?: boolean;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  pending = false,
  destructive = false,
  confirmDisabled = false,
  children,
}: ConfirmDialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel, open, pending]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4"
      role="presentation"
      onMouseDown={() => { if (!pending) onCancel(); }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-lg border border-border bg-background-card p-5 text-text-primary shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-base font-black">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p> : null}
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={pending} className="rounded-md border border-border px-4 py-2 text-sm font-bold text-text-primary disabled:opacity-50">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending || confirmDisabled}
            autoFocus
            className={`rounded-md px-4 py-2 text-sm font-black disabled:opacity-50 ${destructive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-primary text-text-primary hover:opacity-90'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
