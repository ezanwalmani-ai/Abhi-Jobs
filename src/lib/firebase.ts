import { initializeApp } from 'firebase/app';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from 'firebase/app-check';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getCountFromServer,
  writeBatch,
  runTransaction,
  serverTimestamp,
  getDocFromServer,
  onSnapshot,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase using the existing project configuration
export const app = initializeApp(firebaseConfig);

// CRITICAL: Must explicitly target the existing named Firestore database ID
export const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId;
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// ============================================================================
// FIREBASE APP CHECK (OPT-IN PREPARATION — NOT ENFORCED IN PRODUCTION YET)
// ============================================================================
// App Check activates ONLY when VITE_FIREBASE_APP_CHECK_SITE_KEY is explicitly
// configured in environment variables. It never blocks traffic until enforced
// in the Firebase Console after production verification.
let appCheckInstance: AppCheck | null = null;

export function initFirebaseAppCheckIfConfigured(): AppCheck | null {
  if (appCheckInstance) return appCheckInstance;
  if (typeof window === 'undefined') return null;
  const siteKey = (import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY || '').trim();
  if (!siteKey) return null;

  try {
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
    return appCheckInstance;
  } catch (err) {
    console.warn('Firebase App Check initialization skipped:', err);
    return null;
  }
}

// Attempt opt-in initialization on module load (no-op unless site key is configured)
initFirebaseAppCheckIfConfigured();

// Operation types for standard error handling
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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Non-blocking connection health check using authenticated /test/connection when signed in
// or public_settings metadata when unauthenticated (never relies on open /test/connection reads)
export async function testConnection(): Promise<boolean> {
  try {
    if (auth.currentUser) {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } else {
      await getDocFromServer(doc(db, 'public_settings', 'platform_status'));
    }
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Check network/config.');
      return false;
    }
    // Missing document or permission response still confirms reachable Firestore backend
    return true;
  }
}

export async function ensureUserProfileDoc(
  fbUser: FirebaseUser,
  role: 'job_seeker' | 'employer' = 'job_seeker',
  explicitName?: string
): Promise<{ name: string; email: string; avatar: string }> {
  const rawName =
    explicitName?.trim() ||
    fbUser.displayName ||
    fbUser.email?.split('@')[0] ||
    'ABHI JOBS Member';
  const name = rawName.slice(0, 100);
  const email = (fbUser.email || '').trim().toLowerCase().slice(0, 150);
  const rawAvatar =
    fbUser.photoURL ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
  const avatar = rawAvatar.startsWith('data:') ? '' : rawAvatar.slice(0, 500);

  try {
    const userRef = doc(db, 'users', fbUser.uid);
    const userSnap = await getDoc(userRef);
    const nowLabel = new Date().toISOString().slice(0, 16).replace('T', ' ');
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        id: fbUser.uid,
        name,
        email,
        role,
        ...(avatar ? { avatar } : {}),
        createdAt: fbUser.metadata?.creationTime
          ? new Date(fbUser.metadata.creationTime).toISOString()
          : new Date().toISOString(),
        lastActive: nowLabel,
        status: 'active',
      });
    } else {
      const existingData = userSnap.data();
      if (existingData?.status !== 'suspended') {
        await updateDoc(userRef, {
          lastActive: nowLabel,
        }).catch(() => {});
      }
    }
  } catch (fsErr) {
    console.warn('Firestore user profile sync notice:', fsErr);
  }

  return { name, email, avatar };
}

// Real Firebase Google Sign-In with Popup
export async function signInWithFirebaseGoogle(): Promise<{
  user: FirebaseUser;
  name: string;
  email: string;
  avatar: string;
}> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;
  const profile = await ensureUserProfileDoc(fbUser, 'job_seeker');
  return { user: fbUser, ...profile };
}

// Real Firebase Email & Password Sign-In
export async function signInWithFirebaseEmail(
  email: string,
  password: string
): Promise<{
  user: FirebaseUser;
  name: string;
  email: string;
  avatar: string;
}> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const fbUser = credential.user;
  const profile = await ensureUserProfileDoc(fbUser);
  return { user: fbUser, ...profile };
}

// Real Firebase Email & Password Registration (sends verification email automatically)
export async function registerWithFirebaseEmail(params: {
  email: string;
  password: string;
  displayName: string;
  role: 'job_seeker' | 'employer';
}): Promise<{
  user: FirebaseUser;
  name: string;
  email: string;
  avatar: string;
  verificationEmailSent: boolean;
}> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    params.email.trim(),
    params.password
  );
  const fbUser = credential.user;

  if (params.displayName.trim()) {
    try {
      await updateProfile(fbUser, { displayName: params.displayName.trim() });
    } catch {
      // Non-fatal
    }
  }

  let verificationEmailSent = false;
  try {
    await sendEmailVerification(fbUser);
    verificationEmailSent = true;
  } catch (verifyErr) {
    console.warn('Verification email dispatch notice:', verifyErr);
  }

  const profile = await ensureUserProfileDoc(fbUser, params.role, params.displayName);
  return {
    user: fbUser,
    ...profile,
    verificationEmailSent,
  };
}

// Firebase Password Reset Email (used for both self-service recovery and migrated legacy accounts)
export async function requestFirebasePasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function resendFirebaseEmailVerification(): Promise<boolean> {
  if (!auth.currentUser || auth.currentUser.emailVerified) return false;
  await sendEmailVerification(auth.currentUser);
  return true;
}

export {
  firebaseSignOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getCountFromServer,
  writeBatch,
  runTransaction,
  serverTimestamp,
  getDocFromServer,
  onSnapshot,
};
export type { FirebaseUser, QueryDocumentSnapshot, DocumentData };
