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

  const studentId = searchParams.get('studentId');
  const arcId = searchParams.get('arcId');

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

    // Navigate to journal
    router.push('/journal');
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
              onClick={() => router.push('/journal')}
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

      {/* Content */}
      <main className="fixed inset-0 z-10 flex flex-col justify-end">
        <div className="w-full px-0 bg-near-black/95 relative flex flex-col min-h-[40vh]">
          <div className="absolute -top-24 left-0 right-0 h-24 bg-gradient-to-b from-transparent via-transparent to-near-black/95 pointer-events-none z-20"></div>

          <div className="relative w-full pt-2 flex-1 overflow-y-auto px-6 py-4">
            {currentBlock && (
              <>
                {currentBlock.type === 'narration' && (
                  <div className="mb-6">
                    <p className="text-parchment/70 italic text-lg leading-relaxed">
                      {currentBlock.content}
                    </p>
                  </div>
                )}

                {currentBlock.type === 'dialogue' && (
                  <div className="mb-6">
                    <div className="mb-2">
                      <span className="text-wheat-gold font-semibold text-lg">
                        {currentBlock.character}
                      </span>
                      {currentBlock.emotion && (
                        <span className="text-parchment/50 text-sm ml-2">
                          [{currentBlock.emotion}]
                        </span>
                      )}
                    </div>
                    <p className="text-parchment text-lg leading-relaxed pl-4">
                      {currentBlock.content}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleNext}
                  className="mt-6 px-8 py-3 bg-terracotta text-parchment font-bold rounded-lg hover:bg-terracotta/80 transition-colors"
                >
                  {isLastBlock ? 'Continue' : 'Next'}
                </button>
              </>
            )}
          </div>

          <div className="flex flex-col items-center gap-3 px-6 pb-4 pt-3 border-t border-parchment/10">
            <div className="text-parchment/60 text-[10px] tracking-[0.4em] uppercase font-light">
              {currentBlockIndex + 1}/{blocks.length}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
