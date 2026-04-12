// Arc landing page - demo mode entry: accepts any visitor name, maps to mock student
// Replaces student-ID check with demo-access endpoint for LinkedIn showcase

'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../lib/api';
import { Modal } from '../components/Modal';

const DEMO_EXPIRES = new Date('2026-04-19T23:59:59Z');

export function ArcLandingClient({ params }: { params: Promise<{ arcId: string }> }) {
  const { arcId } = use(params);
  const [visitorName, setVisitorName] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState<'processing' | 'rate_limited' | 'expired' | 'generic' | null>(null);
  const router = useRouter();

  const isDemoExpired = new Date() > DEMO_EXPIRES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) return;

    setIsChecking(true);

    try {
      const response = await fetch(`${BASE_URL}/api/demo/arc/${arcId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_name: visitorName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 410 || data?.detail === 'demo_expired') {
          setErrorType('expired');
          setErrorMessage('The demo period has ended. Thank you for your interest in Cervantes!');
        } else {
          setErrorType('generic');
          setErrorMessage(data?.detail || 'Something went wrong. Please try again.');
        }
        return;
      }

      const data = await response.json();

      if (data.status === 'ready') {
        localStorage.setItem('currentStudentId', data.student_id);
        localStorage.setItem('currentArcId', arcId);
        localStorage.setItem('demoSessionId', data.session_id);
        localStorage.setItem('visitorName', visitorName.trim());
        localStorage.setItem('turnsRemaining', String(data.turns_remaining));

        const firstSceneId = data.first_assignment?.scene_id;
        const firstSceneOrder = data.first_assignment?.scene_order;
        if (firstSceneId) {
          router.push(`/scene/${firstSceneId}?studentId=${data.student_id}&arcId=${arcId}&sceneOrder=${firstSceneOrder}`);
        } else {
          setErrorType('processing');
          setErrorMessage('Demo scenes are still being set up. Please check back shortly.');
        }
      } else if (data.status === 'processing') {
        setErrorType('processing');
        setErrorMessage('The demo arc is still being set up. Please check back shortly.');
      } else if (data.status === 'rate_limited') {
        setErrorType('rate_limited');
        setErrorMessage(data.message || 'You have used all your demo turns.');
      }
    } catch (error) {
      console.error('Demo access failed:', error);
      setErrorType('generic');
      setErrorMessage('Failed to connect to server. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const resetForm = () => {
    setErrorType(null);
    setErrorMessage('');
  };

  if (isDemoExpired) {
    return (
      <div className="min-h-screen flex flex-col bg-near-black items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-terracotta/20 rounded-xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl text-terracotta">lock_clock</span>
          </div>
          <h1 className="text-2xl font-extrabold text-parchment mb-3 tracking-tight">Demo Period Ended</h1>
          <p className="text-parchment/60 text-sm leading-relaxed">
            Thank you for your interest in Cervantes. The public demo has concluded.
          </p>
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
        <span className="text-[9px] font-bold uppercase tracking-widest text-terracotta bg-terracotta/10 px-2 py-0.5 rounded">DEMO</span>
      </header>

      <main className="fixed inset-0 z-10 flex flex-col justify-end pb-8">
        <div className="w-full px-6 pt-12 pb-6 bg-gradient-to-t from-near-black via-near-black/95 to-transparent backdrop-blur-sm">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-terracotta/30 rounded-xl blur-xl"></div>
                  <div className="relative w-16 h-16 bg-terracotta rounded-xl flex items-center justify-center text-parchment font-extrabold text-2xl shadow-lg">
                    C
                  </div>
                </div>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-parchment uppercase mb-2">Try Cervantes</h1>
              <p className="text-parchment/50 text-[11px] uppercase tracking-[0.15em] font-medium">
                AI-powered narrative formative assessment
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <label className="block text-[10px] font-extrabold uppercase tracking-[0.15em] text-parchment/70">Your Name</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-terracotta/10 to-wheat-gold/10 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm"></div>
                  <div className="relative flex items-center bg-near-black/40 border border-parchment/20 focus-within:border-terracotta rounded-lg px-4 py-3 transition-all backdrop-blur-sm">
                    <span className="material-symbols-outlined text-parchment/60 mr-3 text-lg">person</span>
                    <input
                      className="bg-transparent border-none p-0 focus:ring-0 w-full text-parchment placeholder:text-parchment/30 font-medium outline-none text-base"
                      placeholder="e.g., Alex"
                      type="text"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      required
                      disabled={isChecking}
                      maxLength={60}
                    />
                  </div>
                </div>
                <p className="text-[9px] text-parchment/30 uppercase tracking-wider">No account needed - enter any name to begin</p>
              </div>

              <div className="pt-4">
                <button
                  className="relative w-full bg-terracotta text-parchment font-bold py-4 flex items-center justify-center gap-2 group transition-all hover:bg-terracotta/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(200,90,50,0.3)] hover:shadow-[0_8px_30px_rgba(200,90,50,0.4)] rounded-lg overflow-hidden"
                  type="submit"
                  disabled={isChecking}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-parchment/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  {isChecking ? (
                    <div className="w-5 h-5 border-2 border-parchment border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="text-sm tracking-wide font-extrabold uppercase">Begin Demo</span>
                      <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-parchment/10">
              <p className="text-center text-parchment/30 text-[9px] uppercase tracking-[0.2em]">
                Demo available until April 19 &bull; 15 dialogue turns per session
              </p>
            </div>
          </div>
        </div>
      </main>

      <Modal isOpen={errorType === 'processing'} onClose={resetForm} title="Setting Up">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-wheat-gold/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-wheat-gold animate-pulse">hourglass_empty</span>
          </div>
          <p className="text-sm text-parchment/80 mb-4">{errorMessage}</p>
          <button onClick={resetForm} className="px-6 py-2 bg-terracotta text-parchment font-bold rounded-lg hover:bg-terracotta/80 transition-colors">
            Try Again
          </button>
        </div>
      </Modal>

      <Modal isOpen={errorType === 'rate_limited'} onClose={resetForm} title="Turn Limit Reached">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-wheat-gold/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-wheat-gold">do_not_disturb_on</span>
          </div>
          <p className="text-sm text-parchment/80 mb-4">{errorMessage}</p>
          <button onClick={resetForm} className="px-6 py-2 bg-terracotta text-parchment font-bold rounded-lg hover:bg-terracotta/80 transition-colors">
            Close
          </button>
        </div>
      </Modal>

      <Modal isOpen={errorType === 'expired'} onClose={resetForm} title="Demo Ended">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-parchment/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-parchment/60">lock_clock</span>
          </div>
          <p className="text-sm text-parchment/80 mb-4">{errorMessage}</p>
          <button onClick={resetForm} className="px-6 py-2 bg-terracotta text-parchment font-bold rounded-lg hover:bg-terracotta/80 transition-colors">
            Close
          </button>
        </div>
      </Modal>

      <Modal isOpen={errorType === 'generic'} onClose={resetForm} title="Error">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-critical/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-critical">error</span>
          </div>
          <p className="text-sm text-parchment/80 mb-4">{errorMessage}</p>
          <button onClick={resetForm} className="px-6 py-2 bg-terracotta text-parchment font-bold rounded-lg hover:bg-terracotta/80 transition-colors">
            Try Again
          </button>
        </div>
      </Modal>
    </div>
  );
}
