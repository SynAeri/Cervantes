// Map page placeholder for student dashboard
// Future: Course navigation and progress map

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function MapPage() {
  const router = useRouter();
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleBack = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 300);
  };

  return (
    <div className={`min-h-screen bg-near-black text-parchment p-6 transition-opacity duration-300 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <button
        onClick={handleBack}
        className="mb-6 text-terracotta hover:text-terracotta/80 transition-colors flex items-center gap-2"
      >
        <span className="material-symbols-outlined">arrow_back</span>
        <span>Back to Dashboard</span>
      </button>
      <h1 className="text-2xl font-bold mb-4">Course Map</h1>
      <p className="text-parchment/60">Course navigation map coming soon...</p>
    </div>
  );
}
