"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

export function PointsCounter({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString("en-US"));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: "easeOut" });
    return controls.stop;
  }, [value, count]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-8 bg-black border border-[#C9A84C]/20 rounded-2xl shadow-[0_0_40px_rgba(201,168,76,0.1)] relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#C9A84C]/10 to-transparent opacity-50" />
      <span className="text-[#C9A84C] text-sm uppercase tracking-widest font-semibold mb-2 z-10">
        نقاط الولاء (Loyalty Points)
      </span>
      <div className="text-6xl md:text-8xl font-serif text-[#C9A84C] font-bold z-10 flex items-baseline gap-2">
        <motion.span>{rounded}</motion.span>
      </div>
    </motion.div>
  );
}
