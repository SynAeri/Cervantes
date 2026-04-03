// Main dashboard overview page for La Mancha
// Shows all classes at a glance

'use client';

import Link from 'next/link';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';

const classes = [
  {
    id: 'intro-ai',
    name: 'Introduction to AI',
    icon: 'psychology',
    description: 'Fundamentals of artificial intelligence, machine learning, and neural networks.',
    students: 89,
    progress: 72,
    status: 'ACTIVE',
    color: 'primary'
  },
  {
    id: 'economics',
    name: 'Introduction to Economics',
    icon: 'finance',
    description: 'Analyzing global markets, fiscal policy, and microeconomic incentives in digital economies.',
    students: 154,
    progress: 68,
    status: 'ACTIVE',
    color: 'primary'
  },
  {
    id: 'senior-seminar',
    name: 'Senior Seminar',
    icon: 'school',
    description: 'Advanced research methods and critical analysis of contemporary issues.',
    students: 32,
    progress: 85,
    status: 'ACTIVE',
    color: 'primary'
  }
];

export default function DashboardPage() {
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((cls) => (
                <Link key={cls.id} href={`/class/${cls.id}`}>
                  <div className="group bg-warm-white p-6 rounded-xl border border-warm-grey hover:border-terracotta/30 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col h-full">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-terracotta/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-terracotta/10 transition-all duration-500"></div>

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-terracotta/10 rounded-lg flex items-center justify-center text-terracotta group-hover:scale-110 transition-transform duration-300">
                          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{cls.icon}</span>
                        </div>
                        <span className="text-[8px] font-extrabold text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-full tracking-widest">{cls.status}</span>
                      </div>

                      <h4 className="text-lg font-bold text-primary tracking-tight mb-2 group-hover:text-terracotta transition-colors">{cls.name}</h4>
                      <p className="text-[12px] text-tertiary leading-relaxed mb-6 line-clamp-2">{cls.description}</p>

                      <div className="flex items-center justify-between pt-4 border-t border-warm-grey">
                        <div className="flex items-center gap-1.5 text-tertiary">
                          <span className="material-symbols-outlined text-base">group</span>
                          <span className="text-[11px] font-bold">{cls.students}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-primary">{cls.progress}%</span>
                          <div className="w-12 h-1 bg-warm-grey rounded-full overflow-hidden">
                            <div
                              className="h-full bg-terracotta transition-all duration-300 group-hover:bg-wheat-gold"
                              style={{ width: `${cls.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="pt-8">
              <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-[0.2em] mb-6">Recent Activity</h3>
              <div className="bg-warm-white rounded-xl border border-warm-grey p-6 space-y-4">
                {[
                  { student: 'Elena Ricci', action: 'Submitted Macro Essay', class: 'Economics', time: '2m ago' },
                  { student: 'Julian Voss', action: 'Completed AI Lab 3', class: 'Intro to AI', time: '14m ago' },
                  { student: 'Marcus Thorne', action: 'Started Research Proposal', class: 'Senior Seminar', time: '1h ago' },
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 border-b border-warm-grey last:border-0 hover:bg-parchment/50 px-3 -mx-3 rounded-lg transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta text-xs font-bold">
                        {activity.student.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-primary">{activity.student}</p>
                        <p className="text-[11px] text-tertiary">{activity.action} · {activity.class}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-tertiary/60 font-bold uppercase">{activity.time}</span>
                  </div>
                ))}
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
                    <span className="text-2xl font-extrabold text-primary">275</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[11px] text-tertiary font-bold">Active Classes</span>
                    <span className="text-2xl font-extrabold text-primary">3</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[11px] text-tertiary font-bold">Avg Completion</span>
                    <span className="text-2xl font-extrabold text-terracotta">75%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-warm-white rounded-xl p-6 border border-warm-grey">
              <h4 className="text-[11px] font-extrabold text-tertiary uppercase tracking-widest mb-4">Upcoming</h4>
              <div className="space-y-3">
                {[
                  { title: 'Economics Midterm', date: 'Apr 15' },
                  { title: 'AI Project Due', date: 'Apr 18' },
                  { title: 'Seminar Presentations', date: 'Apr 22' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 pb-3 border-b border-warm-grey last:border-0">
                    <div className="w-10 h-10 rounded-lg bg-wheat-gold/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-wheat-gold text-lg">event</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] font-bold text-primary">{item.title}</p>
                      <p className="text-[10px] text-tertiary font-bold uppercase mt-0.5">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <footer className="w-full py-12 mt-24 border-t border-warm-grey flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 bg-terracotta/10 rounded flex items-center justify-center text-[10px] font-extrabold text-terracotta">L</div>
            <p className="text-[13px] text-tertiary/60 font-medium tracking-tight">© 2025 La Mancha. Built for Excellence.</p>
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
