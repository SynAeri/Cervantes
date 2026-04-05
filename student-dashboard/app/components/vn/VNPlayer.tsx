// VNPlayer - main orchestrator for visual novel scene playback
// Manages scene state, conversation history, and component rendering

'use client';

import { useState, useEffect } from 'react';
import { parseVNScene, type VNBlock } from '../../lib/vn-parser';
import { DialogueBox } from './DialogueBox';
import { NarrationBox } from './NarrationBox';
import { ChoicePanel } from './ChoicePanel';
import { FreeformInput } from './FreeformInput';
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
    handleNext();
  };

  const handleFreeformSubmit = async (response: string) => {
    setIsWaitingForResponse(true);

    const newHistory = [
      ...conversationHistory,
      { role: 'student', content: response, timestamp: new Date().toISOString() },
    ];
    setConversationHistory(newHistory);

    // TODO: Call dialogue API for Socratic pushback
    // For now, just continue
    setTimeout(() => {
      setIsWaitingForResponse(false);
      handleNext();
    }, 1000);
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
    <div className="min-h-screen bg-vn-bg flex flex-col">
      {/* Progress indicator */}
      <div className="bg-near-black/80 border-b border-warm-grey/20 px-6 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="text-xs text-tertiary/70 uppercase tracking-wider">
            Scene {sceneId}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-tertiary/70">Progress:</span>
            <div className="w-32 h-1 bg-warm-grey/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-terracotta transition-all duration-300"
                style={{ width: `${((currentBlockIndex + 1) / blocks.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-tertiary/70">
              {currentBlockIndex + 1}/{blocks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-between max-w-6xl mx-auto w-full p-8">
        {/* Character display area */}
        <div className="flex-1 flex items-center justify-center">
          {currentBlock.type === 'dialogue' && (
            <CharacterSprite
              name={characterName}
              role={characterRole}
              emotion={currentEmotion}
            />
          )}
        </div>

        {/* Interaction area */}
        <div className="w-full max-w-4xl mx-auto">
          {currentBlock.type === 'narration' && (
            <NarrationBox content={currentBlock.content} onNext={handleNext} />
          )}

          {currentBlock.type === 'dialogue' && (
            <DialogueBox
              character={currentBlock.character}
              text={currentBlock.content}
              emotion={currentBlock.emotion}
              onNext={handleNext}
            />
          )}

          {currentBlock.type === 'player_prompt' && (
            <>
              {currentBlock.isMultiChoice && currentBlock.options ? (
                <ChoicePanel
                  prompt={currentBlock.prompt}
                  options={currentBlock.options}
                  onSelect={handleChoice}
                />
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
      </div>
    </div>
  );
}
