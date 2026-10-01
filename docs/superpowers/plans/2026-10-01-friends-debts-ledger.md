# Friends Debts & Exchanges Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete peer-to-peer debts, mutual favors, and service exchanges management subsystem with real-time Firestore persistence, bidirectional balance calculation, detailed friend statements, and partial/service-offset settlements.

**Architecture:** A standalone `FriendsDebtsView` equipped with net balance KPI cards, a dual-mode interface (Friends cards grid and full chronological transactions table), dedicated interactive modals (`AddFriendModal`, `AddFriendTransactionModal`, `FriendLedgerModal`, `SettleTransactionModal`), and real-time Firestore synchronization with offline `localStorage` fallback. All components follow IndFlow's design tokens and lightweight typography (weights 400-450) with full bilingual Arabic/English support.

**Tech Stack:** React 19, TypeScript, Cloud Firestore, Lucide Icons, Blobatar Avatars (`UserAvatar`), Vanilla CSS with CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-10-01-friends-debts-ledger-design.md`

## Global Constraints

- Never use font weights exceeding 450 (`var(--weight-regular) = 400`, `var(--weight-bold) = 450`, `var(--weight-semibold) = 450`).
- Support full bilingual UI: Arabic (`dir="rtl"`) and English (`dir="ltr"`) via `useLanguage()`.
- Currency formatted with Algerian Dinars (`DZ` / `دج`).
- All interactive elements must have unique test IDs or standard accessible attributes.
- Use `UserAvatar` with consistent Blobatar generator for friend avatars.
- Maintain responsive layout across desktop and mobile screens (< 768px).

## Review Focus

- **Over-settlement Prevention:** Submitting a settlement amount greater than the transaction's remaining balance must be blocked with an informative error.
- **Service Offset Accuracy:** Selecting the "Service Offset" (مقاصة خدمة) method requires notes explaining the offset work, ensuring transparent balance deductions.
- **Net Balance Polarity:** Positive net balance must consistently signify money owed to the user (Green tint), negative signifies money the user owes (Orange/Red tint), and zero displays neutral styling.
- **RTL / LTR Symmetry:** Direction badges (لي / عليّ), table columns, and monetary indicators must align and flow correctly in both Arabic and English modes.
- **Zero-State Handling:** Empty friends list or empty transactions table must display informative empty states with direct call-to-action buttons.

---

### Task 1: Add Friend & Transaction Types and Firestore Services

**Files:**
- Modify: `src/types.ts`
- Modify: `src/firebase/services.ts`
- Create: `scripts/verify-friends-types.mjs`

**Interfaces:**
- Consumes: Firestore `db` instance from `src/firebase/config.ts`.
- Produces: `Friend`, `FriendTransaction`, `FriendSettlement` types, and `firestoreService` CRUD helpers (`getFriends`, `subscribeFriends`, `saveFriend`, `deleteFriend`, `getFriendTransactions`, `subscribeFriendTransactions`, `saveFriendTransaction`, `deleteFriendTransaction`, `getFriendSettlements`, `subscribeFriendSettlements`, `saveFriendSettlement`, `deleteFriendSettlement`).

- [ ] **Step 1: Write verification script for type and service integrity**

Create `scripts/verify-friends-types.mjs`:
```javascript
import { readFileSync } from 'fs';

const typesContent = readFileSync('./src/types.ts', 'utf8');
const servicesContent = readFileSync('./src/firebase/services.ts', 'utf8');

const requiredTypes = ['Friend', 'FriendTransaction', 'FriendSettlement', 'FriendTransactionDirection'];
const requiredServices = ['subscribeFriends', 'saveFriend', 'deleteFriend', 'subscribeFriendTransactions', 'saveFriendTransaction', 'deleteFriendTransaction', 'subscribeFriendSettlements', 'saveFriendSettlement', 'deleteFriendSettlement'];

let failed = false;
for (const t of requiredTypes) {
  if (!typesContent.includes(t)) {
    console.error(`Missing type: ${t}`);
    failed = true;
  }
}
for (const s of requiredServices) {
  if (!servicesContent.includes(s)) {
    console.error(`Missing service: ${s}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log('Types and services verified successfully.');
}
```

- [ ] **Step 2: Run verification script to confirm it fails**

Run: `node scripts/verify-friends-types.mjs`  
Expected: FAIL with "Missing type: Friend"

- [ ] **Step 3: Add interfaces in `src/types.ts`**

Add the following interfaces to `src/types.ts`:
```typescript
export type FriendTransactionType = 'money' | 'service' | 'expense';
export type FriendTransactionDirection = 'lent' | 'borrowed'; // lent = لي (أنا أطلب منه), borrowed = عليّ (هو يطلب مني)
export type FriendTransactionStatus = 'pending' | 'partially_paid' | 'settled';
export type FriendSettlementMethod = 'cash' | 'baridimob' | 'bank_transfer' | 'service_offset' | 'other';

export interface Friend {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  created_at: string;
}

export interface FriendTransaction {
  id: string;
  friend_id: string;
  type: FriendTransactionType;
  direction: FriendTransactionDirection;
  amount: number;
  paid_amount: number;
  description: string;
  due_date?: string;
  status: FriendTransactionStatus;
  date: string;
  created_at: string;
}

export interface FriendSettlement {
  id: string;
  transaction_id: string;
  friend_id: string;
  amount: number;
  payment_method: FriendSettlementMethod;
  notes?: string;
  date: string;
  created_at: string;
}
```

- [ ] **Step 4: Add Firestore service helpers in `src/firebase/services.ts`**

In `src/firebase/services.ts`, import `Friend`, `FriendTransaction`, `FriendSettlement` and add:
```typescript
  // Friends
  getFriends: () => fetchCollection<Friend>('friends'),
  subscribeFriends: (cb: (items: Friend[]) => void) => subscribeCollection<Friend>('friends', cb),
  saveFriend: (friend: Friend) => saveDocument('friends', friend),
  deleteFriend: (id: string) => removeDocument('friends', id),

  // Friend Transactions
  getFriendTransactions: () => fetchCollection<FriendTransaction>('friend_transactions'),
  subscribeFriendTransactions: (cb: (items: FriendTransaction[]) => void) => subscribeCollection<FriendTransaction>('friend_transactions', cb),
  saveFriendTransaction: (tx: FriendTransaction) => saveDocument('friend_transactions', tx),
  deleteFriendTransaction: (id: string) => removeDocument('friend_transactions', id),

  // Friend Settlements
  getFriendSettlements: () => fetchCollection<FriendSettlement>('friend_settlements'),
  subscribeFriendSettlements: (cb: (items: FriendSettlement[]) => void) => subscribeCollection<FriendSettlement>('friend_settlements', cb),
  saveFriendSettlement: (st: FriendSettlement) => saveDocument('friend_settlements', st),
  deleteFriendSettlement: (id: string) => removeDocument('friend_settlements', id),
```

- [ ] **Step 5: Run verification script & build check**

Run: `node scripts/verify-friends-types.mjs && npm run build`  
Expected: PASS with 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/firebase/services.ts scripts/verify-friends-types.mjs
git commit -m "feat: add friend debt types and firestore services"
```

---

### Task 2: Create Friends Debts Stylesheet & Design Tokens

**Files:**
- Create: `src/design-system/15-friends-debts.css`
- Modify: `src/design-system/index.css`

**Interfaces:**
- Consumes: CSS variables from `01-tokens.css` (`--bg-card`, `--border-subtle`, `--accent-purple`, `--accent-orange`, `--text-primary`, `--weight-regular`, `--weight-bold`).
- Produces: Complete CSS layout and components for Friends KPI grid, Friends cards, transaction badges, direction tags (`lent` vs `borrowed`), settlement progress bars, and modal forms.

- [ ] **Step 1: Write `src/design-system/15-friends-debts.css`**

Create stylesheet with:
- `.friends-view-container`: main view padding and responsive layout.
- `.friends-kpi-grid`: 4-column responsive grid matching `.payments-kpi-grid`.
- `.direction-badge`: green for `lent` (`+ لي`), red/orange for `borrowed` (`- عليّ`).
- `.type-badge`: distinct colors for `money` (blue), `service` (purple), `expense` (amber).
- `.friend-card`: rounded card with hover lift, Blobatar avatar, contact details, balance progress bar, and action buttons.
- `.statement-timeline`: styled chronological transaction list for friend statements.
- Strict typography weights capped at 400 and 450.

- [ ] **Step 2: Import `15-friends-debts.css` in `src/design-system/index.css`**

Add `@import './15-friends-debts.css';` to `src/design-system/index.css`.

- [ ] **Step 3: Run build check**

Run: `npm run build`  
Expected: PASS with 0 CSS bundle errors.

- [ ] **Step 4: Commit**

```bash
git add src/design-system/15-friends-debts.css src/design-system/index.css
git commit -m "feat: add friends debts design tokens and stylesheet"
```

---

### Task 3: Implement Add Friend & Add Transaction Modals

**Files:**
- Create: `src/components/AddFriendModal.tsx`
- Create: `src/components/AddFriendTransactionModal.tsx`

**Interfaces:**
- Consumes: `Friend[]`, `LanguageContext`.
- Produces:
  - `AddFriendModal`: `{ isOpen, onClose, onAddFriend: (friend: Friend) => void }`
  - `AddFriendTransactionModal`: `{ isOpen, onClose, friends: Friend[], defaultFriendId?: string, onAddTransaction: (tx: FriendTransaction) => void, onOpenAddFriend?: () => void }`

- [ ] **Step 1: Implement `AddFriendModal.tsx`**

Fields:
- Name (Required)
- Phone number (Optional, validated format)
- Notes / Context (Optional)
- Cancel & Submit buttons styled with IndFlow form classes (`form-input`, `submit-btn`, `secondary-btn`).
- Full RTL and LTR localization.

- [ ] **Step 2: Implement `AddFriendTransactionModal.tsx`**

Fields:
- Friend Selector (with inline `+ صديق جديد` shortcut button).
- Direction Toggle: Segmented control between `لي (أقرضته / قدمت له خدمة)` and `عليّ (اقترضت منه / قدم لي خدمة)`.
- Transaction Type Selector: Radio cards for `دين نقدي (Money Loan)`, `خدمة / عمل (Service)`, and `نفقة مشتركة (Shared Expense)`.
- Amount in DZD (number input, min 1).
- Description (Required text).
- Date of Transaction (defaults to today).
- Optional Due Date / Reminder date.
- Cancel & Submit buttons.

- [ ] **Step 3: Run build check**

Run: `npm run build`  
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/AddFriendModal.tsx src/components/AddFriendTransactionModal.tsx
git commit -m "feat: add friend and transaction creation modals"
```

---

### Task 4: Implement Settle Transaction Modal & Friend Ledger Statement Modal

**Files:**
- Create: `src/components/SettleTransactionModal.tsx`
- Create: `src/components/FriendLedgerModal.tsx`

**Interfaces:**
- Consumes: `Friend`, `FriendTransaction[]`, `FriendSettlement[]`, `LanguageContext`.
- Produces:
  - `SettleTransactionModal`: `{ isOpen, onClose, transaction: FriendTransaction, onSettle: (settlement: FriendSettlement, updatedTransaction: FriendTransaction) => void }`
  - `FriendLedgerModal`: `{ isOpen, onClose, friend: Friend, transactions: FriendTransaction[], settlements: FriendSettlement[], onOpenAddTransaction: (friendId: string) => void, onOpenSettle: (tx: FriendTransaction) => void, onDeleteTransaction: (txId: string) => void }`

- [ ] **Step 1: Implement `SettleTransactionModal.tsx`**

Features:
- Displays target transaction summary: Description, Total Amount, Already Paid, and Remaining.
- Amount input (defaults to exact remaining balance).
- Validation: Cannot exceed remaining balance or be <= 0.
- Quick buttons: `سداد كامل (100%)` and `نصف المبلغ (50%)`.
- Method selector: `كاش (Cash)`, `بريدي موب (BaridiMob)`, `تحويل بنكي (Bank Transfer)`, `مقاصة خدمة (Service Offset)`, `أخرى (Other)`.
- If `مقاصة خدمة` selected, displays note requirement placeholder: e.g., "أذكر الخدمة التي تم تعويض الدين بها".
- Submitting updates `paid_amount` on `FriendTransaction`, updates `status` (`partially_paid` or `settled`), and records a new `FriendSettlement`.

- [ ] **Step 2: Implement `FriendLedgerModal.tsx`**

Features:
- Header with friend's `UserAvatar`, name, phone (with direct `tel:` or WhatsApp link), and overall net balance banner (colored appropriately).
- Metric stats: Total Owed to You, Total You Owe, Settled count, Pending count.
- Action row: `+ تسجيل معاملة مع هذا الصديق (Add Transaction)`.
- Chronological timeline table of transactions with this friend:
  - Date, Direction tag, Type tag, Description, Total Amount, Remaining Amount, Status tag.
  - Action buttons: Settle (`تسوية`), Delete with confirmation.
  - Expandable / nested settlement history per transaction showing previous payments, dates, and methods.

- [ ] **Step 3: Run build check**

Run: `npm run build`  
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/SettleTransactionModal.tsx src/components/FriendLedgerModal.tsx
git commit -m "feat: add settlement modal and friend ledger statement modal"
```

---

### Task 5: Implement Main Friends Debts View

**Files:**
- Create: `src/components/FriendsDebtsView.tsx`

**Interfaces:**
- Consumes: `friends: Friend[]`, `transactions: FriendTransaction[]`, `settlements: FriendSettlement[]`, CRUD handlers (`onAddFriend`, `onDeleteFriend`, `onAddTransaction`, `onDeleteTransaction`, `onSettleTransaction`).
- Produces: `FriendsDebtsView` React component for the main application shell.

- [ ] **Step 1: Implement `FriendsDebtsView.tsx`**

1. **Header Row**:
   - Title: "ديون ومعاملات الأصدقاء" / "Friends Ledger & Exchanges".
   - Subtitle: "تنظيم وتتبع الديون المتبادلة والخدمات ومقاصة الحسابات مع الأصدقاء".
   - Primary action buttons: `+ تسجيل معاملة جديدة` and `+ صديق جديد`.
2. **Top 4 KPI Cards**:
   - Card 1: **صافي الرصيد العام (Net Balance)**: Total Lent Unpaid minus Total Borrowed Unpaid. Tints green when net > 0, red/orange when net < 0, neutral when 0.
   - Card 2: **ديون لك (Owed to You)**: Sum of all unpaid `lent` amounts.
   - Card 3: **ديون عليك (You Owe)**: Sum of all unpaid `borrowed` amounts.
   - Card 4: **النشاط والمعاملات (Active Engagements)**: Active friends count and pending transactions count.
3. **Controls Toolbar**:
   - Real-time search matching friend name, transaction description, and notes.
   - View mode switcher buttons:
     - `دليل الأصدقاء (Friends Grid)`
     - `سجل كل المعاملات (All Transactions)`
   - Filter dropdowns/pills:
     - Direction filter (`all`, `lent`, `borrowed`)
     - Status filter (`all`, `pending`, `settled`)
     - Type filter (`all`, `money`, `service`, `expense`)
4. **Mode 1 - Friends Cards Grid**:
   - Responsive cards with `UserAvatar`, name, phone, balance progress bar, net balance display pill, and `عرض كشف الحساب (Statement)` button.
5. **Mode 2 - All Transactions Table**:
   - Sortable table with columns: Date, Friend, Direction, Type, Description, Amount, Remaining, Status, and Action buttons (Settle, Delete).
6. **Integrated Modals**:
   - Manages state for `AddFriendModal`, `AddFriendTransactionModal`, `FriendLedgerModal`, and `SettleTransactionModal`.

- [ ] **Step 2: Run build check**

Run: `npm run build`  
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/FriendsDebtsView.tsx
git commit -m "feat: implement primary friends debts view with KPIs and dual views"
```

---

### Task 6: Integrate Friends Ledger into Sidebar & App State

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/App.tsx`
- Create: `scripts/verify-friends-integration.mjs`

**Interfaces:**
- Consumes: `friends`, `friendTransactions`, `friendSettlements` in `App.tsx`.
- Produces: Navigation item in `Sidebar.tsx` under Group 3 with live badge, view routing in `App.tsx` for `activeTab === 'friends-debts'`, and real-time Firestore + `localStorage` persistence.

- [ ] **Step 1: Write integration verification script**

Create `scripts/verify-friends-integration.mjs`:
```javascript
import { readFileSync } from 'fs';

const sidebar = readFileSync('./src/components/Sidebar.tsx', 'utf8');
const app = readFileSync('./src/App.tsx', 'utf8');

let failed = false;
if (!sidebar.includes('friends-debts')) {
  console.error("Sidebar missing 'friends-debts' tab");
  failed = true;
}
if (!app.includes('FriendsDebtsView')) {
  console.error("App.tsx missing 'FriendsDebtsView'");
  failed = true;
}
if (!app.includes('subscribeFriends')) {
  console.error("App.tsx missing 'subscribeFriends' subscription");
  failed = true;
}

if (failed) {
  process.exit(1);
} else {
  console.log('Friends integration verified successfully.');
}
```

- [ ] **Step 2: Run verification script to confirm it fails**

Run: `node scripts/verify-friends-integration.mjs`  
Expected: FAIL with "Sidebar missing 'friends-debts' tab"

- [ ] **Step 3: Update `src/components/Sidebar.tsx`**

1. Import `Handshake` from `lucide-react`.
2. Add `activeFriendDebtsCount?: number` to `SidebarProps`.
3. In Group 3 (**Financials & Contracts**), add navigation button:
```tsx
{/* Friends Debts & Exchanges Ledger */}
<button
  id="sidebarFriendsDebtsBtn"
  onClick={() => onTabChange('friends-debts')}
  className={`nav-btn ${activeTab === 'friends-debts' ? 'active' : ''}`}
>
  <span className="nav-icon">
    <Handshake size={16} />
  </span>
  <span className="nav-label">
    {language === 'ar' ? 'ديون ومعاملات الأصدقاء' : 'Friends Ledger'}
  </span>
  {activeFriendDebtsCount !== undefined && activeFriendDebtsCount > 0 && (
    <span className="nav-badge-purple" style={{ background: '#FFF3E0', color: '#E65100' }}>
      {activeFriendDebtsCount}
    </span>
  )}
</button>
```

- [ ] **Step 4: Update `src/App.tsx`**

1. Import `FriendsDebtsView` from `./components/FriendsDebtsView`.
2. Add state for `friends`, `friendTransactions`, `friendSettlements` with `localStorage` initializers for offline support.
3. Add Firestore subscriptions in the authenticated `useEffect`.
4. Add handlers: `handleAddFriend`, `handleDeleteFriend`, `handleAddFriendTransaction`, `handleDeleteFriendTransaction`, `handleSettleFriendTransaction`.
5. Pass `activeFriendDebtsCount` to `Sidebar`.
6. Add render block:
```tsx
{activeTab === 'friends-debts' && (
  <FriendsDebtsView
    friends={friends}
    transactions={friendTransactions}
    settlements={friendSettlements}
    onAddFriend={handleAddFriend}
    onDeleteFriend={handleDeleteFriend}
    onAddTransaction={handleAddFriendTransaction}
    onDeleteTransaction={handleDeleteFriendTransaction}
    onSettleTransaction={handleSettleFriendTransaction}
  />
)}
```

- [ ] **Step 5: Run integration verification script and full build**

Run: `node scripts/verify-friends-integration.mjs && npm run build`  
Expected: PASS with 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/Sidebar.tsx src/App.tsx scripts/verify-friends-integration.mjs
git commit -m "feat: integrate friends debts into sidebar and app lifecycle"
```

---

### Task 7: End-to-End Verification & Edge Cases Validation

**Files:**
- Create: `scripts/test-friends-ledger-calculations.mjs`

**Interfaces:**
- Validates the calculation engine, overpayment guard, status transitions, and data integrity.

- [ ] **Step 1: Write comprehensive calculation test script**

Create `scripts/test-friends-ledger-calculations.mjs`:
```javascript
// Test Calculation Logic:
const friendA = { id: 'fr_1', name: 'Karim' };
const friendB = { id: 'fr_2', name: 'Yacine' };

const txs = [
  // User lent Karim 10,000 DZD (Karim owes user)
  { id: 'tx_1', friend_id: 'fr_1', direction: 'lent', amount: 10000, paid_amount: 3000, status: 'partially_paid' },
  // Karim lent user 2,000 DZD (User owes Karim)
  { id: 'tx_2', friend_id: 'fr_1', direction: 'borrowed', amount: 2000, paid_amount: 0, status: 'pending' },
  // User lent Yacine 5,000 DZD (Fully paid)
  { id: 'tx_3', friend_id: 'fr_2', direction: 'lent', amount: 5000, paid_amount: 5000, status: 'settled' }
];

// 1. Karim balance:
const karimLentUnpaid = txs.filter(t => t.friend_id === 'fr_1' && t.direction === 'lent').reduce((sum, t) => sum + (t.amount - t.paid_amount), 0);
const karimBorrowedUnpaid = txs.filter(t => t.friend_id === 'fr_1' && t.direction === 'borrowed').reduce((sum, t) => sum + (t.amount - t.paid_amount), 0);
const karimNet = karimLentUnpaid - karimBorrowedUnpaid;

if (karimLentUnpaid !== 7000) throw new Error(`Expected Karim lent unpaid 7000, got ${karimLentUnpaid}`);
if (karimBorrowedUnpaid !== 2000) throw new Error(`Expected Karim borrowed unpaid 2000, got ${karimBorrowedUnpaid}`);
if (karimNet !== 5000) throw new Error(`Expected Karim net 5000, got ${karimNet}`);

// 2. Global KPIs:
const totalOwedToYou = txs.filter(t => t.direction === 'lent').reduce((sum, t) => sum + (t.amount - t.paid_amount), 0);
const totalYouOwe = txs.filter(t => t.direction === 'borrowed').reduce((sum, t) => sum + (t.amount - t.paid_amount), 0);
const globalNet = totalOwedToYou - totalYouOwe;

if (totalOwedToYou !== 7000) throw new Error(`Expected total owed to you 7000, got ${totalOwedToYou}`);
if (totalYouOwe !== 2000) throw new Error(`Expected total you owe 2000, got ${totalYouOwe}`);
if (globalNet !== 5000) throw new Error(`Expected global net 5000, got ${globalNet}`);

console.log('All calculations and balance assertions PASSED successfully.');
```

- [ ] **Step 2: Run calculation test suite**

Run: `node scripts/test-friends-ledger-calculations.mjs`  
Expected: PASS with "All calculations and balance assertions PASSED successfully."

- [ ] **Step 3: Run full application build and lint**

Run: `npm run build && npm run lint`  
Expected: Clean build and clean lint pass.

- [ ] **Step 4: Commit**

```bash
git add scripts/test-friends-ledger-calculations.mjs
git commit -m "test: add friends debts calculation validation suite"
```
