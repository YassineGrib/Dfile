# Architectural Design Spec: Friends Debts & Exchanges Ledger Engine

**Date:** 2026-10-01  
**Status:** Approved by User  
**Subsystem:** Financials & Peer-to-Peer Transactions (`friends-debts`)

---

## 1. Overview & Objectives

In freelancer and personal professional workflows, friends and colleagues often exchange financial favors, loans, and mutual services (e.g. freelance work, design, coding, software purchases, shared meals/expenses). Due to the nature of friendship, payment and settlement are frequently delayed and prone to being forgotten.

This specification details the architecture, data models, state flows, and user interface for the **Friends Debts & Exchanges Ledger** in IndFlow / Fintask.

### Core Objectives:
1. **Track Both Directions Seamlessly**:
   - **Owed To You (`lent`)**: Money you lent to a friend or services you provided to them.
   - **You Owe (`borrowed`)**: Money you borrowed from a friend or services they provided to you.
2. **Support Varied Transaction Types**:
   - Cash loans & money transfers (BaridiMob, Cash, Bank Transfer).
   - Service exchanges (design, development, consultation, troubleshooting).
   - Shared bills / expenses.
3. **Flexible Settlement & Service Offsets**:
   - Partial or full cash settlements.
   - Mutual service offsets (e.g., deducting an amount against a provided favor/service).
   - One-click full settlements.
4. **Dedicated Friends Directory & Detailed Statements**:
   - Overview cards for each friend showing their live net balance (in green if they owe you, orange/red if you owe them, neutral gray if zeroed out).
   - In-depth friend account statement modal showing chronological transaction history, settlements, and immediate quick-settle actions.
5. **Universal Transactions Ledger**:
   - Unified chronological table with instant search and status/direction filters.
6. **Strict IndFlow Aesthetics & UX**:
   - Flawless alignment with IndFlow's design system (KPI cards, `UserAvatar`, subtle shadows, clean font weights 400–450, responsive layout, full Dark/Light and Arabic/English language support).

---

## 2. Data Architecture & Interfaces

### 2.1 Types Definition (`src/types.ts`)

```typescript
export type FriendTransactionType = 'money' | 'service' | 'expense';
export type FriendTransactionDirection = 'lent' | 'borrowed'; // 'lent' = لي (أنا أطلب منه), 'borrowed' = عليّ (هو يطلب مني)
export type FriendTransactionStatus = 'pending' | 'partially_paid' | 'settled';
export type FriendSettlementMethod = 'cash' | 'baridimob' | 'bank_transfer' | 'service_offset' | 'other';

export interface Friend {
  id: string;                 // e.g. "fr_9a8b7c"
  name: string;               // Friend's name
  phone?: string;             // Optional phone/WhatsApp for reminders
  notes?: string;             // Relationship note or general context
  created_at: string;         // ISO timestamp
}

export interface FriendTransaction {
  id: string;                 // e.g. "ftr_1x2y3z"
  friend_id: string;          // Linked Friend ID
  type: FriendTransactionType;// 'money' (دين نقدي), 'service' (خدمة/عمل), 'expense' (نفقة مشتركة)
  direction: FriendTransactionDirection; // 'lent' (لي) | 'borrowed' (عليّ)
  amount: number;             // Total transaction amount in DZD
  paid_amount: number;        // Accumulated settled amount in DZD (starts at 0)
  description: string;        // Notes/description (e.g. "سلفة لحساب بريدي موب", "تصميم واجهة متجر")
  due_date?: string;          // Optional promised date / reminder (YYYY-MM-DD)
  status: FriendTransactionStatus; // 'pending' | 'partially_paid' | 'settled'
  date: string;               // Date of transaction (YYYY-MM-DD)
  created_at: string;         // ISO timestamp
}

export interface FriendSettlement {
  id: string;                 // e.g. "fstl_5k6m7n"
  transaction_id: string;     // Linked FriendTransaction ID
  friend_id: string;          // Linked Friend ID
  amount: number;             // Amount cleared in this settlement
  payment_method: FriendSettlementMethod; // cash, baridimob, bank_transfer, service_offset, other
  notes?: string;             // Settlement details (e.g. "تم التحويل عبر بريدي موب", "مقاصة مقابل استشارة")
  date: string;               // Settlement date (YYYY-MM-DD)
  created_at: string;         // ISO timestamp
}
```

---

## 3. Firestore Services & Subscriptions (`src/firebase/services.ts`)

New Firestore collections:
- `friends`
- `friend_transactions`
- `friend_settlements`

### 3.1 Service Methods:
- `getFriends(): Promise<Friend[]>` & `subscribeFriends(cb: (items: Friend[]) => void): () => void`
- `saveFriend(friend: Friend): Promise<void>` & `deleteFriend(id: string): Promise<void>`
- `getFriendTransactions(): Promise<FriendTransaction[]>` & `subscribeFriendTransactions(cb: (items: FriendTransaction[]) => void): () => void`
- `saveFriendTransaction(tx: FriendTransaction): Promise<void>` & `deleteFriendTransaction(id: string): Promise<void>`
- `getFriendSettlements(): Promise<FriendSettlement[]>` & `subscribeFriendSettlements(cb: (items: FriendSettlement[]) => void): () => void`
- `saveFriendSettlement(st: FriendSettlement): Promise<void>` & `deleteFriendSettlement(id: string): Promise<void>`

### 3.2 Offline & LocalStorage Fallback:
- When Firebase is unconfigured or offline, save and retrieve collections to/from `localStorage` keys:
  - `indflow_friends`
  - `indflow_friend_transactions`
  - `indflow_friend_settlements`

---

## 4. Financial Calculations Engine

All calculations are performed reactively in React state via `useMemo`:

### 4.1 Per-Transaction Metrics:
- $\text{Remaining Amount} = \max(0, \text{amount} - \text{paid\_amount})$
- If $\text{paid\_amount} \ge \text{amount}$, $\text{status} = \text{'settled'}$.
- Else if $\text{paid\_amount} > 0$, $\text{status} = \text{'partially\_paid'}$.
- Else, $\text{status} = \text{'pending'}$.

### 4.2 Per-Friend Summary:
For any given friend $f$:
- $\text{Owed To You (Lent)} = \sum_{t \in \text{tx}, t.\text{friend\_id}=f.\text{id}, t.\text{direction}=\text{'lent'}} (t.\text{amount} - t.\text{paid\_amount})$
- $\text{You Owe (Borrowed)} = \sum_{t \in \text{tx}, t.\text{friend\_id}=f.\text{id}, t.\text{direction}=\text{'borrowed'}} (t.\text{amount} - t.\text{paid\_amount})$
- $\text{Net Balance} = \text{Owed To You} - \text{You Owe}$
  - If $\text{Net Balance} > 0$: You are owed money (+ Green badge).
  - If $\text{Net Balance} < 0$: You owe money (- Orange/Red badge).
  - If $\text{Net Balance} == 0$: Account balanced (Neutral gray).
- $\text{Active Transactions Count} = \text{Count of transactions with status} \ne \text{'settled'}$.

### 4.3 Global Hub KPIs:
1. **صافي الرصيد العام (Global Net Balance)**:
   $$\text{Total Lent Unpaid} - \text{Total Borrowed Unpaid}$$
   Indicates overall peer liquidity status.
2. **مجموع ما تطلبه (Total Owed To You)**:
   $$\sum_{t, t.\text{direction}=\text{'lent'}} (t.\text{amount} - t.\text{paid\_amount})$$
3. **مجموع ما يطلبك (Total You Owe)**:
   $$\sum_{t, t.\text{direction}=\text{'borrowed'}} (t.\text{amount} - t.\text{paid\_amount})$$
4. **المعاملات النشطة والمسددة (Active & Settled Counts)**:
   Count of pending vs completed transactions.

---

## 5. User Interface & Component Architecture

### 5.1 Navigation (`Sidebar.tsx`)
Under Group 3 (**Financials & Contracts**):
- Item: **ديون ومعاملات الأصدقاء (Friends Ledger)**
- Tab key: `'friends-debts'`
- Icon: `Handshake` from `lucide-react`
- Dynamic badge: Number of active unsettled transactions.

### 5.2 Primary View: `src/components/FriendsDebtsView.tsx`
- **Header**:
  - Title: "ديون ومعاملات الأصدقاء" / "Friends Ledger & Exchanges"
  - Subtitle: "تنظيم وتتبع الديون المتبادلة والخدمات ومقاصة الحسابات مع الأصدقاء"
  - Action buttons:
    - Primary: `+ تسجيل معاملة / دين جديد (Add Transaction)`
    - Secondary: `+ صديق جديد (Add Friend)`
- **Top 4 KPI Cards**:
  1. **Global Net Balance**: Dynamic card tinting green or red depending on net direction.
  2. **Total Owed To You (ديون لك)**: Green bubble with `ArrowDownLeft` icon.
  3. **Total You Owe (ديون عليك)**: Orange/Red bubble with `ArrowUpRight` icon.
  4. **Active Engagements (الأصدقاء والمعاملات)**: Purple bubble with `Users` icon.
- **Controls Toolbar**:
  - Search input: matches friend name, transaction description, or notes.
  - View switcher:
    - `Friends Cards` (دليل الأصدقاء والأرصدة)
    - `All Transactions` (سجل المعاملات العام)
  - Filter pills:
    - Direction: All / Owed to Me (لي) / I Owe (عليّ)
    - Status: All / Active (معلق) / Settled (مسدد)
    - Type: All / Money (مالي) / Service (خدمات) / Expense (مصاريف مشتركة)
- **View Mode 1: Friends Cards Grid**:
  - Cards displaying:
    - Friend `UserAvatar` (using consistent IndFlow avatar styles).
    - Friend name, phone number with quick WhatsApp link, and note snippet.
    - Large Net Balance display with state pill: "تطلبه X دج" or "يطلبك X دج" or "الحساب مصفّر".
    - Mini progress/stats: Count of open vs settled transactions.
    - Action button: `عرض كشف الحساب والتسوية (Statement & Settle)`.
- **View Mode 2: All Transactions Table**:
  - Columns: Date, Friend (`UserAvatar` + name), Direction badge (Green "لي" vs Orange "عليّ"), Type tag (Money / Service / Expense), Description, Amount, Paid, Remaining, Status badge, Quick Actions (Settle, Edit, Delete).

### 5.3 Modals:
1. **`AddFriendModal.tsx`**:
   - Name (required), Phone (optional), Notes (optional).
2. **`AddFriendTransactionModal.tsx`**:
   - Friend selector (with quick "Add Friend" inline button).
   - Direction toggle: "لي (أنا الدائن)" vs "عليّ (أنا المدين)".
   - Type selector: Money loan / Service rendered / Shared expense.
   - Amount in DZD.
   - Description / Reason.
   - Transaction date & optional due/reminder date.
3. **`FriendLedgerModal.tsx`**:
   - Deep-dive statement for a single friend.
   - Shows overall summary with this friend.
   - Chronological timeline/table of all transactions.
   - Accordion or inline view of settlements for each transaction.
   - Quick button to record a new transaction with this friend.
   - Quick button to record a payment/offset settlement against any open transaction.
4. **`SettleTransactionModal.tsx`**:
   - Transaction summary (remaining balance).
   - Settlement amount input (defaulted to full remaining balance).
   - Method selector: Cash / BaridiMob / Bank Transfer / Service Offset (مقاصة خدمة) / Other.
   - Settlement notes (e.g. description of offset service or receipt code).
   - Settlement date.

---

## 6. Edge Cases & Safeguards

1. **Overpayment Prevention**: Settlement amount cannot exceed remaining balance.
2. **Friend Deletion Protection**: If a friend has active unsettled transactions, deleting the friend prompts with a strong warning or requires settling/archiving the debts first.
3. **Transaction Deletion Cascading**: Deleting a transaction safely deletes all associated `FriendSettlement` records.
4. **Service Offsets Integrity**: When settling by "Service Offset", a clear description of the service rendered must be logged in the settlement record.
5. **Localization & RTL**: Full bi-directional layout support (Arabic RTL / English LTR) using `useLanguage()`.
6. **Dark/Light Theme Compatibility**: All CSS tokens and card backgrounds use CSS custom properties (`--bg-primary`, `--bg-secondary`, `--border-subtle`, `--text-primary`, etc.).

---

## 7. Verification & Testing Strategy

1. **Data Model & Service Validation**:
   - Adding a friend, adding a transaction (lent & borrowed), and verifying Firestore & LocalStorage persistence.
2. **Settlement Logic Validation**:
   - Partial payment: remaining decreases, status transitions to `partially_paid`.
   - Full payment: remaining becomes 0, status transitions to `settled`.
   - Service offset: logs method as `service_offset` and properly adjusts balance.
3. **UI / Responsive / Localization Testing**:
   - Verify Arabic and English text rendering.
   - Test toggle between Friends Grid and All Transactions Table.
   - Test search by friend name and description.
   - Verify Sidebar active tab and badge count update.
