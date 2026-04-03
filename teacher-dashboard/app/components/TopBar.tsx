// TopBar header component for La Mancha teacher dashboard

'use client';

export function TopBar() {
  return (
    <header className="flex justify-between items-center mb-16">
      <div>
        <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-none mb-2">Welcome Back, Professor</h2>
        <p className="text-on-surface-variant/70 text-sm font-medium">Department of Computational Intelligence</p>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center bg-surface-container-low border border-white/5 rounded-full px-4 py-2 w-64 group focus-within:border-primary/50 transition-all">
          <span className="material-symbols-outlined text-on-surface-variant/50 text-lg">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 text-xs text-on-surface placeholder:text-on-surface-variant/30 w-full pl-2 outline-none"
            placeholder="Search registry..."
            type="text"
          />
        </div>

        <div className="relative">
          <span className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer text-2xl">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border-2 border-surface-dim"></span>
        </div>

        <div className="flex items-center gap-3 pl-8 border-l border-white/5">
          <div className="text-right">
            <p className="text-sm font-bold text-on-surface leading-tight">Dr. Aris Thorne</p>
            <p className="text-[10px] text-primary uppercase tracking-widest font-extrabold mt-0.5">Professor</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-bright ring-1 ring-white/10 flex items-center justify-center text-primary font-bold">
            AT
          </div>
        </div>
      </div>
    </header>
  );
}
