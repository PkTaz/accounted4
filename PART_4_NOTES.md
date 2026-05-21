# Part 4 Notes — AI Extraction, Review & CSV Export

## Before you test AI

Deploy the Edge Function (one-time):

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set OPENAI_API_KEY=sk-your-key-here
supabase functions deploy extract-receipt
```

Without this, **Scan with AI** will fail — use **Enter Manually** until deployed.

---

## 1. How the AI endpoint works

**Location:** `supabase/functions/extract-receipt/index.ts`

```
App uploads image → calls Edge Function with JWT + image_path
  → Function validates user owns that path
  → Downloads image (service role)
  → Sends image to OpenAI Vision (gpt-4o-mini, JSON mode)
  → Validates JSON shape + categories + dates
  → Returns structured fields to app
```

The app calls it via `src/services/ai.ts` → `supabase.functions.invoke('extract-receipt')`.

**Important:** The mobile app never talks to OpenAI directly.

---

## 2. Why the OpenAI key is secure

| Location | OpenAI key? |
|----------|-------------|
| Mobile app / `.env` | **No** |
| Git repo | **No** |
| Edge Function secrets | **Yes** |

The Edge Function runs on Supabase's servers. Only authenticated users can call it, and they can only read images under `{their_user_id}/...`.

Even if someone decompiles the app, they get the **anon** key — not OpenAI.

---

## 3. How AI data gets to the review screen

1. **ScanReceiptScreen** — user picks photo
2. Image uploaded to `{user_id}/{draft_id}/image.jpg`
3. `extractReceiptFromImage(imagePath)` calls Edge Function
4. Navigate to **ReviewReceiptScreen** with:
   - `draftReceiptId`, `imagePath`, `localImageUri`
   - `extraction` — AI JSON (vendor, date, total, category, notes, ai_confidence)

If AI fails → user taps **Enter Manually** → same review screen with empty fields.

---

## 4. Why the user reviews before saving

**Requirement:** AI must never auto-save.

- AI can misread amounts, dates, or categories
- User is legally responsible for tax records
- Review screen lets them fix everything
- **Save** only runs after explicit tap on Review screen

This is a product trust + compliance pattern: **AI suggests, human confirms.**

---

## 5. How CSV export works

**Screen:** `ExportScreen`

1. `fetchReceipts()` — all user receipts from Supabase
2. `receiptsToCsv()` — builds CSV string with columns:
   - Date, Vendor, Category, Total, Notes, Receipt Image Path
3. Writes to cache via `expo-file-system`
4. Opens share sheet via `expo-sharing` (AirDrop, Files, email, etc.)

We export **image path** (permanent) not signed URL (expires).

---

## 6. How to test the full app

### Auth
- [ ] Sign up, log in, close app, reopen — still logged in
- [ ] Log out

### AI scan
- [ ] Scan Receipt → take photo → Scan with AI
- [ ] Review screen prefilled → edit a field → Save
- [ ] Detail shows image + ai_confidence (if AI was used)

### Manual fallback
- [ ] Scan Receipt → Enter Manually → fill form → Save

### Low confidence
- [ ] Blurry receipt → yellow warning if confidence < 75%

### List & search
- [ ] Newest receipts first
- [ ] Search vendor/category

### Export
- [ ] Export → CSV → share sheet opens

### Errors
- [ ] AI without deployed function → clear error + manual fallback
- [ ] Empty export → "No receipts to export"

---

## 7. Interview talking points

Be able to explain:

1. **Why anon key in the app is OK** — RLS limits data per user; service role never in client
2. **Why OpenAI is server-side** — secret protection + you can swap models / add rate limits
3. **RLS on receipts + storage** — `auth.uid() = user_id` and folder prefix checks
4. **Public vs signed URLs** — private bucket + signed URLs for receipt photos
5. **Human-in-the-loop AI** — extract → review → save; `ai_confidence` stored for audit
6. **Edge Function auth** — JWT validated; image_path must start with user's id
7. **CSV export** — client-side generation from fetched data; paths for accountant reference

---

## New / updated files (Part 4)

| File | Role |
|------|------|
| `supabase/functions/extract-receipt/index.ts` | AI Edge Function |
| `supabase/config.toml` | Function config (`verify_jwt = true`) |
| `src/services/ai.ts` | App → Edge Function client |
| `src/types/ai.ts` | Extraction types |
| `src/components/ReceiptFormFields.tsx` | Shared review form UI |
| `src/utils/aiHelpers.ts` | Map AI → form fields |
| `src/utils/csvExport.ts` | CSV builder |
| `src/screens/ScanReceiptScreen.tsx` | Photo + AI / manual |
| `src/screens/ReviewReceiptScreen.tsx` | Edit + save |
| `src/screens/ExportScreen.tsx` | CSV export |
| `README.md` | Full setup guide |

---

## What Part 4 did NOT add

- Automatic AI save
- OpenAI key in mobile app
- PDF export
- Edit/delete existing receipts (future enhancement)
