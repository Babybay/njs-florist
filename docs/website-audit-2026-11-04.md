# NJS Projects website audit and florist research

Date: 4 November 2026. Scope: existing NJS storefront, checkout, pickup scheduling, admin slot management, and calendar exports.

## Result and evidence limits

The existing rose palette, editorial type, real catalog, pickup-only business model, and store configuration were retained. Checkout now connects store selection to date-specific availability instead of presenting every template slot as bookable.

The implementation expresses a coherent florist storefront. The reviewed checkout now follows that system. The Impeccable source detector returned `[]` for the checkout, calendar, admin delivery page, and tracking landing page. This is a mechanical result, not proof of accessibility or transaction correctness.

Public pages were rendered locally with `UI_PREVIEW=1`. The configured development database is unavailable, so real customer orders, authenticated admin editing, database migrations, concurrent database transactions, and Midtrans sandbox settlement were not exercised. Competitor research used their public sites and published help pages; no purchases were placed and no proprietary implementation was accessed. REA was not installed or exposed in this session; direct public-flow research was used after the user approved researching suitable sites.

## Comparable florist flows

| Reference | Publicly documented behavior | Application to NJS |
| --- | --- | --- |
| Flower Chimp Indonesia | Product and extras, then date/time and gift message, then recipient details and payment. | Put scheduling before contact entry; keep gifting and pickup details distinct. |
| Flower Chimp Malaysia | Different ordering cutoffs by delivery window; pickup, date, and card message are part of ordering. | Make the time window explicit, apply the store's own configured cutoff, and explain unavailable windows. |
| BloomThis | Location selection, date/time selection, unavailable dates, and an editable card message with a 300-character limit. | Connect location to calendar availability; show closed/full dates; provide editable message suggestions and a counter. |
| Interflora | Date and address are prominent eligibility inputs; delivery information explains service availability. | Put the actual pickup store and schedule ahead of payment and confirm the chosen location visibly. |

Sources: [Flower Chimp Indonesia help center](https://www.flowerchimp.co.id/apps/help-center), [Flower Chimp Malaysia help center](https://www.flowerchimp.my/apps/help-center), [BloomThis ordering instructions](https://bloomthis.co/products/monthly-subscription), and [Interflora delivery information](https://www.interflora.co.uk/page/delivery-information). These are observed public policies, not claims that NJS offers those competitors' delivery coverage or hours.

The resulting NJS flow is: **basket → pickup store → available date → available time → collector/sender → optional card and notes → order → payment**. NJS retains its configured pickup stores, hours, capacities, and cutoff; competitor values were not copied into production configuration.

Midtrans supports explicit transaction expiry and a separate page expiry. An explicit start timestamp avoids starting the payment window only when the customer selects a payment method. NJS now sends a 15-minute expiry anchored to order creation. See [Midtrans custom expiry](https://docs.midtrans.com/docs/snap-advanced-feature) and [expiry objects](https://docs.midtrans.com/reference/json-objects).

## Review health

Provisional code/preview assessment, not a Lighthouse score or a WCAG certification:

| Dimension | Score / 4 | Evidence and limits |
| --- | --- | --- |
| Accessibility | 3 | Native labeled radios, live availability/error messages, visible focus, keyboard calendar movement, and repaired skip-link targets. Full screen-reader and automated WCAG audits remain. |
| Performance | 3 | Three bounded schedule queries per request; grouped order counts; composite index migration; canceled superseded requests; no new calendar library. Production CWV and real database query plans remain unmeasured. |
| Theming | 3 | Checkout reuses storefront tokens and fonts. Older admin and ancillary surfaces still mix hard-coded utility colors. |
| Responsive behavior | 3 | Chromium checks at 320, 390, 768, 1024, and 1440 CSS pixels; no checkout horizontal overflow. Synthesized touch and reduced-motion flow passed. Physical devices and other browser engines remain unverified. |
| Implementation integrity | 2 | Date/capacity logic is shared, holds are rechecked under transaction locks, and demo data is development-only. Pre-existing payment, inventory, and guest-access issues below still need dedicated work. |
| **Total** | **14 / 20** | **Good on reviewed UI; release checks and operational gaps remain.** |

## Findings addressed

The original implementation had **8 P1** and **4 P2** issues addressed in this change. No P0 was asserted from the unavailable local database, because that is an environment limitation.

| ID | Severity | Finding and impact | Change and location |
| --- | --- | --- | --- |
| F01 | P1 | Generic checkout slots ignored date-specific closures, capacity overrides, and bookings. Customers discovered problems only after submitting. | New no-cache availability endpoint, shared service, and date-aware calendar/time controls. `src/server/services/pickup-availability.service.ts`, `src/app/api/pickup/availability/route.ts`, `src/components/checkout/pickup-scheduler.tsx`. |
| F02 | P1 | Server-local dates and hours could change the pickup day or cutoff when deployed in UTC. Calendar exports used floating times. | Explicit WITA parsing, formatting, day bounds, cutoff rules, admin date handling, and an ICS timezone definition. `src/lib/pickup-schedule.ts`, `src/lib/order-display.ts`, `src/server/services/delivery.service.ts`, `src/server/services/calendar-feed.service.ts`. |
| F03 | P1 | Unpaid orders did not occupy slot capacity while customers were paying. | Pending orders hold a place for 15 minutes; completed/paid fulfillment states continue to occupy a place. Expired, failed, cancelled, and refunded states do not. Midtrans receives matching expiry parameters. |
| F04 | P1 | Availability was checked outside the order transaction. Simultaneous checkouts could both take the last place, and count-based daily order numbers could collide. | Transaction-scoped Postgres advisory locks for the slot/day and daily number allocation; capacity is checked again after acquiring the slot lock. `src/server/services/checkout.service.ts`. Live contention testing remains required. |
| F05 | P1 | `isSameDayEligible` was displayed on products but not enforced by checkout. | Cart preparation requirements move the earliest UI date to tomorrow and are enforced again on the server, including after waiting for the transaction lock. |
| F06 | P1 | An unused exported Server Action accepted arbitrary checkout input, including cart/user IDs. | Removed `createCheckoutOrderAction`; the form action derives the cart from its session and the user from authentication. `src/server/actions/checkout.actions.ts`. Other guest-access paths still need review as listed below. |
| F07 | P1 | Date/store changes and later availability changes could leave a stale selection. Form inputs were uncontrolled across action failures. | Changing store/date/month clears the slot; focus and timed refresh invalidate full slots; stale responses are canceled. Contact/message values are controlled and retained. A retry path handles unavailable requests. |
| F08 | P1 | The shared skip-navigation link targeted an absent ID on several storefront routes, including checkout and cart. | Added `main-content` targets to the affected store pages. Relates to WCAG 2.4.1. Checkout keyboard movement, labels, and error focus were also improved. |
| F09 | P2 | Admin calendar totals combined stores; changing dates could retain another date's uncontrolled override editor values. | Added store selection with preserved month navigation; keyed override rows by slot/date. `src/app/admin/delivery/page.tsx`, `src/components/admin/slot-calendar.tsx`. |
| F10 | P2 | Reversed/equal slot times and impossible date strings could be accepted; whitespace-only names and unusable phone numbers had weak validation. | Added ordered same-day time windows, strict calendar-date parsing, and bounded/trimmed contact validation. Partial slot edits are validated against the existing record. |
| F11 | P2 | Scheduling, optional messages, and payment details lacked a clear task hierarchy and confirmation. | Numbered ordering sections, selected schedule recap, editable gift-message suggestions, 300-character counter, optional discount disclosure, product thumbnail, and sticky desktop summary. |
| F12 | P2 | Tracking examples used the obsolete `BLM-...` format, conflicting with actual NJS order numbers. | Updated examples and placeholder to the existing `njs-YYYYMMDDnnnn` convention. `src/app/(store)/track/page.tsx`. |

## Remaining findings, prioritized

These are separate existing application concerns discovered during the audit. They are not presented as completed fixes.

1. **[P1] Inventory reservations are not deducted from availability checks.** `src/server/services/stock.service.ts` calculates from `currentQty`, and checkout compares required quantity with physical stock without subtracting other active reservations. Multiple carts or recipes using the same stock can overcommit inventory. Fix with atomic inventory allocation and tests that model shared ingredients and simultaneous orders. The pickup-slot lock protects time-window capacity; it does not solve this inventory problem.
2. **[P1] Guest order access needs a consistent ownership design.** `src/app/(store)/track/[orderNumber]/page.tsx` reveals a recipient's name and full phone number using a predictable sequential number. `src/app/(store)/payment/pending/page.tsx` and `src/app/api/payments/midtrans/create/route.ts` also locate orders by number. Introduce a scoped guest token or verification step and audit every tracking/payment endpoint together. The removed raw checkout action closes only that particular mutation path.
3. **[P1] Payment reconciliation after hold expiry needs dedicated coverage.** `src/server/services/payment.service.ts` can advance an expired order to paid when a delayed successful callback arrives. Expired inventory reservations are skipped by stock commit. Explicit Midtrans expiry reduces the payment window but is not a substitute for late-callback reconciliation. Verify delayed settlement, duplicate/out-of-order notifications, payment-provider failures after order creation, and capacity conflicts using sandbox integration tests.
4. **[P2] Broader form and theme consistency remains.** Admin slot-create controls use placeholders without persistent labels, the custom inquiry date does not constrain past dates, and older pages mix typography and hard-coded colors. Refine these surfaces within the current visual system. The custom inquiry is a consultation request, so do not treat its desired date as a guaranteed booking.

Recommended follow-ups in order: **`$impeccable harden`** for the authenticated/guest and payment flows, **`$impeccable adapt`** for remaining admin form labels and device coverage, **`$impeccable document`** to capture the existing tokens, then **`$impeccable polish`** across ancillary pages. Backend inventory and payment changes need their own integration tests rather than a visual-only pass.

## Validation completed

- `npm run test:pickup`: **11 passing tests** covering timezone independence, midnight/cutoff boundaries, strict dates, leap/year arithmetic, day bounds, elapsed/full/closed slots, payment-hold filtering, override precedence including reopening inactive templates, aggregation of legacy order times, private-note exclusion, slot-window validation, contact validation, and the Midtrans expiry request.
- `npx tsc --noEmit --incremental false`: passed. The production build also compiled and finished TypeScript successfully, then failed prerendering `/` because the configured database is unavailable. A complete production build has **not** passed.
- Prisma schema validation passed using inert local placeholder URLs; no database was contacted or modified.
- Chromium browser scenarios passed: closed-date blocking; full-slot blocking; date/store/month resets; preserved contact inputs; keyboard focus; editable card suggestions and length counter; failed-request retry; refresh invalidating a newly full slot; malformed API requests; disabled preview payment; skip navigation; no checkout runtime errors.
- Chromium layout checks passed at **320, 390, 768, 1024, and 1440px**. Touch evidence is synthesized Chromium touch input, with reduced-motion preference enabled; selecting a slot and switching stores passed.
- Homepage, catalog, preview product, custom request, blog, tracking landing, and empty cart rendered without route error states or horizontal overflow in the desktop smoke pass.
- Impeccable detector returned **zero findings** for the targeted changed UI source files. No claim of complete WCAG conformance is made.
- Firefox could not be tested: the cached browser build is incompatible with the available Playwright protocol. Chromium results are not reported as cross-browser coverage.
- Local screenshots and browser logs are saved under ignored `.audit/`; these include `checkout-desktop-final.png` and `checkout-mobile-final.png`.

## Deployment and integration checks

Apply `20261104000000_pickup_availability_index` with the normal Prisma migration deployment. The migration adds `Order(storeId, deliveryDate, deliverySlotId)` for bounded store/date schedule queries. It has not been applied to a database here.

With a disposable connected test database, verify: two simultaneous buyers for capacity one; pending-hold expiry at 15 minutes; full/closed/reopened overrides in each store; advance-preparation products; WITA midnight and cutoff while the server runs in UTC; admin editing; and ICS import in the target calendar client. Confirm the Midtrans sandbox applies order-anchored expiry and reconcile delayed successful notifications before production rollout.
