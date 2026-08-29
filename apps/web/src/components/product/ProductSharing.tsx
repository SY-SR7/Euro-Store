'use client';

import { useState, useEffect } from 'react';
import { Share2, Copy, Check, Twitter, Facebook, MessageCircle, Instagram } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ProductSharing({ url, title }: { url?: string; title?: string }) {
  const t = useTranslations('productDetails');
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    setShareUrl(url || window.location.href);
  }, [url]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${title ? title + ' - ' : ''}${shareUrl}`)}`,
      color: 'bg-green-100 text-green-600 hover:bg-green-200',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
    },
    {
      name: 'Instagram',
      icon: Instagram,
      href: `https://www.instagram.com/`, // Instagram doesn't have a direct text share URL for web
      color: 'bg-pink-100 text-pink-600 hover:bg-pink-200',
    },
    {
      name: 'X (Twitter)',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title || '')}`,
      color: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
    },
    {
      name: 'Telegram',
      icon: Share2, // Generic fallback
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title || '')}`,
      color: 'bg-sky-100 text-sky-600 hover:bg-sky-200',
    },
  ];

  return (
    <div className="flex flex-col gap-3 py-4 border-t border-border mt-4">
      <p className="text-sm font-semibold text-text-muted">{t('shareProduct')}</p>
      <div className="flex flex-wrap gap-2">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            title={link.name}
            aria-label={link.name}
            className={`p-2.5 rounded-full transition-colors ${link.color}`}
          >
            <link.icon className="w-4 h-4" />
          </a>
        ))}
        <button
          type="button"
          onClick={() => { void copyToClipboard(); }}
          title={t('copyLink')}
          aria-label={t('copyLink')}
          className="p-2.5 rounded-full bg-surface-elevated text-text-secondary hover:text-primary transition-colors border border-border"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
