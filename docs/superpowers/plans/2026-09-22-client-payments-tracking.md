# Client Payments & Inflow Tracking Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete client payments and cash inflow tracking engine with real-time Firestore persistence, automatic project/client debt reconciliation, KPI metrics, and a dedicated payments ledger view.

**Architecture:** A standalone `PaymentsView` and `AddPaymentModal` powered by live Cloud Firestore subscriptions (`payments` collection), recalculating project outstanding balances, client totals, and monthly performance in real-time, styled with IndFlow's feather-light typography (400/450 weights) and Algerian payment method tokens (BaridiMob, CCP, Cash, Bank).

**Tech Stack:** React 19, TypeScript, Cloud Firestore, Lucide Icons, Blobatar Avatars, Vanilla CSS.

**Spec:** `docs/superpowers/specs/2026-09-22-client-payments-tracking-design.md`

## Global Constraints

- Never use font weights exceeding 450 (var(--weight-semibold) = 450, var(--weight-bold) = 450, var(--weight-regular) = 400).
- Support full bilingual UI: Arabic (`dir="rtl"`) and English (`dir="ltr"`).
- Currency formatted with Algerian Dinars (`DZ` / `دج`).
- All interactive elements must have unique test IDs or standard accessible attributes.
- Use `UserAvatar` with consistent Blobatar generator for client avatars.

## Review Focus

- **Negative / Overflow Amounts:** Submitting an amount greater than the project remaining balance or negative numbers must be handled gracefully.
- **Deleted Project / Client Fallback:** If a client or project is deleted, past payment records must still display fallback names gracefully without crashing.
- **RTL / LTR Alignment:** Currency badges, table cells, and modal forms must mirror cleanly in Arabic RTL mode.
- **Zero-State Handling:** Empty payments list displays an inviting empty state card with a quick CTA.
- **Mobile Responsiveness:** KPI cards and transaction tables must scroll or wrap seamlessly on screens < 768px.

---

### Task 1: Update Payment Types & Firebase Firestore Service

**Files:**
- Modify: `src/types.ts`
- Modify: `src/firebase/services.ts`

**Interfaces:**
- Consumes: Firestore `db` instance from `src/firebase/config.ts`.
- Produces: Enhanced `Payment` type, `firestoreService.savePayment`, `firestoreService.deletePayment`, `firestoreService.subscribePayments`.

- [ ] **Step 1: Update Payment interface in `src/types.ts`**
Ensure `Payment` includes `reference_number?: string`, `payment_type: 'advance' | 'milestone' | 'final' | 'tip'`, and `payment_method: string`.

- [ ] **Step 2: Add `deletePayment` in `src/firebase/services.ts`**
Export `deletePayment: (id: string) => removeDocument('payments', id)` inside `firestoreService`.

- [ ] **Step 3: Verify TypeScript compilation**
Run `npm run build` to confirm zero type errors.

---

### Task 2: Create Payments Stylesheet & Design Tokens

**Files:**
- Create: `src/design-system/13-payments.css`
- Modify: `src/design-system/index.css`

**Interfaces:**
- Consumes: CSS variables from `01-tokens.css` (`--bg-card`, `--weight-regular`, `--weight-bold`, `--accent-purple`, `--accent-orange`, `--btn-primary`).
- Produces: CSS utility classes for payment badges, transaction rows, receipt modal, and KPI cards.

- [ ] **Step 1: Write `13-payments.css`**
Include:
- `.payments-kpi-grid` and `.payments-kpi-card` with hover micro-transitions.
- Method badges: `.badge-baridimob` (orange/white), `.badge-ccp` (amber/gold), `.badge-bank` (blue), `.badge-cash` (emerald).
- Type pills: `.pill-advance`, `.pill-milestone`, `.pill-final`, `.pill-tip`.
- Receipt card layout for printing/viewing: `.payment-receipt-paper`.
- Typography strictly capped at `400` and `450`.

- [ ] **Step 2: Import `13-payments.css` into `src/design-system/index.css`**
Add `@import './13-payments.css';` to the stylesheet bundle.

- [ ] **Step 3: Verify build**
Run `npm run build` to confirm CSS imports succeed.

---

### Task 3: Create Payment Modal & Receipt Components

**Files:**
- Create: `src/components/AddPaymentModal.tsx`
- Create: `src/components/PaymentReceiptModal.tsx`

**Interfaces:**
- Consumes: `Client[]`, `Project[]`, `Payment[]`, `LanguageContext`.
- Produces: `AddPaymentModal` (handles recording new payments with client/project dynamic linkage, presets, and validation), `PaymentReceiptModal` (displays printable invoice receipt).

- [ ] **Step 1: Implement `AddPaymentModal.tsx`**
- Client selection dropdown with avatar.
- Project dropdown filtered by selected client showing remaining balance.
- Preset percentage buttons (`25%`, `50%`, `100% Full Balance`).
- Payment method selector with visual cards (BaridiMob, CCP, Bank, Cash).
- Form submission triggers `onAddPayment(payment: Payment)`.

- [ ] **Step 2: Implement `PaymentReceiptModal.tsx`**
- Displays structured receipt with freelancer profile header, client details, payment breakdown, date, and reference code.
- Printable button (`window.print()`).

- [ ] **Step 3: Verify build**
Run `npm run build` to verify clean compilation.

---

### Task 4: Create Main `PaymentsView.tsx` Component

**Files:**
- Create: `src/components/PaymentsView.tsx`

**Interfaces:**
- Consumes: `Payment[]`, `Client[]`, `Project[]`, `onAddPayment`, `onDeletePayment`.
- Produces: Full payments hub view with KPIs, toolbar search/filter, and interactive transaction ledger.

- [ ] **Step 1: Implement KPI calculations & Top KPI strip**
Calculate `totalReceived`, `totalPending`, `thisMonthInflow`, and `collectionRate` dynamically.

- [ ] **Step 2: Implement Search & Filter Toolbar**
Filter by search query (client name / project name / reference number), payment method, and time frame.

- [ ] **Step 3: Implement Transactions Table & Stream**
Render table rows with `UserAvatar`, project tag, amount, method badge, date, receipt view trigger, and delete button.

- [ ] **Step 4: Implement Empty State**
Render helpful empty state when no payments match filters or exist.

- [ ] **Step 5: Verify build**
Run `npm run build`.

---

### Task 5: Integrate Sidebar, App.tsx & Reconcile Projects/Clients

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/ProjectsView.tsx`
- Modify: `src/components/ProjectsDirectory.tsx`
- Modify: `src/components/ClientsView.tsx`

**Interfaces:**
- Consumes: `payments` state and handlers.
- Produces: Complete workspace integration.

- [ ] **Step 1: Update `Sidebar.tsx`**
Add dedicated `payments` tab (`المدفوعات والتحصيلات` / `Payments & Inflow`) with a badge showing payment count. Set contracts tab identifier to `contracts`.

- [ ] **Step 2: Update `App.tsx`**
- Wire `activeTab === 'payments'` to `<PaymentsView ... />`.
- Wire `activeTab === 'contracts'` to `<ContractsView ... />`.
- Implement `handleAddPayment`, `handleDeletePayment` with Firestore sync and activity logging.
- Include `payments` in backup export.

- [ ] **Step 3: Update `ProjectsView.tsx` & `ProjectsDirectory.tsx`**
Compute paid amount for each project from `payments` and display financial balance (`مدفوع: X دج • متبقي: Y دج`).

- [ ] **Step 4: Update `ClientsView.tsx`**
In the client slide-over drawer, display a real-time list of payments made by that client and remaining balance.

- [ ] **Step 5: Verify build**
Run `npm run build`.

---

### Task 6: Visual & Interactive Verification

**Files:**
- Test across all views in browser.

- [ ] **Step 1: Launch test browser with `agent-browser`**
- [ ] **Step 2: Navigate to Payments tab and record a payment via `AddPaymentModal`**
- [ ] **Step 3: Verify the payment appears in PaymentsView, Project card, and Client slide-over**
- [ ] **Step 4: Verify Receipt modal preview**
- [ ] **Step 5: Capture screenshot artifacts for walkthrough**
