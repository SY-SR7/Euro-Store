'use client';

import * as React from 'react';
import { Toaster as SonnerToaster } from 'sonner';

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <SonnerToaster
      theme="light"
      richColors
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:border-border group-[.toaster]:bg-background-elevated group-[.toaster]:text-text-primary group-[.toaster]:shadow-lg font-body",
          description: "group-[.toast]:text-text-secondary",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-text-primary font-medium",
          cancelButton:
            "group-[.toast]:bg-background-secondary group-[.toast]:text-text-primary",
          error: "group-[.toaster]:border-s-4 group-[.toaster]:border-s-red-500",
          success: "group-[.toaster]:border-s-4 group-[.toaster]:border-s-green-500",
          warning: "group-[.toaster]:border-s-4 group-[.toaster]:border-s-yellow-500",
          info: "group-[.toaster]:border-s-4 group-[.toaster]:border-s-primary",
        },
      }}
      {...props}
    />
  );
}
