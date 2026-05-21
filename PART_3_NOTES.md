# Part 3 Notes — Receipts, Storage & Manual Entry

## Before you test — run SQL in Supabase

1. Open **Supabase Dashboard → SQL Editor**
2. Paste and run everything in **`supabase/part3_schema.sql`**
3. Confirm **Storage → receipt-images** bucket exists (private)
4. Restart Expo: `npm run start:clean`

---

## 1. The receipts database table

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key (app generates before upload) |
| `user_id` | uuid | Owner — matches `auth.users.id` |
| `vendor` | text | Store / merchant name |
| `receipt_date` | date | Date on the receipt |
| `total` | numeric | Dollar amount |
| `category` | text | One of 8 approved categories |
| `notes` | text | Optional memo |
| `image_path` | text | Storage path: `user_id/receipt_id/image.jpg` |
| `image_url` | text | Reserved; app uses signed URLs instead for private bucket |
| `ai_confidence` | numeric | Null for manual entry; Part 4 AI will fill this |
| `created_at` | timestamptz | When saved; list sorted newest first |

---

## 2. How RLS protects receipt data

**Row Level Security** runs on every query:

- **SELECT** — only rows where `user_id = auth.uid()`
- **INSERT** — you can only insert with **your** `user_id`
- **UPDATE / DELETE** — only your rows

Even if someone has your anon key, they cannot read another user's receipts without that user's login session.

**Storage policies** mirror this: files must live under `{your_user_id}/...` in the `receipt-images` bucket.

---

## 3. How the manual receipt form works

**Screen:** `ScanReceiptScreen` (nav title: **Add Receipt**)

1. User fills vendor, date, total, category, notes
2. User takes or picks a photo (Expo ImagePicker)
3. **Validation** (`receiptValidation.ts`) checks required fields and numeric total
4. On save → upload image → insert row → navigate to detail

Categories are fixed: Supplies, Meals, Utilities, Equipment, Software, Fuel, Repairs, Other.

---

## 4. How image upload works

**Service:** `src/services/storage.ts`

1. Generate receipt UUID
2. Upload to path: `{user_id}/{receipt_id}/image.jpg`
3. Store **`image_path`** in Postgres (permanent)
4. On display, call **`createSignedUrl`** (expires in 1 hour)

### Public URL vs signed URL

| | Public URL | Signed URL |
|---|------------|------------|
| **Bucket** | Public bucket | Private bucket (what we use) |
| **Access** | Anyone with link | Only while token valid |
| **Good for** | Public assets | Receipt photos — tax-sensitive |
| **Stored in DB?** | Could store permanent URL | Store **path** only; sign when viewing |

We use a **private bucket + signed URLs** so receipt images are not publicly browsable.

---

## 5. How receipt saving works

**Service:** `src/services/receipts.ts` → `createReceipt()`

```
Validate form → randomUUID() → upload image → INSERT into receipts → navigate to Detail
```

Insert includes `user_id` from the logged-in session. RLS `WITH CHECK` ensures it matches `auth.uid()`.

---

## 6. How receipt fetching works

- **List:** `fetchReceipts()` — `select *` ordered by `created_at desc`
- **Detail:** `fetchReceiptById(id)` — single row by id (RLS still applies)
- **Refresh:** list reloads when screen is focused (`useFocusEffect`) and on pull-to-refresh
- Each row with `image_path` gets a fresh signed URL attached as `image_url` for display

---

## 7. How search works

**Local only** (no extra Supabase query):

- Search box on receipt list
- Filters loaded receipts where **vendor** or **category** contains the query (case-insensitive)
- Part 4+ could move this to Postgres `ilike` for large lists

---

## 8. Before Part 4 (AI)

You should be able to:

- [ ] Run `supabase/part3_schema.sql` successfully
- [ ] Add a receipt with photo on your phone
- [ ] See it in the list (newest first)
- [ ] Open detail and see the image
- [ ] Search by vendor or category
- [ ] Understand why `image_path` is saved but `image_url` is generated at read time

**Part 4 will add:** camera → backend AI → pre-fill **ReviewReceiptScreen** → save (reusing the same table and storage).

**Not in Part 3:** AI extraction, CSV export, edit/delete receipts (can add later).

---

## New / updated files

| File | Role |
|------|------|
| `supabase/part3_schema.sql` | Table, RLS, storage policies |
| `src/services/receipts.ts` | CRUD + search helper |
| `src/services/storage.ts` | Upload + signed URLs |
| `src/constants/categories.ts` | Approved categories |
| `src/utils/receiptValidation.ts` | Form validation |
| `src/types/receipt.ts` | Updated types |
| `src/screens/ScanReceiptScreen.tsx` | Manual add form |
| `src/screens/ReceiptListScreen.tsx` | Real data + search |
| `src/screens/ReceiptDetailScreen.tsx` | Real detail + image |

Removed: `src/data/mockReceipts.ts`
