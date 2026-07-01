'use client';
/* eslint-disable */
// @ts-nocheck
import { useState } from 'react';

export function ContactForm({
  t_submit,
  t_name,
  t_namePlaceholder,
  t_email,
  t_message,
  t_messagePlaceholder,
  t_sentSuccess,
  t_willContactSoon,
}: {
  t_submit: string;
  t_name: string;
  t_namePlaceholder: string;
  t_email: string;
  t_message: string;
  t_messagePlaceholder: string;
  t_sentSuccess: string;
  t_willContactSoon: string;
}) {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-md border border-green-800 bg-green-900/10 p-6 text-center">
        <p className="text-green-400 font-medium">✓ {t_sentSuccess}</p>
        <p className="mt-2 text-sm text-[#6F6658]">{t_willContactSoon}</p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => { e.preventDefault(); setSent(true); }}
    >
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#6F6658]">{t_name}</span>
        <input
          name="name" required
          className="rounded-md border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-2.5 text-sm text-[#1F1B16] placeholder:text-[#8B8172] focus:border-[#C9A84C] focus:outline-none"
          placeholder={t_namePlaceholder}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#6F6658]">{t_email}</span>
        <input
          name="email" type="email" required
          className="rounded-md border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-2.5 text-sm text-[#1F1B16] placeholder:text-[#8B8172] focus:border-[#C9A84C] focus:outline-none"
          placeholder="email@example.com"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-[#6F6658]">{t_message}</span>
        <textarea
          name="message" required rows={5}
          className="rounded-md border border-[#E8DCC3] bg-[#FFFDF8] px-4 py-2.5 text-sm text-[#1F1B16] placeholder:text-[#8B8172] focus:border-[#C9A84C] focus:outline-none resize-none"
          placeholder={t_messagePlaceholder}
        />
      </label>
      <button
        type="submit"
        className="rounded-sm bg-[#C9A84C] py-2.5 text-sm font-semibold text-[#111] hover:bg-[#D8B95F] transition-colors"
      >
        {t_submit}
      </button>
    </form>
  );
}
