# Part 2 Notes — Supabase Auth

## What was added

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client + AsyncStorage session persistence |
| `src/contexts/AuthContext.tsx` | Session state, sign in/up/out, auth listener |
| `src/utils/authErrors.ts` | User-friendly auth error messages |
| `src/components/LoadingScreen.tsx` | Shown while restoring session on app open |
| `src/components/AppTextInput.tsx` | Email/password fields on login |
| `src/screens/LoginScreen.tsx` | Email/password login, sign up, errors, loading |
| `src/screens/ReceiptListScreen.tsx` | Shows user email + log out |
| `src/navigation/RootNavigator.tsx` | Auth-gated screens (login vs app stack) |
| `App.tsx` | Wraps app in `AuthProvider` |
| `SUPABASE_SETUP.md` | Dashboard steps, future SQL, RLS explanation |
| `.env.example` | Required env var names |

Removed: `lib/supabase.ts` (replaced by `src/lib/supabase.ts`).

---

## 1. What Supabase Auth does

Supabase Auth handles **users and sessions**:

- **Sign up** — creates a user (email/password).
- **Sign in** — verifies credentials and issues a **session** (access + refresh tokens).
- **Sign out** — clears the session on the device and server.
- **Session refresh** — keeps the user logged in without re-entering password.

Your app does not store passwords. Supabase hashes them and issues tokens.

---

## 2. How the app knows if someone is logged in

1. On launch, `AuthProvider` calls `supabase.auth.getSession()` and reads the saved session from **AsyncStorage**.
2. It subscribes to `onAuthStateChange` so login/logout/token refresh update React state.
3. `RootNavigator` reads `session` from `useAuth()`:
   - `session === null` → show **Login** only.
   - `session` exists → show **Receipt List** and the rest of the app stack.

No manual `navigation.navigate` after login — the navigator **re-renders** when `session` changes.

---

## 3. What a session is

A **session** is proof that Supabase trusts this device/user right now. It includes:

- **Access token** (JWT) — sent with API requests; short-lived.
- **Refresh token** — used to get a new access token; stored securely via AsyncStorage.
- **User** — id, email, etc.

`session.user.id` is what you will use in Part 3 as `user_id` on receipt rows (matches `auth.uid()` in RLS).

---

## 4. How login / signup / logout work

| Action | Code path | Result |
|--------|-----------|--------|
| **Log in** | `signIn` → `supabase.auth.signInWithPassword` | Session saved; navigator shows app screens |
| **Sign up** | `signUp` → `supabase.auth.signUp` | Session immediately, or “check email” if confirm email is on |
| **Log out** | `signOut` → `supabase.auth.signOut` | Session cleared; navigator shows Login |

Errors from Supabase are caught in the screen and shown in red via `getAuthErrorMessage`.

---

## 5. Where environment variables go

| Variable | Where | Committed? |
|----------|--------|------------|
| `EXPO_PUBLIC_SUPABASE_URL` | `.env` | No — in `.gitignore` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env` | No |

Copy `.env.example` → `.env` and fill in values from **Supabase → Project Settings → API**.

Restart Expo after editing `.env` (`npx expo start -c`).

**Note:** `@supabase/supabase-js` is pinned to `2.105.4` because v2.106+ uses dynamic `import()` that breaks Hermes on React Native until fixed upstream.

**Important:** If you still use `EXPO_PUBLIC_API_URL` for the Supabase URL from earlier experiments, rename it to `EXPO_PUBLIC_SUPABASE_URL` to match the code.

---

## 6. What security rules matter

1. **Only anon key in the app** — never `service_role`, never OpenAI keys.
2. **Anon key is OK in the client** because RLS (Part 3) limits data per user. The key identifies your project; policies limit rows.
3. **`.env` is not committed** — use `.env.example` for teammates.
4. **Passwords** — handled only by Supabase; your app sends them over HTTPS to Auth endpoints, not stored locally.
5. **Part 3 RLS** — run policies in `SUPABASE_SETUP.md` so users can only read/write their own `receipts`.

---

## 7. Before Part 3

You should understand:

- [ ] Log in, sign up, log out on a real device or simulator.
- [ ] Close and reopen the app — you should **stay logged in** (persisted session).
- [ ] What `session.user.id` is for (owner of receipts later).
- [ ] Why mock receipts are still shown (Part 3 replaces `mockReceipts` with Supabase).
- [ ] `SUPABASE_SETUP.md` SQL is **not** run until Part 3.

**Part 3 will add:** `receipts` table, RLS, CRUD from the app, likely Storage for receipt images — not in Part 2.

---

## Quick test checklist

1. Update `.env` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
2. `npx expo start -c`
3. Sign up with a test email.
4. See receipt list with your email at the top.
5. Log out → back to login.
6. Log in again → receipt list.
