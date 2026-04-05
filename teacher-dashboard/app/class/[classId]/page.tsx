// Class detail page - refactored to use real API data
// Shows class overview, student performance, and arc status

'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';
import { TopBar } from '../../components/TopBar';
import { StudentRow } from '../../components/StudentRow';
import { StudentProgressTable } from '../../components/StudentProgressTable';
import { ArcStatusBox } from '../../components/ArcStatusBox';
import { ArcReviewModal } from '../../components/features/arc-generator/ArcReviewModal';
import { useClass } from '../../hooks/useClasses';
import { useArcs } from '../../hooks/useArcs';
import { useClassStudents } from '../../hooks/useStudents';
import { useApproveArc } from '../../hooks/useArcMutations';
import { api } from '../../lib/api';
import type { Arc } from '../../lib/types';

export default function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const router = useRouter();
  const { data: classData, isLoading: classLoading, error: classError } = useClass(classId);
  const { data: arcs, isLoading: arcsLoading, refetch: refetchArcs } = useArcs(classId);
  const { data: students, isLoading: studentsLoading } = useClassStudents(classId);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [pendingArc, setPendingArc] = useState<Arc | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const approveMutation = useApproveArc();

  const isLoading = classLoading || arcsLoading;
  const currentArc = arcs?.[0];

  const handleArcGenerated = (arc: Arc) => {
    // Don't auto-show modal, just refresh to show the draft arc
    refetchArcs();
  };

  const handleReviewClick = () => {
    if (currentArc) {
      setPendingArc(currentArc);
      setShowReviewModal(true);
    }
  };

  const handleApprove = async () => {
    if (!pendingArc) return;
    try {
      await approveMutation.mutateAsync(pendingArc.arc_id);
      setShowReviewModal(false);
      setPendingArc(null);
      refetchArcs(); // Refresh to show the approved arc
    } catch (error) {
      console.error('Arc approval failed:', error);
    }
  };

  const handleRegenerate = async () => {
    if (!pendingArc) return;

    // Delete the draft arc
    if (confirm('Discard this arc and start over?')) {
      try {
        await api.arc.delete(pendingArc.arc_id);
        setShowReviewModal(false);
        setPendingArc(null);
        refetchArcs();
      } catch (e: any) {
        alert('Failed to delete arc: ' + e.message);
      }
    }
  };

  const handleCloseModal = async () => {
    // When X is clicked, delete the draft arc
    if (pendingArc && pendingArc.status === 'draft') {
      if (confirm('Discard this draft arc?')) {
        try {
          await api.arc.delete(pendingArc.arc_id);
          setShowReviewModal(false);
          setPendingArc(null);
          refetchArcs();
        } catch (e: any) {
          alert('Failed to delete arc: ' + e.message);
        }
      }
    } else {
      setShowReviewModal(false);
    }
  };

  const handlePublish = async () => {
    if (!currentArc) return;
    if (confirm('Publish this arc to students? This will generate all scenes and assign character variants.')) {
      setIsPublishing(true);
      try {
        await api.arc.publish(currentArc.arc_id);
        await refetchArcs();
        alert('Arc published successfully!');
      } catch (e: any) {
        alert('Failed to publish: ' + e.message);
      } finally {
        setIsPublishing(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!currentArc) return;
    if (confirm('Delete this arc and all scenes? This cannot be undone.')) {
      try {
        await api.arc.delete(currentArc.arc_id);
        refetchArcs();
      } catch (e: any) {
        alert('Failed to delete arc: ' + e.message);
      }
    }
  };

  // Extract unique dimension names from students
  const dimensionNames = students && students.length > 0
    ? Object.keys(students[0].dimensions)
    : [];

  if (classError) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="ml-64 min-h-screen bg-parchment p-10 flex-1">
          <TopBar />
          <div className="bg-warm-white p-8 rounded-xl border border-warm-grey">
            <p className="text-terracotta font-bold">Error loading class: {classError.message}</p>
          </div>
        </main>
      </div>
    );
  }

  const icon = classData?.subject === 'Economics' ? 'finance' :
               classData?.subject === 'Software Development' ? 'code' :
               classData?.subject === 'English Standard' ? 'menu_book' : 'school';

  const statusLabel = classData?.status === 'published' ? 'ACTIVE' :
                     classData?.status === 'generating' ? 'GENERATING' :
                     classData?.status === 'draft' ? 'DRAFT' : 'NO ARC';

  return (
    <div className="flex">
      <Sidebar />

      <main className="ml-64 min-h-screen bg-parchment p-10 flex-1">
        <TopBar />

        <div className="grid grid-cols-12 gap-8">
          <section className="col-span-12 lg:col-span-9 space-y-8">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="text-[11px] font-extrabold text-tertiary uppercase tracking-[0.2em] hover:text-terracotta transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back to Dashboard
              </Link>
              <Link href={`/class/${classId}/arc/new`}>
                <button className="text-[10px] font-extrabold text-terracotta hover:text-terracotta/80 transition-all uppercase tracking-widest flex items-center gap-1">
                  Create New Arc
                  <span className="material-symbols-outlined text-xs">add</span>
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group bg-warm-white p-8 rounded-xl border border-warm-grey hover:border-terracotta/20 transition-all duration-500 relative overflow-hidden flex flex-col justify-between h-full">
                <div className="absolute top-0 right-0 w-48 h-48 bg-terracotta/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-terracotta/10 transition-all"></div>
                <div>
                  <div className="flex justify-between items-start mb-6">
                    {isLoading ? (
                      <div className="w-12 h-12 bg-terracotta/10 rounded-lg animate-pulse"></div>
                    ) : (
                      <div className="w-12 h-12 bg-terracotta/10 rounded-lg flex items-center justify-center text-terracotta">
                        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                      </div>
                    )}
                    <span className="text-[9px] font-extrabold text-terracotta bg-terracotta/10 px-2.5 py-1 rounded-full tracking-widest">
                      {isLoading ? 'LOADING...' : statusLabel}
                    </span>
                  </div>
                  {isLoading ? (
                    <>
                      <div className="h-8 bg-warm-grey rounded mb-3 w-3/4 animate-pulse"></div>
                      <div className="h-4 bg-warm-grey rounded w-full animate-pulse"></div>
                    </>
                  ) : (
                    <>
                      <h4 className="text-2xl font-bold text-primary tracking-tight mb-3">{classData?.name}</h4>
                      <p className="text-[14px] text-tertiary leading-relaxed max-w-sm">
                        {classData?.subject} - {classData?.module || 'General Course'}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between mt-10 pt-6 border-t border-warm-grey">
                  <div className="flex items-center gap-2 text-tertiary">
                    <span className="material-symbols-outlined text-lg">group</span>
                    <span className="text-[12px] font-bold">
                      {isLoading ? '--' : classData?.enrollment?.length || 0} Students Enrolled
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-bold text-primary">0%</span>
                    <div className="w-16 h-1 bg-warm-grey rounded-full overflow-hidden">
                      <div className="w-0 h-full bg-terracotta"></div>
                    </div>
                  </div>
                </div>
              </div>

              <ArcStatusBox
                classId={classId}
                currentArc={currentArc}
                isLoading={isLoading}
                isPublishing={isPublishing}
                onArcGenerated={handleArcGenerated}
                onPublish={handlePublish}
                onDelete={handleDelete}
                onReviewClick={handleReviewClick}
              />
            </div>

            <div className="pt-8">
              <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-[0.2em] mb-6">Student Performance</h3>
              {studentsLoading ? (
                <div className="bg-warm-white rounded-xl border border-warm-grey p-8">
                  <div className="space-y-4">
                    <div className="h-8 bg-warm-grey rounded animate-pulse"></div>
                    <div className="h-8 bg-warm-grey rounded animate-pulse"></div>
                    <div className="h-8 bg-warm-grey rounded animate-pulse"></div>
                  </div>
                </div>
              ) : students && students.length > 0 ? (
                <StudentProgressTable
                  students={students}
                  dimensionNames={dimensionNames}
                />
              ) : (
                <div className="bg-warm-white rounded-xl border border-warm-grey p-12 text-center">
                  <span className="material-symbols-outlined text-6xl text-tertiary/30 mb-4 block">
                    group_off
                  </span>
                  <p className="text-[13px] text-tertiary">No students enrolled yet</p>
                </div>
              )}
            </div>
          </section>

          <aside className="col-span-12 lg:col-span-3 space-y-8">
            <div>
              <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-[0.2em] mb-6">Activity Timeline</h3>
              <div className="bg-warm-white rounded-xl p-6 border border-warm-grey">
                <p className="text-[12px] text-tertiary italic">No activity yet</p>
              </div>
            </div>

            <div className="bg-warm-white p-8 rounded-xl border border-warm-grey shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-6xl text-terracotta">auto_awesome</span>
              </div>
              <h4 className="text-[10px] font-extrabold text-terracotta uppercase tracking-[0.25em] mb-6">Focus Metric</h4>
              <div className="flex items-end justify-between relative z-10">
                <div>
                  <span className="text-4xl font-extrabold text-primary tracking-tighter">--</span>
                  <p className="text-[10px] font-bold text-tertiary uppercase mt-1">Grading Efficiency</p>
                </div>
                <div className="w-20 h-20 relative">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-warm-grey" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeWidth="6"></circle>
                    <circle className="text-terracotta" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeDasharray="213" strokeDashoffset="20" strokeLinecap="round" strokeWidth="6"></circle>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-terracotta">N/A</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <footer className="w-full py-12 mt-24 border-t border-warm-grey flex flex-col md:flex-row justify-between items-center gap-8 px-4">
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

      {/* Arc Review Modal */}
      {pendingArc && (
        <ArcReviewModal
          arc={pendingArc}
          isOpen={showReviewModal}
          onClose={handleCloseModal}
          onApprove={handleApprove}
          onRegenerate={handleRegenerate}
        />
      )}
    </div>
  );
}
