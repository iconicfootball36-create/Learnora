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

// Use the specific firestoreDatabaseId provisioned in AI Studio with resilient network settings.
// experimentalForceLongPolling eliminates WebChannel streaming drops in iframe/preview environments.
const databaseId = (config as any).firestoreDatabaseId || 'ai-studio-189ac80e-2fad-4aed-9e25-ea8469c78882';
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
    databaseId
  );
} catch {
  db = getFirestore(app, databaseId);
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
