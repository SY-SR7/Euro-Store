import { existsSync } from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

type InvoiceItem = {
  quantity: number;
  unit_price_syp: number;
  total_price_syp: number;
  product_snapshot: Record<string, unknown> | null;
};

export type InvoiceOrder = {
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal_syp: number;
  discount_syp: number;
  loyalty_discount_syp: number;
  shipping_syp: number;
  total_syp: number;
  loyalty_points_used: number;
  loyalty_points_earned: number;
  notes: string | null;
  created_at: string;
  address_snapshot: Record<string, unknown> | null;
  order_items: InvoiceItem[];
};

function fontPath(): string {
  const candidates = [
    path.join(process.cwd(), 'packages', 'database', 'assets', 'NotoSansArabic.ttf'),
    path.join(process.cwd(), 'assets', 'NotoSansArabic.ttf'),
    path.join(process.cwd(), '..', '..', 'packages', 'database', 'assets', 'NotoSansArabic.ttf'),
    path.join(process.cwd(), 'public', 'fonts', 'NotoSansArabic.ttf'),
    path.join(process.cwd(), 'apps', 'web', 'public', 'fonts', 'NotoSansArabic.ttf'),
  ];
  const found = candidates.find(existsSync);
  if (!found) throw new Error('invoice_font_missing');
  return found;
}

function clean(value: unknown): string {
  return String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
}

function money(value: unknown): string {
  return `${Number(value || 0).toLocaleString('ar-SY')} ل.س`;
}

function paymentLabel(value: string): string {
  return value === 'sham_cash' ? 'شام كاش' : 'الدفع عند الاستلام';
}

function statusLabel(value: string): string {
  return ({
    pending: 'قيد الانتظار', confirmed: 'مؤكد', processing: 'قيد التجهيز',
    picked_up: 'استلمته شركة الشحن', shipped: 'تم الشحن', delivered: 'تم التسليم',
    completed: 'مكتمل', cancelled: 'ملغي', rejected: 'مرفوض',
  } as Record<string, string>)[value] ?? clean(value);
}

function paymentStatusLabel(value: string): string {
  return ({ pending: 'بانتظار الدفع', paid: 'مدفوع', failed: 'فشل الدفع', refunded: 'مسترد' } as Record<string, string>)[value] ?? clean(value);
}

export async function createInvoicePdf(order: InvoiceOrder): Promise<Uint8Array> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 42,
    bufferPages: true,
    info: { Title: `Invoice ${order.order_number}`, Author: 'Euro Store' },
  });
  const chunks: Uint8Array[] = [];
  doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
  const completed = new Promise<Uint8Array>((resolve, reject) => {
    doc.on('end', () => {
      const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const output = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) {
        output.set(chunk, offset);
        offset += chunk.length;
      }
      resolve(output);
    });
    doc.on('error', reject);
  });

  doc.registerFont('Invoice', fontPath()).font('Invoice');
  const left = 42;
  const width = 511;

  const line = (label: string, value: unknown) => {
    doc.fontSize(9).fillColor('#1F1B16').text(
      `${label}: ${clean(value) || '-'}`,
      left,
      doc.y,
      { width, align: 'right' },
    );
    doc.moveDown(0.25);
  };

  const pageHeader = () => {
    doc.fontSize(22).fillColor('#1F1B16').text('Euro Store', left, 42, { width, align: 'left' });
    doc.fontSize(18).fillColor('#766235').text('فاتورة طلب', left, 44, { width, align: 'right' });
    doc.moveTo(left, 78).lineTo(left + width, 78).strokeColor('#B8860B').lineWidth(1.5).stroke();
    doc.y = 94;
  };

  const ensureSpace = (needed: number) => {
    if (doc.y + needed <= 760) return;
    doc.addPage();
    pageHeader();
  };

  pageHeader();
  doc.fontSize(12).fillColor('#1F1B16').text(`رقم الطلب: ${clean(order.order_number)}`, left, doc.y, { width, align: 'right' });
  doc.fontSize(9).fillColor('#5F574A').text(
    `التاريخ: ${new Intl.DateTimeFormat('ar-SY', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Damascus' }).format(new Date(order.created_at))}`,
    left,
    doc.y + 4,
    { width, align: 'right' },
  );
  doc.moveDown(1.2);

  const address = order.address_snapshot ?? {};
  doc.fontSize(13).fillColor('#766235').text('بيانات الطلب والتوصيل', left, doc.y, { width, align: 'right' });
  doc.moveDown(0.5);
  line('الحالة', statusLabel(order.status));
  line('حالة الدفع', paymentStatusLabel(order.payment_status));
  line('طريقة الدفع', paymentLabel(order.payment_method));
  line('الاسم', address.full_name ?? address.name);
  line('الهاتف', address.phone);
  line('العنوان', [address.governorate, address.city, address.street, address.address, address.building, address.floor].filter(Boolean).map(clean).join('، '));
  if (order.notes) line('ملاحظات الطلب', order.notes);

  ensureSpace(90);
  doc.fontSize(13).fillColor('#766235').text('المنتجات', left, doc.y, { width, align: 'right' });
  doc.moveDown(0.5);

  order.order_items.forEach((item, index) => {
    const snapshot = item.product_snapshot ?? {};
    const name = clean(snapshot.name_ar || snapshot.name_en || snapshot.name || snapshot.sku || `منتج ${index + 1}`);
    const variant = [snapshot.size, snapshot.color_ar || snapshot.color_en || snapshot.color, snapshot.sku].filter(Boolean).map(clean).join(' | ');
    ensureSpace(76);
    const rowTop = doc.y;
    doc.fontSize(10).fillColor('#1F1B16').text(`${index + 1}. ${name}`, left + 175, rowTop, { width: 336, align: 'right' });
    if (variant) doc.fontSize(8).fillColor('#8B8172').text(variant, left + 175, doc.y + 2, { width: 336, align: 'right' });
    doc.fontSize(9).fillColor('#5F574A').text(`الكمية: ${item.quantity}`, left, rowTop, { width: 155, align: 'right' });
    doc.text(`سعر الوحدة: ${money(item.unit_price_syp)}`, left, rowTop + 17, { width: 155, align: 'right' });
    doc.fontSize(10).fillColor('#766235').text(`الإجمالي: ${money(item.total_price_syp)}`, left, rowTop + 34, { width: 155, align: 'right' });
    doc.y = Math.max(doc.y, rowTop + 58);
    doc.moveTo(left, doc.y).lineTo(left + width, doc.y).strokeColor('#E5E0D8').lineWidth(0.6).stroke();
    doc.moveDown(0.6);
  });

  ensureSpace(150);
  doc.moveDown(0.4);
  const totals: Array<[string, number]> = [
    ['المجموع الفرعي', order.subtotal_syp],
    ['خصم الرمز', -Number(order.discount_syp || 0)],
    ['خصم نقاط الولاء', -Number(order.loyalty_discount_syp || 0)],
    ['التوصيل', order.shipping_syp],
  ];
  for (const [label, amount] of totals) {
    if (amount === 0 && label.includes('خصم')) continue;
    doc.fontSize(10).fillColor('#5F574A').text(`${label}: ${money(amount)}`, left, doc.y, { width, align: 'right' });
  }
  doc.moveDown(0.25).fontSize(14).fillColor('#766235').text(`الإجمالي النهائي: ${money(order.total_syp)}`, left, doc.y, { width, align: 'right' });
  if (order.loyalty_points_used || order.loyalty_points_earned) {
    doc.moveDown(0.3).fontSize(9).fillColor('#5F574A').text(
      `نقاط مستخدمة: ${order.loyalty_points_used || 0} | نقاط مكتسبة: ${order.loyalty_points_earned || 0}`,
      left,
      doc.y,
      { width, align: 'right' },
    );
  }

  const pages = doc.bufferedPageRange();
  for (let page = 0; page < pages.count; page += 1) {
    doc.switchToPage(page);
    doc.page.margins.bottom = 0;
    doc.font('Invoice').fontSize(8).fillColor('#8B8172').text(
      `Euro Store | ${page + 1} / ${pages.count}`,
      left,
      812,
      { width, align: 'center', lineBreak: false },
    );
  }

  doc.end();
  return completed;
}
