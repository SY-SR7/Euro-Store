'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';

export function EuroConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([
    { role: 'assistant', text: 'مرحباً بك في يورو ستور! أنا مساعدك الشخصي للبحث عن أرقى صيحات الموضة الأوروبية. كيف يمكنني مساعدتك اليوم؟' }
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setChat([...chat, { role: 'user', text: message }]);
    setMessage('');

    // Simulate AI response
    setTimeout(() => {
      setChat(prev => [...prev, { role: 'assistant', text: 'شكراً لتواصلك! في هذه النسخة التجريبية (MVP)، أنا مجرد واجهة للعرض (Mockup) لميزة الذكاء الاصطناعي المستقبلية. أرجو لك تسوقاً ممتعاً!' }]);
    }, 1000);
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className='fixed bottom-24 md:bottom-6 left-4 md:left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-110 transition-all duration-300'
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 1.2 }}
        whileHover={{ y: -5 }}
        aria-label='المساعد الذكي'
      >
        <Sparkles size={24} className="text-[#0F0F0F]" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-40 md:bottom-24 left-4 md:left-6 z-50 w-[calc(100vw-32px)] sm:w-96 bg-background border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            dir="rtl"
            style={{ height: '500px', maxHeight: 'calc(100vh - 120px)' }}
          >
            {/* Header */}
            <div className="bg-background-elevated p-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Sparkles size={16} className="text-[#0F0F0F]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">EuroConcierge</h3>
                  <p className="text-xs text-primary">متصل (AI)</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain touch-pan-y" 
              data-lenis-prevent="true"
              onWheel={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {chat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-[#0F0F0F] rounded-br-sm' 
                      : 'bg-background-elevated text-text-primary border border-border/50 rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-border/50 bg-background-elevated">
              <div className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اسألني عن الماركات..."
                  className="w-full bg-background border border-border/50 rounded-full py-3 pr-4 pl-12 text-text-primary text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-primary rounded-full text-[#0F0F0F] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={16} className="mr-1" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
