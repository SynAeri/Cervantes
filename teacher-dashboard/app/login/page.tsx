// Login page for La Mancha - PWA teacher dashboard
// Styled based on Windmill Scholarly Systems design system

'use client';

import { useState } from 'react';
import { WheatField } from '../components/WheatField';
import { useAuth } from '../../lib/auth-context';
import { apiFetch } from '../../lib/api';

export default function LoginPage() {
  const { signIn, signUp, signInWithGoogle, signInWithMicrosoft, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const registerProfessor = async () => {
    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ role: 'professor' }),
      });
    } catch {
      // Registration may fail if user already exists, that's fine
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      await registerProfessor();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      await registerProfessor();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      if (message.includes('auth/unauthorized-domain')) {
        setError('This domain is not authorised for Google sign-in. Please use email/password or contact your administrator.');
      } else if (message.includes('auth/popup-closed-by-user')) {
        setError('Sign-in popup was closed. Please try again.');
      } else if (message.includes('auth/popup-blocked')) {
        setError('Popup blocked by browser. Please allow popups for this site.');
      } else {
        setError(message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim() || 'Google sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithMicrosoft();
      await registerProfessor();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Microsoft sign-in failed';
      if (message.includes('auth/unauthorized-domain')) {
        setError('This domain is not authorised for Microsoft sign-in. Please use email/password or contact your administrator.');
      } else if (message.includes('auth/popup-closed-by-user')) {
        setError('Sign-in popup was closed. Please try again.');
      } else if (message.includes('auth/popup-blocked')) {
        setError('Popup blocked by browser. Please allow popups for this site.');
      } else {
        setError(message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim() || 'Microsoft sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-terracotta border-t-transparent rounded-full animate-spin"></div>
          <p className="text-tertiary text-xs uppercase tracking-widest font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-parchment">
      <WheatField />
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none z-[2]">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-terracotta/20 blur-[120px] rounded-full"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-wheat-gold/20 blur-[120px] rounded-full"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-terracotta rounded-lg flex items-center justify-center text-parchment font-extrabold text-2xl">
                C
              </div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tighter text-primary uppercase">Cervantes</h1>
            <p className="text-tertiary font-label uppercase tracking-[0.15em] text-xs mt-2">Scholarly Assessment System</p>
          </div>

          <div className="bg-warm-white shadow-[0_24px_40px_rgba(30,28,24,0.15)] border border-warm-grey rounded-xl p-10 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-terracotta/30 to-transparent"></div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-tertiary">Email Address</label>
                <div className="relative">
                  <div className="flex items-center border-b border-warm-grey focus-within:border-terracotta w-full py-3">
                    <span className="material-symbols-outlined text-tertiary mr-3 text-lg">mail</span>
                    <input
                      className="bg-transparent border-none p-0 focus:ring-0 w-full text-primary placeholder:text-tertiary/40 font-medium outline-none"
                      placeholder="professor@university.edu"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-tertiary">Password</label>
                <div className="relative">
                  <div className="flex items-center border-b border-warm-grey focus-within:border-terracotta w-full py-3">
                    <span className="material-symbols-outlined text-tertiary mr-3 text-lg">lock</span>
                    <input
                      className="bg-transparent border-none p-0 focus:ring-0 w-full text-primary placeholder:text-tertiary/40 font-medium outline-none"
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="material-symbols-outlined text-tertiary hover:text-terracotta cursor-pointer text-lg"
                    >
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <button
                  className="w-full bg-terracotta text-parchment font-bold py-4 rounded-lg flex items-center justify-center gap-2 group transition-all hover:scale-[1.01] active:scale-[0.98] hover:bg-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-parchment border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>{isSignUp ? 'CREATE ACCOUNT' : 'AUTHENTICATE'}</span>
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </>
                  )}
                </button>

                <div className="relative flex items-center justify-center py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-warm-grey"></div>
                  </div>
                  <span className="relative bg-warm-white px-4 text-[10px] font-bold uppercase tracking-widest text-tertiary">or continue with</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 py-3 border border-warm-grey rounded-lg text-primary hover:bg-parchment/50 transition-all text-xs font-bold disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={handleMicrosoftSignIn}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 py-3 border border-warm-grey rounded-lg text-primary hover:bg-parchment/50 transition-all text-xs font-bold disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <rect fill="#F25022" x="1" y="1" width="10" height="10"/>
                      <rect fill="#7FBA00" x="13" y="1" width="10" height="10"/>
                      <rect fill="#00A4EF" x="1" y="13" width="10" height="10"/>
                      <rect fill="#FFB900" x="13" y="13" width="10" height="10"/>
                    </svg>
                    Microsoft
                  </button>
                </div>

                <div className="flex justify-center items-center text-[11px] font-semibold uppercase tracking-wider px-1 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                    className="text-tertiary hover:text-terracotta transition-colors"
                  >
                    {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <p className="text-center mt-12 text-tertiary/60 text-[10px] uppercase tracking-[0.2em] font-medium">
            Encrypted Portal • Scholarly Systems v1.0.0
          </p>
        </div>
      </main>

      <footer className="w-full py-8 border-t border-warm-grey bg-warm-white flex justify-between items-center px-12 relative z-10">
        <div className="text-[11px] font-medium text-tertiary/60 font-label tracking-wide uppercase">
          &copy; 2025 La Mancha
        </div>
        <div className="flex gap-8">
          <a className="text-[11px] font-medium text-tertiary hover:text-terracotta transition-colors font-label tracking-wide uppercase" href="#">Institutional Access</a>
          <a className="text-[11px] font-medium text-tertiary hover:text-terracotta transition-colors font-label tracking-wide uppercase" href="#">API</a>
          <a className="text-[11px] font-medium text-tertiary hover:text-terracotta transition-colors font-label tracking-wide uppercase" href="#">Privacy</a>
        </div>
      </footer>
    </div>
  );
}
