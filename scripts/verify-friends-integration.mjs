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
