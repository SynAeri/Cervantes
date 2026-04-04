// TopBar header component for La Mancha teacher dashboard
// Parchment theme with warm accents

'use client';

export function TopBar() {
  return (
    <header className="flex justify-between items-center mb-16">
      <div>
        <h2 className="text-4xl font-extrabold text-primary tracking-tight leading-none mb-2">Welcome Back, Professor</h2>
        <p className="text-tertiary text-sm font-medium">Department of Computational Intelligence</p>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center bg-warm-white border border-warm-grey rounded-full px-4 py-2 w-64 focus-within:border-wheat-gold transition-all">
          <span className="material-symbols-outlined text-tertiary text-lg">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 text-xs text-body placeholder:text-tertiary/50 w-full pl-2 outline-none"
            placeholder="Search registry..."
            type="text"
          />
        </div>

        <div className="relative">
          <span className="material-symbols-outlined text-tertiary hover:text-terracotta transition-colors cursor-pointer text-2xl">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-terracotta rounded-full border-2 border-parchment"></span>
        </div>

        <div className="flex items-center gap-3 pl-8 border-l border-warm-grey">
          <div className="text-right">
            <p className="text-sm font-bold text-primary leading-tight">Dr. Aris Thorne</p>
            <p className="text-[10px] text-terracotta uppercase tracking-widest font-extrabold mt-0.5">Professor</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-terracotta/10 border border-terracotta/20 flex items-center justify-center text-terracotta font-bold">
            AT
          </div>
        </div>
      </div>
    </header>
  );
}
