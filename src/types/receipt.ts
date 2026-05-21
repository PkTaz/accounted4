/** Database row shape (snake_case matches Supabase) */
export type ReceiptRow = {
  id: string;
  user_id: string;
  vendor: string;
  receipt_date: string;
  total: number;
  category: string;
  notes: string | null;
  image_url: string | null;
  image_path: string | null;
  ai_confidence: number | null;
  created_at: string;
};

export type Receipt = ReceiptRow;

export type CreateReceiptInput = {
  id: string;
  vendor: string;
  receipt_date: string;
  total: number;
  category: string;
  notes?: string;
  image_path?: string | null;
  image_url?: string | null;
  ai_confidence?: number | null;
};

export type ManualReceiptForm = {
  vendor: string;
  receipt_date: string;
  total: string;
  category: string;
  notes: string;
};
