export const RECEIPT_CATEGORIES = [
  'Supplies',
  'Meals',
  'Utilities',
  'Equipment',
  'Software',
  'Fuel',
  'Repairs',
  'Other',
] as const;

export type ReceiptCategory = (typeof RECEIPT_CATEGORIES)[number];
