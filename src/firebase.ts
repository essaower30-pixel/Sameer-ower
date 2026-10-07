import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Test Connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }
    await getDocFromServer(doc(db, 'workshop_settings', 'connection_test'));
    return true;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('Could not reach Cloud Firestore backend'))) {
      console.warn('Firebase client is offline / standby. Using local cached data.');
    }
    return false;
  }
}

export default app;
