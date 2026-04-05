// Main dashboard overview page - refactored to use real API data
// Shows all classes fetched from backend with React Query

'use client';

import Link from 'next/link';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { useClasses } from '../hooks/useClasses';

export default function DashboardPage() {
  const { data: classes, isLoading, error } = useClasses();

  if (error) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="ml-64 min-h-screen bg-parchment p-10 flex-1">
          <TopBar />
          <div className="bg-warm-white p-8 rounded-xl border border-warm-grey">
            <p className="text-terracotta font-bold">Error loading classes: {error.message}</p>
          </div>
        </main>
      </div>
    );
  }

  const totalStudents = classes?.reduce((sum, cls) => sum + (cls.enrollment?.length || 0), 0) || 0;
  const activeClasses = classes?.filter(cls => cls.status !== 'no_arc').length || 0;

  return (
    <div className="flex">
      <Sidebar />

      <main className="ml-64 min-h-screen bg-parchment p-10 flex-1">
        <TopBar />

        <div className="grid grid-cols-12 gap-8">
          <section className="col-span-12 lg:col-span-9 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-[0.2em]">All Classes</h3>
              <button className="text-[10px] font-extrabold text-terracotta hover:text-terracotta/80 transition-all uppercase tracking-widest flex items-center gap-1">
                Create New Class
                <span className="material-symbols-outlined text-xs">add</span>
              </button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-warm-white p-6 rounded-xl border border-warm-grey h-48 animate-pulse">
                    <div className="h-10 w-10 bg-terracotta/10 rounded-lg mb-4"></div>
                    <div className="h-4 bg-warm-grey rounded mb-2 w-3/4"></div>
                    <div className="h-3 bg-warm-grey rounded mb-6 w-full"></div>
                    <div className="h-3 bg-warm-grey rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : classes && classes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => {
                  const studentCount = cls.enrollment?.length || 0;
                  const progress = 0;
                  const statusLabel = cls.status === 'published' ? 'ACTIVE' : (cls.status?.toUpperCase() || 'DRAFT');
                  const icon = cls.subject === 'Economics' ? 'finance' :
                               cls.subject === 'Software Development' ? 'code' :
                               cls.subject === 'English Standard' ? 'menu_book' : 'school';

                  return (
                    <Link key={cls.class_id} href={`/class/${cls.class_id}`}>
                      <div className="group bg-warm-white p-6 rounded-xl border border-warm-grey hover:border-terracotta/30 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col h-full">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-terracotta/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-terracotta/10 transition-all duration-500"></div>

                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-terracotta/10 rounded-lg flex items-center justify-center text-terracotta group-hover:scale-110 transition-transform duration-300">
                              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                            </div>
                            <span className="text-[8px] font-extrabold text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-full tracking-widest">{statusLabel}</span>
                          </div>

                          <h4 className="text-lg font-bold text-primary tracking-tight mb-2 group-hover:text-terracotta transition-colors">{cls.name}</h4>
                          <p className="text-[12px] text-tertiary leading-relaxed mb-6 line-clamp-2">
                            {cls.subject} - {cls.module || 'General Course'}
                          </p>

                          <div className="flex items-center justify-between pt-4 border-t border-warm-grey">
                            <div className="flex items-center gap-1.5 text-tertiary">
                              <span className="material-symbols-outlined text-base">group</span>
                              <span className="text-[11px] font-bold">{studentCount}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-primary">{progress}%</span>
                              <div className="w-12 h-1 bg-warm-grey rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-terracotta transition-all duration-300 group-hover:bg-wheat-gold"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-warm-white p-12 rounded-xl border border-warm-grey text-center">
                <span className="material-symbols-outlined text-6xl text-tertiary/30 mb-4">school</span>
                <p className="text-tertiary text-sm">No classes yet. Create your first class to get started.</p>
              </div>
            )}

            <div className="pt-8">
              <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-[0.2em] mb-6">Recent Activity</h3>
              <div className="bg-warm-white rounded-xl border border-warm-grey p-6 space-y-4">
                <p className="text-[12px] text-tertiary italic">Activity feed will be populated as students complete scenes</p>
              </div>
            </div>
          </section>

          <aside className="col-span-12 lg:col-span-3 space-y-6">
            <div className="bg-warm-white p-6 rounded-xl border border-warm-grey shadow-sm">
              <h4 className="text-[10px] font-extrabold text-terracotta uppercase tracking-[0.25em] mb-4">Quick Stats</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[11px] text-tertiary font-bold">Total Students</span>
                    <span className="text-2xl font-extrabold text-primary">
                      {isLoading ? '--' : totalStudents}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[11px] text-tertiary font-bold">Active Classes</span>
                    <span className="text-2xl font-extrabold text-primary">
                      {isLoading ? '--' : activeClasses}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[11px] text-tertiary font-bold">Avg Completion</span>
                    <span className="text-2xl font-extrabold text-terracotta">0%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-warm-white rounded-xl p-6 border border-warm-grey">
              <h4 className="text-[11px] font-extrabold text-tertiary uppercase tracking-widest mb-4">Upcoming</h4>
              <div className="space-y-3">
                <p className="text-[12px] text-tertiary italic">No upcoming deadlines</p>
              </div>
            </div>
          </aside>
        </div>

        <footer className="w-full py-12 mt-24 border-t border-warm-grey flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 bg-terracotta/10 rounded flex items-center justify-center text-[10px] font-extrabold text-terracotta">C</div>
            <p className="text-[13px] text-tertiary/60 font-medium tracking-tight">© 2026 Cervantes. Built for Scholarly Assessment.</p>
          </div>
          <div className="flex gap-8">
            <a className="text-[13px] text-tertiary hover:text-terracotta transition-colors font-semibold" href="#">Privacy Policy</a>
            <a className="text-[13px] text-tertiary hover:text-terracotta transition-colors font-semibold" href="#">Institutional Access</a>
            <a className="text-[13px] text-tertiary hover:text-terracotta transition-colors font-semibold" href="#">Support</a>
          </div>
        </footer>
      </main>

      <button className="fixed bottom-10 right-10 w-16 h-16 bg-terracotta text-parchment rounded-2xl shadow-[0_20px_50px_rgba(200,90,50,0.2)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 z-50">
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'wght' 700" }}>add</span>
      </button>
    </div>
  );
}
