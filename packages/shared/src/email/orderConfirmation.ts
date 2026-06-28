export interface OrderConfirmationItem {
  nameAr?: string;
  nameEn?: string;
  sku?: string;
  quantity: number;
  priceSyp: number;
}

export interface OrderConfirmationInput {
  orderNumber: string;
  customerName: string;
  totalSyp: number;
  shippingSyp: number;
  governorateName: string;
  items: OrderConfirmationItem[];
}

function formatSyp(value: number): string {
  return `${new Intl.NumberFormat('ar-SY').format(value)} ل.س`;
}

function esc(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function buildOrderConfirmationHtml(input: OrderConfirmationInput): string {
  const rows = input.items
    .map((item) => {
      const name = item.nameAr ?? item.nameEn ?? item.sku ?? 'منتج';
      return `<tr><td>${esc(name)}</td><td>${esc(item.sku)}</td><td>${item.quantity}</td><td>${formatSyp(item.priceSyp)}</td></tr>`;
    })
    .join('');

  return `
    <div dir="rtl" style="font-family:Arial,sans-serif">
      <h2>تأكيد الطلب #${esc(input.orderNumber)}</h2>
      <p>مرحباً ${esc(input.customerName)}، تم استلام طلبك.</p>
      <p>المحافظة: ${esc(input.governorateName)}</p>
      <p>الشحن: ${formatSyp(input.shippingSyp)}</p>
      <p><strong>الإجمالي: ${formatSyp(input.totalSyp)}</strong></p>
      <table border="1" cellpadding="8" cellspacing="0">
        <thead><tr><th>المنتج</th><th>SKU</th><th>الكمية</th><th>السعر</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}