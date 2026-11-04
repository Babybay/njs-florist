# Admin workflow audit — NJS Projects

Date: 4 November 2026. This extends the [storefront audit](website-audit-2026-11-04.md).

## Result

The admin now has reliable multi-status order filtering, separate pickup and order-creation dates, full-day dashboard counts, a direct pickup queue, and store-specific calendar operations. Calendar edits distinguish recurring templates from date overrides and keep existing bookings visible when a day is closed. The existing admin structure was retained; the navigation, forms, and calendar were refined for day-to-day work.

The read-only local preview is `/preview/admin` when `UI_PREVIEW=1` in development. It renders the actual shared calendar, slot editor, settings form, mobile navigation, and pickup summary using labeled sample data. Save and bulk-mutation controls are disabled. The real `/admin` remains protected by its existing authentication and role checks. The preview returns not-found outside development preview mode.

## Research used

[Shopify's pickup administration guide](https://help.shopify.com/en/manual/fulfillment/setup/delivery-methods/pickup-in-store) documents the operational distinction between preparing a pickup, notifying the customer that it is ready, and marking it collected. NJS already has fulfillment states for this; the improvement makes today's outstanding and ready pickups easier to find rather than adding a competing status model.

[WooCommerce's booking availability settings](https://woocommerce.com/document/introduction-to-woocommerce-bookings/woocommerce-bookings-store-manager-guide/availability-settings/) distinguish capacity from availability rules. Its [store availability guide](https://woocommerce.com/document/introduction-to-woocommerce-bookings/woocommerce-booking-settings/store-availability/) describes blocking date ranges. These support separating NJS's recurring slot templates, date-specific capacity, and closed dates. NJS retains its own store hours, capacity, and WITA cutoff; it does not copy another platform's defaults.

These are public documentation comparisons, not access to another merchant's private administration screens. REA was unavailable in this session.

## Review health

Provisional assessment of reviewed code and rendered preview, not a production accessibility certification:

| Dimension | Score / 4 | Evidence |
| --- | --- | --- |
| Accessibility | 3 | Labeled time/capacity controls, visible checkboxes, a native mobile dialog with keyboard containment and focus restoration, status/error announcements, and skip-navigation target. Full screen-reader testing remains. |
| Performance | 3 | Dashboard counts use database aggregation; order results have a visible 100-result cap; day operations use one transaction. Query plans and real production traffic are unmeasured. |
| Theming | 3 | Shared form controls, consistent SVG navigation, existing neutral/rose colors and typography. Older admin modules retain some mixed styling. |
| Responsive behavior | 3 | No overflow at 320, 390, 768, 1024, and 1440px; 200% zoom passed; synthesized mobile touch passed. Only Chromium was exercised. |
| Implementation integrity | 3 | Store/day changes are scoped and transactional; role guards remain; preview writes are disabled; numeric settings and stock movements are validated on the server. Real database integration remains necessary. |
| **Total** | **15 / 20** | **Good on the reviewed surfaces; operational release checks remain.** |

The source detector returned `[]` for the changed admin UI. Rendered checks are reported separately from that mechanical result.

## Findings addressed

| Severity | Finding | Change |
| --- | --- | --- |
| P1 | Repeated `status` query parameters from native checkboxes arrive as an array; `.split()` on that array could break the order list. | Shared parser accepts repeated and comma-separated statuses, de-duplicates them, and validates recognized states. Visible checkboxes remain keyboard accessible. |
| P1 | Date filters mixed UTC date parsing with server-local end-of-day calculations, and malformed dates could reach Prisma. | Validated WITA day bounds, explicit invalid/reversed-range feedback, and a separate pickup-date filter. Creation dates continue to filter creation time. |
| P1 | Admin settings could persist invalid cutoff or fee strings, leading to invalid checkout dates or negative pricing. | Server validation requires integer hours 0–23 and whole, nonnegative rupiah amounts within bounds. Inputs mirror those limits. |
| P1 | Stock-movement actions did not enforce nonnegative integer quantities. A negative OUT amount could increase stock. | Validate at both the admin action and inventory service boundaries. IN/OUT must be positive integers; adjustment to zero remains valid. This does not fix shared stock-allocation concurrency. |
| P1 | A note-only date override was displayed using effective status/capacity as form defaults, silently pinning fields that should inherit the template. | Utilization carries raw override values separately. Empty capacity and inherited status stay empty in the editor. Keys refresh the editor when its underlying override changes. |
| P1 | Clearing a day's overrides called one Server Action per slot, allowing partially reset days if a later call failed. | Whole-day close/open/reset uses one transaction scoped to the selected store. Sorted slot/day lock acquisition coordinates with checkout and avoids inconsistent lock order. |
| P1 | The off-screen mobile sidebar still contained focusable links; the menu lacked keyboard containment and Escape/focus restoration. | Separate desktop sidebar and native mobile dialog; closed dialog content is unfocusable, Tab/Shift+Tab stay in the dialog, Escape restores focus, and desktop resize closes the drawer. |
| P2 | Dashboard order totals were calculated from only six recent records. | Database grouping counts all orders created during the current WITA day. Outstanding/ready pickups are counted independently of creation date. |
| P2 | Merchants had no direct operational entry into today's scheduled pickups. | A pickup summary links to orders filtered by pickup date and outstanding fulfillment states, with a separate ready-to-collect link. |
| P2 | The 14-day slot strip used template capacity and ignored closure/capacity overrides. | Each date shows effective capacity and closed status; bookings remain visible. Calendar full status now considers remaining room in each active window. |
| P2 | Store filtering did not cover the upcoming overrides and recurring templates consistently. | The selected store applies to calendar, upcoming overrides, template rows, and the creation form's default store. |
| P2 | Slot forms relied on placeholders, tiny action targets, and text inputs for time. | Persistent labels, native time controls, bounded capacities, 44px shared controls, and 16px form input text on mobile. |

Primary changed areas: `src/app/admin/`, `src/components/admin/`, `src/lib/admin-order-filters.ts`, `src/server/services/store-day.service.ts`, `src/server/services/dashboard.service.ts`, and inventory/settings validation and actions.

## Operational behavior

- **Close a date:** forces that store's slots closed for new checkouts. Existing pending/paid orders remain and must still be served. A confirmation explains this.
- **Open all slots:** removes forced closure by setting that date active. Existing custom capacity and staff notes remain; a zero-capacity window still cannot accept orders.
- **Follow daily template:** removes that store/date's overrides, including custom capacities and notes, after confirmation.
- **Per-slot editing:** retains independent inherit/open/closed status and nullable capacity. A note alone does not create a custom capacity or forced-open rule.
- **Capacity:** counts orders, including unexpired 15-minute payment holds. It is separate from the number of bouquets or physical inventory units.
- **Order filters:** support store, text search, multiple statuses, creation-date range, and pickup date. The 100-result cap is explicit; narrowing filters retrieves older matches. This is a bounded search, not complete pagination.

## Verification

- `npm run test:admin`: **10 passing regressions**. Covers repeated status filters, WITA creation/pickup dates, invalid/reversed ranges, cutoff/fee validation, invalid stock quantities, full-day dashboard aggregation, store-scoped bulk changes, preserving capacities/notes, reset scoping, lock-before-write ordering, and no-slot failures.
- `npm run test:pickup`: **11 existing scheduling regressions pass** after the shared settings and schedule changes.
- `npx tsc --noEmit --incremental false`: passed. The final production build also compiled and completed TypeScript successfully, then failed while prerendering `/` because the configured database is unavailable. The full build has not passed.
- Chromium: **14 browser scenarios pass**, covering sample-data labeling, closed days with existing bookings, note-only inheritance, native time/capacity controls, disabled preview mutations, effective capacity strips, store/month navigation, queue links, responsive layout, keyboard containment, Escape/focus return, resizing an open menu, anonymous sign-in routing, skip target, no runtime errors, and 200% zoom.
- Additional Chromium mobile-emulation check passed using synthesized touch with reduced motion: menu open/close and pickup-store switching.
- Source detector: zero findings on the targeted admin UI scan. `git diff --check` passes.
- Before/after screenshots and browser logs are stored in ignored `.audit/`, including `admin-before.png`, `admin-desktop-final.png`, `admin-mobile-final.png`, and `admin-browser-results.json`.

Tests for database services use controlled clients. They demonstrate query scope and transaction/lock ordering, not actual Postgres rollback, live lock contention, or the behavior of an authenticated production session. The local database remains unavailable. The existing full production build is blocked by database-dependent homepage prerendering; it has not passed end to end.

## Remaining work

1. **P1 — Physical stock and reservations:** stock availability still needs to subtract active reservations, and simultaneous stock movements still need protection against lost updates. Invalid quantities are fixed; atomic inventory allocation is not. See the original audit.
2. **P1 — Payment and fulfillment integration:** exercise late/duplicate Midtrans callbacks, cancellations/refunds, and simultaneous status changes on a disposable database. A label change to refunded must not be mistaken for confirmation that money was returned by a provider.
3. **P1 — Guest order privacy:** predictable order-number access and payment/tracking ownership remain documented in the original audit. This admin pass does not introduce a guest token scheme.
4. **P2 — Production operating tools:** complete pagination, saved filters, broader audit history for slot/settings edits, recurring weekday hours, and bulk date-range closures are useful extensions; this pass provides individual dates and the existing recurring daily templates.
5. **Verification gap:** authenticated CRUD, email/WhatsApp delivery, calendar imports, all role combinations, live Postgres contention, and physical-device/other-browser testing require a connected test environment.

Positive controls retained: admin role checks inside mutation actions, Super Admin restriction for user-role changes, actor IDs on inventory movements, an order-status history, and a distinct ready/collected fulfillment flow.

Recommended next work: `$impeccable harden` for payment/status and inventory integration, `$impeccable adapt` for the remaining admin modules, then `$impeccable polish` after live-flow verification.
