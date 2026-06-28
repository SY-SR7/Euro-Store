/**
 * Builds the HTML body for the order-confirmation email.
 * Keep this adapter-agnostic: it just returns a string.
 */
export interface OrderEmailData {
  orderNumber    : string;
  customerName   : string;
  totalSyp       : number;
  shippingSyp    : number;
  governorateName: string;
  items: Array<{
    nameAr  : string;
    sku     : string;
    quantity: number;
    priceSyp: number;
  }>;
}

export function buildOrderConfirmationHtml(data: OrderEmailData): string {
  const itemRows = data.items.map(
    (item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #2E2E2E;">${item.nameAr}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #2E2E2E;font-family:monospace;">${item.sku}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #2E2E2E;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #2E2E2E;color:#C9A84C;">${item.priceSyp.toLocaleString('ar-SY')} ل.س</td>
    </tr>`,
  ).join('');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><title>تأكيد الطلب</title></head>
<body style="margin:0;padding:0;background:#0F0F0F;color:#E2E2E2;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:40px auto;background:#1A1A1A;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#111;padding:28px 32px;border-bottom:1px solid #2E2E2E;">
      <span style="font-size:22px;font-weight:600;color:#C9A84C;">EUROSTORE</span>
    </td></tr>
    <tr><td style="padding:32px;">
      <h1 style="margin:0 0 8px;font-size:20px;">تم استلام طلبك!</h1>
      <p style="color:#9CA3AF;margin:0 0 24px;">شكراً ${data.customerName}، سنتواصل معك قريباً.</p>
      <p style="background:#111;border-radius:6px;padding:12px 16px;display:inline-block;font-size:15px;">
        رقم الطلب: <strong style="color:#C9A84C;">#${data.orderNumber}</strong>
      </p>
      <table width="100%" style="margin-top:24px;border-collapse:collapse;">
        <thead><tr style="background:#111;color:#9CA3AF;font-size:13px;">
          <th style="padding:10px 12px;text-align:right;border-bottom:1px solid #2E2E2E;">المنتج</th>
          <th style="padding:10px 12px;text-align:right;border-bottom:1px solid #2E2E2E;">SKU</th>
          <th style="padding:10px 12px;text-align:center;border-bottom:1px solid #2E2E2E;">الكمية</th>
          <th style="padding:10px 12px;text-align:right;border-bottom:1px solid #2E2E2E;">السعر</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <table style="margin-top:20px;width:100%;">
        <tr><td style="color:#9CA3AF;padding:6px 0;">الشحن إلى ${data.governorateName}</td><td style="text-align:left;color:#E2E2E2;">${data.shippingSyp.toLocaleString('ar-SY')} ل.س</td></tr>
        <tr><td style="font-weight:600;padding:6px 0;font-size:16px;">الإجمالي</td><td style="text-align:left;font-weight:600;color:#C9A84C;font-size:16px;">${data.totalSyp.toLocaleString('ar-SY')} ل.س</td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:20px 32px;background:#111;border-top:1px solid #2E2E2E;text-align:center;font-size:12px;color:#6B7280;">
      يورو ستور · eurostore.com
    </td></tr>
  </table>
</body></html>`;
}