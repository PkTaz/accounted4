import { RECEIPT_CATEGORIES } from '@/src/constants/categories';
import type { AiExtractionResult } from '@/src/types/ai';
import type { ManualReceiptForm } from '@/src/types/receipt';

export function aiExtractionToForm(extraction: AiExtractionResult): ManualReceiptForm {
  return {
    vendor: extraction.vendor ?? '',
    receipt_date: extraction.receipt_date ?? '',
    total: extraction.total != null ? String(extraction.total) : '',
    category: extraction.category ?? '',
    notes: extraction.notes ?? '',
  };
}

export function isLowConfidence(confidence: number): boolean {
  return confidence > 0 && confidence < 0.75;
}

/** Enough fields to auto-advance from live camera to review. */
export function isExtractionReadyForReview(extraction: AiExtractionResult): boolean {
  return (
    !!extraction.vendor?.trim() &&
    extraction.total != null &&
    extraction.total > 0 &&
    !!extraction.receipt_date &&
    !!extraction.category &&
    extraction.ai_confidence >= 0.65
  );
}

export function normalizeAiCategory(category: string | null): string {
  if (!category) return '';
  const match = RECEIPT_CATEGORIES.find((c) => c.toLowerCase() === category.toLowerCase());
  return match ?? '';
}
