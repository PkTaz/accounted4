import type { Receipt } from '@/src/types/receipt';
import { formatCurrency, formatDate } from '@/src/utils/formatters';

function escapeCsvField(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function receiptsToCsv(receipts: Receipt[]): string {
  const header = ['Date', 'Vendor', 'Category', 'Total', 'Notes', 'Receipt Image Path'].join(',');

  const rows = receipts.map((r) =>
    [
      escapeCsvField(formatDate(r.receipt_date)),
      escapeCsvField(r.vendor),
      escapeCsvField(r.category),
      escapeCsvField(formatCurrency(r.total)),
      escapeCsvField(r.notes ?? ''),
      escapeCsvField(r.image_path ?? ''),
    ].join(',')
  );

  return [header, ...rows].join('\n');
}
