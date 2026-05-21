export type AiExtractionResult = {
  vendor: string | null;
  receipt_date: string | null;
  total: number | null;
  category: string | null;
  notes: string | null;
  ai_confidence: number;
};

export const EMPTY_AI_EXTRACTION: AiExtractionResult = {
  vendor: null,
  receipt_date: null,
  total: null,
  category: null,
  notes: null,
  ai_confidence: 0,
};

export const AI_CONFIDENCE_WARNING_THRESHOLD = 0.75;
