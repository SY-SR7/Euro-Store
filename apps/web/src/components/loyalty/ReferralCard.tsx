"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Share2 } from "lucide-react";

interface ReferralCardProps {
  referralCode: string;
}

export function ReferralCard({ referralCode }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: "EuroStore",
      text: `سجل في يورو ستور باستخدام كود الدعوة الخاص بي واحصل على خصم! كود الدعوة: ${referralCode}`,
      url: `https://eurostore.com?ref=${referralCode}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Failed to share", err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-[#1A1A1A] border border-[#C9A84C]/30 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C]/10 blur-3xl rounded-full" />
      
      <div className="z-10">
        <h3 className="text-[#C9A84C] font-serif text-2xl mb-2">دعوة الأصدقاء</h3>
        <p className="text-gray-400 text-sm">
          شارك كود الدعوة الخاص بك مع أصدقائك. ستحصل على 500 نقطة ولاء عندما يقوم صديقك بإتمام أول طلب له!
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-2 z-10">
        <div className="flex-1 bg-black border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="font-mono text-xl tracking-wider text-white select-all">
            {referralCode}
          </span>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-[#C9A84C] transition-colors p-2"
            title="نسخ الكود"
            aria-label="Copy code"
          >
            {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
          </button>
        </div>
        
        <button
          onClick={handleShare}
          className="bg-[#C9A84C] hover:bg-[#A67C2E] text-black font-semibold rounded-xl px-6 py-3 flex items-center justify-center gap-2 transition-colors"
        >
          <Share2 size={20} />
          <span>مشاركة</span>
        </button>
      </div>
    </motion.div>
  );
}
