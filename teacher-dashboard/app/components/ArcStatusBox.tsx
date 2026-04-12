// Arc Status Box with integrated document upload
// In demo/showcase mode the upload flow returns a pre-existing arc instead of generating a new one
// Delete arc is disabled - the demo arc stays fixed

'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import { useAuth } from '../../lib/auth-context';

const FALLBACK_ARC_ID = '2d684a9d-1e50-41e4-9838-82da00338258';

interface ArcStatusBoxProps {
  classId: string;
  currentArc: any;
  isLoading: boolean;
  isPublishing?: boolean;
  onArcGenerated: (arc: any) => void;
  onPublish: () => void;
  onDelete?: () => void;
  onReviewClick?: () => void;
  progressData?: {
    total_students: number;
    students: Array<{
      student_id: string;
      assignments: Array<{
        scene_order: number;
        status: 'not_started' | 'started' | 'completed';
      }>;
    }>;
  };
}

export function ArcStatusBox({
  classId,
  currentArc,
  isLoading,
  isPublishing = false,
  onArcGenerated,
  onPublish,
  onDelete: _onDelete,
  onReviewClick,
  progressData
}: ArcStatusBoxProps) {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);

  useEffect(() => {
    const uploaded = localStorage.getItem(`arc_uploaded_${classId}`);
    setHasUploaded(!!uploaded);
  }, [classId]);

  // treat arc as present only if the professor has gone through the upload flow
  const effectiveArc = hasUploaded ? currentArc : null;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (effectiveArc) return; // Only allow drag when no arc exists
    e.preventDefault();
    setIsDragging(true);
  }, [effectiveArc]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (effectiveArc) return; // Only allow drop when no arc exists

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type === 'application/pdf' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'text/plain'
    );

    if (files.length === 0) return;

    await processFile(files[0]);
  }, [effectiveArc, classId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (_file: File) => {
    setIsProcessing(true);

    // Demo mode: run through fake generation stages, then return the pre-existing arc for this class
    const stages = [
      'Reading document...',
      'Parsing assessment structure...',
      'Extracting learning objectives...',
      'Identifying misconceptions...',
      'Generating narrative arc...',
      'Creating character profiles...',
      'Planning scene sequences...',
      'Finalizing arc...'
    ];

    let stageIndex = 0;
    const stageInterval = setInterval(() => {
      if (stageIndex < stages.length) {
        setProcessingStage(stages[stageIndex]);
        stageIndex++;
      }
    }, 1500);

    try {
      // Wait for all stages to display, then fetch whichever arc already exists for this class
      await new Promise(resolve => setTimeout(resolve, stages.length * 1500 + 500));
      clearInterval(stageInterval);

      let arcId = FALLBACK_ARC_ID;
      try {
        const classArcs = await api.arc.getByClass(classId);
        if (classArcs && classArcs.length > 0) {
          arcId = classArcs[0].arc_id;
        }
      } catch {
        // fall through to fallback
      }

      const arc = await api.arc.getById(arcId);
      localStorage.setItem(`arc_uploaded_${classId}`, 'true');
      setHasUploaded(true);
      setIsProcessing(false);
      onArcGenerated(arc);
    } catch (error: any) {
      clearInterval(stageInterval);
      setIsProcessing(false);
      console.error('Failed to load arc:', error);
      alert('Could not load arc: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-warm-white p-8 rounded-xl border border-warm-grey flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <h4 className="text-[11px] font-extrabold text-tertiary uppercase tracking-widest">Arc Status</h4>
          <span className="material-symbols-outlined text-tertiary/50">assessment</span>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-warm-grey rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-warm-grey rounded w-1/2 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="bg-warm-white p-8 rounded-xl border border-warm-grey flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <h4 className="text-[11px] font-extrabold text-tertiary uppercase tracking-widest">Arc Status</h4>
          <span className="material-symbols-outlined text-tertiary/50">assessment</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="animate-bounce mb-4">
            <span className="material-symbols-outlined text-5xl text-terracotta">description</span>
          </div>
          <p className="text-[13px] font-bold text-primary mb-2">Generating Arc</p>
          <p className="text-[11px] text-wheat font-bold animate-pulse">{processingStage}</p>
        </div>
      </div>
    );
  }

  if (isPublishing) {
    return (
      <div className="bg-warm-white p-8 rounded-xl border border-warm-grey flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <h4 className="text-[11px] font-extrabold text-tertiary uppercase tracking-widest">Arc Status</h4>
          <span className="material-symbols-outlined text-tertiary/50">assessment</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="animate-spin mb-4">
            <span className="material-symbols-outlined text-5xl text-terracotta">autorenew</span>
          </div>
          <p className="text-[13px] font-bold text-primary mb-2">Publishing Arc</p>
          <p className="text-[11px] text-wheat font-bold">Generating scenes and assigning characters...</p>
        </div>
      </div>
    );
  }

  if (effectiveArc) {
    return (
      <div className="bg-warm-white p-8 rounded-xl border border-warm-grey flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <h4 className="text-[11px] font-extrabold text-tertiary uppercase tracking-widest">Arc Status</h4>
          <span className="material-symbols-outlined text-tertiary/50">assessment</span>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-4 flex-1 min-w-0">
              <div>
                <p className="text-[11px] text-tertiary font-bold uppercase mb-1">Arc ID</p>
                <p className="text-[13px] font-bold text-primary">{effectiveArc.arc_id}</p>
              </div>
              <div>
                <p className="text-[11px] text-tertiary font-bold uppercase mb-1">Status</p>
                <p className="text-[13px] font-bold text-terracotta">{effectiveArc.status}</p>
              </div>
              <div>
                <p className="text-[11px] text-tertiary font-bold uppercase mb-1">Scenes</p>
                <p className="text-[13px] font-bold text-primary">{effectiveArc.scenes?.length || 0} scenes</p>
              </div>
              {effectiveArc.status === 'published' && (
                <>
                  <div className="min-w-0">
                    <p className="text-[11px] text-tertiary font-bold uppercase mb-1">Student Link</p>
                    <a
                      href={`${process.env.NEXT_PUBLIC_STUDENT_URL || 'https://cervantes-caebc.web.app'}/${effectiveArc.arc_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-bold text-[#2563eb] hover:text-[#1d4ed8] transition-colors flex items-center gap-1 group min-w-0"
                    >
                      <span className="truncate min-w-0">student-portal/{effectiveArc.arc_id}</span>
                      <span className="material-symbols-outlined text-xs flex-shrink-0 group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </a>
                  </div>
                  {progressData && (
                    <div>
                      <p className="text-[11px] text-tertiary font-bold uppercase mb-1">Active Students</p>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const activeCount = progressData.students.filter(s =>
                            s.assignments.some(a => a.status === 'started' || a.status === 'completed')
                          ).length;
                          const completedCount = progressData.students.filter(s =>
                            s.assignments.every(a => a.status === 'completed')
                          ).length;

                          return (
                            <>
                              <span className="text-[13px] font-bold text-primary">{activeCount} active</span>
                              {completedCount > 0 && (
                                <>
                                  <span className="text-tertiary">•</span>
                                  <span className="text-[13px] font-bold text-mastery">{completedCount} completed</span>
                                </>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Three-dot Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 hover:bg-parchment rounded transition-colors"
              >
                <span className="material-symbols-outlined text-secondary">more_vert</span>
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-40 bg-card-surface border border-warm-grey rounded shadow-lg z-20">
                    <Link href={`/arc/${effectiveArc.arc_id}?mode=edit`}>
                      <button
                        onClick={() => setMenuOpen(false)}
                        className="w-full px-4 py-2 text-left text-xs text-secondary hover:bg-parchment flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Edit Arc
                      </button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons - Bottom Right */}
          <div className="flex justify-end gap-3 mt-auto">
            {effectiveArc.status === 'draft' && onReviewClick && (
              <button
                onClick={onReviewClick}
                className="px-6 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded transition-all flex items-center gap-2 bg-terracotta text-parchment hover:bg-terracotta/90"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                Review & Confirm
              </button>
            )}
            {effectiveArc.status === 'approved' && (
              <button
                disabled={!effectiveArc.scenes || effectiveArc.scenes.length === 0}
                className={`px-6 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded transition-all flex items-center gap-2 ${
                  !effectiveArc.scenes || effectiveArc.scenes.length === 0
                    ? 'bg-warm-grey text-tertiary cursor-not-allowed opacity-50'
                    : 'bg-terracotta text-parchment hover:bg-terracotta/80'
                }`}
                onClick={onPublish}
              >
                <span className="material-symbols-outlined text-sm">publish</span>
                Publish Scenes
              </button>
            )}
            {effectiveArc.status === 'published' && (
              <>
                <Link href={`/arc/${effectiveArc.arc_id}`}>
                  <button className="px-6 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded transition-all flex items-center gap-2 bg-wheat text-parchment hover:bg-wheat/90">
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    View Scenes
                  </button>
                </Link>
                <div className="px-6 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded bg-mastery/10 text-mastery flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Published
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No arc - show drop zone
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        bg-warm-white p-8 rounded-xl border-2 border-dashed flex flex-col h-full transition-all cursor-pointer
        ${isDragging ? 'border-terracotta bg-terracotta/5' : 'border-warm-grey hover:border-terracotta/50 hover:bg-terracotta/5'}
      `}
    >
      <div className="flex items-center justify-between mb-8">
        <h4 className="text-[11px] font-extrabold text-tertiary uppercase tracking-widest">Arc Status</h4>
        <span className="material-symbols-outlined text-tertiary/50">assessment</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <span className="material-symbols-outlined text-5xl text-tertiary/20 mb-4">
          {isDragging ? 'upload_file' : 'auto_stories'}
        </span>
        <p className="text-[13px] text-tertiary mb-4">
          {isDragging ? 'Drop assessment document here' : 'No arc created yet for this class'}
        </p>
        {!isDragging && (
          <>
            <p className="text-[10px] text-tertiary/70 mb-4">Drag and drop a rubric to create arc</p>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
              id={`file-upload-${classId}`}
            />
            <label htmlFor={`file-upload-${classId}`}>
              <span className="inline-block text-[10px] font-extrabold text-terracotta hover:text-terracotta/80 transition-all uppercase tracking-widest cursor-pointer flex items-center gap-1">
                Or Browse Files
                <span className="material-symbols-outlined text-xs">add</span>
              </span>
            </label>
          </>
        )}
      </div>
    </div>
  );
}
