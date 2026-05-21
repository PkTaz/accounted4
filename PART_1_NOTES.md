# Part 1 Notes — Receipt Helper Foundation

## 1. What files were created

### Entry & navigation
| File | Purpose |
|------|---------|
| `index.ts` | Registers `App` as the root component (replaces Expo Router entry) |
| `App.tsx` | Wraps the app in `NavigationContainer` and `RootNavigator` |
| `src/navigation/types.ts` | TypeScript types for screen names and route params |
| `src/navigation/RootNavigator.tsx` | Stack navigator wiring all six screens |

### Screens (`src/screens/`)
| File | Purpose |
|------|---------|
| `LoginScreen.tsx` | Placeholder login; button goes to receipt list |
| `ReceiptListScreen.tsx` | Lists mock receipts; buttons to scan, export, or open detail |
| `ScanReceiptScreen.tsx` | Placeholder for camera/scan; button goes to review |
| `ReviewReceiptScreen.tsx` | Placeholder for editing extracted data; button goes to detail |
| `ReceiptDetailScreen.tsx` | Shows one receipt; button back to list |
| `ExportScreen.tsx` | Placeholder for export; button back to list |

### Shared code
| File | Purpose |
|------|---------|
| `src/types/receipt.ts` | `Receipt` TypeScript type |
| `src/data/mockReceipts.ts` | Sample receipts for UI testing |
| `src/utils/formatters.ts` | `formatCurrency`, `formatDate` helpers |
| `src/components/AppButton.tsx` | Reusable primary button |

### Docs
| File | Purpose |
|------|---------|
| `PART_1_NOTES.md` | This file |

**Note:** The old Expo Router `app/`, `components/`, and `constants/` template folders were removed to avoid TypeScript/IDE errors.

---

## 2. What each screen does

| Screen | What it shows | Where buttons go |
|--------|----------------|------------------|
| **Login** | App title + “no auth yet” message | → Receipt List |
| **Receipt List** | FlatList of 3 mock receipts | Tap row → Detail; “Scan” → Scan; “Export” → Export |
| **Scan Receipt** | Dashed box (camera placeholder) | → Review (uses mock receipt id `1`) |
| **Review Receipt** | Read-only mock fields | → Receipt Detail |
| **Receipt Detail** | Full view of one receipt | → Receipt List |
| **Export** | Export placeholder | → Receipt List |

---

## 3. How navigation works

- **Library:** `@react-navigation/native` + `@react-navigation/native-stack`
- **Pattern:** One stack navigator; all screens sit on the same stack.
- **Initial route:** `Login`
- **Route params:** `ReviewReceipt` and `ReceiptDetail` receive `{ receiptId: string }` so the correct mock receipt can be loaded.
- **Flow diagram:**

```
Login
  └─► Receipt List ──┬─► Scan ──► Review ──► Detail
                     ├─► Export
                     └─► Detail (tap a row)
```

- **Types:** `RootStackParamList` in `src/navigation/types.ts` keeps `navigation.navigate(...)` type-safe.
- **Headers:** Native stack shows a back button automatically when you push a new screen.

---

## 4. What the `Receipt` type is for

Defined in `src/types/receipt.ts`:

```ts
export type Receipt = {
  id: string;
  merchant: string;
  amount: number;
  date: string;      // ISO date string, e.g. "2026-05-10"
  category: string;
  notes?: string;
};
```

**Purpose:**
- Describes the shape of a receipt everywhere in the app (list, review, detail).
- Part 2 will map Supabase database rows and AI extraction results to this same type.
- Mock data in `src/data/mockReceipts.ts` already uses this type so UI code matches future real data.

---

## 5. What to understand before Part 2

1. **Navigation is decoupled from data** — Screens only receive `receiptId` and load from mock helpers today; later you’ll load from Supabase by id.
2. **Login is fake** — “Continue” skips straight to the list. Part 2 adds real Supabase Auth and route guards.
3. **Scan / Review / Export are shells** — UI flow exists; camera, AI, and file export are not implemented.
4. **Single client pattern (from earlier)** — When you add Supabase back, keep one `lib/supabase.ts` and import it from screens; don’t call `createClient` per screen.
5. **Run the app:** `npx expo start` then press `w` for web (or simulator / TestFlight for SDK 55 on device).

**Part 2 will likely add:** Auth, protected routes, Supabase tables + RLS, replacing `mockReceipts` with real queries, then scan/upload/AI.
