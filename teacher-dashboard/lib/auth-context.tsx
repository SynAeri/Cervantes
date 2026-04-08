'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();
const microsoftProvider = new OAuthProvider('microsoft.com');

// E2E test mode: bypass Firebase auth with a mock user
const isE2ETest = process.env.NEXT_PUBLIC_E2E_TEST === 'true';

export function AuthProvider({ children }: { children: ReactNode }) {
  // In E2E test mode, initialise with a mock user immediately to prevent redirect race
  const [user, setUser] = useState<User | null>(
    isE2ETest ? ({ uid: 'e2e-test-user', email: 'test@cervantes.edu' } as User) : null
  );
  const [token, setToken] = useState<string | null>(isE2ETest ? 'e2e-mock-token' : null);
  const [loading, setLoading] = useState(!isE2ETest);
  const router = useRouter();
  const pathname = usePathname();

  // Listen to auth state and cache the ID token
  useEffect(() => {
    if (isE2ETest) return;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
      } else {
        setToken(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Redirect logic
  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== '/login') {
      router.replace('/login');
    }
    if (user && pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [user, loading, pathname, router]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    router.replace('/login');
  };

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signInWithMicrosoft = async () => {
    await signInWithPopup(auth, microsoftProvider);
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, signIn, signUp, signOut, signInWithGoogle, signInWithMicrosoft }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
