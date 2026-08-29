export type OfflineLoyaltyResult = {
  operation_id: string;
  operation_type: 'earn' | 'redeem';
  points: number;
  syp_value: number;
  balance_after: number;
  replayed: boolean;
};

export function offlineLoyaltyError(message: string): { error: string; status: number } {
  if (message.includes('helper_not_active')) return { error: 'حساب الموظف غير نشط', status: 403 };
  if (message.includes('customer_not_found')) return { error: 'العميل غير موجود', status: 404 };
  if (message.includes('customer_blocked')) return { error: 'الحساب موقوف', status: 403 };
  if (message.includes('invoice_too_small')) return { error: 'المبلغ غير كافٍ لكسب نقاط', status: 400 };
  if (message.includes('below_minimum_redemption')) return { error: 'عدد النقاط أقل من الحد الأدنى للاسترداد', status: 400 };
  if (message.includes('insufficient_points')) return { error: 'رصيد العميل غير كافٍ', status: 400 };
  if (message.includes('redemption_percentage_exceeded')) return { error: 'قيمة الخصم تتجاوز النسبة المسموحة من الفاتورة', status: 400 };
  if (message.includes('idempotency_key_reused')) return { error: 'تعارض في معرّف العملية', status: 409 };
  if (message.includes('invalid_')) return { error: 'بيانات غير صحيحة', status: 400 };
  return { error: 'حدث خطأ في الخادم', status: 500 };
}
