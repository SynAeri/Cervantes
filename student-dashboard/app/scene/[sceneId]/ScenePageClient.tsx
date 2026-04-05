// Client component for scene page

'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { SceneRenderer } from '../../components/vn/SceneRenderer';
import { useSaveReasoningTrace } from '../../hooks/useJournal';

export function ScenePageClient({ params }: { params: Promise<{ sceneId: string }> }) {
  const { sceneId } = use(params);
  const router = useRouter();
  const saveTraceMutation = useSaveReasoningTrace();

  const mockSceneData = {
    scene_id: sceneId,
    character: {
      name: 'Elena',
      role: 'Economics Club President',
    },
    content: `[narration] You're in the university café, studying for your economics exam. A student approaches your table.

[character:Elena] *curious* Hey, I noticed you're working on the supply and demand assignment. Mind if I ask you something?

[narration] Elena sits down across from you, pulling out her notes.

[character:Elena] *thoughtful* I'm confused about equilibrium. Does it mean supply and demand are always equal?

[player_prompt] What do you think equilibrium means in economics?
- Supply and demand quantities are equal at a specific price
- Supply and demand curves intersect
- The market has no shortage or surplus
- All buyers and sellers are satisfied

[character:Elena] *nodding* Interesting perspective. Can you explain why you chose that answer?

[player_prompt] Explain your reasoning about economic equilibrium.`,
  };

  const handleSceneComplete = async (conversationHistory: any[]) => {
    try {
      await saveTraceMutation.mutateAsync({
        student_id: 'student_demo',
        scene_id: sceneId,
        conversation_history: conversationHistory,
        initial_answer: conversationHistory[0]?.content || '',
        revised_answer: conversationHistory[conversationHistory.length - 1]?.content || '',
      });

      router.push('/journal');
    } catch (error) {
      console.error('Failed to save reasoning trace:', error);
    }
  };

  return (
    <SceneRenderer
      sceneId={sceneId}
      sceneData={mockSceneData}
      onComplete={handleSceneComplete}
    />
  );
}
