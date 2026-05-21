import { supabase } from '@/src/lib/supabase';

export const RECEIPT_IMAGES_BUCKET = 'receipt-images';

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

/** Upload receipt image to user_id/receipt_id/image.ext */
export async function uploadReceiptImage(
  userId: string,
  receiptId: string,
  localUri: string,
  mimeType: string
): Promise<string> {
  const extension = mimeType.includes('png') ? 'png' : 'jpg';
  const path = `${userId}/${receiptId}/image.${extension}`;

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from(RECEIPT_IMAGES_BUCKET).upload(path, arrayBuffer, {
    contentType: mimeType,
    upsert: true,
  });

  if (error) throw error;
  return path;
}

/**
 * Private bucket: generate a temporary signed URL for display.
 * Public URL would work only if the bucket were public (we keep it private).
 */
export async function getSignedImageUrl(imagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(RECEIPT_IMAGES_BUCKET)
    .createSignedUrl(imagePath, SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.warn('Signed URL error:', error.message);
    return null;
  }

  return data.signedUrl;
}

export async function deleteReceiptImage(imagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(RECEIPT_IMAGES_BUCKET).remove([imagePath]);
  if (error) throw error;
}
