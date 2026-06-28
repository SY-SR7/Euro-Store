'use client';

import * as React from 'react';
import { Toaster as SonnerToaster } from 'sonner';

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <SonnerToaster
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#1E2020] group-[.toaster]:text-[#E2E2E2] group-[.toaster]:border-[#2E2E2E] group-[.toaster]:shadow-lg font-body",
          description: "group-[.toast]:text-[#9CA3AF]",
          actionButton:
            "group-[.toast]:bg-[#C9A84C] group-[.toast]:text-[#1A1A1A] font-medium",
          cancelButton:
            "group-[.toast]:bg-[#2E2E2E] group-[.toast]:text-[#E2E2E2]",
          error: "group-[.toaster]:border-s-4 group-[.toaster]:border-s-red-500",
          success: "group-[.toaster]:border-s-4 group-[.toaster]:border-s-green-500",
          warning: "group-[.toaster]:border-s-4 group-[.toaster]:border-s-yellow-500",
          info: "group-[.toaster]:border-s-4 group-[.toaster]:border-s-[#C9A84C]",
        },
      }}
      {...props}
    />
  );
}
