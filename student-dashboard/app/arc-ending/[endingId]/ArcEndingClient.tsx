// Client component for arc ending page
// Fetches ending data and displays VN-formatted narrative with reflection prompt

'use client';

import { use, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { parseVNScene, type VNBlock } from '@/app/lib/vn-parser';

export function ArcEndingClient({ params }: { params: Promise<{ endingId: string }> }) {
  const { endingId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [endingData, setEndingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blocks, setBlocks] = useState<VNBlock[]>([]);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionAnswer, setReflectionAnswer] = useState('');

  const studentId = searchParams.get('studentId') || localStorage.getItem('currentStudentId') || '';
  const arcId = searchParams.get('arcId') || localStorage.getItem('currentArcId') || '';

  // Store in localStorage for journal access
  useEffect(() => {
    if (studentId && arcId) {
      localStorage.setItem('currentStudentId', studentId);
      localStorage.setItem('currentArcId', arcId);
    }
  }, [studentId, arcId]);

  useEffect(() => {
    const fetchEnding = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/arc-endings/${endingId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch ending');
        }

        const data = await response.json();
        setEndingData(data);

        // Parse the narrative text as VN content
        const parsedBlocks = parseVNScene(data.narrative_text);
        setBlocks(parsedBlocks);
        setCurrentBlockIndex(0);
      } catch (err: any) {
        console.error('Failed to fetch ending:', err);
        setError(err.message || 'Failed to load ending');
      } finally {
        setLoading(false);
      }
    };

    fetchEnding();
  }, [endingId]);

  const currentBlock = blocks[currentBlockIndex];
  const isLastBlock = currentBlockIndex >= blocks.length - 1;

  const handleNext = () => {
    if (isLastBlock) {
      // Show reflection prompt
      setShowReflection(true);
    } else {
      setCurrentBlockIndex(prev => prev + 1);
    }
  };

  const handleReflectionSubmit = async () => {
    if (!reflectionAnswer.trim()) {
      alert('Please write a reflection before continuing.');
      return;
    }

    // TODO: Save reflection to backend
    console.log('Reflection submitted:', reflectionAnswer);

    // Navigate to journal with student and arc IDs
    if (studentId && arcId) {
      router.push(`/journal?studentId=${studentId}&arcId=${arcId}`);
    } else {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-near-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-parchment/60 text-sm">Loading ending...</p>
        </div>
      </div>
    );
  }

  if (error || !endingData) {
    return (
      <div className="min-h-screen bg-near-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-near-black border border-parchment/20 rounded-xl p-6 text-center">
          <span className="material-symbols-outlined text-5xl text-critical mb-4 block">error</span>
          <h1 className="text-xl font-bold text-parchment mb-2">Ending Not Found</h1>
          <p className="text-parchment/60 text-sm mb-6">{error || 'This ending could not be loaded.'}</p>
          <button
            onClick={() => router.push('/journal')}
            className="px-6 py-2 bg-terracotta text-parchment font-bold rounded transition-colors hover:bg-terracotta/80"
          >
            Go to Journal
          </button>
        </div>
      </div>
    );
  }

  if (showReflection) {
    return (
      <div className="min-h-screen bg-near-black flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-parchment/5 border border-parchment/20 rounded-xl p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-3xl text-wheat-gold">auto_stories</span>
              <h2 className="text-2xl font-bold text-parchment">Reflection</h2>
            </div>
            <p className="text-parchment/80 text-lg mb-6">{endingData.reflection_prompt}</p>
          </div>

          <textarea
            className="w-full h-48 p-4 bg-parchment/10 border border-parchment/30 rounded-lg text-parchment placeholder:text-parchment/40 resize-none focus:outline-none focus:border-terracotta transition-colors"
            placeholder="Write your reflection here..."
            value={reflectionAnswer}
            onChange={e => setReflectionAnswer(e.target.value)}
          />

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => studentId && arcId ? router.push(`/journal?studentId=${studentId}&arcId=${arcId}`) : router.push('/')}
              className="px-6 py-2 bg-parchment/10 text-parchment/80 font-medium rounded transition-colors hover:bg-parchment/20"
            >
              Skip
            </button>
            <button
              onClick={handleReflectionSubmit}
              className="px-6 py-2 bg-terracotta text-parchment font-bold rounded transition-colors hover:bg-terracotta/80"
            >
              Submit Reflection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden relative bg-near-black">
      {/* Background */}
      <div className="fixed inset-0 z-0 bg-near-black">
        <img
          alt=""
          className="w-full h-full object-cover grayscale-[0.1] brightness-75"
          src="/city.jpeg"
        />
        <div className="absolute inset-0 bg-near-black/40"></div>
      </div>

      {/* Ending title overlay */}
      <div className="fixed top-8 left-0 right-0 z-20 flex justify-center">
        <div className="bg-near-black/90 border border-parchment/30 rounded-lg px-8 py-3">
          <p className="text-wheat-gold text-sm tracking-wider uppercase font-light">
            {endingData.ending_type === 'good_end' && '✓ Understanding Secured'}
            {endingData.ending_type === 'bad_end' && '◆ Further Study Needed'}
            {endingData.ending_type === 'iffy_end' && '~ Partial Understanding'}
          </p>
        </div>
      </div>

      {/* Main content - matching VNPlayer layout */}
      <main className="fixed inset-0 z-10 flex flex-col justify-end">
        {/* Character display area (sprites would go here) */}
        <div className="flex-1 flex items-end justify-center relative pt-15">
          {/* TODO: Add character sprite based on currentBlock.character */}
        </div>

        {/* Interaction area - VN standard 1/4 of page */}
        <div className="w-full px-0 bg-near-black/95 relative flex flex-col min-h-[25vh]">
          {/* Gradient overlay at top edge */}
          <div className="absolute -top-24 left-0 right-0 h-24 bg-gradient-to-b from-transparent via-transparent to-near-black/95 pointer-events-none z-20"></div>

          {/* Dialogue/Narration content */}
          <div className="relative w-full pt-2 flex-1 flex flex-col justify-between">
            <div className="px-8 py-6 flex-1 flex flex-col justify-center">
              {currentBlock && (
                <>
                  {currentBlock.type === 'narration' && (
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-parchment/5 border-l-4 border-wheat-gold/40 px-6 py-4 rounded-r-lg">
                        <p className="text-parchment/70 italic text-base leading-relaxed">
                          {currentBlock.content}
                        </p>
                      </div>
                    </div>
                  )}

                  {currentBlock.type === 'dialogue' && (
                    <div className="max-w-4xl mx-auto">
                      <div className="bg-near-black/50 border border-parchment/10 rounded-xl px-6 py-5">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-wheat-gold font-semibold text-lg tracking-wide">
                            {currentBlock.character}
                          </span>
                          {currentBlock.emotion && (
                            <span className="text-xs px-2 py-1 bg-parchment/10 text-parchment/60 rounded-full">
                              {currentBlock.emotion}
                            </span>
                          )}
                        </div>
                        <p className="text-parchment text-base leading-relaxed">
                          {currentBlock.content}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Progress indicator and next button */}
            <div className="flex items-center justify-between px-8 py-4 border-t border-parchment/10">
              <div className="text-parchment/40 text-xs tracking-[0.2em] uppercase font-light">
                {currentBlockIndex + 1}/{blocks.length}
              </div>
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-terracotta text-near-black font-bold rounded-lg hover:bg-terracotta/90 transition-all hover:scale-105 active:scale-95"
              >
                {isLastBlock ? 'Reflect' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
