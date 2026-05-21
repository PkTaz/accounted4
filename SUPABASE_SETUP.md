# Supabase Setup — Receipt Helper

## Part 4: Deploy AI Edge Function

```bash
supabase secrets set OPENAI_API_KEY=sk-your-key
supabase functions deploy extract-receipt
```

See **`PART_4_NOTES.md`** and **`README.md`** for full setup.

---

## Part 3: Database & storage (run if not done)

Run **`supabase/part3_schema.sql`** in the Supabase SQL Editor. It creates:

- `public.receipts` table
- Row Level Security policies
- Private `receipt-images` storage bucket + policies

See **`PART_3_NOTES.md`** for how the app uses this schema.

---

## Auth setup (Part 2)

1. [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Authentication** → **Providers** → **Email** → enable
3. For local testing, turn **Confirm email** off to avoid rate limits
4. Copy **Project URL** and **anon public** key into `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Restart Expo after changing `.env`.

---

## Keys: what is safe in the mobile app?

| Key | In the app? | Why |
|-----|-------------|-----|
| **anon (public)** | Yes | Designed for clients. Access limited by **RLS** + auth session. |
| **service_role** | **Never** | Bypasses RLS — server-only. |
| **OpenAI / AI keys** | **Never** | Backend only (Part 4+). |

---

## Public URL vs signed URL (receipt images)

- **Public bucket + public URL:** permanent link anyone can open. Simple but receipts are exposed if the URL leaks.
- **Private bucket + signed URL:** temporary link (e.g. 1 hour). Path stored in DB; app requests a fresh signed URL when viewing. **We use this.**

---

## Part 4 reminder

- `ai_confidence` column is ready but unused until AI scanning in Part 4.
- `ReviewReceiptScreen` is a placeholder for AI review flow.
