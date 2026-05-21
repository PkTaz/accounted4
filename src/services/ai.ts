import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/src/lib/supabase';
import type { AiExtractionResult } from '@/src/types/ai';

async function readFunctionError(error: FunctionsHttpError): Promise<string> {
  try {
    const body = await error.context.json();
    if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
      return body.error;
    }
  } catch {
    // ignore parse failures
  }
  return error.message;
}

/**
 * Calls the Supabase Edge Function — OpenAI key stays server-side.
 */
export async function extractReceiptFromImage(imagePath: string): Promise<AiExtractionResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('You must be logged in to scan receipts.');
  }

  const { data, error } = await supabase.functions.invoke('extract-receipt', {
    body: { image_path: imagePath },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const message = await readFunctionError(error);
      throw new Error(message);
    }
    throw new Error(error.message ?? 'AI extraction request failed.');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('AI extraction failed — empty response.');
  }

  if ('error' in data && typeof (data as { error: unknown }).error === 'string') {
    throw new Error((data as { error: string }).error);
  }

  return data as AiExtractionResult;
}
