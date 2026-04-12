// Class detail page - refactored to use real API data
// Shows class overview, student performance, and arc status

'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '../../components/Sidebar';
import { TopBar } from '../../components/TopBar';
import { StudentProgressTable } from '../../components/StudentProgressTable';
import { ArcStatusBox } from '../../components/ArcStatusBox';
import { ScenariosTab } from '../../components/ScenariosTab';
import { ArcReviewModal } from '../../components/features/arc-generator/ArcReviewModal';
import { useClass } from '../../hooks/useClasses';
import { useArcs } from '../../hooks/useArcs';
import { useClassStudents, useClassArcProgress } from '../../hooks/useStudents';
import { useApproveArc } from '../../hooks/useArcMutations';
import { api } from '../../lib/api';
import type { Arc } from '../../lib/types';

export default function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const { data: classData, isLoading: classLoading, error: classError } = useClass(classId);
  const { data: arcs, isLoading: arcsLoading, refetch: refetchArcs } = useArcs(classId);
  const { data: students, isLoading: studentsLoading } = useClassStudents(classId);
  const [activeTab, setActiveTab] = useState<'students' | 'scenarios'>('students');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [pendingArc, setPendingArc] = useState<Arc | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'success' | 'timeout'>('idle');
  const approveMutation = useApproveArc();

  const isLoading = classLoading || arcsLoading;
  const currentArc = arcs?.[0];

  // Poll for real-time student progress if arc is published
  const { data: progressData } = useClassArcProgress(
    currentArc?.status === 'published' ? classId : null,
    currentArc?.status === 'published' ? currentArc.arc_id : null
  );

  // Merge progress data with student data for real-time status updates
  const studentsWithProgress = students?.map(student => {
    if (!progressData) return student;

    const studentProgress = progressData.students.find(
      s => s.student_id === student.student_id
    );

    if (!studentProgress) return student;

    // Calculate scenes completed and status
    const scenesCompleted = studentProgress.assignments.filter(a => a.status === 'completed').length;
    const totalScenes = studentProgress.assignments.length;
    const hasStarted = studentProgress.assignments.some(a => a.status === 'started' || a.status === 'completed');
    const allCompleted = studentProgress.assignments.every(a => a.status === 'completed');

    let arc_status: 'complete' | 'in_progress' | 'not_started' = 'not_started';
    if (allCompleted) {
      arc_status = 'complete';
    } else if (hasStarted) {
      arc_status = 'in_progress';
    }

    return {
      ...student,
      arc_status,
      scenes_completed: scenesCompleted,
      total_scenes: totalScenes,
      progress: totalScenes > 0 ? Math.round((scenesCompleted / totalScenes) * 100) : 0,
    };
  }) || students;

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

  const handleRegenerate = () => {
    // In demo mode arc regeneration is disabled - just close the modal
    setShowReviewModal(false);
    setPendingArc(null);
  };

  const handleCloseModal = () => {
    setShowReviewModal(false);
  };

  const handlePublish = async () => {
    if (!currentArc) return;
    setShowPublishConfirm(false);
    setIsPublishing(true);
    setPublishStatus('publishing');

    try {
      // Set a timeout to show "still processing" message after 45 seconds
      const timeoutId = setTimeout(() => {
        setPublishStatus('timeout');
      }, 45000);

      await api.arc.publish(currentArc.arc_id);
      clearTimeout(timeoutId);

      setPublishStatus('success');
      await refetchArcs();

      // Auto-close success message after 3 seconds
      setTimeout(() => {
        setIsPublishing(false);
        setPublishStatus('idle');
      }, 3000);
    } catch (e: any) {
      console.error('Publish error:', e);

      // If it's a timeout error, the backend is still processing
      if (e.message?.includes('timeout') || e.message?.includes('NetworkError')) {
        // Show timeout message and start polling
        setPublishStatus('timeout');

        // Poll for completion every 5 seconds
        const pollInterval = setInterval(async () => {
          try {
            const arcs = await api.arc.getByClass(classId);
            const arc = arcs.find((a: any) => a.arc_id === currentArc.arc_id);

            if (arc?.status === 'published') {
              clearInterval(pollInterval);
              setPublishStatus('success');
              await refetchArcs();

              setTimeout(() => {
                setIsPublishing(false);
                setPublishStatus('idle');
              }, 3000);
            }
          } catch (pollError) {
            console.error('Poll error:', pollError);
          }
        }, 5000);

        // Stop polling after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          if (publishStatus === 'timeout') {
            setPublishStatus('idle');
            setIsPublishing(false);
          }
        }, 300000);
      } else {
        // Real error - show error message
        setPublishStatus('idle');
        setIsPublishing(false);
        alert('Failed to publish: ' + e.message);
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
              <div className="group bg-warm-white p-8 rounded-xl border border-warm-grey hover:border-terracotta/20 transition-all duration-500 relative overflow-hidden flex flex-col h-full">
                <div className="absolute top-0 right-0 w-48 h-48 bg-terracotta/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-terracotta/10 transition-all"></div>
                <div className="flex-1">
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
                      <p className="text-[14px] text-tertiary leading-relaxed mb-4">
                        {classData?.subject} - {classData?.module || 'General Course'}
                      </p>

                      {/* Curriculum Data Section */}
                      {currentArc?.curriculum_data && (
                        <div className="mt-6 space-y-4">
                          {/* Learning Outcomes */}
                          {currentArc.curriculum_data.learning_outcomes && currentArc.curriculum_data.learning_outcomes.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-wheat-gold text-sm">target</span>
                                <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-tertiary">Learning Objectives</h5>
                              </div>
                              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2">
                                {currentArc.curriculum_data.learning_outcomes.slice(0, 3).map((outcome, idx) => (
                                  <div key={idx} className="flex items-start gap-2">
                                    <span className="text-wheat-gold text-[10px] mt-0.5">•</span>
                                    <p className="text-[11px] text-body leading-relaxed">{outcome}</p>
                                  </div>
                                ))}
                                {currentArc.curriculum_data.learning_outcomes.length > 3 && (
                                  <p className="text-[10px] text-tertiary/60 italic pl-3">
                                    +{currentArc.curriculum_data.learning_outcomes.length - 3} more
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Key Concepts */}
                          {currentArc.curriculum_data.key_concepts && currentArc.curriculum_data.key_concepts.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-terracotta text-sm">lightbulb</span>
                                <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-tertiary">Key Concepts</h5>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {currentArc.curriculum_data.key_concepts.slice(0, 4).map((concept, idx) => (
                                  <span key={idx} className="text-[10px] font-semibold px-2 py-1 bg-terracotta/10 text-terracotta rounded">
                                    {concept}
                                  </span>
                                ))}
                                {currentArc.curriculum_data.key_concepts.length > 4 && (
                                  <span className="text-[10px] font-semibold px-2 py-1 bg-warm-grey/30 text-tertiary/60 rounded">
                                    +{currentArc.curriculum_data.key_concepts.length - 4}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-warm-grey">
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
                onPublish={() => setShowPublishConfirm(true)}
                onReviewClick={handleReviewClick}
                progressData={progressData}
              />
            </div>

            {/* Tab navigation */}
            <div className="pt-8">
              <div className="flex items-center gap-1 border-b border-warm-grey mb-6" role="tablist">
                <button
                  role="tab"
                  aria-selected={activeTab === 'students'}
                  onClick={() => setActiveTab('students')}
                  className={`px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.2em] transition-all relative focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta rounded-sm ${
                    activeTab === 'students'
                      ? 'text-terracotta'
                      : 'text-tertiary hover:text-primary'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">group</span>
                    Student Performance
                  </span>
                  <span className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-200 ${
                    activeTab === 'students' ? 'bg-terracotta opacity-100' : 'bg-transparent opacity-0'
                  }`} />
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === 'scenarios'}
                  onClick={() => setActiveTab('scenarios')}
                  className={`px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.2em] transition-all relative focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta rounded-sm ${
                    activeTab === 'scenarios'
                      ? 'text-terracotta'
                      : 'text-tertiary hover:text-primary'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">auto_stories</span>
                    Scenarios
                  </span>
                  <span className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-200 ${
                    activeTab === 'scenarios' ? 'bg-terracotta opacity-100' : 'bg-transparent opacity-0'
                  }`} />
                </button>
              </div>

              {/* Tab content */}
              {activeTab === 'students' && (
                <>
                  {studentsLoading ? (
                    <div className="bg-warm-white rounded-xl border border-warm-grey p-8">
                      <div className="space-y-4">
                        <div className="h-8 bg-warm-grey rounded animate-pulse"></div>
                        <div className="h-8 bg-warm-grey rounded animate-pulse"></div>
                        <div className="h-8 bg-warm-grey rounded animate-pulse"></div>
                      </div>
                    </div>
                  ) : studentsWithProgress && studentsWithProgress.length > 0 ? (
                    <StudentProgressTable
                      students={studentsWithProgress}
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
                </>
              )}

              {activeTab === 'scenarios' && (
                <ScenariosTab classId={classId} />
              )}
            </div>
          </section>

          <aside className="col-span-12 lg:col-span-3 space-y-8">
            <div>
              <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-[0.2em] mb-6">Activity Timeline</h3>
              <div className="bg-warm-white rounded-xl p-6 border border-warm-grey">
                {studentsWithProgress && studentsWithProgress.length > 0 ? (
                  <div className="relative">
                    <div className="absolute left-4 top-2 bottom-2 w-px bg-warm-grey"></div>
                    <div className="space-y-4 relative">
                      {studentsWithProgress
                        .filter(s => s.scenes_completed > 0)
                        .sort((a, b) => (b.scenes_completed || 0) - (a.scenes_completed || 0))
                        .slice(0, 8)
                        .map((student, index) => {
                          const statusColor = student.arc_status === 'complete' ? '#3B827E' :
                                             student.arc_status === 'in_progress' ? '#D4A347' : '#8A7F72';
                          const statusIcon = student.arc_status === 'complete' ? 'check_circle' :
                                           student.arc_status === 'in_progress' ? 'schedule' : 'radio_button_unchecked';

                          return (
                            <div key={student.student_id} className="flex items-start gap-3 relative">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative z-10"
                                style={{ backgroundColor: `${statusColor}15`, border: `2px solid ${statusColor}` }}
                              >
                                <span className="material-symbols-outlined text-sm" style={{ color: statusColor }}>{statusIcon}</span>
                              </div>
                              <div className="flex-1 pt-1">
                                <p className="text-[11px] font-bold text-primary">{student.student_name}</p>
                                <p className="text-[10px] text-tertiary mt-0.5">
                                  {student.scenes_completed || 0}/{student.total_scenes || 0} scenes
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] text-tertiary italic">No activity yet</p>
                )}
              </div>
            </div>

            <div className="bg-warm-white p-8 rounded-xl border border-warm-grey shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-6xl text-terracotta">auto_awesome</span>
              </div>
              <h4 className="text-[10px] font-extrabold text-terracotta uppercase tracking-[0.25em] mb-6">Focus Metric</h4>
              <div className="flex items-end justify-between relative z-10">
                <div>
                  {(() => {
                    const avgProgress = studentsWithProgress && studentsWithProgress.length > 0
                      ? Math.round(studentsWithProgress.reduce((sum, s) => sum + (s.progress || 0), 0) / studentsWithProgress.length)
                      : 0;
                    const studentsAtRisk = studentsWithProgress?.filter(s =>
                      s.arc_status === 'in_progress' && (s.progress || 0) < 30
                    ).length || 0;

                    return (
                      <>
                        <span className="text-4xl font-extrabold text-primary tracking-tighter">{avgProgress}%</span>
                        <p className="text-[10px] font-bold text-tertiary uppercase mt-1">Avg Progress</p>
                        {studentsAtRisk > 0 && (
                          <p className="text-[9px] text-critical mt-2">{studentsAtRisk} student{studentsAtRisk > 1 ? 's' : ''} need attention</p>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="w-20 h-20 relative">
                  {(() => {
                    const avgProgress = studentsWithProgress && studentsWithProgress.length > 0
                      ? Math.round(studentsWithProgress.reduce((sum, s) => sum + (s.progress || 0), 0) / studentsWithProgress.length)
                      : 0;
                    const circumference = 213;
                    const offset = circumference - (avgProgress / 100) * circumference;

                    return (
                      <>
                        <svg className="w-full h-full transform -rotate-90">
                          <circle className="text-warm-grey" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeWidth="6"></circle>
                          <circle className="text-terracotta" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" strokeWidth="6"></circle>
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-terracotta">
                          {avgProgress > 0 ? `${avgProgress}%` : 'N/A'}
                        </span>
                      </>
                    );
                  })()}
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

      {/* Publish Confirmation Modal */}
      {showPublishConfirm && (
        <div className="fixed inset-0 bg-near-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-warm-white rounded-xl border border-warm-grey p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-terracotta text-3xl">publish</span>
              <h3 className="text-xl font-bold text-primary">Publish Arc to Students?</h3>
            </div>
            <p className="text-[14px] text-body leading-relaxed mb-6">
              This will generate all VN scenes with dialogue and assign unique character variants to each student.
              This process may take 1-2 minutes to complete.
            </p>
            <div className="bg-wheat/10 border border-wheat/30 rounded-lg p-4 mb-6">
              <p className="text-[12px] text-tertiary leading-relaxed">
                <strong className="text-primary">Note:</strong> Students will receive a unique link to access the arc.
                Once published, the arc cannot be unpublished.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowPublishConfirm(false)}
                className="px-6 py-2.5 text-[11px] font-extrabold uppercase tracking-widest rounded transition-all bg-warm-grey text-tertiary hover:bg-warm-grey/80"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                className="px-6 py-2.5 text-[11px] font-extrabold uppercase tracking-widest rounded transition-all bg-terracotta text-parchment hover:bg-terracotta/90 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">publish</span>
                Publish Arc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publishing Status Modal */}
      {isPublishing && (
        <div className="fixed inset-0 bg-near-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-warm-white rounded-xl border border-warm-grey p-8 max-w-md w-full shadow-2xl">
            {publishStatus === 'publishing' && (
              <>
                <div className="flex flex-col items-center text-center">
                  <div className="animate-spin mb-6">
                    <span className="material-symbols-outlined text-6xl text-terracotta">autorenew</span>
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-3">Publishing Arc...</h3>
                  <p className="text-[13px] text-body leading-relaxed mb-4">
                    Generating VN scenes and assigning character variants to students.
                  </p>
                  <div className="w-full bg-warm-grey rounded-full h-2 overflow-hidden">
                    <div className="bg-terracotta h-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-[11px] text-tertiary mt-4">
                    This usually takes 1-2 minutes. Please wait...
                  </p>
                </div>
              </>
            )}

            {publishStatus === 'timeout' && (
              <>
                <div className="flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-6xl text-wheat-gold mb-4">schedule</span>
                  <h3 className="text-xl font-bold text-primary mb-3">Still Processing...</h3>
                  <p className="text-[13px] text-body leading-relaxed mb-4">
                    The arc is still being generated in the background. This is normal for large arcs with multiple scenes.
                  </p>
                  <div className="bg-wheat/10 border border-wheat/30 rounded-lg p-4 mb-6">
                    <p className="text-[12px] text-tertiary leading-relaxed">
                      You can safely close this and check back in a minute. Refresh the page to see if publishing has completed.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsPublishing(false);
                      setPublishStatus('idle');
                      refetchArcs();
                    }}
                    className="px-6 py-2.5 text-[11px] font-extrabold uppercase tracking-widest rounded transition-all bg-terracotta text-parchment hover:bg-terracotta/90"
                  >
                    Close & Refresh
                  </button>
                </div>
              </>
            )}

            {publishStatus === 'success' && (
              <>
                <div className="flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-6xl text-mastery mb-4">check_circle</span>
                  <h3 className="text-xl font-bold text-primary mb-3">Arc Published Successfully!</h3>
                  <p className="text-[13px] text-body leading-relaxed">
                    All scenes have been generated and students can now access the arc.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
