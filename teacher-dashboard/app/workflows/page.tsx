// Workflows page - future feature for automated assessment workflows
// Currently a placeholder with system overview

'use client';

import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';

export default function WorkflowsPage() {
  return (
    <div className="flex">
      <Sidebar />

      <main className="ml-64 min-h-screen bg-parchment p-10 flex-1">
        <TopBar />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary tracking-tight mb-2">Workflows</h1>
          <p className="text-[14px] text-tertiary">
            Automated assessment generation and grading workflows
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Workflow */}
          <div className="bg-warm-white rounded-xl border border-warm-grey p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-mastery/10 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-mastery">
                  check_circle
                </span>
              </div>
              <div>
                <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-widest">Active</h3>
                <p className="text-[15px] font-bold text-primary">Standard Arc Generation</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-terracotta/10 rounded-full flex items-center justify-center text-[10px] font-bold text-terracotta mt-0.5">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-primary">Upload Assessment Materials</p>
                  <p className="text-[11px] text-tertiary/70">PDF, DOCX, or TXT rubrics and task sheets</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-terracotta/10 rounded-full flex items-center justify-center text-[10px] font-bold text-terracotta mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-primary">CurricuLLM Analysis</p>
                  <p className="text-[11px] text-tertiary/70">Extract rubric dimensions and misconceptions</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-terracotta/10 rounded-full flex items-center justify-center text-[10px] font-bold text-terracotta mt-0.5">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-primary">Arc Generation</p>
                  <p className="text-[11px] text-tertiary/70">Gemini creates personalized narrative arcs</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-terracotta/10 rounded-full flex items-center justify-center text-[10px] font-bold text-terracotta mt-0.5">
                  4
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-primary">Review & Publish</p>
                  <p className="text-[11px] text-tertiary/70">Professor approves and publishes to students</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-terracotta/10 rounded-full flex items-center justify-center text-[10px] font-bold text-terracotta mt-0.5">
                  5
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-primary">Signal Extraction</p>
                  <p className="text-[11px] text-tertiary/70">Automatic grading from reasoning traces</p>
                </div>
              </div>
            </div>
          </div>

          {/* Future Workflows */}
          <div className="space-y-6">
            <div className="bg-warm-white rounded-xl border border-warm-grey p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-misconception/10 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-misconception">
                    schedule
                  </span>
                </div>
                <div>
                  <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-widest">Coming Soon</h3>
                  <p className="text-[14px] font-bold text-primary">Batch Arc Generation</p>
                </div>
              </div>
              <p className="text-[12px] text-tertiary/70 leading-relaxed">
                Generate arcs for multiple classes simultaneously with shared rubric dimensions
              </p>
            </div>

            <div className="bg-warm-white rounded-xl border border-warm-grey p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-misconception/10 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-misconception">
                    schedule
                  </span>
                </div>
                <div>
                  <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-widest">Coming Soon</h3>
                  <p className="text-[14px] font-bold text-primary">Automated Flagging</p>
                </div>
              </div>
              <p className="text-[12px] text-tertiary/70 leading-relaxed">
                Automatically flag students with critical gaps for intervention
              </p>
            </div>

            <div className="bg-warm-white rounded-xl border border-warm-grey p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-misconception/10 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-misconception">
                    schedule
                  </span>
                </div>
                <div>
                  <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-widest">Coming Soon</h3>
                  <p className="text-[14px] font-bold text-primary">Export to LMS</p>
                </div>
              </div>
              <p className="text-[12px] text-tertiary/70 leading-relaxed">
                Export grading reports directly to Canvas, Blackboard, or Moodle
              </p>
            </div>
          </div>
        </div>

        {/* System Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-warm-white rounded-xl border border-warm-grey p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-3xl text-mastery/50">
                auto_awesome
              </span>
              <span className="text-[10px] font-extrabold text-mastery bg-mastery/10 px-2 py-1 rounded-full uppercase tracking-widest">
                Active
              </span>
            </div>
            <p className="text-3xl font-extrabold text-primary mb-1">94%</p>
            <p className="text-[11px] text-tertiary uppercase tracking-widest font-bold">Grading Efficiency</p>
          </div>

          <div className="bg-warm-white rounded-xl border border-warm-grey p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-3xl text-terracotta/50">
                query_stats
              </span>
              <span className="text-[10px] font-extrabold text-terracotta bg-terracotta/10 px-2 py-1 rounded-full uppercase tracking-widest">
                Live
              </span>
            </div>
            <p className="text-3xl font-extrabold text-primary mb-1">247</p>
            <p className="text-[11px] text-tertiary uppercase tracking-widest font-bold">Reasoning Traces</p>
          </div>

          <div className="bg-warm-white rounded-xl border border-warm-grey p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-3xl text-wheat-gold/50">
                speed
              </span>
              <span className="text-[10px] font-extrabold text-wheat-gold bg-wheat-gold/10 px-2 py-1 rounded-full uppercase tracking-widest">
                Avg
              </span>
            </div>
            <p className="text-3xl font-extrabold text-primary mb-1">4.2m</p>
            <p className="text-[11px] text-tertiary uppercase tracking-widest font-bold">Arc Generation Time</p>
          </div>
        </div>
      </main>
    </div>
  );
}
