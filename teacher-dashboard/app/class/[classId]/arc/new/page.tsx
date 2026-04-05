// Arc creation page - workflow for uploading rubric and generating arc
// Guides professor through rubric upload → CurricuLLM parsing → arc generation → review → approval

'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '../../../../components/Sidebar';
import { TopBar } from '../../../../components/TopBar';
import { RubricUpload } from '../../../../components/features/arc-generator/RubricUpload';
import { ArcReview } from '../../../../components/features/arc-generator/ArcReview';
import { useGenerateArc, useApproveArc } from '../../../../hooks/useArcMutations';
import { useClass } from '../../../../hooks/useClasses';
import type { Arc } from '../../../../lib/types';

type WorkflowStep = 'upload' | 'generating' | 'review' | 'approved';

export default function NewArcPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const { data: classData } = useClass(classId);
  const [step, setStep] = useState<WorkflowStep>('upload');
  const [generatedArc, setGeneratedArc] = useState<Arc | null>(null);
  const [rubricData, setRubricData] = useState<any>(null);

  const generateMutation = useGenerateArc();
  const approveMutation = useApproveArc();

  const handleUploadSuccess = (data: any) => {
    setRubricData(data);
    setStep('generating');
    handleGenerateArc(data);
  };

  const handleGenerateArc = async (parsedRubric: any) => {
    try {
      const arc = await generateMutation.mutateAsync({
        class_id: classId,
        rubric_text: parsedRubric.rubric_text || parsedRubric.text,
        professor_id: 'prof_demo',
        student_subjects: [],
        student_extracurriculars: [],
      });
      setGeneratedArc(arc);
      setStep('review');
    } catch (error) {
      console.error('Arc generation failed:', error);
      setStep('upload');
    }
  };

  const handleApprove = async () => {
    if (!generatedArc) return;
    try {
      await approveMutation.mutateAsync(generatedArc.arc_id);
      setStep('approved');
    } catch (error) {
      console.error('Arc approval failed:', error);
    }
  };

  const handleRegenerate = () => {
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
              {(['upload', 'generating', 'review', 'approved'] as WorkflowStep[]).map((s, index) => {
                const isActive = s === step;
                const isComplete = ['upload', 'generating', 'review', 'approved'].indexOf(step) > index;

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
                    {index < 3 && (
                      <div className={`h-0.5 flex-1 ${isComplete ? 'bg-mastery' : 'bg-warm-grey'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-8">
            {step === 'upload' && (
              <RubricUpload classId={classId} onUploadSuccess={handleUploadSuccess} />
            )}

            {step === 'generating' && (
              <div className="bg-warm-white rounded-xl border border-warm-grey p-16 text-center">
                <div className="inline-block animate-spin mb-6">
                  <span className="material-symbols-outlined text-6xl text-terracotta">autorenew</span>
                </div>
                <h3 className="text-lg font-bold text-primary mb-2">Generating Assessment Arc</h3>
                <p className="text-[13px] text-tertiary max-w-md mx-auto">
                  CurricuLLM is analyzing your rubric and Gemini is generating personalized narrative scenes...
                </p>
              </div>
            )}

            {step === 'review' && generatedArc && (
              <ArcReview
                arc={generatedArc}
                onApprove={handleApprove}
                onRegenerate={handleRegenerate}
              />
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
      </main>
    </div>
  );
}
