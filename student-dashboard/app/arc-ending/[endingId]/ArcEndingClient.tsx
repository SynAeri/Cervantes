// Client component for arc ending page
// Fetches ending data and displays VN-formatted narrative with reflection prompt

'use client';

import { use, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { parseVNScene, type VNBlock } from '@/app/lib/vn-parser';
import { BASE_URL, api } from '@/app/lib/api';
import { DialogueBox } from '@/app/components/vn/DialogueBox';
import { NarrationBox } from '@/app/components/vn/NarrationBox';
import { CharacterSprite } from '@/app/components/vn/CharacterSprite';

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
  const [characterMappings, setCharacterMappings] = useState<any>(null);

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
        const response = await fetch(`${BASE_URL}/api/arc-endings/${endingId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch ending');
        }

        const data = await response.json();
        setEndingData(data);

        // Fetch character mappings if we have studentId and arcId
        let loadedMappings = null;
        if (studentId && arcId) {
          try {
            loadedMappings = await api.characterMappings.get(studentId, arcId);
            setCharacterMappings(loadedMappings.character_mappings);
            console.log('Character mappings loaded:', loadedMappings.character_mappings);
          } catch (err) {
            console.warn('Failed to load character mappings:', err);
          }
        }

        // Parse the narrative text as VN content (backend now uses mapped names)
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
  }, [endingId, studentId, arcId]);

  const currentBlock = blocks[currentBlockIndex];
  const isLastBlock = currentBlockIndex >= blocks.length - 1;

  // Map character ID to assigned name
  const getCharacterName = (charId: string): string => {
    if (!characterMappings) return charId;

    // Find mapping for this character ID
    const mapping = Object.values(characterMappings).find(
      (m: any) => m.original_name === charId || charId.includes(m.original_name)
    );

    return mapping ? (mapping as any).assigned_name : charId;
  };

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

  // Get character sprite info if current block has a character
  const getCharacterSpriteInfo = () => {
    if (currentBlock?.type !== 'dialogue' || !currentBlock.character) return null;

    const characterName = getCharacterName(currentBlock.character);
    const mapping: any = characterMappings ? Object.values(characterMappings).find(
      (m: any) => m.assigned_name === characterName
    ) : null;

    return {
      name: characterName,
      gender: mapping?.gender || 'female',
      spriteIndex: mapping?.sprite_index || 1,
      emotion: currentBlock.emotion || 'neutral'
    };
  };

  const spriteInfo = getCharacterSpriteInfo();

  return (
    <div className="min-h-screen overflow-hidden relative bg-near-black">
      {/* Background - city.jpeg like VNPlayer */}
      <div className="fixed inset-0 z-0 bg-near-black">
        <img
          alt=""
          className="w-full h-full object-cover brightness-[0.85]"
          src="/backgrounds/city/bg.jpg"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-near-black/60 via-near-black/40 to-near-black/60"></div>
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

      {/* Main content - matching VNPlayer layout exactly */}
      <main className="fixed inset-0 z-10 flex flex-col justify-end">
        {/* Character display area */}
        <div className="flex-1 flex items-end justify-center relative pt-15">
          {/* Character sprite - only show for dialogue blocks */}
          {spriteInfo && (
            <div
              className="absolute bottom-0 left-1/2 transition-all duration-700 ease-out"
              style={{ transform: 'translateX(-50%)' }}
            >
              <CharacterSprite
                name={spriteInfo.name}
                role="ending"
                emotion={spriteInfo.emotion}
                gender={spriteInfo.gender}
                spriteIndex={spriteInfo.spriteIndex}
                isActive={true}
              />
            </div>
          )}
        </div>

        {/* Interaction area - VN standard 1/4 of page */}
        <div className="w-full px-0 bg-near-black/95 relative flex flex-col min-h-[25vh]">
          {/* Gradient overlay at top edge */}
          <div className="absolute -top-24 left-0 right-0 h-24 bg-gradient-to-b from-transparent via-transparent to-near-black/95 pointer-events-none z-20"></div>

          {/* Content area - using VN components */}
          <div className="relative w-full pt-2 flex-1 overflow-y-auto">
            {currentBlock && (
              <>
                {currentBlock.type === 'narration' && (
                  <NarrationBox
                    content={currentBlock.content}
                    onNext={handleNext}
                  />
                )}

                {currentBlock.type === 'dialogue' && (
                  <DialogueBox
                    character={getCharacterName(currentBlock.character)}
                    text={currentBlock.content}
                    emotion={currentBlock.emotion}
                    onNext={handleNext}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
