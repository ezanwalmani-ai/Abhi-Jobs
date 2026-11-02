import { useState, useEffect, useCallback } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, signInWithFirebaseGoogle } from '../lib/firebase';
import { User, UserRole } from '../types';

export interface UseFirebaseAuthReturn {
  /** The raw Firebase User object if signed in */
  firebaseUser: FirebaseUser | null;
  /** The mapped ABHI JOBS application User object */
  user: User | null;
  /** Whether a user is actively authenticated */
  isAuthenticated: boolean;
  /** Whether the initial auth check or action is loading */
  isLoading: boolean;
  /** Any authentication error encountered */
  error: string | null;
  /** Whether the error was due to Firebase auth/unauthorized-domain */
  isUnauthorizedDomain: boolean;
  /** The current host domain that needs authorization in Firebase Console */
  unauthorizedDomain: string;
  /** Triggers the Firebase Google popup login flow and syncs user to Firestore */
  loginWithGoogle: () => Promise<{
    success: boolean;
    user?: User;
    error?: string;
    isUnauthorizedDomain?: boolean;
    hostname?: string;
  }>;
  /** Signs out from Firebase and clears local session persistence */
  logout: () => Promise<void>;
  /** Explicitly fetches or creates the Firestore user document for a Firebase user */
  syncUserProfile: (fbUser: FirebaseUser) => Promise<User>;
  /** Re-reads user profile from Firestore and refreshes local state */
  refreshSession: () => Promise<void>;
}

const STORAGE_KEY = 'abhijobs_currentUser';
const SESSION_FLAG = 'abhijobs_firebase_active';

/**
 * Reusable React hook for Firebase Authentication state management,
 * session persistence, and synchronized login/logout flows.
 */
export function useFirebaseAuth(): UseFirebaseAuthReturn {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(() => auth.currentUser);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore JSON parse errors
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState<boolean>(false);
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string>(currentHostname);

  /**
   * Synchronizes or creates the user record in Firestore
   */
  const syncUserProfile = useCallback(async (fbUser: FirebaseUser): Promise<User> => {
    const userDocRef = doc(db, 'users', fbUser.uid);
    let appUser: User;

    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const role: UserRole = data.role === 'candidate' ? 'job_seeker' : (data.role || 'job_seeker');
        appUser = {
          id: fbUser.uid,
          name: data.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
          email: fbUser.email?.toLowerCase() || data.email || '',
          role,
          avatar:
            data.avatar ||
            fbUser.photoURL ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fbUser.displayName || 'User')}`,
          status: data.status || 'active',
          createdAt: data.createdAt || new Date().toISOString(),
          lastActive: 'Just now',
        };
      } else {
        const displayName = fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User';
        const email = (fbUser.email || '').toLowerCase();
        const avatar =
          fbUser.photoURL ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`;

        appUser = {
          id: fbUser.uid,
          name: displayName,
          email,
          role: 'job_seeker',
          avatar,
          status: 'active',
          createdAt: new Date().toISOString(),
          lastActive: 'Just now',
        };

        await setDoc(
          userDocRef,
          {
            ...appUser,
            lastLoginAt: serverTimestamp(),
            authProvider: 'google',
          },
          { merge: true }
        );
      }
    } catch (fsErr) {
      console.warn('Firestore profile sync warning, falling back to Firebase Auth metadata:', fsErr);
      const displayName = fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User';
      appUser = {
        id: fbUser.uid,
        name: displayName,
        email: (fbUser.email || '').toLowerCase(),
        role: 'job_seeker',
        avatar:
          fbUser.photoURL ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastActive: 'Just now',
      };
    }

    // Persist session to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appUser));
      sessionStorage.setItem(SESSION_FLAG, 'true');
    } catch {}

    setUser(appUser);
    return appUser;
  }, []);

  /**
   * Listen to Firebase onAuthStateChanged for real-time auth synchronization
   */
  useEffect(() => {
    setIsLoading(true);

    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser) => {
        if (fbUser) {
          setFirebaseUser(fbUser);
          try {
            await syncUserProfile(fbUser);
          } catch (err: any) {
            console.error('Error syncing Firebase user profile:', err);
            setError(err?.message || 'Failed to synchronize profile');
          }
        } else {
          setFirebaseUser(null);
          // Only clear if active Firebase session was logged out
          const wasFirebaseSession = sessionStorage.getItem(SESSION_FLAG) === 'true';
          if (wasFirebaseSession) {
            sessionStorage.removeItem(SESSION_FLAG);
            localStorage.removeItem(STORAGE_KEY);
            setUser(null);
          }
        }
        setIsLoading(false);
      },
      (authError) => {
        console.error('Firebase Auth listener error:', authError);
        setError(authError.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [syncUserProfile]);

  /**
   * Google popup login helper
   */
  const loginWithGoogle = useCallback(async (): Promise<{
    success: boolean;
    user?: User;
    error?: string;
    isUnauthorizedDomain?: boolean;
    hostname?: string;
  }> => {
    setIsLoading(true);
    setError(null);
    setIsUnauthorizedDomain(false);

    const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
    setUnauthorizedDomain(currentHost);

    try {
      const fbData = await signInWithFirebaseGoogle();
      const appUser = await syncUserProfile(fbData.user);
      setFirebaseUser(fbData.user);
      setIsUnauthorizedDomain(false);
      return { success: true, user: appUser };
    } catch (err: any) {
      console.error('Firebase Google Auth error:', err);
      const isBlocked = err?.code === 'auth/popup-blocked';
      const isCancelled =
        err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request';
      const isUnauthDomain = err?.code === 'auth/unauthorized-domain';

      if (isUnauthDomain) {
        setIsUnauthorizedDomain(true);
        const errMsg = `Firebase domain authorization required: The domain "${currentHost}" must be added in Firebase Console > Authentication > Settings > Authorized domains.`;
        setError(errMsg);
        return {
          success: false,
          error: errMsg,
          isUnauthorizedDomain: true,
          hostname: currentHost,
        };
      }

      const errMsg = isBlocked
        ? 'Popup was blocked by your browser. Please allow popups or use account selector.'
        : isCancelled
        ? 'Google sign-in popup was cancelled.'
        : err?.message || 'Google authentication encountered an error.';

      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setIsLoading(false);
    }
  }, [syncUserProfile]);

  /**
   * Complete logout helper
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      setFirebaseUser(null);
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(SESSION_FLAG);
    } catch (err: any) {
      console.error('Firebase logout error:', err);
      setError(err?.message || 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Manual session refresh
   */
  const refreshSession = useCallback(async (): Promise<void> => {
    if (auth.currentUser) {
      setIsLoading(true);
      await syncUserProfile(auth.currentUser);
      setIsLoading(false);
    }
  }, [syncUserProfile]);

  const isAuthenticated = Boolean(firebaseUser || user);

  return {
    firebaseUser,
    user,
    isAuthenticated,
    isLoading,
    error,
    isUnauthorizedDomain,
    unauthorizedDomain,
    loginWithGoogle,
    logout,
    syncUserProfile,
    refreshSession,
  };
}

export default useFirebaseAuth;
