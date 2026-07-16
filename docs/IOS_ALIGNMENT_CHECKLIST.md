# iOS / monorepo alignment checklist (Android)

What the Android app still needs to match the iOS app (`~/Desktop/lifepass-ios`)
and the v1 backend (`~/Desktop/lifepass-monorepo`). Ordered by priority. Audited
2026-07-14 against iOS `f8e8e7e` and monorepo `b361f9f`.

Legend: 🔴 broken/stale · 🟠 parity gap · 🔵 net-new feature · ⚪ polish · ✅ done

---

## 🔴 P1 — Dead direct-Supabase paths (stale/broken on v1)

The v1 backend no longer drives these tables from the client (same rot that hit
bookings/check-in/favourites). Each still queries Supabase directly and must
move to the API.

- [x] **`subscription.ts` → `GET /subscriptions`.** ✅ Done. Migrated to the API
  (iOS `SubscriptionService`); `Subscription` type reshaped to the v1 lifecycle
  shape (no credit/luxury); `useSubscription` simplified; AccountScreen shows
  renews/ends + a past-due indicator instead of the retired luxury chip.
- [x] **`fetchVenueReviews` → `GET /venues/{venueId}/reviews`.** ✅ Done. Was
  dead code (never called → reviews always empty). Now fetched via the API,
  adapted to `VenueReview`, and wired into VenueDetail through a new
  `useVenueReviews` hook.
- [~] **`venues.ts fetchActivities` → walk-in preview `slotActivities`.**
  Partially aligned. BookingFlow now reads the walk-in preview via
  `fetchBookableActivities` to get the activity **provider** (unblocking Abler
  classes). The VenueDetail activity LIST still reads the live `activities`
  table for name/image/duration — kept intentionally so the venue page doesn't
  lose those. Fully replacing the list with `slotActivities` remains optional.

## 🟠 P2 — Booking / check-in parity gaps

- [x] **Pay-and-save-card for WALK-INS.** ✅ Done. `kind: 'walk_in'` session
  (`createWalkInPaymentSession`) wired into CheckInScreen: no-card surcharge
  walk-ins now open the Kling hosted page and complete on confirm, with the
  same outcomes as the booking rail (venue name resolved via fetchVenueById).
- [x] **Abler CLASSES in the booking flow.** ✅ Done. BookingFlow resolves the
  activity `provider` from the walk-in preview's `slotActivities`
  (`fetchBookableActivities`); Abler activities show a class-list step
  (`fetchClasses` → `GET /activities/{id}/classes`) and book by `eventId`, with
  the same 402 charge-consent. Slot providers are unchanged (default path).
- [x] **Gate-refusal copy.** ✅ Done. `gateRefusalFor()` maps the DomainError
  codes to friendly copy + a "View plans" CTA (booking + check-in).
- [ ] **Booking-preview disclosure (optional).** iOS discloses the charge on the
  Confirm step via `GET /activities/{id}/booking-preview`; Android relies on the
  402 alert. Works today; disclosure-before-confirm is nicer.

## 🔵 P3 — Net-new features absent on Android

- [~] **Co-pay (employer co-pay).** Activation flow DONE: `/company-plans/
  context` + `/activate` (companyPlans.ts, useCompanyPlan), Account banner
  ("{company} covers X, you pay Y/mo" → Accept & pay via the hosted checkout,
  or instant when fully subsidised; blocked-by-personal-sub note). Follow-ups:
  the past-due **dunning retry** (`/company-plans/retry-payment`) and wiring the
  **pendingInvite → Kenni** claim (currently an info banner only).
- [ ] **Check-in proof window.** New monorepo feature (`recent-check-in-banner`,
  5-min "show check-in to staff"). Not on Android **or** iOS-mobile yet — parity
  candidate, not urgent. No API change.

## ⚪ P4 — Copy / polish

- [ ] **Reason-aware consent copy.** iOS distinguishes boutique-overflow /
  boutique-access / premium / out-of-visits wording (`f8e8e7e`). Android shows a
  generic "isn't included in your plan — Pay X kr", which is reason-agnostic and
  not wrong — low priority.

## ✅ Done this session

- Booking flow → v1 API (calendar, availability, 402 consent, pay-and-save-card
  rail, dead-end inset fix).
- Walk-in check-in → v1 API + venue-QR App Links + shared QR parser.
- Removed remaining visible credit displays; fixed dead venue scan button.
- Explore Boutique chip + chip-row clipping fix.
- Max plan feature copy (dropped the retired "member rate on premium surcharges"
  promise — iOS `f8e8e7e` parity).

## Infra (see `BACKEND_INFRA_CHECKLIST.md`)

- App Links `assetlinks.json` needs the release SHA-256 on the web deployment.
- Kling products must be active for each sold slug.
