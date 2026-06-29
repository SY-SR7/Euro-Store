'use client';

import { useEffect } from 'react';

function fallbackSvg(label: string) {
  const safe = (label || 'Euro Store Admin').slice(0, 40);
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#FAF7EF"/>
        <stop offset=".55" stop-color="#FFFFFF"/>
        <stop offset="1" stop-color="#F3EDE3"/>
      </linearGradient>
    </defs>
    <rect width="900" height="700" fill="url(#g)"/>
    <circle cx="450" cy="300" r="96" fill="#fff" stroke="#C9A84C" stroke-width="6"/>
    <path d="M360 345h180v-105H360v105Zm35-135h110" fill="none" stroke="#C9A84C" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="450" y="455" text-anchor="middle" font-size="34" font-family="Arial, sans-serif" font-weight="800" fill="#6F6658">${safe}</text>
    <text x="450" y="505" text-anchor="middle" font-size="22" font-family="Arial, sans-serif" fill="#A8A29E">Admin Panel</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export function GlobalVisualPatches() {
  useEffect(() => {
    const fix = (img: HTMLImageElement) => {
      if (img.dataset.euroAdminFallbackReady === 'true') return;
      img.dataset.euroAdminFallbackReady = 'true';

      const apply = () => {
        if (img.dataset.euroAdminFallbackApplied === 'true') return;
        img.dataset.euroAdminFallbackApplied = 'true';
        img.src = fallbackSvg(img.alt || 'صورة');
        img.classList.add('object-cover');
      };

      const raw = img.getAttribute('src');
      if (!raw || raw === '#' || raw === 'null' || raw === 'undefined') apply();
      img.addEventListener('error', apply);
    };

    const scan = () => document.querySelectorAll('img').forEach((el) => fix(el as HTMLImageElement));
    scan();

    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => mo.disconnect();
  }, []);

  return null;
}