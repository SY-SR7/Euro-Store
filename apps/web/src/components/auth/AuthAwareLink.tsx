'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useAuthModal } from './AuthModalProvider';

export function AuthAwareLink({
  href,
  children,
  className,
  ariaLabel,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}): ReactNode {
  const { isAuthenticated, openAuth } = useAuthModal();
  if (isAuthenticated) return <Link href={href} className={className} aria-label={ariaLabel}>{children}</Link>;
  return <button type="button" className={className} aria-label={ariaLabel} onClick={() => openAuth(href)}>{children}</button>;
}

export function AuthModalButton({
  next,
  children,
  className,
}: {
  next: string;
  children: ReactNode;
  className?: string;
}): ReactNode {
  const { openAuth } = useAuthModal();
  return <button type="button" className={className} onClick={() => openAuth(next)}>{children}</button>;
}
