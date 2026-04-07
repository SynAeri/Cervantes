// Arc landing page - asks for student ID and validates access

'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { Modal } from '../components/Modal';

export function ArcLandingClient({ params }: { params: Promise<{ arcId: string }> }) {
  const { arcId } = use(params);
  const [studentId, setStudentId] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState<'processing' | 'student_not_found' | 'generic' | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) return;

    setIsChecking(true);

    try {
      const response = await api.arc.checkStudentAccess(arcId, studentId.trim());

      if (response.status === 'ready') {
        // Success - redirect to first scene with student ID
        const firstSceneId = response.first_assignment?.scene_id;
        if (firstSceneId) {
          router.push(`/scene/${firstSceneId}?studentId=${response.student_id}&arcId=${arcId}`);
        } else {
          setErrorType('processing');
          setErrorMessage('Your scenes are still being assigned. Please check back later.');
        }
      } else if (response.status === 'processing') {
        setErrorType('processing');
        setErrorMessage('Your professor is still generating this assessment. Please check back later.');
      } else if (response.status === 'student_not_found') {
        setErrorType('student_not_found');
        setErrorMessage('You are not enrolled in this class or your student ID is incorrect.');
      } else if (response.status === 'not_found') {
        setErrorType('generic');
        setErrorMessage('The arc ID does not exist or has been deleted.');
      }
    } catch (error) {
      console.error('Failed to check arc access:', error);
      setErrorType('generic');
      setErrorMessage('Failed to connect to server. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const resetForm = () => {
    setErrorType(null);
    setErrorMessage('');
    setStudentId('');
  };

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
              <div className="inline-flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-terracotta/30 rounded-xl blur-xl"></div>
                  <div className="relative w-16 h-16 bg-terracotta rounded-xl flex items-center justify-center text-parchment font-extrabold text-2xl shadow-lg">
                    C
                  </div>
                </div>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-parchment uppercase mb-2">Enter Student ID</h1>
              <p className="text-parchment/50 text-[11px] uppercase tracking-[0.15em] font-medium">Arc: {arcId.substring(0, 8)}...</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <label className="block text-[10px] font-extrabold uppercase tracking-[0.15em] text-parchment/70">Student ID</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-terracotta/10 to-wheat-gold/10 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm"></div>
                  <div className="relative flex items-center bg-near-black/40 border border-parchment/20 focus-within:border-terracotta rounded-lg px-4 py-3 transition-all backdrop-blur-sm">
                    <span className="material-symbols-outlined text-parchment/60 mr-3 text-lg">badge</span>
                    <input
                      className="bg-transparent border-none p-0 focus:ring-0 w-full text-parchment placeholder:text-parchment/30 font-medium outline-none text-base"
                      placeholder="e.g., 10234567"
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                      disabled={isChecking}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
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
                      <span className="text-sm tracking-wide font-extrabold uppercase">Access Assessment</span>
                      <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-parchment/10">
              <div className="flex items-center justify-center gap-2 text-parchment/50 text-xs">
                <span className="material-symbols-outlined text-sm">help</span>
                <p>Having trouble? Contact your professor.</p>
              </div>
            </div>

            <div className="text-center mt-8 flex items-center justify-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-parchment/20"></div>
              <p className="text-parchment/30 text-[9px] uppercase tracking-[0.2em] font-bold">Secure Access v1.0</p>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-parchment/20"></div>
            </div>
          </div>
        </div>
      </main>

      {/* Processing Modal */}
      <Modal
        isOpen={errorType === 'processing'}
        onClose={resetForm}
        title="Arc Still Processing"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-wheat-gold/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-wheat-gold animate-pulse">
              hourglass_empty
            </span>
          </div>
          <p className="text-sm text-parchment/80 mb-4">{errorMessage}</p>
          <button
            onClick={resetForm}
            className="px-6 py-2 bg-terracotta text-parchment font-bold rounded-lg hover:bg-terracotta/80 transition-colors"
          >
            Try Again
          </button>
        </div>
      </Modal>

      {/* Student Not Found Modal */}
      <Modal
        isOpen={errorType === 'student_not_found'}
        onClose={resetForm}
        title="Student Not Found"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-critical/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-critical">
              person_off
            </span>
          </div>
          <p className="text-sm text-parchment/80 mb-4">{errorMessage}</p>
          <button
            onClick={resetForm}
            className="px-6 py-2 bg-terracotta text-parchment font-bold rounded-lg hover:bg-terracotta/80 transition-colors"
          >
            Try Again
          </button>
        </div>
      </Modal>

      {/* Generic Error Modal */}
      <Modal
        isOpen={errorType === 'generic'}
        onClose={resetForm}
        title="Error"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-critical/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-critical">
              error
            </span>
          </div>
          <p className="text-sm text-parchment/80 mb-4">{errorMessage}</p>
          <button
            onClick={resetForm}
            className="px-6 py-2 bg-terracotta text-parchment font-bold rounded-lg hover:bg-terracotta/80 transition-colors"
          >
            Try Again
          </button>
        </div>
      </Modal>
    </div>
  );
}
