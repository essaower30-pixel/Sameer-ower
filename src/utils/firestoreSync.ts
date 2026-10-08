import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { CustomerOrder, SupplierPurchaseInvoice, WorkshopExpense, WorkshopSettings } from '../types';

export interface SyncStatus {
  lastSynced: string | null;
  isSyncing: boolean;
  error: string | null;
}

// 1. Sync Settings to Firestore
export async function syncSettingsToFirestore(settings: WorkshopSettings): Promise<void> {
  const path = 'workshop_settings/main_profile';
  try {
    await setDoc(doc(db, 'workshop_settings', 'main_profile'), settings);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

// 2. Sync Orders to Firestore
export async function syncOrderToFirestore(order: CustomerOrder): Promise<void> {
  const path = `customer_orders/${order.id}`;
  try {
    await setDoc(doc(db, 'customer_orders', order.id), order);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  const path = `customer_orders/${orderId}`;
  try {
    await deleteDoc(doc(db, 'customer_orders', orderId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// 3. Sync Supplier Invoices to Firestore
export async function syncPurchaseInvoiceToFirestore(invoice: SupplierPurchaseInvoice): Promise<void> {
  const path = `supplier_invoices/${invoice.id}`;
  try {
    await setDoc(doc(db, 'supplier_invoices', invoice.id), invoice);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function deletePurchaseInvoiceFromFirestore(invoiceId: string): Promise<void> {
  const path = `supplier_invoices/${invoiceId}`;
  try {
    await deleteDoc(doc(db, 'supplier_invoices', invoiceId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// 4. Sync Expenses to Firestore
export async function syncExpenseToFirestore(expense: WorkshopExpense): Promise<void> {
  const path = `workshop_expenses/${expense.id}`;
  try {
    await setDoc(doc(db, 'workshop_expenses', expense.id), expense);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function deleteExpenseFromFirestore(expenseId: string): Promise<void> {
  const path = `workshop_expenses/${expenseId}`;
  try {
    await deleteDoc(doc(db, 'workshop_expenses', expenseId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// 5. Full Backup / Restore with Firestore
export async function backupAllToFirestore(data: {
  settings: WorkshopSettings;
  orders: CustomerOrder[];
  purchases: SupplierPurchaseInvoice[];
  expenses: WorkshopExpense[];
}): Promise<void> {
  await syncSettingsToFirestore(data.settings);

  for (const o of data.orders) {
    await syncOrderToFirestore(o);
  }
  for (const p of data.purchases) {
    await syncPurchaseInvoiceToFirestore(p);
  }
  for (const e of data.expenses) {
    await syncExpenseToFirestore(e);
  }
}

export async function loadAllFromFirestore(): Promise<{
  settings: WorkshopSettings | null;
  orders: CustomerOrder[];
  purchases: SupplierPurchaseInvoice[];
  expenses: WorkshopExpense[];
} | null> {
  try {
    const ordersSnap = await getDocs(collection(db, 'customer_orders'));
    const purchasesSnap = await getDocs(collection(db, 'supplier_invoices'));
    const expensesSnap = await getDocs(collection(db, 'workshop_expenses'));
    const settingsSnap = await getDocs(collection(db, 'workshop_settings'));

    let settings: WorkshopSettings | null = null;
    settingsSnap.forEach((d) => {
      if (d.id === 'main_profile') {
        settings = d.data() as WorkshopSettings;
      }
    });

    const orders: CustomerOrder[] = [];
    ordersSnap.forEach((d) => orders.push(d.data() as CustomerOrder));

    const purchases: SupplierPurchaseInvoice[] = [];
    purchasesSnap.forEach((d) => purchases.push(d.data() as SupplierPurchaseInvoice));

    const expenses: WorkshopExpense[] = [];
    expensesSnap.forEach((d) => expenses.push(d.data() as WorkshopExpense));

    return { settings, orders, purchases, expenses };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'all_collections');
    return null;
  }
}
