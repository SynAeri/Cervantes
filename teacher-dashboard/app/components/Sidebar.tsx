// Sidebar navigation component for La Mancha teacher dashboard
// Features animated dropdowns and navigation state

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const [classesOpen, setClassesOpen] = useState(true);
  const pathname = usePathname();

  const classes = [
    { id: 'intro-ai', name: 'Intro to AI', href: '/class/intro-ai' },
    { id: 'economics', name: 'Economics', href: '/class/economics' },
    { id: 'senior-seminar', name: 'Senior Seminar', href: '/class/senior-seminar' },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 z-40 bg-surface-container-lowest border-r border-white/[0.05] flex flex-col py-6 px-4 gap-y-6">
      <div className="flex items-center gap-3 px-2 mb-4">
        <div className="w-8 h-8 bg-primary-container rounded flex items-center justify-center text-on-primary-container font-extrabold text-sm">
          L
        </div>
        <div>
          <h1 className="text-[#e5e2e1] font-bold uppercase tracking-[0.1em] text-[13px]">La Mancha</h1>
          <p className="text-[9px] text-on-surface-variant/50 font-bold uppercase tracking-widest">Assessment</p>
        </div>
      </div>

      <nav className="flex flex-col gap-y-1">
        <div className="space-y-1">
          <Link href="/dashboard">
            <button
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all group ${
                pathname === '/dashboard'
                  ? 'text-primary bg-primary/10'
                  : 'text-[#948e9d] hover:text-[#e5e2e1] hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              Dashboard
            </button>
          </Link>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => setClassesOpen(!classesOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-[#948e9d] hover:text-[#e5e2e1] hover:bg-white/5 rounded-lg text-[13px] font-semibold transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]">school</span>
              Classes
            </div>
            <span
              className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${
                classesOpen ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              classesOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="ml-4 flex flex-col border-l border-white/10 py-1">
              {classes.map((cls) => (
                <Link
                  key={cls.id}
                  href={cls.href}
                  className={`text-[12px] transition-all duration-200 py-1.5 pl-5 relative hover:text-primary ${
                    pathname === cls.href
                      ? 'text-primary font-bold before:absolute before:left-[-1px] before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-4 before:bg-primary'
                      : 'text-[#948e9d] hover:translate-x-1'
                  }`}
                >
                  {cls.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Link href="/students">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-[#948e9d] hover:text-[#e5e2e1] hover:bg-white/5 rounded-lg text-[13px] font-semibold transition-all group">
              <span className="material-symbols-outlined text-[20px]">group</span>
              Students
            </button>
          </Link>
        </div>

        <div className="space-y-1">
          <Link href="/scenarios">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-[#948e9d] hover:text-[#e5e2e1] hover:bg-white/5 rounded-lg text-[13px] font-semibold transition-all group">
              <span className="material-symbols-outlined text-[20px]">account_tree</span>
              Scenarios
            </button>
          </Link>
        </div>

        <div className="space-y-1">
          <Link href="/workflows">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-[#948e9d] hover:text-[#e5e2e1] hover:bg-white/5 rounded-lg text-[13px] font-semibold transition-all group">
              <span className="material-symbols-outlined text-[20px]">alt_route</span>
              Workflows
            </button>
          </Link>
        </div>

        <div className="space-y-1">
          <Link href="/settings">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-[#948e9d] hover:text-[#e5e2e1] hover:bg-white/5 rounded-lg text-[13px] font-semibold transition-all group">
              <span className="material-symbols-outlined text-[20px]">settings</span>
              Settings
            </button>
          </Link>
        </div>
      </nav>

      <div className="mt-auto flex flex-col gap-y-4 pt-4 border-t border-white/5">
        <div className="px-2">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Storage</p>
            <p className="text-[9px] text-on-surface-variant/50 font-bold">75%</p>
          </div>
          <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
            <div className="w-3/4 h-full bg-primary transition-all duration-500"></div>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 text-[#948e9d]">
          <div className="flex items-center gap-2 hover:text-on-surface cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-[20px]">help</span>
            <span className="text-[12px] font-medium">Support</span>
          </div>
          <span className="material-symbols-outlined text-[20px] hover:text-on-surface cursor-pointer transition-colors">settings</span>
        </div>
      </div>
    </aside>
  );
}
