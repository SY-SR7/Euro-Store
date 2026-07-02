'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

const FAQ_DATA = [
  {
    question: 'ما هي طرق الدفع المتوفرة؟',
    answer: 'في الوقت الحالي، نوفر الدفع نقداً عند الاستلام (Cash on Delivery) لضمان راحتك وثقتك بمنتجاتنا. نعمل على إضافة الدفع بالبطاقات البنكية قريباً.'
  },
  {
    question: 'ما هي سياسة الاستبدال والاسترجاع؟',
    answer: 'يمكنك استبدال أي منتج خلال 14 يوماً من تاريخ الاستلام بشرط أن يكون بحالته الأصلية مع الغلاف والبطاقات (Tags). نعتذر عن قبول الاسترجاع إلا في حال وجود عيب مصنعي.'
  },
  {
    question: 'كم تستغرق عملية التوصيل؟',
    answer: 'لطلبات دمشق، يتم التوصيل خلال 24 إلى 48 ساعة. لباقي المحافظات السورية، يستغرق التوصيل من 2 إلى 4 أيام عمل عبر شركات الشحن المعتمدة.'
  },
  {
    question: 'هل المنتجات المعروضة أصلية؟',
    answer: 'بالتأكيد. جميع المنتجات المعروضة في يورو ستور أصلية 100% ومستوردة مباشرة من الوكلاء المعتمدين في أوروبا (إسبانيا، إيطاليا، وألمانيا).'
  },
  {
    question: 'كيف يمكنني تتبع طلبي؟',
    answer: 'بمجرد تأكيد الطلب، يمكنك الدخول إلى "حسابي" ثم "طلباتي" لتتبع حالة الطلب (قيد التجهيز، تم الشحن، تم التوصيل). كما سنرسل لك إشعارات عند كل تحديث.'
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <main className="min-h-screen py-20 px-4 bg-background" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-wider">
            الأسئلة الشائعة
          </h1>
          <p className="text-lg text-text-secondary">
            كل ما تحتاج لمعرفته عن التسوق معنا في يورو ستور
          </p>
        </motion.div>

        <div className="space-y-4">
          {FAQ_DATA.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-background-elevated border border-border/50 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <h3 className={`text-lg font-bold text-right transition-colors ${isOpen ? 'text-primary' : 'text-white'}`}>
                    {faq.question}
                  </h3>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className={`shrink-0 ml-4 ${isOpen ? 'text-primary' : 'text-text-muted'}`}
                  >
                    <ChevronDown size={24} />
                  </motion.div>
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    >
                      <div className="px-6 pb-6 text-text-secondary leading-relaxed">
                        <div className="h-px w-full bg-border/50 mb-6" />
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center bg-primary/10 border border-primary/20 rounded-2xl p-8"
        >
          <h4 className="text-xl font-bold text-white mb-4">لم تجد إجابة لسؤالك؟</h4>
          <p className="text-text-secondary mb-6">فريق خدمة العملاء لدينا جاهز دائماً لمساعدتك.</p>
          <Link href="/contact" className="inline-block bg-primary text-[#0F0F0F] font-black py-3 px-8 rounded-xl hover:bg-primary/90 transition-colors">
            تواصل معنا
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
