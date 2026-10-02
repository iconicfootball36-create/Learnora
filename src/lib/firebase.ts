import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  initializeFirestore,
  getFirestore, 
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  Firestore
} from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

// In Firebase Web Auth, *.firebaseapp.com may sometimes be unreachable, blocked by firewalls/DNS,
// or experience regional network timeouts. If needed, the authDomain can fallback to the hosting domain
// or the application's current origin.
const effectiveConfig = {
  projectId: config.projectId,
  appId: config.appId,
  apiKey: config.apiKey,
  authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
};

const app: FirebaseApp = getApps().length === 0 ? initializeApp(effectiveConfig) : getApp();
const auth = getAuth(app);

// Use the default Firestore database unless an actual project database ID is explicitly configured.
// This avoids repeated warnings when a custom database ID does not exist in the active Firebase project.
const configuredDatabaseId = (config as any).firestoreDatabaseId || null;
let db: Firestore;
try {
  db = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true,
      localCache: typeof window !== 'undefined' && typeof indexedDB !== 'undefined'
        ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        : memoryLocalCache(),
    },
    configuredDatabaseId || undefined
  );
} catch {
  db = configuredDatabaseId ? getFirestore(app, configuredDatabaseId) : getFirestore(app);
}

const googleProvider = new GoogleAuthProvider();

export {
  app,
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
};
export type { User };
