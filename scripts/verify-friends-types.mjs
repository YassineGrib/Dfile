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
