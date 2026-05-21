import { RECEIPT_CATEGORIES, type ReceiptCategory } from '@/src/constants/categories';
import type { ManualReceiptForm } from '@/src/types/receipt';

export type ReceiptFormErrors = Partial<Record<keyof ManualReceiptForm | 'image', string>>;

export function parseTotal(value: string): number | null {
  const cleaned = value.replace(/[$,\s]/g, '');
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00');
  return !Number.isNaN(date.getTime());
}

export function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function validateReceiptForm(
  form: ManualReceiptForm,
  hasImage: boolean
): ReceiptFormErrors {
  const errors: ReceiptFormErrors = {};

  if (!form.vendor.trim()) {
    errors.vendor = 'Vendor is required.';
  }

  if (!form.receipt_date.trim()) {
    errors.receipt_date = 'Date is required.';
  } else if (!isValidDateString(form.receipt_date.trim())) {
    errors.receipt_date = 'Use YYYY-MM-DD format.';
  }

  const total = parseTotal(form.total);
  if (total === null) {
    errors.total = 'Enter a valid amount (e.g. 42.50).';
  }

  if (!form.category.trim()) {
    errors.category = 'Pick a category.';
  } else if (!RECEIPT_CATEGORIES.includes(form.category as ReceiptCategory)) {
    errors.category = 'Invalid category.';
  }

  if (!hasImage) {
    errors.image = 'Add a receipt photo.';
  }

  return errors;
}

export function hasFormErrors(errors: ReceiptFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
