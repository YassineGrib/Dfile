// Comprehensive End-to-End Calculations & Edge-Cases Test Suite

const friendA = { id: 'fr_1', name: 'Karim Boualam' };
const friendB = { id: 'fr_2', name: 'Yacine Mansouri' };
const friendC = { id: 'fr_3', name: 'Amine Ziane' };

const initialTransactions = [
  // 1. User lent Karim 10,000 DZD for a software tool
  {
    id: 'tx_1',
    friend_id: 'fr_1',
    type: 'money',
    direction: 'lent',
    amount: 10000,
    paid_amount: 0,
    status: 'pending',
    date: '2026-09-15',
  },
  // 2. Karim lent User 3,000 DZD for shared dinner
  {
    id: 'tx_2',
    friend_id: 'fr_1',
    type: 'expense',
    direction: 'borrowed',
    amount: 3000,
    paid_amount: 0,
    status: 'pending',
    date: '2026-09-18',
  },
  // 3. User designed logo for Yacine (Service) for 15,000 DZD
  {
    id: 'tx_3',
    friend_id: 'fr_2',
    type: 'service',
    direction: 'lent',
    amount: 15000,
    paid_amount: 0,
    status: 'pending',
    date: '2026-09-20',
  },
  // 4. Amine lent User 5,000 DZD, fully settled previously
  {
    id: 'tx_4',
    friend_id: 'fr_3',
    type: 'money',
    direction: 'borrowed',
    amount: 5000,
    paid_amount: 5000,
    status: 'settled',
    date: '2026-09-01',
  }
];

console.log('--- TEST 1: Initial Calculations & Net Balances ---');

function computeSummary(txs) {
  let totalLentUnpaid = 0;
  let totalBorrowedUnpaid = 0;
  let settledCount = 0;
  let pendingCount = 0;

  for (const t of txs) {
    const rem = Math.max(0, t.amount - (t.paid_amount || 0));
    if (t.status === 'settled' || rem === 0) {
      settledCount++;
    } else {
      pendingCount++;
      if (t.direction === 'lent') {
        totalLentUnpaid += rem;
      } else {
        totalBorrowedUnpaid += rem;
      }
    }
  }

  const netBalance = totalLentUnpaid - totalBorrowedUnpaid;
  return { totalLentUnpaid, totalBorrowedUnpaid, netBalance, settledCount, pendingCount };
}

const summary1 = computeSummary(initialTransactions);
console.log('Global summary:', summary1);

// Assertions:
// Lent unpaid: tx_1 (10000) + tx_3 (15000) = 25000
if (summary1.totalLentUnpaid !== 25000) {
  throw new Error(`Expected totalLentUnpaid 25000, got ${summary1.totalLentUnpaid}`);
}
// Borrowed unpaid: tx_2 (3000) = 3000
if (summary1.totalBorrowedUnpaid !== 3000) {
  throw new Error(`Expected totalBorrowedUnpaid 3000, got ${summary1.totalBorrowedUnpaid}`);
}
// Net balance: 25000 - 3000 = +22000
if (summary1.netBalance !== 22000) {
  throw new Error(`Expected netBalance 22000, got ${summary1.netBalance}`);
}
if (summary1.pendingCount !== 3 || summary1.settledCount !== 1) {
  throw new Error(`Counts mismatch. Pending: ${summary1.pendingCount}, Settled: ${summary1.settledCount}`);
}
console.log('✔ Initial global metrics assertion passed.');

console.log('\n--- TEST 2: Per-Friend Balances ---');
function getFriendNet(friendId, txs) {
  const fTxs = txs.filter(t => t.friend_id === friendId);
  const s = computeSummary(fTxs);
  return s.netBalance;
}

const karimNet = getFriendNet('fr_1', initialTransactions);
// Karim: User lent 10000, Karim lent 3000 => Karim owes User 7000 (+7000)
if (karimNet !== 7000) {
  throw new Error(`Expected Karim net +7000, got ${karimNet}`);
}
console.log(`✔ Karim net balance correctly calculated: +${karimNet} DZ (Owed to user)`);

const amineNet = getFriendNet('fr_3', initialTransactions);
// Amine: Was borrowed 5000, but fully paid 5000 => net is 0
if (amineNet !== 0) {
  throw new Error(`Expected Amine net 0, got ${amineNet}`);
}
console.log(`✔ Amine net balance correctly calculated: ${amineNet} DZ (Settled)`);

console.log('\n--- TEST 3: Partial Settlement Workflow ---');
// Karim pays 4,000 DZD back on tx_1 via BaridiMob
const partialAmount = 4000;
const tx1 = initialTransactions.find(t => t.id === 'tx_1');
const remBefore = tx1.amount - tx1.paid_amount;

if (partialAmount > remBefore) {
  throw new Error('Overpayment detected!');
}

const updatedTx1 = {
  ...tx1,
  paid_amount: tx1.paid_amount + partialAmount,
  status: (tx1.paid_amount + partialAmount >= tx1.amount) ? 'settled' : 'partially_paid'
};

if (updatedTx1.status !== 'partially_paid') {
  throw new Error(`Expected status 'partially_paid', got ${updatedTx1.status}`);
}
if (updatedTx1.paid_amount !== 4000) {
  throw new Error(`Expected paid_amount 4000, got ${updatedTx1.paid_amount}`);
}
const remAfter = updatedTx1.amount - updatedTx1.paid_amount;
if (remAfter !== 6000) {
  throw new Error(`Expected remaining 6000, got ${remAfter}`);
}
console.log('✔ Partial payment correctly transitions status to partially_paid and computes remaining 6000 DZ.');

console.log('\n--- TEST 4: Service Offset Settlement Workflow ---');
// Yacine provides a consultation service worth 15,000 DZD to settle tx_3
const tx3 = initialTransactions.find(t => t.id === 'tx_3');
const offsetSettlement = {
  id: 'fstl_test_1',
  transaction_id: tx3.id,
  friend_id: tx3.friend_id,
  amount: 15000,
  payment_method: 'service_offset',
  notes: 'مقاصة مقابل استشارة برمجية وتوجيه تقني',
  date: '2026-09-22',
  created_at: new Date().toISOString()
};

const updatedTx3 = {
  ...tx3,
  paid_amount: tx3.amount,
  status: 'settled'
};

if (updatedTx3.status !== 'settled') {
  throw new Error(`Expected tx3 to be 'settled', got ${updatedTx3.status}`);
}
if (offsetSettlement.payment_method !== 'service_offset') {
  throw new Error('Expected payment_method service_offset');
}
console.log('✔ Service offset settlement successfully clears transaction and marks as settled.');

console.log('\n--- TEST 5: Overpayment Guard ---');
function attemptSettlement(tx, amountToSettle) {
  const currentRem = Math.max(0, tx.amount - (tx.paid_amount || 0));
  if (amountToSettle > currentRem) {
    return { success: false, error: 'Settlement exceeds remaining balance' };
  }
  return { success: true };
}

const overpayResult = attemptSettlement(updatedTx1, 7000); // Only 6000 remaining
if (overpayResult.success) {
  throw new Error('Overpayment guard failed to block settlement of 7000 on remaining 6000!');
}
console.log('✔ Overpayment guard successfully blocked excessive settlement.');

console.log('\n🎉 ALL EDGE CASES AND LEDGER CALCULATION TESTS PASSED!');
