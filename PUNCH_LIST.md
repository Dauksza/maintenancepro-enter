# MaintenancePro Punch List

**Project:** MaintenancePro Enterprise CMMS  
**Date:** 2026-03-03  
**Status:** Active Development  

This punch list documents open issues, missing features, and improvement opportunities identified through a full repository review. Items are grouped by area and prioritized (🔴 Critical · 🟡 High · 🟢 Medium · ⚪ Low).

## Production Readiness Review Protocol

To keep quality gates explicit as we approach production, each review pass should follow this sequence and be recorded in this file:

1. **Tab-by-tab validation**  
   Verify each primary tab and its dialogs/components for happy-path flow, invalid input handling, and data persistence behavior.
2. **Integration validation**  
   Confirm cross-module flows (Work Orders ↔ Employees ↔ Parts ↔ Scheduling) still function end-to-end without regression.
3. **Performance + reliability spot checks**  
   Confirm critical screens remain responsive and no new console/runtime errors are introduced.
4. **Issue and fix logging**  
   Record every discovered issue, fix status, and follow-up owner in the sections below so no gap is lost between design/dev/QA handoffs.
5. **Verification evidence**  
   For each resolved item, include the validation method used (manual scenario, lint/build check, targeted test).

Use this tracking format for new findings:

| ID | Area | Finding | Fix | Validation | Status |
|---|---|---|---|---|---|
| Q-### | Tab/Feature | Clear problem statement | PR/commit reference | Manual + lint/build/test evidence | Open / In Progress / Resolved |

---

## 1. UX / Visual Design

| # | Priority | Issue | Status |
|---|----------|-------|--------|
| 1 | 🟡 | Sidebar has no collapse/icon-only mode – on laptops (1366 px) it consumes ~17 % of viewport | ✅ Resolved |
| 2 | 🟡 | No dark-mode CSS variables defined under `.dark` class – next-themes is installed but only light tokens exist in `index.css` | ✅ Resolved |
| 3 | 🟡 | Mobile viewports: sidebar is always rendered; no hamburger / overlay pattern | ✅ Resolved |
| 4 | 🟢 | No "Back to top" affordance on long list pages (Work Orders, Parts) | ✅ Resolved |
| 5 | 🟢 | Current active section is not reflected in the browser `<title>` or header breadcrumb | ✅ Resolved |
| 6 | 🟢 | Print styles are absent – printed pages include sidebar, header chrome, and buttons | ✅ Resolved |
| 7 | ⚪ | Button hover animation (`translateY(-1px)`) can cause layout jitter in data tables | Deferred |
| 8 | ⚪ | `glass-effect-dark` CSS class defined but never used in any component | Deferred |
| 9 | ⚪ | Status badge colours for "In Progress" and "Completed" are nearly identical (`oklch(0.65 …)` vs `oklch(0.62 …)`) | Deferred |
| 10 | ⚪ | Tailwind CSS warning: `max-width: (pointer: fine)` generates an unexpected token in the PostCSS build | Deferred |

---

## 2. Functionality Gaps

| # | Priority | Issue | Status |
|---|----------|-------|--------|
| 11 | 🔴 | **No real authentication** – `currentUserRole` is a client-side state variable; any user can switch roles freely | Open |
| 12 | 🔴 | **Data is browser-local only** – `spark.kv` persists to `localStorage`; no multi-user or server sync | Open |
| 13 | 🟡 | Excel export writes all three sheets but filenames are hard-coded; no timestamp or user name in the filename | Open |
| 14 | 🟡 | `CertificationReminders` re-generates reminders on every render of `certificationCounts` (expensive `useMemo` with no dependency guard) | ✅ Resolved |
| 15 | 🟡 | `AutoSchedulerDialog` and `EnhancedAutoSchedulerDialog` are both present; the former appears to be an older, superseded version | Open |
| 16 | 🟡 | Work order "Cloning" copies the original `work_order_id` before a new UUID is set in `NewWorkOrderDialog` – race condition possible if dialog closes early | ✅ Resolved |
| 17 | 🟢 | P&ID Drawing Editor has no undo/redo keybinding integration with the global `UndoRedoManager` | Open |
| 18 | 🟢 | `PhotoUploadDialog` accepts files via drag-and-drop UI but only stores metadata; actual binary upload is not wired to any backend | Open |
| 19 | 🟢 | `DocumentStorageDialog` lists documents but has no download / preview path for stored items | Open |
| 20 | 🟢 | Forms & Inspections: completed forms cannot be exported to PDF or printed | Open |
| 21 | ⚪ | `AuditLogViewer` shows mock/static data rather than real events from `audit-logger.ts` | Open |
| 22 | ⚪ | `VersionHistoryViewer` displays hardcoded version history entries | Open |
| 23 | ⚪ | `SuggestionPreview` component is imported in several places but never rendered in the main app flow | Open |
| 24 | ⚪ | `DatabaseManagement` backup/restore buttons log to console rather than persisting state | Open |

---

## 3. Performance

| # | Priority | Issue | Status |
|---|----------|-------|--------|
| 25 | 🟡 | JS bundle is ~2.9 MB (766 KB gzipped) – no dynamic imports or route-level code splitting | Open |
| 26 | 🟡 | `WorkOrderGrid` renders all rows without virtualisation; performance degrades past ~500 rows | Open |
| 27 | 🟢 | `AnalyticsDashboard` recalculates all chart data synchronously on every render | Open |
| 28 | 🟢 | `three.js` (`TankViewer3D`) is bundled eagerly; could be lazy-loaded on demand | Open |
| 29 | ⚪ | `d3` is imported fully even though only a small subset of functions is used | Open |

---

## 4. Accessibility

| # | Priority | Issue | Status |
|---|----------|-------|--------|
| 30 | 🟡 | Sidebar `<nav>` buttons use `<button>` elements but have no `aria-current="page"` on the active item | Open |
| 31 | 🟡 | Modal dialogs do not trap focus when the underlying page content is still interactive | Open |
| 32 | 🟢 | Colour contrast for `.muted-foreground` text on white backgrounds is ~3.8:1 (WCAG AA requires 4.5:1 for small text) | Open |
| 33 | 🟢 | Icon-only buttons (Import, Export in header) have `aria-label` but tooltips only appear on hover, not on keyboard focus | Open |
| 34 | ⚪ | `<kbd>` elements inside tooltips are not announced correctly by screen readers | Open |
| 35 | ⚪ | `CalendarView` drag-and-drop is not keyboard accessible | Open |

---

## 5. Code Quality & Architecture

| # | Priority | Issue | Status |
|---|----------|-------|--------|
| 36 | 🟡 | `App.tsx` is 1 481 lines; it manages global state, renders the entire layout, and handles all event handlers – should be split into context/provider + layout + page components | Open |
| 37 | 🟡 | Many components use `|| []` default coalescing rather than dedicated empty-state checks; hides potential `undefined` propagation bugs | Open |
| 38 | 🟢 | `uuid` package used for ID generation but the native `crypto.randomUUID()` is available in all target browsers | ✅ Resolved |
| 39 | 🟢 | `eslint` version `^10.0.0` is listed in `devDependencies` but eslint 10 is a pre-release; should be pinned to stable `^9.x` | Open |
| 40 | 🟢 | TypeScript `noCheck` flag used in the build script (`tsc -b --noCheck`); type errors are silenced at build time | Open |
| 41 | ⚪ | Several `console.error` / `console.warn` calls are scattered in production code without a structured logger | Open |
| 42 | ⚪ | `ANALYSIS_AND_RECOMMENDATIONS.md`, `COMPREHENSIVE_ASSESSMENT.md`, `TRANSFORMATION_SUMMARY.md` etc. appear to be AI-generated output files not intended for public repo documentation | Open |

---

## 6. Security

| # | Priority | Issue | Status |
|---|----------|-------|--------|
| 43 | 🔴 | `xlsx` package (v0.18.5) has 3 known high-severity CVEs (prototype pollution, ReDoS). Should upgrade to `exceljs` or `@sheet/core` | Open |
| 44 | 🟡 | No Content Security Policy headers defined; the PWA service worker could be a vector for stored XSS | Open |
| 45 | 🟡 | User-supplied data rendered in `marked` (Markdown parser) without sanitisation – potential XSS in SOP descriptions | Open |
| 46 | 🟢 | `localStorage` stores all application data in plain text; sensitive maintenance/personnel data has no encryption layer | Open |

---

## 7. Documentation

| # | Priority | Issue | Status |
|---|----------|-------|--------|
| 47 | 🟡 | `README.md` lists `Recharts` and `D3.js` as data visualisation libraries but no chart uses raw D3 (only recharts wrappers) | ✅ Resolved |
| 48 | 🟡 | `README.md` references `src/components/NotificationCenter.tsx` in the project structure but the file has moved/been split | ✅ Resolved |
| 49 | 🟢 | `CHANGELOG.md` does not follow Keep a Changelog / Semantic Versioning format | ✅ Resolved |
| 50 | 🟢 | Multiple redundant documentation files (`TRANSFORMATION_SUMMARY.md`, `COMPREHENSIVE_ASSESSMENT.md`, `ANALYSIS_AND_RECOMMENDATIONS.md`, `FINAL_POLISH.md`, `IMPLEMENTATION_SUMMARY.md`, `SYSTEM_VERIFICATION.md`) overlap heavily with README | Deferred |
| 51 | ⚪ | `API_DOCUMENTATION.md` documents a REST API that does not yet exist | Open |
| 52 | ⚪ | `SECURITY.md` references a security contact email (`security@maintenancepro.com`) that is not real | Open |

---

## 8. Testing

| # | Priority | Issue | Status |
|---|----------|-------|--------|
| 53 | 🔴 | **Zero automated tests** – no unit, integration, or end-to-end tests exist in the project | Open |
| 54 | 🟡 | No CI pipeline configuration (only `dependabot.yml`); PRs are merged without automated quality checks | Open |
| 55 | 🟢 | Critical utility functions (`maintenance-utils.ts`, `certification-utils.ts`, `auto-scheduler.ts`) are untested | Open |

---

## 9. DevOps / Build

| # | Priority | Issue | Status |
|---|----------|-------|--------|
| 56 | 🟡 | `dist/` directory is not in `.gitignore`; build artifacts may accidentally be committed | Open |
| 57 | 🟢 | Service worker (`public/sw.js`) has a hardcoded cache name `maintenancepro-v1` – cache busting requires a manual version bump | Open |
| 58 | ⚪ | `vite.config.ts` has no chunk splitting strategy; all third-party deps land in a single 2.9 MB chunk | Open |

---

## Resolved / Closed Items (This Session)

| # | Enhancement | Notes |
|---|-------------|-------|
| E1 | Dark mode CSS variables + header toggle | Added `.dark` class variables in `index.css` + ThemeProvider + toggle button |
| E2 | Collapsible sidebar with icon-only mode | Added `sidebarCollapsed` state with localStorage persistence |
| E3 | Section breadcrumb in header | Active tab name shown in header |
| E4 | Mobile sidebar overlay / hamburger menu | Overlay + backdrop on narrow viewports |
| E5 | Print-friendly CSS styles | `@media print` added to `index.css` |
| E6 | "Back to top" scroll button | Floating button shown after scrolling 400 px |
| E7 | Sidebar footer: version + last-updated | Added version strip to sidebar bottom |
| E8 | Page-level section header strip | Consistent section title/description across all tabs |
| E9 | Keyboard skip-link + focus-ring improvements | Improved `focus-visible` ring |
| E10 | Animated counter fade-in for KPI numbers | CSS animation class `.count-up-animate` |
