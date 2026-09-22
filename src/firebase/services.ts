import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc,
  onSnapshot 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import type { Client, Project, Expense, Invoice, Task, Payment, Activity, Milestone, Contract } from '../types';

/**
 * Generic Firestore collection fetcher
 */
export async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as T));
  } catch (err) {
    console.error(`Error fetching collection ${collectionName} from Firestore:`, err);
    return [];
  }
}

/**
 * Generic Firestore collection real-time listener (onSnapshot)
 */
export function subscribeCollection<T>(
  collectionName: string, 
  callback: (items: T[]) => void
): () => void {
  if (!isFirebaseConfigured || !db) return () => {};
  try {
    const colRef = collection(db, collectionName);
    return onSnapshot(
      colRef, 
      (snapshot) => {
        const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as T));
        callback(items);
      },
      (err) => {
        console.warn(`Firestore real-time listener on ${collectionName}:`, err.message);
      }
    );
  } catch (err) {
    console.error(`Error setting up listener for ${collectionName}:`, err);
    return () => {};
  }
}

/**
 * Generic Firestore document saver
 */
export async function saveDocument<T extends { id: string }>(
  collectionName: string, 
  item: T
): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const docRef = doc(db, collectionName, item.id);
    // Cleanly strip any undefined values that Firestore rejects
    const cleanItem = JSON.parse(JSON.stringify(item));
    await setDoc(docRef, cleanItem, { merge: true });
  } catch (err) {
    console.error(`Error saving document ${item.id} in ${collectionName}:`, err);
  }
}

/**
 * Generic Firestore document deleter
 */
export async function removeDocument(collectionName: string, id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`Error deleting document ${id} from ${collectionName}:`, err);
  }
}

// ── Specific Collection Helpers ──

export const firestoreService = {
  // Clients
  getClients: () => fetchCollection<Client>('clients'),
  subscribeClients: (cb: (c: Client[]) => void) => subscribeCollection<Client>('clients', cb),
  saveClient: (client: Client) => saveDocument('clients', client),
  deleteClient: (id: string) => removeDocument('clients', id),

  // Projects
  getProjects: () => fetchCollection<Project>('projects'),
  subscribeProjects: (cb: (p: Project[]) => void) => subscribeCollection<Project>('projects', cb),
  saveProject: (project: Project) => saveDocument('projects', project),
  deleteProject: (id: string) => removeDocument('projects', id),

  // Expenses
  getExpenses: () => fetchCollection<Expense>('expenses'),
  subscribeExpenses: (cb: (e: Expense[]) => void) => subscribeCollection<Expense>('expenses', cb),
  saveExpense: (expense: Expense) => saveDocument('expenses', expense),
  deleteExpense: (id: string) => removeDocument('expenses', id),

  // Invoices
  getInvoices: () => fetchCollection<Invoice>('invoices'),
  subscribeInvoices: (cb: (i: Invoice[]) => void) => subscribeCollection<Invoice>('invoices', cb),
  saveInvoice: (invoice: Invoice) => saveDocument('invoices', invoice),
  deleteInvoice: (id: string) => removeDocument('invoices', id),

  // Tasks
  getTasks: () => fetchCollection<Task>('tasks'),
  subscribeTasks: (cb: (t: Task[]) => void) => subscribeCollection<Task>('tasks', cb),
  saveTask: (task: Task) => saveDocument('tasks', task),
  deleteTask: (id: string) => removeDocument('tasks', id),

  // Payments
  getPayments: () => fetchCollection<Payment>('payments'),
  subscribePayments: (cb: (p: Payment[]) => void) => subscribeCollection<Payment>('payments', cb),
  savePayment: (payment: Payment) => saveDocument('payments', payment),
  deletePayment: (id: string) => removeDocument('payments', id),

  // Activities
  getActivities: () => fetchCollection<Activity>('activities'),
  subscribeActivities: (cb: (a: Activity[]) => void) => subscribeCollection<Activity>('activities', cb),
  saveActivity: (activity: Activity) => saveDocument('activities', activity),

  // Milestones (Deadlines)
  getMilestones: () => fetchCollection<Milestone>('milestones'),
  subscribeMilestones: (cb: (m: Milestone[]) => void) => subscribeCollection<Milestone>('milestones', cb),
  saveMilestone: (milestone: Milestone) => saveDocument('milestones', milestone),
  deleteMilestone: (id: string) => removeDocument('milestones', id),

  // Contracts
  getContracts: () => fetchCollection<Contract>('contracts'),
  subscribeContracts: (cb: (c: Contract[]) => void) => subscribeCollection<Contract>('contracts', cb),
  saveContract: (contract: Contract) => saveDocument('contracts', contract),
  deleteContract: (id: string) => removeDocument('contracts', id),
};

