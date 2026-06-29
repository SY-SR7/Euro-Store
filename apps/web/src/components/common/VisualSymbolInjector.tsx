'use client';

import { useEffect } from 'react';

const GOLD = '#C9A84C';
const TEXT = '#6F6658';

function svgIcon(kind: string, size = 22) {
  const common = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;

  if (kind === 'cart') return `<svg class="euro-cart-svg" ${common}><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>`;
  if (kind === 'product') return `<svg ${common}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`;
  if (kind === 'category') return `<svg ${common}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`;
  if (kind === 'order') return `<svg ${common}><path d="M10 17h4V5H2v12h3"/><path d="M14 17h1V9h4l3 4v4h-2"/><circle cx="7" cy="17" r="2"/><circle cx="18" cy="17" r="2"/></svg>`;
  if (kind === 'exchange') return `<svg ${common}><path d="M21 7H7"/><path d="m15 1 6 6-6 6"/><path d="M3 17h14"/><path d="m9 23-6-6 6-6"/></svg>`;
  if (kind === 'loyalty') return `<svg ${common}><path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7Z"/><path d="M12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7Z"/></svg>`;
  if (kind === 'account') return `<svg ${common}><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>`;
  if (kind === 'favorite') return `<svg ${common}><polygon points="12 2 15 8.5 22 9 17 14 18.5 21 12 17.3 5.5 21 7 14 2 9 9 8.5 12 2"/></svg>`;
  if (kind === 'search') return `<svg ${common}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;
  if (kind === 'home') return `<svg ${common}><path d="m3 10 9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>`;
  if (kind === 'image') return `<svg ${common}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>`;

  return `<svg ${common}><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`;
}

function detectKind(text: string) {
  const t = text || '';
  if (/سلة|cart|basket|bag/i.test(t)) return 'cart';
  if (/طلب|orders?|شحن|توصيل/i.test(t)) return 'order';
  if (/استبدال|exchange|return/i.test(t)) return 'exchange';
  if (/ولاء|نقاط|مكاف/i.test(t)) return 'loyalty';
  if (/حساب|دخول|مستخدم|profile|account|login|user/i.test(t)) return 'account';
  if (/مفضلة|wishlist|favorite/i.test(t)) return 'favorite';
  if (/تصنيف|category/i.test(t)) return 'category';
  if (/بحث|search/i.test(t)) return 'search';
  if (/الرئيسية|home/i.test(t)) return 'home';
  if (/منتج|product|sku|مخزون|variant/i.test(t)) return 'product';
  return 'image';
}

function fallbackImage(label: string, kind = 'image') {
  const safe = String(label || 'Euro Store').replace(/[<>&"]/g, '').slice(0, 42);
  const icon = svgIcon(kind, 82).replaceAll('currentColor', GOLD);

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#FAF7EF"/>
        <stop offset="0.52" stop-color="#FFFFFF"/>
        <stop offset="1" stop-color="#F3EDE3"/>
      </linearGradient>
    </defs>
    <rect width="900" height="700" fill="url(#g)"/>
    <circle cx="450" cy="285" r="112" fill="#fff" stroke="${GOLD}" stroke-width="5"/>
    <g transform="translate(409 244)">${icon}</g>
    <text x="450" y="455" text-anchor="middle" font-size="34" font-family="Arial, sans-serif" font-weight="800" fill="${TEXT}">${safe}</text>
    <text x="450" y="505" text-anchor="middle" font-size="22" font-family="Arial, sans-serif" fill="#A8A29E">Euro Store</text>
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function readCartCount() {
  try {
    let total = 0;

    const walk = (value: any, depth = 0): number => {
      if (!value || depth > 8) return 0;

      if (Array.isArray(value)) {
        return value.reduce((s, x) => s + walk(x, depth + 1), 0);
      }

      if (typeof value === 'object') {
        const looksItem =
          ('quantity' in value || 'qty' in value) &&
          ('variantId' in value || 'variant_id' in value || 'productId' in value || 'product_id' in value || 'sku' in value);

        if (looksItem) return Math.max(1, Number(value.quantity || value.qty || 1));

        return Object.values(value).reduce((s: number, x: any) => s + walk(x, depth + 1), 0);
      }

      return 0;
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      if (!/cart|basket|bag|سلة/i.test(key)) continue;
      try {
        total += walk(JSON.parse(localStorage.getItem(key) || 'null'));
      } catch {}
    }

    return total;
  } catch {
    return 0;
  }
}

function ensureStyle() {
  if (document.getElementById('euro-visual-symbol-style')) return;

  const style = document.createElement('style');
  style.id = 'euro-visual-symbol-style';
  style.textContent = `
    .euro-cart-link,
    a[data-euro-cart-fixed="1"] {
      position: relative !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 44px !important;
      height: 44px !important;
      min-width: 44px !important;
      min-height: 44px !important;
      border-radius: 9999px !important;
      border: 1px solid rgba(201,168,76,.55) !important;
      background: #fff !important;
      color: #6F6658 !important;
      opacity: 1 !important;
      visibility: visible !important;
      overflow: visible !important;
      box-shadow: 0 1px 5px rgba(31,27,22,.06) !important;
      text-decoration: none !important;
      z-index: 5 !important;
    }

    .euro-cart-link svg,
    a[data-euro-cart-fixed="1"] svg {
      display: block !important;
      width: 22px !important;
      height: 22px !important;
      stroke: currentColor !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    .euro-cart-link:hover,
    a[data-euro-cart-fixed="1"]:hover {
      color: #C9A84C !important;
      border-color: #C9A84C !important;
    }

    .euro-cart-badge {
      position: absolute !important;
      top: -7px !important;
      right: -7px !important;
      display: none;
      align-items: center !important;
      justify-content: center !important;
      min-width: 20px !important;
      height: 20px !important;
      padding: 0 5px !important;
      border-radius: 9999px !important;
      background: #C9A84C !important;
      color: #111 !important;
      font-size: 10px !important;
      font-weight: 900 !important;
      border: 2px solid #fff !important;
      z-index: 10 !important;
    }

    .euro-empty-symbol {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 72px !important;
      height: 72px !important;
      margin: 0 auto 14px !important;
      border-radius: 24px !important;
      border: 1px solid rgba(201,168,76,.35) !important;
      background: linear-gradient(135deg, #FAF7EF, #fff, #F3EDE3) !important;
      color: #C9A84C !important;
      box-shadow: 0 8px 24px rgba(31,27,22,.06) !important;
    }

    .euro-placeholder-symbol {
      position: absolute !important;
      inset: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      color: #C9A84C !important;
      background: linear-gradient(135deg, #FAF7EF, #fff, #F3EDE3) !important;
      text-align: center !important;
      pointer-events: none !important;
    }

    .euro-placeholder-symbol span {
      color: #6F6658 !important;
      font-size: 12px !important;
      font-weight: 800 !important;
    }
  `;
  document.head.appendChild(style);
}

function decorateCart(a: HTMLAnchorElement) {
  a.dataset.euroCartFixed = '1';
  a.classList.add('euro-cart-link');
  a.setAttribute('aria-label', a.getAttribute('aria-label') || 'السلة');
  a.setAttribute('title', a.getAttribute('title') || 'السلة');

  if (!a.querySelector('.euro-cart-svg')) {
    a.insertAdjacentHTML('afterbegin', svgIcon('cart'));
  }

  let badge = a.querySelector('.euro-cart-badge') as HTMLElement | null;
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'euro-cart-badge';
    a.appendChild(badge);
  }

  const count = readCartCount();
  badge.textContent = count > 99 ? '99+' : String(count);
  badge.style.display = count > 0 ? 'inline-flex' : 'none';
}

function ensureCart() {
  const header = document.querySelector('header') || document.querySelector('nav');
  if (!header) return;

  const existing = Array.from(header.querySelectorAll('a[href]')).find((x) => {
    const a = x as HTMLAnchorElement;
    const href = a.getAttribute('href') || '';
    try {
      return new URL(a.href).pathname.replace(/\/$/, '') === '/cart';
    } catch {
      return /\/cart\/?$/i.test(href);
    }
  }) as HTMLAnchorElement | undefined;

  if (existing) {
    decorateCart(existing);
    return;
  }

  if (header.querySelector('[data-euro-injected-cart="1"]')) {
    decorateCart(header.querySelector('[data-euro-injected-cart="1"]') as HTMLAnchorElement);
    return;
  }

  const cart = document.createElement('a');
  cart.href = '/cart';
  cart.dataset.euroInjectedCart = '1';
  cart.innerHTML = svgIcon('cart') + '<span class="euro-cart-badge"></span>';
  decorateCart(cart);

  const search =
    header.querySelector('a[href="/search"]') ||
    header.querySelector('a[href$="/search"]') ||
    header.querySelector('[aria-label*="بحث"]') ||
    header.querySelector('[title*="بحث"]');

  if (search?.parentElement) {
    search.parentElement.insertBefore(cart, search);
  } else {
    header.appendChild(cart);
  }
}

function fixImages() {
  document.querySelectorAll('img').forEach((img) => {
    const el = img as HTMLImageElement;
    if (el.dataset.euroImageFixed === '1') return;
    el.dataset.euroImageFixed = '1';

    const apply = () => {
      if (el.dataset.euroFallbackApplied === '1') return;
      const label = el.alt || el.title || 'صورة المنتج';
      const kind = detectKind(label);
      el.dataset.euroFallbackApplied = '1';
      el.src = fallbackImage(label, kind);
      el.style.objectFit = 'cover';
      el.style.background = '#FAF7EF';
    };

    const raw = el.getAttribute('src');
    if (!raw || raw === '#' || raw === 'null' || raw === 'undefined') apply();

    el.addEventListener('error', apply);
  });
}

function addEmptyIcons() {
  document.querySelectorAll('main div, main section, main article').forEach((node) => {
    const el = node as HTMLElement;
    if (el.dataset.euroEmptyIcon === '1') return;
    if (el.querySelector('.euro-empty-symbol, svg, img')) return;

    const text = (el.innerText || '').trim();
    if (!text || text.length > 180) return;
    if (!/لا توجد|لا يوجد|فارغ|فارغة|غير موجود|لم يتم العثور|سجّل الدخول|تسجيل الدخول|ابدأ|لا تملك/i.test(text)) return;

    const kind = detectKind(text);
    const icon = document.createElement('div');
    icon.className = 'euro-empty-symbol';
    icon.innerHTML = svgIcon(kind, 34);

    el.dataset.euroEmptyIcon = '1';
    el.prepend(icon);
  });
}

function fillEmptyBoxes() {
  const selector = [
    '[class*="aspect-square"]',
    '[class*="aspect-["]',
    '[class*="image"]',
    '[class*="thumbnail"]',
    '[class*="photo"]',
    '[class*="avatar"]',
  ].join(',');

  document.querySelectorAll(selector).forEach((node) => {
    const el = node as HTMLElement;
    if (el.dataset.euroPlaceholderIcon === '1') return;
    if (el.querySelector('img,svg,.euro-placeholder-symbol')) return;

    const rect = el.getBoundingClientRect();
    if (rect.width < 60 || rect.height < 60) return;
    if ((el.innerText || '').trim().length > 8) return;

    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';

    const label = el.getAttribute('aria-label') || el.getAttribute('title') || 'صورة';
    const kind = detectKind(label);

    const box = document.createElement('div');
    box.className = 'euro-placeholder-symbol';
    box.innerHTML = `${svgIcon(kind, 38)}<span>${kind === 'product' ? 'صورة المنتج' : 'صورة معبرة'}</span>`;

    el.dataset.euroPlaceholderIcon = '1';
    el.appendChild(box);
  });
}

export function VisualSymbolInjector() {
  useEffect(() => {
    ensureStyle();

    const run = () => {
      ensureCart();
      fixImages();
      addEmptyIcons();
      fillEmptyBoxes();
    };

    run();

    const mo = new MutationObserver(run);
    mo.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('storage', run);
    window.addEventListener('focus', run);

    const timer = window.setInterval(run, 1500);

    return () => {
      mo.disconnect();
      window.removeEventListener('storage', run);
      window.removeEventListener('focus', run);
      window.clearInterval(timer);
    };
  }, []);

  return null;
}