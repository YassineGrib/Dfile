import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './config';

/**
 * One-time import of the data that was stored in shared top-level collections
 * before data became private per user (users/{uid}/...).
 *
 * The first account to run the import writes legacy_migration/claim with its uid.
 * Firestore rules only let that account read the old collections afterwards, so
 * nobody else can see or claim the data.
 */

const LEGACY_COLLECTIONS = [
  'clients',
  'projects',
  'expenses',
  'invoices',
  'tasks',
  'payments',
  'activities',
  'milestones',
  'contracts',
  'friends',
  'friend_transactions',
  'friend_settlements',
] as const;

const LEGACY_SETTINGS_DOC = ['settings', 'workspace_default'] as const;
const CLAIM_DOC = ['legacy_migration', 'claim'] as const;
const BATCH_SIZE = 400;

export type LegacyImportStatus =
  | 'unavailable' // Firebase off, signed out, or claimed by another account
  | 'available' // nobody has claimed it yet, or this account's import didn't finish
  | 'done'; // this account already imported it

export interface LegacyImportResult {
  imported: number;
  skipped: number;
}

export async function getLegacyImportStatus(): Promise<LegacyImportStatus> {
  const uid = auth?.currentUser?.uid;
  if (!isFirebaseConfigured || !db || !uid) return 'unavailable';
  try {
    const claim = await getDoc(doc(db, ...CLAIM_DOC));
    if (!claim.exists()) return 'available';
    const data = claim.data();
    if (data.uid !== uid) return 'unavailable';
    return data.completed ? 'done' : 'available';
  } catch (err) {
    console.warn('Could not check legacy data status:', err);
    return 'unavailable';
  }
}

/** Write docs into the user's space; if a batch is rejected, retry one by one so one bad doc doesn't block the rest. */
async function copyDocs(
  uid: string,
  collectionName: string,
  docs: { id: string; data: DocumentData }[]
): Promise<LegacyImportResult> {
  const result: LegacyImportResult = { imported: 0, skipped: 0 };
  if (!db) return result;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const d of chunk) {
      batch.set(doc(db, 'users', uid, collectionName, d.id), d.data, { merge: true });
    }
    try {
      await batch.commit();
      result.imported += chunk.length;
    } catch {
      for (const d of chunk) {
        try {
          await setDoc(doc(db, 'users', uid, collectionName, d.id), d.data, { merge: true });
          result.imported += 1;
        } catch (err) {
          console.warn(`Skipped legacy ${collectionName}/${d.id}:`, err);
          result.skipped += 1;
        }
      }
    }
  }
  return result;
}

export async function importLegacyData(): Promise<LegacyImportResult> {
  const uid = auth?.currentUser?.uid;
  if (!isFirebaseConfigured || !db || !uid) {
    throw new Error('You must be signed in to import data.');
  }

  // 1. Claim first. If another account already claimed it, the rules reject this write.
  const claimRef = doc(db, ...CLAIM_DOC);
  const claim = await getDoc(claimRef);
  if (!claim.exists()) {
    await setDoc(claimRef, { uid, claimed_at: new Date().toISOString(), completed: false });
  } else if (claim.data().uid !== uid) {
    throw new Error('This data has already been imported by another account.');
  }

  // 2. Copy every legacy collection into users/{uid}/...
  const total: LegacyImportResult = { imported: 0, skipped: 0 };
  for (const name of LEGACY_COLLECTIONS) {
    const snapshot = await getDocs(collection(db, name));
    const docs = snapshot.docs.map((d) => ({ id: d.id, data: d.data() }));
    const res = await copyDocs(uid, name, docs);
    total.imported += res.imported;
    total.skipped += res.skipped;
  }

  // 3. Copy workspace settings, but never carry over a plaintext PIN
  const legacySettings = await getDoc(doc(db, ...LEGACY_SETTINGS_DOC));
  if (legacySettings.exists()) {
    const { security, ...rest } = legacySettings.data();
    const settings: DocumentData = { ...rest, id: 'workspace' };
    if (security) {
      settings.security = { pin_enabled: false, biometrics_enabled: Boolean(security.biometrics_enabled) };
    }
    await setDoc(doc(db, 'users', uid, 'settings', 'workspace'), settings, { merge: true });
    total.imported += 1;
  }

  await updateDoc(claimRef, { completed: true, completed_at: new Date().toISOString(), ...total });
  return total;
}
