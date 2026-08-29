'use client';

import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { ConfirmDialog } from '@eurostore/ui';

export default function ConfirmedSubmitButton({
  ariaLabel,
  title,
  description,
  confirmLabel,
  cancelLabel,
  className,
  children,
}: {
  ariaLabel: string;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  className?: string;
  children: ReactNode;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        title={ariaLabel}
        className={className}
        onClick={() => setOpen(true)}
        disabled={submitting}
      >
        {children}
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        destructive
        pending={submitting}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          const form = buttonRef.current?.form;
          if (!form) return;
          setSubmitting(true);
          setOpen(false);
          form.requestSubmit();
        }}
      />
    </>
  );
}
