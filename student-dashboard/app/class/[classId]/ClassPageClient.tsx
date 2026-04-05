// Teacher dashboard client component for La Mancha
// Main view showing course overview, student performance, and timeline

'use client';

import { Sidebar } from '../../components/Sidebar';
import { TopBar } from '../../components/TopBar';
import { StudentRow } from '../../components/StudentRow';

export function ClassPageClient() {
  return (
    <div className="flex">
      <Sidebar />

      <main className="ml-64 min-h-screen bg-parchment p-10 flex-1">
        <TopBar />

        <div className="grid grid-cols-12 gap-8">
          <section className="col-span-12 lg:col-span-9 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-[0.2em]">Course Overview</h3>
              <button className="text-[10px] font-extrabold text-terracotta hover:text-terracotta/80 transition-all uppercase tracking-widest flex items-center gap-1">
                View All Registry
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group bg-warm-white p-8 rounded-xl border border-warm-grey hover:border-terracotta/20 transition-all duration-500 relative overflow-hidden flex flex-col justify-between h-full">
                <div className="absolute top-0 right-0 w-48 h-48 bg-terracotta/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-terracotta/10 transition-all"></div>
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-terracotta/10 rounded-lg flex items-center justify-center text-terracotta">
                      <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>finance</span>
                    </div>
                    <span className="text-[9px] font-extrabold text-terracotta bg-terracotta/10 px-2.5 py-1 rounded-full tracking-widest">ACTIVE</span>
                  </div>
                  <h4 className="text-2xl font-bold text-primary tracking-tight mb-3">Introduction to Economics</h4>
                  <p className="text-[14px] text-tertiary leading-relaxed max-w-sm">Analyzing global markets, fiscal policy, and microeconomic incentives in digital economies.</p>
                </div>
                <div className="flex items-center justify-between mt-10 pt-6 border-t border-warm-grey">
                  <div className="flex items-center gap-2 text-tertiary">
                    <span className="material-symbols-outlined text-lg">group</span>
                    <span className="text-[12px] font-bold">154 Students Enrolled</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-bold text-primary">68%</span>
                    <div className="w-16 h-1 bg-warm-grey rounded-full overflow-hidden">
                      <div className="w-2/3 h-full bg-terracotta"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-warm-white p-8 rounded-xl border border-warm-grey flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-[11px] font-extrabold text-tertiary uppercase tracking-widest">Assessed Sections</h4>
                  <span className="material-symbols-outlined text-tertiary/50">assessment</span>
                </div>
                <div className="flex-1 space-y-6">
                  {[
                    { name: 'Micro Theory', progress: 82 },
                    { name: 'Macro Analysis', progress: 45 },
                    { name: 'Econometrics', progress: 67 },
                    { name: 'Strategic Analysis', progress: 91 }
                  ].map((section) => (
                    <div key={section.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-[13px] font-bold text-primary">{section.name}</p>
                        <span className="text-[11px] font-bold text-terracotta">{section.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-warm-grey rounded-full overflow-hidden">
                        <div
                          className={`h-full ${section.progress >= 80 ? 'bg-mastery' : section.progress >= 50 ? 'bg-misconception' : 'bg-critical'}`}
                          style={{ width: `${section.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-8">
              <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-[0.2em] mb-6">Student Performance</h3>
              <div className="bg-warm-white rounded-xl border border-warm-grey overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-parchment/50 border-b border-warm-grey">
                      <th className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-tertiary">Student Name</th>
                      <th className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-tertiary">Progress</th>
                      <th className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-tertiary text-center">Micro</th>
                      <th className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-tertiary text-center">Macro</th>
                      <th className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-tertiary text-center">Econ-m</th>
                      <th className="px-6 py-5 text-[10px] font-extrabold uppercase tracking-widest text-tertiary text-center">Strategic Analysis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Elena Ricci', progress: 92, scores: [88, 94, 78, 96] },
                      { name: 'Julian Voss', progress: 64, scores: [72, 42, 68, 82] },
                      { name: 'Marcus Thorne', progress: 48, scores: [35, 55, 44, 58] },
                      { name: 'Sarah Chen', progress: 85, scores: [90, 82, 88, 79] },
                      { name: 'David Martinez', progress: 71, scores: [75, 68, 72, 70] }
                    ].map((student) => (
                      <StudentRow key={student.name} student={student} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <aside className="col-span-12 lg:col-span-3 space-y-8">
            <div>
              <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-[0.2em] mb-6">Student Timeline</h3>
              <div className="bg-warm-white rounded-xl p-6 border border-warm-grey space-y-8 relative overflow-hidden">
                <div className="absolute top-0 left-9 bottom-0 w-[1px] bg-warm-grey"></div>
                <div className="space-y-8">
                  {[
                    { name: 'Elena Ricci', action: 'Submitted Macro Essay', time: '2m ago', color: 'mastery' },
                    { name: 'Julian Voss', action: 'Completed Micro Quiz', time: '14m ago', color: 'wheat-gold' },
                    { name: 'System', action: 'Grades Released', time: '1h ago', color: 'tertiary' },
                    { name: 'Marcus Thorne', action: 'Flagged: Low Progress', time: '3h ago', color: 'critical' }
                  ].map((event, idx) => (
                    <div key={idx} className="relative flex gap-4">
                      <div className={`z-10 w-6 h-6 rounded-full bg-warm-white border-2 border-${event.color} flex items-center justify-center`}>
                        <div className={`w-1.5 h-1.5 bg-${event.color} rounded-full`}></div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-baseline">
                          <p className="text-[11px] font-extrabold text-primary uppercase tracking-tight">{event.name}</p>
                          <span className="text-[9px] text-tertiary/60 font-bold uppercase">{event.time}</span>
                        </div>
                        <p className="text-[12px] text-tertiary font-medium">{event.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-warm-white p-8 rounded-xl border border-warm-grey shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-6xl text-terracotta">auto_awesome</span>
              </div>
              <h4 className="text-[10px] font-extrabold text-terracotta uppercase tracking-[0.25em] mb-6">Focus Metric</h4>
              <div className="flex items-end justify-between relative z-10">
                <div>
                  <span className="text-4xl font-extrabold text-primary tracking-tighter">94%</span>
                  <p className="text-[10px] font-bold text-tertiary uppercase mt-1">Grading Efficiency</p>
                </div>
                <div className="w-20 h-20 relative">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-warm-grey" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeWidth="6"></circle>
                    <circle className="text-terracotta" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeDasharray="213" strokeDashoffset="20" strokeLinecap="round" strokeWidth="6"></circle>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-terracotta">TOP</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <footer className="w-full py-12 mt-24 border-t border-warm-grey flex flex-col md:flex-row justify-between items-center gap-8 px-4">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 bg-terracotta/10 rounded flex items-center justify-center text-[10px] font-extrabold text-terracotta">L</div>
            <p className="text-[13px] text-tertiary/60 font-medium tracking-tight">© 2025 La Mancha. Built for Excellence.</p>
          </div>
          <div className="flex gap-8">
            <a className="text-[13px] text-tertiary hover:text-terracotta transition-colors font-semibold" href="#">Privacy Policy</a>
            <a className="text-[13px] text-tertiary hover:text-terracotta transition-colors font-semibold" href="#">Institutional Access</a>
            <a className="text-[13px] text-tertiary hover:text-terracotta transition-colors font-semibold" href="#">Developer API</a>
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
