// Student login page for La Mancha PWA
// Mobile-optimized visual novel inspired interface with parchment color scheme

'use client';

export default function LoginPage() {
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

            <form className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[9px] font-bold uppercase tracking-[0.15em] text-parchment/70">Institution</label>
                <div className="relative">
                  <div className="flex items-center border-b border-parchment/20 focus-within:border-terracotta w-full py-3">
                    <span className="material-symbols-outlined text-parchment/60 mr-3 text-base">account_balance</span>
                    <select className="bg-transparent border-none p-0 focus:ring-0 w-full text-parchment font-medium outline-none appearance-none">
                      <option className="bg-near-black text-parchment">Select your institution...</option>
                      <option className="bg-near-black text-parchment">University of La Mancha</option>
                      <option className="bg-near-black text-parchment">Cervantes Academy</option>
                    </select>
                    <span className="material-symbols-outlined text-parchment/60 text-base">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-bold uppercase tracking-[0.15em] text-parchment/70">Student ID</label>
                <div className="relative">
                  <div className="flex items-center border-b border-parchment/20 focus-within:border-terracotta w-full py-3">
                    <span className="material-symbols-outlined text-parchment/60 mr-3 text-base">badge</span>
                    <input
                      className="bg-transparent border-none p-0 focus:ring-0 w-full text-parchment placeholder:text-parchment/30 font-medium outline-none"
                      placeholder="Enter your student ID"
                      type="text"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  className="w-full bg-terracotta text-parchment font-bold py-3.5 flex items-center justify-center gap-2 group transition-all active:scale-[0.98]"
                  type="submit"
                >
                  <span className="text-sm tracking-wide">ENTER</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
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
