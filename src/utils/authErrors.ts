import type { AuthError } from '@supabase/supabase-js';

export function getAuthErrorMessage(error: unknown): string {
  if (!error) return 'Something went wrong. Please try again.';

  const authError = error as AuthError;
  if (authError.message) {
    const msg = authError.message.toLowerCase();
    if (msg.includes('invalid login credentials')) {
      return 'Incorrect email or password.';
    }
    if (msg.includes('rate limit') || msg.includes('rate_limit')) {
      return 'Too many emails sent. Wait about an hour, or turn off Confirm email in Supabase for testing.';
    }
    return authError.message;
  }

  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
