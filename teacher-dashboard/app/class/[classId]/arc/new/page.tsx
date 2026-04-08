// Arc creation page - workflow for uploading rubric and generating arc
// Guides professor through rubric upload → CurricuLLM parsing → arc generation → review → approval

'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '../../../../components/Sidebar';
import { TopBar } from '../../../../components/TopBar';
import { DocumentUploadZone } from '../../../../components/features/arc-generator/DocumentUploadZone';
import { ArcReviewModal } from '../../../../components/features/arc-generator/ArcReviewModal';
import { useGenerateArc, useApproveArc } from '../../../../hooks/useArcMutations';
import { useClass } from '../../../../hooks/useClasses';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../../lib/auth-context';
import type { Arc } from '../../../../lib/types';

type WorkflowStep = 'upload' | 'generating' | 'approved';

export default function NewArcPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const { user } = useAuth();
  const { data: classData } = useClass(classId);
  const [step, setStep] = useState<WorkflowStep>('upload');
  const [generatedArc, setGeneratedArc] = useState<Arc | null>(null);
  const [rubricData, setRubricData] = useState<any>(null);
  const [generationStage, setGenerationStage] = useState<string>('Uploading rubric...');
  const [showReviewModal, setShowReviewModal] = useState(false);

  const generateMutation = useGenerateArc();
  const approveMutation = useApproveArc();

  const handleUploadSuccess = (data: any) => {
    setRubricData(data);
    setStep('generating');
    handleGenerateArc(data);
  };

  const handleGenerateArc = async (parsedRubric: any) => {
    const stages = [
      'Parsing rubric with CurricuLLM...',
      'Extracting learning objectives...',
      'Identifying misconceptions...',
      'Generating narrative structure...',
      'Creating character profiles...',
      'Planning scene sequences...',
      'Finalizing arc...'
    ];

    let currentStageIndex = 0;
    const stageInterval = setInterval(() => {
      if (currentStageIndex < stages.length) {
        setGenerationStage(stages[currentStageIndex]);
        currentStageIndex++;
      }
    }, 2000);

    try {
      const arc = await generateMutation.mutateAsync({
        class_id: classId,
        rubric_text: parsedRubric.rubric_text || parsedRubric.text,
        professor_id: user?.uid || 'unknown',
        student_subjects: [],
        student_extracurriculars: [],
      });
      clearInterval(stageInterval);
      setGeneratedArc(arc);
      setShowReviewModal(true);
      setStep('upload'); // Stay on upload page, show modal
    } catch (error) {
      clearInterval(stageInterval);
      console.error('Arc generation failed:', error);
      setStep('upload');
    }
  };

  const handleApprove = async () => {
    if (!generatedArc) return;
    try {
      await approveMutation.mutateAsync(generatedArc.arc_id);
      setShowReviewModal(false);
      setStep('approved');
    } catch (error) {
      console.error('Arc approval failed:', error);
    }
  };

  const handleRegenerate = () => {
    setShowReviewModal(false);
    setGeneratedArc(null);
    setStep('upload');
  };

  return (
    <div className="flex">
      <Sidebar />

      <main className="ml-64 min-h-screen bg-parchment p-10 flex-1">
        <TopBar />

        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link
                href={`/class/${classId}`}
                className="text-[11px] font-extrabold text-tertiary uppercase tracking-[0.2em] hover:text-terracotta transition-colors flex items-center gap-2 mb-3"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back to Class
              </Link>
              <h2 className="text-2xl font-bold text-primary tracking-tight">
                Create New Assessment Arc
              </h2>
              <p className="text-[13px] text-tertiary mt-1">
                {classData?.name || 'Loading...'}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-4">
              {(['upload', 'generating', 'approved'] as WorkflowStep[]).map((s, index) => {
                const isActive = s === step;
                const isComplete = ['upload', 'generating', 'approved'].indexOf(step) > index;

                return (
                  <div key={s} className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors
                          ${isComplete ? 'bg-mastery text-parchment' : isActive ? 'bg-terracotta text-parchment' : 'bg-warm-grey text-tertiary'}
                        `}
                      >
                        {isComplete ? '✓' : index + 1}
                      </div>
                      <span className={`text-[11px] font-bold uppercase tracking-wide ${isActive ? 'text-terracotta' : 'text-tertiary'}`}>
                        {s.replace('_', ' ')}
                      </span>
                    </div>
                    {index < 2 && (
                      <div className={`h-0.5 flex-1 ${isComplete ? 'bg-mastery' : 'bg-warm-grey'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-8">
            {step === 'upload' && (
              <DocumentUploadZone classId={classId} onUploadSuccess={handleUploadSuccess} />
            )}

            {step === 'generating' && (
              <div className="bg-warm-white rounded-xl border border-warm-grey p-16 text-center">
                <div className="inline-block animate-spin mb-6">
                  <span className="material-symbols-outlined text-6xl text-terracotta">autorenew</span>
                </div>
                <h3 className="text-lg font-bold text-primary mb-2">Generating Assessment Arc</h3>
                <p className="text-[13px] text-wheat font-bold mb-4 animate-pulse">
                  {generationStage}
                </p>
                <div className="max-w-md mx-auto bg-parchment rounded-full h-2 overflow-hidden">
                  <div className="bg-terracotta h-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
                <p className="text-[11px] text-tertiary mt-4 max-w-md mx-auto">
                  This may take 30-60 seconds as we analyze your rubric and generate personalized content
                </p>
              </div>
            )}

            {step === 'approved' && (
              <div className="bg-warm-white rounded-xl border border-warm-grey p-16 text-center">
                <span className="material-symbols-outlined text-8xl text-mastery mb-6 block">check_circle</span>
                <h3 className="text-2xl font-bold text-primary mb-4">Arc Approved!</h3>
                <p className="text-[14px] text-tertiary mb-8 max-w-md mx-auto">
                  Your assessment arc has been approved and is ready to publish to students.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link href={`/class/${classId}`}>
                    <button className="px-6 py-3 text-[11px] font-extrabold text-tertiary uppercase tracking-widest hover:text-terracotta transition-colors">
                      Back to Class
                    </button>
                  </Link>
                  <Link href={generatedArc ? `/arc/${generatedArc.arc_id}` : '#'}>
                    <button className="px-8 py-3 bg-terracotta text-parchment rounded-lg text-[11px] font-extrabold uppercase tracking-widest hover:bg-terracotta/90 transition-colors">
                      View Arc Details
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Arc Review Modal */}
        {generatedArc && (
          <ArcReviewModal
            arc={generatedArc}
            isOpen={showReviewModal}
            onClose={() => setShowReviewModal(false)}
            onApprove={handleApprove}
            onRegenerate={handleRegenerate}
          />
        )}
      </main>
    </div>
  );
}
