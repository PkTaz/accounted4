import { supabase } from '@/src/lib/supabase';
import { getSignedImageUrl } from '@/src/services/storage';
import type { CreateReceiptInput, Receipt, ReceiptRow } from '@/src/types/receipt';

function mapRow(row: ReceiptRow): Receipt {
  return {
    ...row,
    total: Number(row.total),
  };
}

/** Attach a fresh signed URL when image_path exists (private bucket). */
async function withDisplayImageUrl(receipt: Receipt): Promise<Receipt> {
  if (!receipt.image_path) return receipt;

  const signedUrl = await getSignedImageUrl(receipt.image_path);
  return {
    ...receipt,
    image_url: signedUrl,
  };
}

export async function fetchReceipts(): Promise<Receipt[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as ReceiptRow[];
  return Promise.all(rows.map((row) => withDisplayImageUrl(mapRow(row))));
}

export async function fetchReceiptById(id: string): Promise<Receipt | null> {
  const { data, error } = await supabase.from('receipts').select('*').eq('id', id).maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return withDisplayImageUrl(mapRow(data as ReceiptRow));
}

export async function createReceipt(
  userId: string,
  input: CreateReceiptInput
): Promise<Receipt> {
  const { data, error } = await supabase
    .from('receipts')
    .insert({
      id: input.id,
      user_id: userId,
      vendor: input.vendor.trim(),
      receipt_date: input.receipt_date,
      total: input.total,
      category: input.category,
      notes: input.notes?.trim() || null,
      image_path: input.image_path ?? null,
      image_url: null,
      ai_confidence: input.ai_confidence ?? null,
    })
    .select('*')
    .single();

  if (error) throw error;

  return withDisplayImageUrl(mapRow(data as ReceiptRow));
}

export function searchReceipts(receipts: Receipt[], query: string): Receipt[] {
  const q = query.trim().toLowerCase();
  if (!q) return receipts;

  return receipts.filter(
    (r) => r.vendor.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
  );
}
