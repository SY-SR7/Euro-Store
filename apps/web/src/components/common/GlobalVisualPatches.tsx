'use client';

import { useEffect, useState } from 'react';
import { CartIconLink } from './CartIconLink';

function fallbackSvg(label: string) {
  const safe = (label || 'Euro Store').slice(0, 40);
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#FAF7EF"/>
        <stop offset="0.55" stop-color="#FFFFFF"/>
        <stop offset="1" stop-color="#F3EDE3"/>
      </linearGradient>
    </defs>
    <rect width="900" height="700" fill="url(#g)"/>
    <circle cx="450" cy="305" r="96" fill="#fff" stroke="#C9A84C" stroke-width="6" opacity=".95"/>
    <path d="M395 330h110l-14-70h-82l-14 70Zm30-88c0-29 50-29 50 0" fill="none" stroke="#C9A84C" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="450" y="455" text-anchor="middle" font-size="34" font-family="Arial, sans-serif" font-weight="800" fill="#6F6658">${safe}</text>
    <text x="450" y="505" text-anchor="middle" font-size="22" font-family="Arial, sans-serif" fill="#A8A29E">Euro Store</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function guessLabel(img: HTMLImageElement) {
  const alt = img.getAttribute('alt') || '';
  const title = img.getAttribute('title') || '';
  const cls = img.className?.toString() || '';
  const text = alt || title;

  if (text.trim()) return text;
  if (cls.includes('avatar')) return 'الحساب';
  if (cls.includes('brand')) return 'علامة تجارية';
  if (cls.includes('category')) return 'تصنيف';
  if (cls.includes('banner') || cls.includes('hero')) return 'Euro Store';
  return 'صورة المنتج';
}

export function GlobalVisualPatches() {
  const [hasHeaderCart, setHasHeaderCart] = useState(true);

  useEffect(() => {
    const fixImage = (img: HTMLImageElement) => {
      if (img.dataset.euroFallbackReady === 'true') return;
      img.dataset.euroFallbackReady = 'true';

      const apply = () => {
        if (img.dataset.euroFallbackApplied === 'true') return;
        img.dataset.euroFallbackApplied = 'true';
        img.src = fallbackSvg(guessLabel(img));
        img.classList.add('object-cover');
      };

      const raw = img.getAttribute('src');
      if (!raw || raw === '#' || raw === 'null' || raw === 'undefined') apply();

      img.addEventListener('error', apply);
    };

    const scan = () => {
      document.querySelectorAll('img').forEach((el) => fixImage(el as HTMLImageElement));
    };

    scan();

    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const check = () => {
      const headerCart = document.querySelector('header a[href="/cart"], nav a[href="/cart"]');
      setHasHeaderCart(Boolean(headerCart));
    };

    check();

    const mo = new MutationObserver(check);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => mo.disconnect();
  }, []);

  if (hasHeaderCart) return null;

  return (
    <div className="fixed top-4 z-[9999] ltr:right-4 rtl:left-4">
      <CartIconLink floating />
    </div>
  );
}