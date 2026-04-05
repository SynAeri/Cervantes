// Sidebar navigation component for La Mancha teacher dashboard
// Darker parchment background with terracotta and wheat gold accents

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClasses } from '../hooks/useClasses';

export function Sidebar() {
  const [classesOpen, setClassesOpen] = useState(true);
  const pathname = usePathname();
  const { data: classesData, isLoading } = useClasses();

  const classes = classesData?.map(cls => ({
    id: cls.class_id,
    name: cls.name,
    href: `/class/${cls.class_id}`
  })) || [];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 z-40 bg-parchment-dark border-r border-warm-grey shadow-[4px_0_12px_rgba(30,28,24,0.08)] flex flex-col py-6 px-4 gap-y-6">
      <div className="flex items-center gap-3 px-2 mb-4">
        <div className="w-8 h-8 bg-terracotta rounded flex items-center justify-center text-parchment font-extrabold text-sm">
          C
        </div>
        <div>
          <h1 className="text-primary font-bold uppercase tracking-[0.1em] text-[13px]">Cervantes</h1>
          <p className="text-[9px] text-tertiary font-bold uppercase tracking-widest">Assessment</p>
        </div>
      </div>

      <nav className="flex flex-col gap-y-1">
        <div className="space-y-1">
          <Link href="/dashboard">
            <button
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all group ${
                pathname === '/dashboard'
                  ? 'text-terracotta bg-terracotta/10'
                  : 'text-body hover:text-primary hover:bg-warm-white/50'
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
            className="w-full flex items-center justify-between px-3 py-2 text-body hover:text-primary hover:bg-warm-white/50 rounded-lg text-[13px] font-semibold transition-all group"
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
            <div className="ml-4 flex flex-col border-l border-warm-grey py-1">
              {classes.map((cls) => (
                <Link
                  key={cls.id}
                  href={cls.href}
                  className={`text-[12px] transition-all duration-200 py-1.5 pl-5 relative ${
                    pathname === cls.href
                      ? 'text-wheat-gold font-bold before:absolute before:left-[-1px] before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-4 before:bg-wheat-gold'
                      : 'text-body hover:text-primary hover:translate-x-1'
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
            <button className="w-full flex items-center gap-3 px-3 py-2 text-body hover:text-primary hover:bg-warm-white/50 rounded-lg text-[13px] font-semibold transition-all group">
              <span className="material-symbols-outlined text-[20px]">group</span>
              Students
            </button>
          </Link>
        </div>

        <div className="space-y-1">
          <Link href="/scenarios">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-body hover:text-primary hover:bg-warm-white/50 rounded-lg text-[13px] font-semibold transition-all group">
              <span className="material-symbols-outlined text-[20px]">account_tree</span>
              Scenarios
            </button>
          </Link>
        </div>

        <div className="space-y-1">
          <Link href="/workflows">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-body hover:text-primary hover:bg-warm-white/50 rounded-lg text-[13px] font-semibold transition-all group">
              <span className="material-symbols-outlined text-[20px]">alt_route</span>
              Workflows
            </button>
          </Link>
        </div>

        <div className="space-y-1">
          <Link href="/settings">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-body hover:text-primary hover:bg-warm-white/50 rounded-lg text-[13px] font-semibold transition-all group">
              <span className="material-symbols-outlined text-[20px]">settings</span>
              Settings
            </button>
          </Link>
        </div>
      </nav>

      <div className="mt-auto flex flex-col gap-y-4 pt-4 border-t border-warm-grey">
        <div className="px-2">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] text-tertiary font-bold uppercase tracking-wider">Storage</p>
            <p className="text-[9px] text-tertiary/70 font-bold">75%</p>
          </div>
          <div className="w-full h-1 bg-warm-white/30 rounded-full overflow-hidden">
            <div className="w-3/4 h-full bg-wheat-gold transition-all duration-500"></div>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 text-body">
          <div className="flex items-center gap-2 hover:text-primary cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-[20px]">help</span>
            <span className="text-[12px] font-medium">Support</span>
          </div>
          <span className="material-symbols-outlined text-[20px] hover:text-primary cursor-pointer transition-colors">settings</span>
        </div>
      </div>
    </aside>
  );
}
