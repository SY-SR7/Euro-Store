export function exchangeStatusLabel(status: string, isAr: boolean): string {
  const labels: Record<string, [string, string]> = {
    pending: ['بانتظار المراجعة', 'Pending review'],
    approved: ['تمت الموافقة', 'Approved'],
    rejected: ['مرفوض', 'Rejected'],
    item_received_by_shipping: ['استلمته شركة الشحن', 'Received by shipping'],
    completed: ['مكتمل', 'Completed'],
  };
  const label = labels[status];
  return label ? label[isAr ? 0 : 1] : status;
}
