// Arc Status Box with integrated document upload
// Shows arc status or accepts drag-and-drop files for arc generation

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';

interface ArcStatusBoxProps {
  classId: string;
  currentArc: any;
  isLoading: boolean;
  isPublishing?: boolean;
  onArcGenerated: (arc: any) => void;
  onPublish: () => void;
  onDelete: () => void;
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
  onDelete,
  onReviewClick,
  progressData
}: ArcStatusBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (currentArc) return; // Only allow drag when no arc exists
    e.preventDefault();
    setIsDragging(true);
  }, [currentArc]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (currentArc) return; // Only allow drop when no arc exists

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type === 'application/pdf' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'text/plain'
    );

    if (files.length === 0) return;

    await processFile(files[0]);
  }, [currentArc, classId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);

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
      // Upload rubric using the API client (handles auth)
      const uploadData = await api.arc.uploadRubric(classId, file);

      // Generate arc
      const arc = await api.arc.generate({
        class_id: classId,
        rubric_text: uploadData.text,
        professor_id: 'prof_demo',
        student_subjects: [],
        student_extracurriculars: [],
      });

      clearInterval(stageInterval);
      setIsProcessing(false);
      onArcGenerated(arc); // This will trigger the review modal
    } catch (error: any) {
      clearInterval(stageInterval);
      setIsProcessing(false);
      console.error('Arc generation failed:', error);
      alert('Arc generation failed: ' + error.message);
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

  if (currentArc) {
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
                <p className="text-[13px] font-bold text-primary">{currentArc.arc_id}</p>
              </div>
              <div>
                <p className="text-[11px] text-tertiary font-bold uppercase mb-1">Status</p>
                <p className="text-[13px] font-bold text-terracotta">{currentArc.status}</p>
              </div>
              <div>
                <p className="text-[11px] text-tertiary font-bold uppercase mb-1">Scenes</p>
                <p className="text-[13px] font-bold text-primary">{currentArc.scenes?.length || 0} scenes</p>
              </div>
              {currentArc.status === 'published' && (
                <>
                  <div className="min-w-0">
                    <p className="text-[11px] text-tertiary font-bold uppercase mb-1">Student Link</p>
                    <a
                      href={`https://cervantes-backend-prod--cervantes-caebc.asia-southeast1.hosted.app/${currentArc.arc_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-bold text-[#2563eb] hover:text-[#1d4ed8] transition-colors flex items-center gap-1 group min-w-0"
                    >
                      <span className="truncate min-w-0">cervantes-student.com/{currentArc.arc_id}</span>
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
                    <Link href={`/arc/${currentArc.arc_id}?mode=edit`}>
                      <button
                        onClick={() => setMenuOpen(false)}
                        className="w-full px-4 py-2 text-left text-xs text-secondary hover:bg-parchment flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Edit Arc
                      </button>
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-[#9E3B3B] hover:bg-[#9E3B3B]/10 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Delete Arc
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons - Bottom Right */}
          <div className="flex justify-end gap-3 mt-auto">
            {currentArc.status === 'draft' && onReviewClick && (
              <button
                onClick={onReviewClick}
                className="px-6 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded transition-all flex items-center gap-2 bg-terracotta text-parchment hover:bg-terracotta/90"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                Review & Confirm
              </button>
            )}
            {currentArc.status === 'approved' && (
              <button
                disabled={!currentArc.scenes || currentArc.scenes.length === 0}
                className={`px-6 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded transition-all flex items-center gap-2 ${
                  !currentArc.scenes || currentArc.scenes.length === 0
                    ? 'bg-warm-grey text-tertiary cursor-not-allowed opacity-50'
                    : 'bg-terracotta text-parchment hover:bg-terracotta/80'
                }`}
                onClick={onPublish}
              >
                <span className="material-symbols-outlined text-sm">publish</span>
                Publish Scenes
              </button>
            )}
            {currentArc.status === 'published' && (
              <>
                <Link href={`/arc/${currentArc.arc_id}`}>
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
