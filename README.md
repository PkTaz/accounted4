# Receipt Helper (accounted4)

Expo React Native app for small business owners to scan receipts, extract data with AI, review/edit, and organize records for taxes.

## Stack

- **Expo SDK 54** + React Native + TypeScript
- **Supabase** — Auth, Postgres, Storage, Edge Functions
- **OpenAI Vision** — server-side only (Edge Function)

## Setup

### 1. Clone and install

```bash
cd accounted4
npm install
```

### 2. Environment variables (mobile app)

Copy `.env.example` → `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Never commit `.env`. Never put OpenAI keys in the app.

### 3. Supabase database & storage

Run in **SQL Editor**:

1. `supabase/part3_schema.sql` — receipts table, RLS, storage bucket

### 4. Deploy AI Edge Function

Install [Supabase CLI](https://supabase.com/docs/guides/cli), link your project, then:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set OPENAI_API_KEY=sk-your-openai-key
supabase functions deploy extract-receipt
```

The function auto-receives `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

### 5. Auth (Supabase Dashboard)

- **Authentication → Providers → Email** — enabled
- For local testing: turn **Confirm email** off to avoid rate limits

### 6. Run the app

```bash
npm run start:clean
```

Press `w` for web, or scan QR with **Expo Go** (SDK 54).

## App flow

```
Login → Receipt List → Scan (photo + AI) → Review (edit) → Save → Detail
                    → Export CSV
```

- AI **never** saves automatically — user always reviews first
- Receipt images stored in private `receipt-images` bucket

## Project structure

```
src/
  components/     UI building blocks
  constants/      Categories, etc.
  contexts/       Auth
  lib/            Supabase client
  navigation/     React Navigation
  screens/        App screens
  services/       receipts, storage, ai
  types/          TypeScript types
  utils/            formatters, validation, csv
supabase/
  functions/extract-receipt/   AI Edge Function
  part3_schema.sql             Database setup
```

## Testing checklist

- [ ] Sign up / log in / log out / session persists
- [ ] Scan receipt photo → AI fills review screen
- [ ] Edit fields → save → appears in list
- [ ] Low AI confidence shows warning (< 75%)
- [ ] AI failure → Enter Manually still works
- [ ] Receipt detail shows image + data
- [ ] Search by vendor/category
- [ ] Export CSV and share

## Docs

| File | Contents |
|------|----------|
| `PART_1_NOTES.md` | Navigation & structure |
| `PART_2_NOTES.md` | Supabase Auth |
| `PART_3_NOTES.md` | Receipts & storage |
| `PART_4_NOTES.md` | AI, export, interview prep |
| `SUPABASE_SETUP.md` | Dashboard & security |

## Notes

- `@supabase/supabase-js` pinned to **2.105.4** (Hermes compatibility)
- OpenAI key lives only in Edge Function secrets
