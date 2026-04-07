# Firebase Auth in Next.js (Frontend)

> Setup for teacher-dashboard (port 3000) and student-dashboard (port 3001).
> Last updated: 2026-04-04

---

## Installation

Both dashboards need the Firebase client SDK:

```bash
npm install firebase
```

Currently the dashboards use Next.js 16.2.2 with React 19.

---

## Firebase Configuration

### 1. Create Firebase Web App

Firebase Console > Project Settings > General > Your Apps > Add App (Web icon `</>`) > Register.

### 2. Environment Variables

Create `.env.local` in each dashboard root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cervantes-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cervantes-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cervantes-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

`NEXT_PUBLIC_` prefix makes these available in the browser. These are **safe to expose** -- Firebase security rules + backend token verification are what protect data.

### 3. Firebase Client Initialization

```typescript
// lib/firebase.ts  (shared between both dashboards)

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Prevent re-initialization in dev (hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
```

---

## Authentication Flows

### Email + Password Registration

```typescript
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";

async function registerWithEmail(email: string, password: string, displayName: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName });

  // Get ID token to send to backend for profile creation
  const idToken = await userCredential.user.getIdToken();

  // Call FastAPI backend to create professor/student profile
  await fetch("http://localhost:8000/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      role: "professor",  // or "student"
      institution: "University of ...",
      // ... other profile fields
    }),
  });

  return userCredential.user;
}
```

### Email + Password Login

```typescript
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

async function loginWithEmail(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}
```

### Google Sign-In

```typescript
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();

async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  // result.user contains uid, email, displayName, photoURL
  return result.user;
}
```

Enable Google sign-in in Firebase Console: Authentication > Sign-in method > Google > Enable.

### Sign Out

```typescript
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

async function logout() {
  await signOut(auth);
}
```

### Password Reset

```typescript
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}
```

---

## Auth State Management

### React Context Pattern

```typescript
// contexts/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  getIdToken: async () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const getIdToken = async () => {
    if (!user) return null;
    return user.getIdToken();  // auto-refreshes if expired
  };

  return (
    <AuthContext.Provider value={{ user, loading, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Wrap the App

```typescript
// app/layout.tsx
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

---

## Passing ID Tokens to the FastAPI Backend

### API Client Helper

```typescript
// lib/api.ts

import { auth } from "@/lib/firebase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// Usage:
// const arcs = await apiFetch("/api/arcs");
// await apiFetch("/api/arcs", { method: "POST", body: JSON.stringify(data) });
```

### Key Point: Token Auto-Refresh

`user.getIdToken()` automatically refreshes the token if it is expired (tokens last 1 hour). You do NOT need to manually manage refresh tokens.

To force refresh: `user.getIdToken(true)`.

---

## Route Protection (Client-Side)

```typescript
// components/ProtectedRoute.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return <>{children}</>;
}
```

---

## Difference Between Teacher and Student Dashboards

Since they are separate Next.js apps on different ports:

- **teacher-dashboard (3000):** Uses same Firebase project, registers users with `role: "professor"`
- **student-dashboard (3001):** Same Firebase project, registers users with `role: "student"`
- Both share the same `lib/firebase.ts` config (same project credentials)
- Role enforcement happens on the **backend** via custom claims (see `02-auth-backend.md`)
- Optionally, the frontend can read custom claims from the token to hide/show UI elements:

```typescript
const tokenResult = await user.getIdTokenResult();
const role = tokenResult.claims.role;  // "professor" or "student"
```

---

## Optional: next-firebase-auth-edge

For SSR-heavy Next.js apps, consider `next-firebase-auth-edge` which handles:
- Server-side token verification in middleware
- Cookie-based sessions
- Works with App Router

```bash
npm install next-firebase-auth-edge
```

This is more relevant if you need server-side rendering with auth. For a client-side SPA pattern (which is simpler), the approach above is sufficient.

---

## Sources

- [Firebase Codelab: Next.js + Firebase](https://firebase.google.com/codelabs/firebase-nextjs)
- [Next.js Firebase Auth with Google Sign-In (DEV)](https://dev.to/yutakusuno/nextjs14-firebase-authentication-with-google-sign-in-using-cookies-middleware-and-server-actions-48h4)
- [Implementing Auth in Next.js with Firebase (LogRocket)](https://blog.logrocket.com/implementing-authentication-in-next-js-with-firebase/)
- [Authenticated SSR with Next.js and Firebase](https://colinhacks.com/essays/nextjs-firebase-authentication)
- [next-firebase-auth-edge docs](https://next-firebase-auth-edge-docs.vercel.app/docs/usage/client-side-apis)
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
