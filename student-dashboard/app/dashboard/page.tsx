// Student dashboard main page - visual novel inspired mobile interface
// Displays current learning dialogue and navigation with smooth slide transitions

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  const handleNavigation = (path: string, buttonIndex: number) => {
    const totalButtons = 6;
    const direction = buttonIndex < totalButtons / 2 ? 'left' : 'right';
    setSlideDirection(direction);

    setTimeout(() => {
      router.push(path);
    }, 300);
  };

  const getSlideClass = () => {
    if (!slideDirection) return 'translate-x-0 opacity-100';
    return slideDirection === 'left'
      ? '-translate-x-full opacity-0'
      : 'translate-x-full opacity-0';
  };

  return (
    <div className={`min-h-screen overflow-hidden relative bg-near-black font-body selection:bg-terracotta/30 selection:text-terracotta transition-all duration-300 ease-in-out ${getSlideClass()}`}>
      <style jsx global>{`
        html, body {
          background-color: #1E1C18 !important;
        }
      `}</style>

      <div className="fixed inset-0 z-0 bg-near-black">
        <img
          alt=""
          className="w-full h-full object-cover grayscale-[0.1] brightness-75"
          src="/city.jpeg"
        />
        <div className="absolute inset-0 bg-near-black/20"></div>
      </div>

      <header className="fixed top-6 left-6 z-50 flex items-center px-4 py-1.5 gap-4 bg-near-black/80 border border-parchment/10">
        <div className="flex items-center gap-2 text-parchment">
          <span className="text-lg font-bold">7/28</span>
          <span className="text-[10px] opacity-70">(WED)</span>
        </div>
        <div className="w-px h-3 bg-parchment/20"></div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px] opacity-60">battery_full_alt</span>
          <span className="material-symbols-outlined text-[14px] opacity-60">signal_cellular_alt</span>
        </div>
      </header>

      <main className="fixed inset-0 z-10 flex flex-col justify-end">
        <div className="w-full px-0 bg-near-black/95 relative">
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent via-transparent to-near-black/95 pointer-events-none -translate-y-24"></div>

          <div className="relative w-full pt-12 pb-4">
            <div className="relative mb-4 px-6 md:px-8">
              <p className="text-parchment/95 leading-relaxed font-light text-xs md:text-sm">
                "Wait. You're saying the <span className="text-terracotta font-medium italic">divergence meter</span> hasn't fluctuated at all since we arrived?"
                She crossed her arms, her gaze shifting toward the terminal screen. "That shouldn't be possible according to the <span className="text-terracotta font-medium">Attractor Field</span> theory."
              </p>
              <div className="absolute right-6 md:right-8 bottom-0">
                <span className="material-symbols-outlined text-[10px] text-parchment/40 animate-pulse">keyboard_double_arrow_right</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 px-6 pb-6">
              <div className="text-parchment/80 text-[10px] tracking-[0.4em] uppercase font-light relative w-full flex justify-center">
                <span className="inline-block before:content-[''] before:h-px before:w-[60px] before:bg-parchment/20 before:inline-block before:align-middle before:mr-[15px] after:content-[''] after:h-px after:w-[60px] after:bg-parchment/20 after:inline-block after:align-middle after:ml-[15px]">
                  xxx
                </span>
              </div>

              <nav className="flex items-center justify-center gap-8 py-2 w-full border-t border-parchment/10">
                <button
                  onClick={() => handleNavigation('/journal', 0)}
                  className="group flex flex-col items-center transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none tap-highlight-transparent"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <span className="material-symbols-outlined text-base text-parchment/50 group-hover:text-terracotta transition-colors duration-200">auto_stories</span>
                  <span className="text-[7px] uppercase tracking-widest text-parchment/30 group-hover:text-parchment/70 mt-1 transition-colors duration-200">Journal</span>
                </button>
                <button
                  onClick={() => handleNavigation('/log', 1)}
                  className="group flex flex-col items-center transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none tap-highlight-transparent"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <span className="material-symbols-outlined text-base text-parchment/50 group-hover:text-terracotta transition-colors duration-200">list_alt</span>
                  <span className="text-[7px] uppercase tracking-widest text-parchment/30 group-hover:text-parchment/70 mt-1 transition-colors duration-200">Log</span>
                </button>
                <button
                  onClick={() => handleNavigation('/write', 2)}
                  className="group flex flex-col items-center transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none tap-highlight-transparent"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <span className="material-symbols-outlined text-base text-parchment/50 group-hover:text-terracotta transition-colors duration-200">edit_note</span>
                  <span className="text-[7px] uppercase tracking-widest text-parchment/30 group-hover:text-parchment/70 mt-1 transition-colors duration-200">Write</span>
                </button>
                <button
                  onClick={() => handleNavigation('/calendar', 3)}
                  className="group flex flex-col items-center transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none tap-highlight-transparent"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <span className="material-symbols-outlined text-base text-parchment/50 group-hover:text-terracotta transition-colors duration-200">calendar_today</span>
                  <span className="text-[7px] uppercase tracking-widest text-parchment/30 group-hover:text-parchment/70 mt-1 transition-colors duration-200">Calendar</span>
                </button>
                <button
                  onClick={() => handleNavigation('/map', 4)}
                  className="group flex flex-col items-center transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none tap-highlight-transparent"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <span className="material-symbols-outlined text-base text-parchment/50 group-hover:text-terracotta transition-colors duration-200">map</span>
                  <span className="text-[7px] uppercase tracking-widest text-parchment/30 group-hover:text-parchment/70 mt-1 transition-colors duration-200">Map</span>
                </button>
                <button
                  onClick={() => handleNavigation('/accessibility', 5)}
                  className="group flex flex-col items-center transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none tap-highlight-transparent"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <span className="material-symbols-outlined text-base text-parchment/50 group-hover:text-terracotta transition-colors duration-200">accessibility_new</span>
                  <span className="text-[7px] uppercase tracking-widest text-parchment/30 group-hover:text-parchment/70 mt-1 transition-colors duration-200">Access</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
