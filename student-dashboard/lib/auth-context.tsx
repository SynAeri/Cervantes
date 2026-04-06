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
import { apiFetch } from '../app/lib/api';

interface StudentProfile {
  student_id: string;
  full_name: string;
  email: string;
  enrolled_classes: string[];
}

interface AuthContextType {
  user: User | null;
  studentProfile: StudentProfile | null;
  loading: boolean;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  loginWithStudentId: (studentId: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();
const microsoftProvider = new OAuthProvider('microsoft.com');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Listen to auth state and cache the ID token
  useEffect(() => {
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

  // Restore student profile from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('student_profile');
    if (stored) {
      try {
        setStudentProfile(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('student_profile');
      }
    }
  }, []);

  // Redirect logic - allow student profile OR Firebase user
  useEffect(() => {
    if (loading) return;
    const isAuthenticated = user || studentProfile;
    if (!isAuthenticated && pathname !== '/login') {
      router.replace('/login');
    }
    if (isAuthenticated && pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [user, studentProfile, loading, pathname, router]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setStudentProfile(null);
    localStorage.removeItem('student_profile');
    router.replace('/login');
  };

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signInWithMicrosoft = async () => {
    await signInWithPopup(auth, microsoftProvider);
  };

  const loginWithStudentId = async (studentId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiFetch<{ success: boolean; message?: string; student?: StudentProfile }>('/api/auth/student-login', {
        method: 'POST',
        body: JSON.stringify({ student_id: studentId }),
      });

      if (response.success && response.student) {
        setStudentProfile(response.student);
        localStorage.setItem('student_profile', JSON.stringify(response.student));
        return { success: true };
      }

      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      studentProfile,
      loading,
      token,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      signInWithMicrosoft,
      loginWithStudentId
    }}>
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
