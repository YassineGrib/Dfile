# Architectural Design Spec: Client Payments & Inflow Tracking Engine

**Date:** 2026-09-22  
**Status:** Approved by User  
**Subsystem:** Financials & Payments Tracking (`payments`)

---

## 1. Overview & Objectives

This specification outlines the architecture, data structures, and user interface for the **Client Payments & Inflow Tracking Engine** in IndFlow / Fintask. 

The goal is to allow freelancers to:
1. Log and track every incoming payment made by clients (advances, milestones, final balances, tips).
2. Automatically reconcile payments against project contracts/quotes, computing remaining unpaid debts in real time.
3. Provide a dedicated **Payments & Inflow Hub** (`PaymentsView`) equipped with key financial performance indicators (KPIs), multi-criteria filtering, and transaction logs.
4. Support localized payment methods (BaridiMob, CCP, Bank Transfer, Cash) in Algerian Dinars (DZD) and international methods.
5. Provide automatic financial progress reflection across client slide-overs and project cards.
6. Adhere strictly to the IndFlow design system with ultra-refined typography (weights capped at 400-450, no heavy stems) and bilingual (Arabic/English) support.

---

## 2. Data Architecture & Firestore Schema

### 2.1 Collection: `payments`
Each payment record in Cloud Firestore adheres to the following interface:

```typescript
export type PaymentType = 'advance' | 'milestone' | 'final' | 'tip';

export type PaymentMethod = 'baridimob' | 'ccp' | 'bank_transfer' | 'cash' | 'other';

export interface Payment {
  id: string;                 // e.g. "pay_k3x9a1b2"
  project_id: string;         // Linked Project ID
  client_id: string;          // Linked Client ID
  amount: number;             // Amount received in DZD
  payment_type: PaymentType;  // advance (تسبيق), milestone (مرحلية), final (نهائية), tip (إكرامية)
  payment_method: PaymentMethod; // baridimob, ccp, bank_transfer, cash, other
  reference_number?: string;  // Transaction slip / BaridiMob transfer ID
  notes?: string;             // Optional notes / receipts remarks
  payment_date: string;       // Date payment was received (YYYY-MM-DD)
  created_at: string;         // ISO timestamp
}
```

### 2.2 Firestore Service Methods (`src/firebase/services.ts`)
- `getPayments(): Promise<Payment[]>`: Initial fetch.
- `subscribePayments(callback: (payments: Payment[]) => void): () => void`: Real-time listener.
- `savePayment(payment: Payment): Promise<void>`: Save / update payment.
- `deletePayment(id: string): Promise<void>`: Delete payment.

---

## 3. Financial Reconciliation Engine

All computations are calculated dynamically in state to ensure 100% consistency across views:

1. **Total Received (`totalReceived`)**:
   $$\sum_{p \in \text{Payments}} p.\text{amount}$$
2. **Total Committed Project Value (`totalBudget`)**:
   $$\sum_{\text{proj} \in \text{Projects}} \text{proj}.\text{price\_dzd}$$
3. **Total Outstanding / Pending Balance (`totalPending`)**:
   $$\max(0, \text{totalBudget} - \text{totalReceived})$$
4. **Current Month Inflow (`thisMonthInflow`)**:
   $$\sum_{p \in \text{Payments}, \text{isCurrentMonth}(p.\text{payment\_date})} p.\text{amount}$$
5. **Collection Rate (`collectionRate`)**:
   $$\min(100, \text{round}((\text{totalReceived} / \text{totalBudget}) \times 100))$$
6. **Per-Project Balance**:
   $$\text{Project Paid} = \sum_{p \in \text{Payments}, p.\text{project\_id} = \text{proj}.\text{id}} p.\text{amount}$$
   $$\text{Project Remaining} = \max(0, \text{proj}.\text{price\_dzd} - \text{Project Paid})$$

---

## 4. User Interface & Component Architecture

### 4.1 Navigation (`src/components/Sidebar.tsx`)
- In Group 3 (**Financials & Contracts**):
  - **Payments & Income** (`payments`): Navigates to `PaymentsView`. Displays a live badge with the count of recorded payments.
  - **Contracts & Agreements** (`contracts`): Navigates to `ContractsView` (separated cleanly from payments).
  - **Invoices & Quotes** (`invoices`).
  - **Expenses & Outlays** (`expenses`).

### 4.2 Main View (`src/components/PaymentsView.tsx`)
1. **Header**: Title, subtitle, and primary `+ تسجيل دفعة جديدة / Record Payment` action button.
2. **KPI Strip (4 Cards)**:
   - Card 1: **إجمالي المحصل** (Total Received) with green theme.
   - Card 2: **المستحقات المعلقة** (Pending Balance) with subtle orange accent.
   - Card 3: **مقبوضات هذا الشهر** (This Month's Inflow) with purple accent.
   - Card 4: **معدل التحصيل** (Collection Rate %) with circular progress indicator.
3. **Filter & Search Toolbar**:
   - Live search input matching Client name, Project name, or reference number.
   - Method pill filters: All, BaridiMob, CCP, Bank, Cash.
   - Time filters: All time, This month, Last 3 months.
4. **Transactions Ledger Table**:
   - Client Avatar (`UserAvatar` with Blobatar styling) + Client name.
   - Project name pill.
   - Payment method badge (e.g. BaridiMob with custom badge styling).
   - Type tag (Advance, Milestone, Final, Tip).
   - Date & Reference code.
   - Amount formatted in DZD (`150,000 دج`).
   - Actions: View mini-receipt modal, Delete payment (with confirmation).
5. **Empty State Card**:
   - Clean illustration, descriptive prompt, and quick record button.

### 4.3 Payment Modal (`src/components/AddPaymentModal.tsx`)
- Triggered from `PaymentsView`, `Sidebar`, `ProjectsView`, or `ClientsView`.
- Form steps / inputs:
  1. **Client Selection**: Dropdown with client avatars and names.
  2. **Linked Project Selection**: Filtered by chosen client. Displays current project budget and outstanding unpaid amount directly in the options (e.g. `متجر إلكتروني — المتبقي: 45,000 دج`).
  3. **Amount Input**:
     - Number input with DZD currency symbol.
     - Quick preset buttons: `25%`, `50%`, `100% (سداد كامل المتبقي)`.
  4. **Payment Method Selector**: Visual clickable cards for BaridiMob, CCP, Bank Wire, Cash, Other.
  5. **Payment Type**: Advance (تسبيق), Milestone (دفعة مرحلية), Final (تسوية نهائية), Tip (إكرامية).
  6. **Payment Date**: Defaults to current date.
  7. **Reference Number & Notes**: Transfer slip number, remarks.

### 4.4 Payment Receipt Modal (`PaymentReceiptModal`)
- Clean, printable receipt card displaying:
  - Freelancer header & logo.
  - Receipt number & timestamp.
  - Client details.
  - Project name & payment type.
  - Amount in DZD (both numbers and formatted text).
  - Remaining project balance after this payment.
  - Action buttons: Print / Export PDF, Close.

### 4.5 Cross-View Integration
- **`ProjectsView.tsx` & `ProjectsDirectory.tsx`**:
  - Add financial balance progress bar under project status: `مدفوع: 60,000 دج • متبقي: 40,000 دج`.
  - Quick action to record payment directly for that project.
- **`ClientsView.tsx`**:
  - Slide-over ledger displays dynamic payment history for that specific client.
  - Summary tile: Total paid by client vs total contract value.
- **`DashboardView.tsx`**:
  - "Total Revenue" KPI reflects real payments received.
  - Activity feed logs new payments automatically.

---

## 5. Design & Typography Tokens

- CSS file: `src/design-system/13-payments.css`.
- Typography weights:
  - Headings & KPI values: `var(--weight-bold)` (calibrated at `450`).
  - Subtitles, labels & body: `var(--weight-regular)` (`400`).
  - Badges & small tags: `var(--weight-semibold)` (`450`).
  - Zero usage of chunky weights (`500+` or `700`).
- Color palette:
  - BaridiMob Badge: Light orange background `#FFF1EA`, text `#F05A28`.
  - CCP Badge: Gold/Amber background `#FFF9E6`, text `#B78103`.
  - Bank Transfer Badge: Blue background `#EFF6FF`, text `#2563EB`.
  - Cash Badge: Emerald green background `#E2FFEF`, text `#0E4F2F`.

---

## 6. Verification & Test Plan

1. **Automated Build & Type Check**:
   - Run `npm run build` (`tsc -b && vite build`) to verify all TypeScript interfaces, props, and imports compile with zero errors.
2. **Real-time Firestore Verification**:
   - Create a new payment via `AddPaymentModal`.
   - Verify payment record is saved in Firestore `payments` collection.
   - Verify all calculations (Total Received, Project Remaining, Client Ledger) update reactively without page reload.
3. **Visual & Interactive Verification**:
   - Check responsive layout on desktop and mobile.
   - Verify bilingual Arabic (RTL) and English (LTR) rendering.
   - Verify receipt generation and print layout.
