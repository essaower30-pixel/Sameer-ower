import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID and auto-detect long polling for resilient connections
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
} catch {
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreDb;
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  // Only throw structured error if permission-related or missing configuration
  if (errMessage.includes('insufficient permissions') || errMessage.includes('Missing or insufficient permissions')) {
    console.error('Firestore Permission Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else {
    console.warn('Firestore Operation Notice: ', errMessage);
  }
}

// Test Connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('client is offline') || error.message.includes('Could not reach Cloud Firestore backend') || error.message.includes('unavailable'))) {
      console.warn('Firebase client is in offline/cache mode. Operating seamlessly with local cache.');
    }
    return false;
  }
}

export default app;
