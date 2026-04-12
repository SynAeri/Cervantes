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
import { api, BASE_URL } from '../../lib/api';

interface VNPlayerProps {
  sceneContent: string;
  characterName: string;
  characterRole: string;
  sceneId: string;
  sceneOrder?: number;
  location?: string;
  onSceneComplete: (conversationHistory: any[]) => void;
}

export function VNPlayer({
  sceneContent,
  characterName,
  characterRole,
  sceneId,
  sceneOrder,
  location = 'office',
  onSceneComplete,
}: VNPlayerProps) {
  const [blocks, setBlocks] = useState<VNBlock[]>([]);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]); // Scene-level history
  const [arcJournalEntries, setArcJournalEntries] = useState<any[]>([]); // Arc-wide persistent journal
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string | undefined>();
  const [showJournal, setShowJournal] = useState(false);
  const [charactersPresent, setCharactersPresent] = useState<Set<string>>(new Set()); // Track all characters in scene
  const [charactersIntroduced, setCharactersIntroduced] = useState<Set<string>>(new Set()); // Characters who have spoken
  const [activeCharacter, setActiveCharacter] = useState<string | null>(null); // Currently speaking character
  const [characterEmotions, setCharacterEmotions] = useState<Map<string, string>>(new Map()); // Track last emotion per character
  const [characterMappings, setCharacterMappings] = useState<any>(null); // Character sprite mappings
  const [nameToMappingIndex, setNameToMappingIndex] = useState<Map<string, any>>(new Map()); // Reverse lookup: assigned_name -> mapping
  const [isMobile, setIsMobile] = useState(false); // Track mobile viewport

  // Detect mobile viewport and handle resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load character mappings and arc journal on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const studentId = searchParams.get('studentId');
    const arcId = searchParams.get('arcId');

    if (studentId && arcId) {
      // Load character mappings for sprite assignment
      api.characterMappings.get(studentId, arcId)
        .then(data => {
          setCharacterMappings(data.character_mappings);

          // Create reverse lookup: assigned_name -> mapping
          const reverseLookup = new Map();
          Object.values(data.character_mappings || {}).forEach((mapping: any) => {
            reverseLookup.set(mapping.assigned_name, mapping);
          });
          setNameToMappingIndex(reverseLookup);

          console.log('Loaded character mappings:', data.character_mappings);
          console.log('Name lookup:', reverseLookup);
        })
        .catch(err => console.error('Failed to load character mappings:', err));
    }
  }, []);

  // Load arc journal on mount
  useEffect(() => {
    const loadArcJournal = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const studentId = searchParams.get('studentId');
      const arcId = searchParams.get('arcId');

      if (studentId && arcId) {
        try {
          const journalData = await api.arcJournal.get(studentId, arcId);
          setArcJournalEntries(journalData.entries || []);
          console.log(`Loaded arc journal: ${journalData.entries?.length || 0} entries`);
        } catch (error) {
          console.error('Failed to load arc journal:', error);
          // Journal doesn't exist yet - will be created on first append
          setArcJournalEntries([]);
        }
      }
    };

    loadArcJournal();
  }, []);

  useEffect(() => {
    const parsedBlocks = parseVNScene(sceneContent);
    setBlocks(parsedBlocks);
    setCurrentBlockIndex(0);
    // Reset scene-level history when new scene loads
    setConversationHistory([]);

    // Extract all unique characters from scene
    const characters = new Set<string>();
    parsedBlocks.forEach(block => {
      if (block.type === 'dialogue' && block.character) {
        characters.add(block.character);
      }
    });
    setCharactersPresent(characters);
    console.log(`Scene has ${characters.size} characters:`, Array.from(characters));

    // Reset introduced characters and their emotions when new scene loads
    setCharactersIntroduced(new Set());
    setCharacterEmotions(new Map());

    // Don't set active character yet - let it be set when first dialogue appears
    setActiveCharacter(null);
  }, [sceneContent]);

  const currentBlock = blocks[currentBlockIndex];
  const isLastBlock = currentBlockIndex >= blocks.length - 1;

  // Update active character when block changes
  useEffect(() => {
    if (currentBlock?.type === 'dialogue') {
      setActiveCharacter(currentBlock.character);
      setCurrentEmotion(currentBlock.emotion);

      // Update this character's last emotion state
      setCharacterEmotions(prev => {
        const updated = new Map(prev);
        updated.set(currentBlock.character, currentBlock.emotion || 'neutral');
        return updated;
      });

      // Add character to introduced set when they first speak
      setCharactersIntroduced(prev => {
        const updated = new Set(prev);
        updated.add(currentBlock.character);
        return updated;
      });
    } else {
      // During narration/prompts, keep characters visible but no one active
      setActiveCharacter(null);
    }
  }, [currentBlockIndex, currentBlock]);

  // Fire-and-forget journal append so mid-scene navigation shows current dialogue
  const appendTurnsToJournal = (turns: any[]) => {
    const searchParams = new URLSearchParams(window.location.search);
    const studentId = searchParams.get('studentId');
    const arcId = searchParams.get('arcId');
    if (!studentId || !arcId || turns.length === 0) return;
    const order = sceneOrder ?? 1;
    api.arcJournal.append({
      student_id: studentId,
      arc_id: arcId,
      scene_id: sceneId,
      scene_order: order,
      new_entries: turns,
    }).catch(() => {});
  };

  const handleNext = () => {
    // Build updated history with current block
    let updatedHistory = conversationHistory;

    // Add current block to conversation history if it's dialogue or narration
    if (currentBlock.type === 'dialogue') {
      updatedHistory = [
        ...conversationHistory,
        {
          role: 'character',
          content: currentBlock.content,
          character_id: currentBlock.character, // Use character from parsed block, not prop
          emotion_tag: currentBlock.emotion,
          timestamp: new Date().toISOString(),
        },
      ];
      setConversationHistory(updatedHistory);
    } else if (currentBlock.type === 'narration') {
      updatedHistory = [
        ...conversationHistory,
        {
          role: 'narration',
          content: currentBlock.content,
          timestamp: new Date().toISOString(),
        },
      ];
      setConversationHistory(updatedHistory);
    }

    if (isLastBlock) {
      // Pass the updated history to onSceneComplete
      onSceneComplete(updatedHistory);
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

      // Call dialogue API with multi-part response with 90 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const dialogueResponse = await fetch(`${BASE_URL}/api/dialogue/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene_id: sceneId,
          arc_id: arcId,
          student_id: studentId,
          student_multipart_response: responses,
          conversation_history: newHistory,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!dialogueResponse.ok) {
        throw new Error('Dialogue API failed');
      }

      const data = await dialogueResponse.json();

      // Persist student + character turns to journal so mid-scene navigation shows progress
      appendTurnsToJournal([
        ...newHistory.slice(conversationHistory.length),
        { role: 'character', content: data.character_dialogue, character_id: characterName, emotion_tag: data.emotion_tag, timestamp: new Date().toISOString() },
      ]);

      // Parse the AI response to extract dialogue and player_prompt blocks
      // NOTE: Individual blocks will be added to conversation history as user clicks through via handleNext()
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
        // Don't pass updatedHistory since we removed it - use current conversation history
        // The parsed blocks haven't been clicked through yet, so they won't be in history
        // This is fine - the scene is ending anyway and full history will be saved
        onSceneComplete(conversationHistory);
      } else {
        // Advance to the first inserted block (the AI's dialogue)
        setCurrentBlockIndex(currentBlockIndex + 1);
      }
    } catch (error: any) {
      console.error('Multi-part Socratic pushback failed:', error);

      // If timeout, show a fallback response instead of just skipping
      if (error.name === 'AbortError') {
        console.log('Multi-part dialogue timed out, showing fallback response');
        const fallbackBlocks = parseVNScene('[player_prompt] Continue your response:');
        const newBlocks = [...blocks];
        newBlocks.splice(currentBlockIndex + 1, 0, ...fallbackBlocks);
        setBlocks(newBlocks);
        setCurrentBlockIndex(currentBlockIndex + 1);
      } else {
        // Other error - just continue
        handleNext();
      }

      setIsWaitingForResponse(false);
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

      // Call dialogue API for Socratic pushback with 90 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

      const dialogueResponse = await fetch(`${BASE_URL}/api/dialogue/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene_id: sceneId,
          arc_id: arcId,
          student_id: studentId,
          student_response: response,
          conversation_history: newHistory,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!dialogueResponse.ok) {
        throw new Error('Dialogue API failed');
      }

      const data = await dialogueResponse.json();

      // Persist student + character turns to journal so mid-scene navigation shows progress
      appendTurnsToJournal([
        { role: 'student', content: response, timestamp: new Date().toISOString() },
        { role: 'character', content: data.character_dialogue, character_id: characterName, emotion_tag: data.emotion_tag, timestamp: new Date().toISOString() },
      ]);

      // Parse the AI response to extract dialogue and player_prompt blocks
      // NOTE: Individual blocks will be added to conversation history as user clicks through via handleNext()
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
    } catch (error: any) {
      console.error('Socratic pushback failed:', error);

      // If timeout, show a fallback response instead of just skipping
      if (error.name === 'AbortError') {
        console.log('Dialogue timed out, showing fallback response');
        // Insert a simple continuation prompt
        const fallbackBlocks = parseVNScene('[player_prompt] Continue your response:');
        const newBlocks = [...blocks];
        newBlocks.splice(currentBlockIndex + 1, 0, ...fallbackBlocks);
        setBlocks(newBlocks);
        setCurrentBlockIndex(currentBlockIndex + 1);
      } else {
        // Other error - just continue
        handleNext();
      }

      setIsWaitingForResponse(false);
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
        <picture>
          <source srcSet={`/backgrounds/${location}/bg.jpg`} type="image/jpeg" />
          <source srcSet={`/backgrounds/${location}/bg.jpeg`} type="image/jpeg" />
          <source srcSet={`/backgrounds/${location}/bg.png`} type="image/png" />
          <img
            alt=""
            className="w-full h-full object-cover grayscale-[0.1] brightness-75"
            src={`/backgrounds/${location}/bg.jpg`}
            onError={(e) => {
              // Fallback to solid background if image not found
              e.currentTarget.style.display = 'none';
            }}
          />
        </picture>
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
          {/* Show arc-wide journal + current scene history combined */}
          {arcJournalEntries.length === 0 && conversationHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <span className="material-symbols-outlined text-5xl text-wheat-gold/30 mb-3">auto_stories</span>
              <p className="text-parchment/60 text-sm">No conversation yet</p>
              <p className="text-parchment/40 text-xs mt-2">Dialogue appears here as you progress</p>
            </div>
          ) : (
            <>
              {/* Arc journal entries (from previous scenes) */}
              {arcJournalEntries.map((turn, index) => (
                <div
                  key={`arc-${index}`}
                  className={`p-3 rounded-lg ${
                    turn.role === 'student'
                      ? 'bg-terracotta/10 border-l-4 border-terracotta'
                      : turn.role === 'character'
                      ? 'bg-wheat-gold/10 border-l-4 border-wheat-gold'
                      : 'bg-parchment/5 border-l-4 border-parchment/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-parchment/40">Scene {turn.scene_order}</span>
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
              ))}

              {/* Current scene history (not yet saved to journal) */}
              {conversationHistory.map((turn, index) => (
                <div
                  key={`current-${index}`}
                  className={`p-3 rounded-lg border-2 border-dashed ${
                    turn.role === 'student'
                      ? 'bg-terracotta/10 border-terracotta/60'
                      : turn.role === 'character'
                      ? 'bg-wheat-gold/10 border-wheat-gold/60'
                      : 'bg-parchment/5 border-parchment/40'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-parchment/40">Current</span>
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
              ))}
            </>
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
          {/* Render only characters that have been introduced (spoken at least once) */}
          {Array.from(charactersIntroduced).map((characterName, index) => {
            const isActive = characterName === activeCharacter;
            const totalCharacters = charactersIntroduced.size;

            // Use character's last emotion state (preserved when inactive)
            const lastEmotion = characterEmotions.get(characterName) || 'neutral';

            // On mobile with 2+ characters, only show the active character
            if (isMobile && totalCharacters >= 2 && !isActive) {
              return null;
            }

            // Calculate position based on number of characters (VN standard positioning)
            let translateX = '-50%'; // Default: center the sprite
            if (totalCharacters === 1 || isMobile) {
              translateX = '-50%'; // Single character or mobile: perfectly centered
            } else if (totalCharacters === 2) {
              // Two characters: left (-25%) and right (-75%) with spacing
              translateX = index === 0 ? 'calc(-50% - 200px)' : 'calc(-50% + 200px)';
            } else {
              // For 3+ characters, spread them out evenly
              const positions = totalCharacters;
              const spacing = 400 / (positions - 1); // 400px total spread
              translateX = `calc(-50% - 200px + ${index * spacing}px)`;
            }

            // Get sprite mapping for this character using assigned name
            const mapping = nameToMappingIndex.get(characterName);
            const gender = mapping?.gender;
            const spriteIndex = mapping?.sprite_index;

            console.log(`DEBUG: Character ${characterName} - mapping:`, mapping, `gender: ${gender}, spriteIndex: ${spriteIndex}`);

            return (
              <div
                key={characterName}
                className="absolute bottom-0 left-1/2 transition-all duration-700 ease-out"
                style={{
                  transform: `translateX(${translateX})`,
                }}
              >
                <CharacterSprite
                  name={characterName}
                  role={characterRole}
                  emotion={lastEmotion}
                  isActive={isActive}
                  position={totalCharacters === 1 ? 'center' : index === 0 ? 'left' : 'right'}
                  gender={gender}
                  spriteIndex={spriteIndex}
                />
              </div>
            );
          })}

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
                character={currentBlock.character}
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
