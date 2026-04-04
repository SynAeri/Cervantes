// Student login page for La Mancha PWA
// Mobile-optimized visual novel inspired interface with parchment color scheme

'use client';

import { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { apiFetch } from '../../lib/api';

export default function LoginPage() {
  const { signIn, signUp, signInWithGoogle, signInWithMicrosoft, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const registerStudent = async () => {
    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ role: 'student' }),
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
      await registerStudent();
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
      await registerStudent();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithMicrosoft();
      await registerStudent();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Microsoft sign-in failed';
      setError(message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-near-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-terracotta border-t-transparent rounded-full animate-spin"></div>
          <p className="text-parchment/40 text-[10px] uppercase tracking-widest font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-near-black overflow-hidden relative">
      <div className="fixed inset-0 z-0">
        <img
          alt="Cervantes background"
          className="w-full h-full object-cover opacity-30 grayscale"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeqi8VBV0o_QELWaPN9Mqj3PvFt6zHqM3m9ZbStvyDg8swHPmFFJfAqsy5IqEtj3_ELyn97sN7Ut9-6KpDyq8aNwTZyCNyx2GiwUYkiFIyXqXI8BjNDjhcmXiFP1OvD74VAE0OKlB8CWPNHBTYibrScaKqXhKu9HKrfPX-EFe5Ju7fjaVDvzevBB5iQ5v6SpFB0mh8kNq0DHqR0lXkqv8wg_ZBJuO9u6pwdjgPLyvNhTsTG-9hK6BhvIEIwDTbYgBUtACyyOMDv4tq"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-near-black/80 via-near-black/60 to-near-black/95"></div>
      </div>

      <header className="fixed top-4 left-4 z-50 flex items-center px-3 py-1.5 gap-3 bg-near-black/80 backdrop-blur-md border border-parchment/10">
        <div className="flex items-center gap-2 text-parchment">
          <span className="text-sm font-bold tracking-tight">CERVANTES</span>
        </div>
      </header>

      <main className="fixed inset-0 z-10 flex flex-col justify-end pb-8">
        <div className="w-full px-6 pt-12 pb-6 bg-gradient-to-t from-near-black via-near-black/95 to-transparent backdrop-blur-sm">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-3">
                <div className="w-12 h-12 bg-terracotta flex items-center justify-center text-parchment font-extrabold text-xl">
                  C
                </div>
              </div>
              <h1 className="text-xl font-extrabold tracking-tighter text-parchment uppercase mb-1">Student Portal</h1>
              <p className="text-tertiary text-[10px] uppercase tracking-[0.2em]">La Mancha Learning System</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded text-red-300 text-xs font-medium">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="block text-[9px] font-bold uppercase tracking-[0.15em] text-parchment/70">Email</label>
                <div className="relative">
                  <div className="flex items-center border-b border-parchment/20 focus-within:border-terracotta w-full py-3">
                    <span className="material-symbols-outlined text-parchment/60 mr-3 text-base">mail</span>
                    <input
                      className="bg-transparent border-none p-0 focus:ring-0 w-full text-parchment placeholder:text-parchment/30 font-medium outline-none"
                      placeholder="student@university.edu"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-bold uppercase tracking-[0.15em] text-parchment/70">Password</label>
                <div className="relative">
                  <div className="flex items-center border-b border-parchment/20 focus-within:border-terracotta w-full py-3">
                    <span className="material-symbols-outlined text-parchment/60 mr-3 text-base">lock</span>
                    <input
                      className="bg-transparent border-none p-0 focus:ring-0 w-full text-parchment placeholder:text-parchment/30 font-medium outline-none"
                      placeholder="••••••••"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-4">
                <button
                  className="w-full bg-terracotta text-parchment font-bold py-3.5 flex items-center justify-center gap-2 group transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-parchment border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="text-sm tracking-wide">{isSignUp ? 'CREATE ACCOUNT' : 'ENTER'}</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </>
                  )}
                </button>

                <div className="relative flex items-center justify-center py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-parchment/15"></div>
                  </div>
                  <span className="relative bg-near-black px-4 text-[8px] font-bold uppercase tracking-widest text-parchment/40">or</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 py-3 border border-parchment/15 text-parchment/70 hover:bg-parchment/5 transition-all text-xs font-bold disabled:opacity-50"
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
                    className="flex items-center justify-center gap-2 py-3 border border-parchment/15 text-parchment/70 hover:bg-parchment/5 transition-all text-xs font-bold disabled:opacity-50"
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

                <div className="flex justify-center items-center pt-1">
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                    className="text-parchment/40 hover:text-terracotta transition-colors text-[9px] uppercase tracking-widest font-bold"
                  >
                    {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
                  </button>
                </div>
              </div>
            </form>

            <p className="text-center mt-8 text-parchment/40 text-[8px] uppercase tracking-[0.25em] font-medium">
              Secure Student Access v1.0
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
