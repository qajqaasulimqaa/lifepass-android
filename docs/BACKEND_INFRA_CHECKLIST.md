# Backend / infra checklist (Android v1)

Provider- and deployment-side items that the Android app **cannot fix in code** —
each one blocks or degrades a client feature until it's configured. None of
these live in this repo; they're in Supabase, Kling, Kenni, or the web
(`lifepass-monorepo`) deployment. Most affect **iOS identically**.

Status legend: ⛔ blocks a feature · ⚠️ degraded / workaround in place · ✅ verified working

---

## ⛔ Kenni redirect URI not registered — blocks monthly-plan checkout

**Symptom:** "Verify with Kenni.is" → Kenni returns `400 — redirect uri did not
match any of the client's registered redirect uris`.

**Cause:** the server sends `redirect_uri = lifepass://kenni-callback` (default
of `getKenniNativeRedirectUri()`, override `KENNI_NATIVE_REDIRECT_URI`), and
that URI is **not registered** in the Kenni OIDC client.

**Fix (Kenni dashboard / backend):** register `lifepass://kenni-callback` as an
allowed redirect URI on the LifePass Kenni client — *or* set
`KENNI_NATIVE_REDIRECT_URI` on the web deployment to a value that already is,
and tell mobile so the app's callback capture matches.

**Notes:** iOS hits the identical error; iOS `MIGRATION_GAPS.md` lists Kenni as
"Pinned — not directly consumable through the API yet." The Android Kenni flow
(`src/supabase/services/kenni.ts`, `KenniVerificationModal`) is complete and
will work the moment this is registered. Subscriptions stay blocked until then;
**visitor passes don't need Kenni and work today.**

---

## ⚠️ Android App Links not enabled — email link can't reopen the app

**Symptom:** the email-confirmation link redirected to `lifepass://auth/callback`
and landed on `about:blank` on Android (browsers won't follow a server redirect
into a custom scheme).

**Workaround in place:** signup now redirects email confirmation to
`https://www.lifepass.is` (real page, no blank), and the user returns to the app
and signs in (`EMAIL_CONFIRM_REDIRECT` in `src/supabase/services/auth.ts`).

**Proper fix (web + app):**
1. Web: set `ANDROID_PACKAGE_NAME=is.lifepass.android` and
   `ANDROID_SHA256_CERT_FINGERPRINTS=<release signing SHA-256>` so
   `/.well-known/assetlinks.json` serves (already coded, gated on these env
   vars — see monorepo `docs/08_QR_CODE.md`). Get the fingerprint from
   `eas credentials`.
2. App: add an `autoVerify` intent filter for the `https://lifepass.is/...`
   callback path in `app.json`, and point `emailRedirectTo` at that https path.

Once done, the confirmation link opens the app directly (like iOS Universal
Links) and auto-login works.

---

## ✅ Branded auth email (Supabase Send Email hook → Resend)

**Verified:** a live signup returns `confirmation_sent_at`; the hook renders and
Resend sends. Confirmation emails arrive.

**Watch:** delivery is only as good as Resend's domain verification. If some
recipients don't receive email while others do, check the Resend domain is fully
verified (not test-mode, which only delivers to the account owner). Supabase →
Authentication → Logs shows the hook firing; Resend → Emails shows per-recipient
delivery.

---

## ✅ Supabase redirect allow-list

**Verified:** `lifepass://auth/callback` is honored (GoTrue redirects to it) and
`https://www.lifepass.is` is the Site URL (always allowed). Keep
`lifepass://**` and `https://www.lifepass.is` on the allow-list.

---

## ⚠️ Kling products must be active for checkout to resolve

**Why:** checkout refuses any product with no matching **active** Kling product
(`currency = ISK`, correct type) at the expected `Name` — see monorepo
`docs/02_PAYMENTS.md`. If a plan/pass "Continue" fails with
`checkout_product_not_found` / a Kling catalog error, the Kling product isn't set
up.

**Verify:** each slug the app sells has a live Kling product —
`LifePass Base/Plus/Max`, `Gym/Studio/Pool Day Pass`, `Explorer`, `Adventurer`,
`Local` (Kling `Name` is the join key).

---

## ✅ Payment confirm route deployed

`POST /payments/checkout-sessions/confirm` exists on `main` (Kling has no mobile
webhook, so the app calls confirm + polls `GET /payments/status` on return). If
a future deploy drops it, the app degrades gracefully to polling only.
