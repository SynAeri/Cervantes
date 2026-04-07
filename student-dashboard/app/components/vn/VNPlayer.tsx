// VNPlayer - main orchestrator for visual novel scene playback
// Manages scene state, conversation history, and component rendering

'use client';

import { useState, useEffect } from 'react';
import { parseVNScene, type VNBlock } from '../../lib/vn-parser';
import { DialogueBox } from './DialogueBox';
import { NarrationBox } from './NarrationBox';
import { ChoicePanel } from './ChoicePanel';
import { FreeformInput } from './FreeformInput';
import { MultiPartFreeformInput } from './MultiPartFreeformInput';
import { CharacterSprite } from './CharacterSprite';

interface VNPlayerProps {
  sceneContent: string;
  characterName: string;
  characterRole: string;
  sceneId: string;
  onSceneComplete: (conversationHistory: any[]) => void;
}

export function VNPlayer({
  sceneContent,
  characterName,
  characterRole,
  sceneId,
  onSceneComplete,
}: VNPlayerProps) {
  const [blocks, setBlocks] = useState<VNBlock[]>([]);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string | undefined>();
  const [showJournal, setShowJournal] = useState(false);

  useEffect(() => {
    const parsedBlocks = parseVNScene(sceneContent);
    setBlocks(parsedBlocks);
    setCurrentBlockIndex(0);
  }, [sceneContent]);

  const currentBlock = blocks[currentBlockIndex];
  const isLastBlock = currentBlockIndex >= blocks.length - 1;

  const handleNext = () => {
    if (isLastBlock) {
      onSceneComplete(conversationHistory);
    } else {
      setCurrentBlockIndex(prev => prev + 1);
    }
  };

  const handleChoice = (choice: string) => {
    const newHistory = [
      ...conversationHistory,
      { role: 'student', content: choice, timestamp: new Date().toISOString() },
    ];
    setConversationHistory(newHistory);

    // If this prompt has branches, insert the corresponding branch blocks
    if (currentBlock.type === 'player_prompt' && currentBlock.branches) {
      // Find which option was selected (match by index)
      const optionIndex = currentBlock.options?.indexOf(choice);
      if (optionIndex !== undefined && optionIndex >= 0) {
        const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, etc.
        const branchBlocks = currentBlock.branches[optionLetter];

        if (branchBlocks && branchBlocks.length > 0) {
          console.log(`Inserting ${branchBlocks.length} blocks for choice ${optionLetter}`);
          // Insert branch blocks after current block
          const newBlocks = [...blocks];
          newBlocks.splice(currentBlockIndex + 1, 0, ...branchBlocks);
          setBlocks(newBlocks);
          // Advance to next block immediately with updated blocks array
          setCurrentBlockIndex(prev => prev + 1);
          return; // Don't call handleNext() - we already advanced
        }
      }
    }

    // No branches found or no match - proceed normally
    handleNext();
  };

  const handleMultiPartSubmit = async (responses: any[]) => {
    setIsWaitingForResponse(true);

    // Format multi-part responses for display in history
    const formattedResponse = responses
      .map(r => `${r.partNumber}) ${r.studentAnswer}`)
      .join('\n\n');

    const newHistory = [
      ...conversationHistory,
      {
        role: 'student',
        content: formattedResponse,
        timestamp: new Date().toISOString(),
        multipart: true,
      },
    ];
    setConversationHistory(newHistory);

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const studentId = searchParams.get('studentId');
      const arcId = searchParams.get('arcId');

      if (!studentId || !arcId) {
        console.error('Student ID or Arc ID not found');
        setIsWaitingForResponse(false);
        handleNext();
        return;
      }

      // Call dialogue API with multi-part response
      const dialogueResponse = await fetch('http://localhost:8080/api/dialogue/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene_id: sceneId,
          arc_id: arcId,
          student_id: studentId,
          student_multipart_response: responses,
          conversation_history: newHistory,
        }),
      });

      if (!dialogueResponse.ok) {
        throw new Error('Dialogue API failed');
      }

      const data = await dialogueResponse.json();

      // Add AI response to history
      const updatedHistory = [
        ...newHistory,
        {
          role: 'character',
          content: data.character_dialogue,
          character_id: characterName,
          emotion_tag: data.emotion_tag,
          timestamp: new Date().toISOString(),
        },
      ];
      setConversationHistory(updatedHistory);

      // Parse the AI response to extract dialogue and player_prompt blocks
      const parsedBlocks = parseVNScene(data.character_dialogue);

      // Check if should_end_scene is false but there's no player_prompt
      // This is a safety fallback if the LLM didn't generate a prompt
      const hasPlayerPrompt = parsedBlocks.some(block => block.type === 'player_prompt');
      if (!data.should_end_scene && !hasPlayerPrompt) {
        console.warn('Backend indicated scene should continue but no [player_prompt] found, adding fallback prompt');
        parsedBlocks.push({
          type: 'player_prompt',
          isMultiChoice: false,
          prompt: 'Continue your response:',
        });
      }

      // Insert parsed blocks after current block
      const newBlocks = [...blocks];
      newBlocks.splice(currentBlockIndex + 1, 0, ...parsedBlocks);
      setBlocks(newBlocks);

      setIsWaitingForResponse(false);

      if (data.should_end_scene) {
        onSceneComplete(updatedHistory);
      } else {
        // Advance to the first inserted block (the AI's dialogue)
        setCurrentBlockIndex(currentBlockIndex + 1);
      }
    } catch (error) {
      console.error('Multi-part Socratic pushback failed:', error);
      setIsWaitingForResponse(false);
      handleNext();
    }
  };

  const handleFreeformSubmit = async (response: string) => {
    setIsWaitingForResponse(true);

    const newHistory = [
      ...conversationHistory,
      { role: 'student', content: response, timestamp: new Date().toISOString() },
    ];
    setConversationHistory(newHistory);

    try {
      // Get student_id and arc_id from URL params (should be passed as props)
      const searchParams = new URLSearchParams(window.location.search);
      const studentId = searchParams.get('studentId');
      const arcId = searchParams.get('arcId');

      if (!studentId) {
        console.error('Student ID not found');
        setIsWaitingForResponse(false);
        handleNext();
        return;
      }

      // Call dialogue API for Socratic pushback
      const dialogueResponse = await fetch('http://localhost:8080/api/dialogue/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene_id: sceneId,
          arc_id: arcId,
          student_id: studentId,
          student_response: response,
          conversation_history: newHistory,
        }),
      });

      if (!dialogueResponse.ok) {
        throw new Error('Dialogue API failed');
      }

      const data = await dialogueResponse.json();

      // Add AI response to history
      const updatedHistory = [
        ...newHistory,
        {
          role: 'character',
          content: data.character_dialogue,
          character_id: characterName,
          emotion_tag: data.emotion_tag,
          timestamp: new Date().toISOString(),
        },
      ];
      setConversationHistory(updatedHistory);

      // Parse the AI response to extract dialogue and player_prompt blocks
      const parsedBlocks = parseVNScene(data.character_dialogue);
      console.log(`Parsed ${parsedBlocks.length} blocks from AI response:`, parsedBlocks.map(b => b.type));

      // Check if should_end_scene is false but there's no player_prompt
      // This is a safety fallback if the LLM didn't generate a prompt
      const hasPlayerPrompt = parsedBlocks.some(block => block.type === 'player_prompt');
      if (!data.should_end_scene && !hasPlayerPrompt) {
        console.warn('Backend indicated scene should continue but no [player_prompt] found, adding fallback prompt');
        parsedBlocks.push({
          type: 'player_prompt',
          isMultiChoice: false,
          prompt: 'Continue your response:',
        });
      }

      // Insert parsed blocks after current block
      const newBlocks = [...blocks];
      newBlocks.splice(currentBlockIndex + 1, 0, ...parsedBlocks);
      setBlocks(newBlocks);
      console.log(`Total blocks now: ${newBlocks.length}, current index: ${currentBlockIndex}, advancing to: ${currentBlockIndex + 1}`);

      setIsWaitingForResponse(false);

      // Always advance to show the AI's dialogue blocks first
      setCurrentBlockIndex(currentBlockIndex + 1);

      // If should_end_scene, the scene will complete naturally when user clicks through to the end
      // Don't force complete here - let them see the final dialogue and narration
      if (data.should_end_scene) {
        console.log('Scene will end after displaying final blocks');
      }
    } catch (error) {
      console.error('Socratic pushback failed:', error);
      setIsWaitingForResponse(false);
      handleNext();
    }
  };

  useEffect(() => {
    if (currentBlock?.type === 'dialogue' && currentBlock.emotion) {
      setCurrentEmotion(currentBlock.emotion);
    }
  }, [currentBlock]);

  if (!currentBlock) {
    return (
      <div className="min-h-screen bg-vn-bg flex items-center justify-center">
        <div className="text-parchment text-xl">Loading scene...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden relative bg-near-black font-body selection:bg-terracotta/30 selection:text-terracotta">
      <style jsx global>{`
        html, body {
          background-color: #1E1C18 !important;
        }
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 z-0 bg-near-black">
        <img
          alt=""
          className="w-full h-full object-cover grayscale-[0.1] brightness-75"
          src="/city.jpeg"
        />
        <div className="absolute inset-0 bg-near-black/20"></div>
      </div>

      {/* Journal Button - Top Right */}
      <button
        onClick={() => setShowJournal(true)}
        className="fixed top-6 right-6 z-50 px-4 py-2 bg-near-black/50 backdrop-blur-sm border border-wheat-gold/40 rounded-lg hover:border-wheat-gold/60 hover:bg-near-black/70 transition-all duration-300 flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-wheat-gold text-xl">book</span>
        <span className="text-wheat-gold text-sm font-medium">Journal</span>
      </button>

      {/* Journal Sidebar - Left Side */}
      <div
        className={`fixed left-0 top-0 h-full w-96 bg-near-black/95 backdrop-blur-sm border-r border-wheat-gold/40 shadow-2xl flex flex-col z-[100] transition-transform duration-300 ${
          showJournal ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-parchment/20">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-wheat-gold text-2xl">book</span>
            <h2 className="text-lg font-bold text-parchment">Journal</h2>
          </div>
          <button
            onClick={() => setShowJournal(false)}
            className="p-2 hover:bg-parchment/10 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-parchment/60 hover:text-parchment">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {conversationHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <span className="material-symbols-outlined text-5xl text-wheat-gold/30 mb-3">auto_stories</span>
              <p className="text-parchment/60 text-sm">No conversation yet</p>
              <p className="text-parchment/40 text-xs mt-2">Dialogue appears here as you progress</p>
            </div>
          ) : (
            conversationHistory.map((turn, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  turn.role === 'student'
                    ? 'bg-terracotta/10 border-l-4 border-terracotta'
                    : turn.role === 'character'
                    ? 'bg-wheat-gold/10 border-l-4 border-wheat-gold'
                    : 'bg-parchment/5 border-l-4 border-parchment/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-parchment/80">
                    {turn.role === 'student' ? 'You' : turn.role === 'character' ? turn.character_id || 'Character' : 'Narration'}
                  </span>
                  {turn.emotion_tag && (
                    <span className="text-xs text-wheat-gold/60 italic">({turn.emotion_tag})</span>
                  )}
                </div>
                <p className="text-parchment/90 text-xs leading-relaxed whitespace-pre-wrap">
                  {turn.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Overlay when journal is open */}
      {showJournal && (
        <div
          className="fixed inset-0 bg-near-black/40 z-[90]"
          onClick={() => setShowJournal(false)}
        />
      )}

      {/* Main content */}
      <main className="fixed inset-0 z-10 flex flex-col justify-end">
        {/* Character display area */}
        <div className="flex-1 flex items-end justify-center relative pt-15">
          {currentBlock.type === 'dialogue' && (
            <CharacterSprite
              name={characterName}
              role={characterRole}
              emotion={currentEmotion}
            />
          )}

          {/* Choice panel in middle of screen */}
          {currentBlock.type === 'player_prompt' && currentBlock.isMultiChoice && currentBlock.options && (
            <div className="absolute inset-0 flex items-center justify-center px-8">
              <ChoicePanel
                prompt={currentBlock.prompt}
                options={currentBlock.options}
                onSelect={handleChoice}
              />
            </div>
          )}
        </div>

        {/* Interaction area - VN standard 1/4 of page */}
        <div className="w-full px-0 bg-near-black/95 relative flex flex-col min-h-[25vh]">
          {/* Gradient overlay at top edge */}
          <div className="absolute -top-24 left-0 right-0 h-24 bg-gradient-to-b from-transparent via-transparent to-near-black/95 pointer-events-none z-20"></div>

          {/* Content area - scrollable if needed */}
          <div className="relative w-full pt-2 flex-1 overflow-y-auto">
            {currentBlock.type === 'narration' && (
              <NarrationBox content={currentBlock.content} onNext={handleNext} />
            )}

            {currentBlock.type === 'dialogue' && (
              <DialogueBox
                character={characterName}
                text={currentBlock.content}
                emotion={currentBlock.emotion}
                onNext={handleNext}
              />
            )}

            {currentBlock.type === 'player_prompt' && !currentBlock.isMultiChoice && (
              <>
                {currentBlock.isMultiPartFreeform && currentBlock.subQuestions ? (
                  <div className="px-6 py-4">
                    <div className="mb-4 text-parchment">
                      <p className="text-lg font-medium">{currentBlock.prompt}</p>
                    </div>
                    <MultiPartFreeformInput
                      subQuestions={currentBlock.subQuestions}
                      onSubmit={handleMultiPartSubmit}
                    />
                  </div>
                ) : (
                  <FreeformInput
                    prompt={currentBlock.prompt}
                    onSubmit={handleFreeformSubmit}
                    isLoading={isWaitingForResponse}
                  />
                )}
              </>
            )}
          </div>

          {/* Progress indicator - fixed at bottom */}
          <div className="flex flex-col items-center gap-3 px-6 pb-4 pt-3 border-t border-parchment/10">
            <div className="text-parchment/60 text-[10px] tracking-[0.4em] uppercase font-light relative w-full flex justify-center">
              <span className="inline-block before:content-[''] before:h-px before:w-[60px] before:bg-parchment/20 before:inline-block before:align-middle before:mr-[15px] after:content-[''] after:h-px after:w-[60px] after:bg-parchment/20 after:inline-block after:align-middle after:ml-[15px]">
                {currentBlockIndex + 1}/{blocks.length}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
