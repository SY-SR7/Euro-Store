export function orderStatusLabel(status: string, isAr: boolean): string {
  const labels: Record<string, [string, string]> = {
    pending: ['قيد الانتظار', 'Pending'],
    confirmed: ['تم التأكيد', 'Confirmed'],
    processing: ['قيد التجهيز', 'Processing'],
    picked_up: ['تم الاستلام للتوصيل', 'Picked up'],
    shipped: ['تم الشحن', 'Shipped'],
    delivered: ['تم التسليم', 'Delivered'],
    completed: ['مكتمل', 'Completed'],
    rejected: ['مرفوض', 'Rejected'],
    cancelled: ['ملغي', 'Cancelled'],
  };
  const label = labels[status];
  return label ? label[isAr ? 0 : 1] : status;
}
