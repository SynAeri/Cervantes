// Login page for La Mancha - PWA teacher dashboard
// Styled based on Windmill Scholarly Systems design system

'use client';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-parchment">
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-terracotta/20 blur-[120px] rounded-full"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-wheat-gold/20 blur-[120px] rounded-full"></div>
        </div>

        <div className="w-full max-w-md z-10">
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

            <form className="space-y-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-tertiary">Select Institution</label>
                <div className="relative group/select">
                  <div className="flex items-center border-b border-warm-grey focus-within:border-terracotta w-full cursor-pointer py-3">
                    <span className="material-symbols-outlined text-tertiary mr-3 text-lg">account_balance</span>
                    <span className="text-primary flex-grow font-medium">Search for your university...</span>
                    <span className="material-symbols-outlined text-tertiary group-hover/select:text-terracotta transition-colors">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-tertiary">Professor ID</label>
                <div className="relative">
                  <div className="flex items-center border-b border-warm-grey focus-within:border-terracotta w-full py-3">
                    <span className="material-symbols-outlined text-tertiary mr-3 text-lg">fingerprint</span>
                    <input
                      className="bg-transparent border-none p-0 focus:ring-0 w-full text-primary placeholder:text-tertiary/40 font-medium outline-none"
                      placeholder="Enter your ID number"
                      type="text"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-tertiary">Security Cipher</label>
                <div className="relative">
                  <div className="flex items-center border-b border-warm-grey focus-within:border-terracotta w-full py-3">
                    <span className="material-symbols-outlined text-tertiary mr-3 text-lg">lock</span>
                    <input
                      className="bg-transparent border-none p-0 focus:ring-0 w-full text-primary placeholder:text-tertiary/40 font-medium outline-none"
                      placeholder="••••••••"
                      type="password"
                    />
                    <span className="material-symbols-outlined text-tertiary hover:text-terracotta cursor-pointer text-lg">visibility</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <button
                  className="w-full bg-terracotta text-parchment font-bold py-4 rounded-lg flex items-center justify-center gap-2 group transition-all hover:scale-[1.01] active:scale-[0.98] hover:bg-terracotta/90"
                  type="submit"
                >
                  <span>AUTHENTICATE</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
                <div className="flex justify-between items-center text-[11px] font-semibold uppercase tracking-wider px-1">
                  <a className="text-tertiary hover:text-terracotta transition-colors" href="#">Forgot Cipher?</a>
                  <a className="text-tertiary hover:text-terracotta transition-colors" href="#">Request Access</a>
                </div>
              </div>
            </form>
          </div>

          <p className="text-center mt-12 text-tertiary/60 text-[10px] uppercase tracking-[0.2em] font-medium">
            Encrypted Portal • Scholarly Systems v1.0.0
          </p>
        </div>
      </main>

      <footer className="w-full py-8 border-t border-warm-grey bg-warm-white flex justify-between items-center px-12">
        <div className="text-[11px] font-medium text-tertiary/60 font-label tracking-wide uppercase">
          © 2025 La Mancha
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
