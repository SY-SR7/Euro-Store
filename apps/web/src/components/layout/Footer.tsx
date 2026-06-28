import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#0F0F0F] border-t border-[#2E2E2E] pt-16 pb-8">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="font-headline text-3xl tracking-wider text-[#C9A84C] block mb-6">
              EUROSTORE
            </Link>
            <p className="text-[#9CA3AF] text-sm leading-relaxed max-w-sm">
              أزياء أوروبية راقية تصلك إلى سوريا. نقدم تجربة تسوق فريدة ومميزة مع نظام نقاط متكامل وخدمة عملاء استثنائية.
            </p>
          </div>
          
          <div>
            <h4 className="text-[#E2E2E2] font-semibold mb-6 uppercase tracking-wider text-sm">تسوق</h4>
            <ul className="space-y-4">
              <li><Link href="/products" className="text-[#9CA3AF] hover:text-[#C9A84C] text-sm transition-colors">وصل حديثاً</Link></li>
              <li><Link href="/categories" className="text-[#9CA3AF] hover:text-[#C9A84C] text-sm transition-colors">الأقسام</Link></li>
              <li><Link href="/products?sale=true" className="text-[#9CA3AF] hover:text-[#C9A84C] text-sm transition-colors">التخفيضات</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#E2E2E2] font-semibold mb-6 uppercase tracking-wider text-sm">مساعدة</h4>
            <ul className="space-y-4">
              <li><Link href="/faq" className="text-[#9CA3AF] hover:text-[#C9A84C] text-sm transition-colors">الأسئلة الشائعة</Link></li>
              <li><Link href="/exchange" className="text-[#9CA3AF] hover:text-[#C9A84C] text-sm transition-colors">سياسة الاستبدال</Link></li>
              <li><Link href="/contact" className="text-[#9CA3AF] hover:text-[#C9A84C] text-sm transition-colors">اتصل بنا</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2E2E2E] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#9CA3AF] text-xs">
            © {new Date().getFullYear()} EuroStore. جميع الحقوق محفوظة.
          </p>
          <div className="flex gap-4">
            {/* Payment Icons Placeholder */}
            <span className="text-[#9CA3AF] text-xs uppercase tracking-widest border border-[#2E2E2E] px-2 py-1 rounded">COD</span>
            <span className="text-[#9CA3AF] text-xs uppercase tracking-widest border border-[#2E2E2E] px-2 py-1 rounded">SHAM CASH</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
