// Client component for scene page
// Fetches real scene data from backend and displays VN scene with player

'use client';

import { use, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SceneRenderer } from '../../components/vn/SceneRenderer';
import { useSaveReasoningTrace } from '../../hooks/useJournal';
import { api } from '../../lib/api';

export function ScenePageClient({ params }: { params: Promise<{ sceneId: string }> }) {
  const { sceneId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const saveTraceMutation = useSaveReasoningTrace();

  const [sceneData, setSceneData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get studentId and arcId from URL params
  const studentId = searchParams.get('studentId');
  const arcId = searchParams.get('arcId');

  useEffect(() => {
    const fetchSceneData = async () => {
      if (!studentId || !arcId) {
        setError('Student ID or Arc ID not found in URL');
        setLoading(false);
        return;
      }

      try {
        // Extract scene_order from sceneId (format: "scene1" -> 1)
        const sceneOrderMatch = sceneId.match(/scene(\d+)/);
        if (!sceneOrderMatch) {
          throw new Error('Invalid scene ID format');
        }
        const sceneOrder = parseInt(sceneOrderMatch[1], 10);

        // Fetch scene by arc_id and scene_order, with student_id to get assigned character
        const data = await api.scene.getByOrder(arcId, sceneOrder, studentId);
        setSceneData(data);

        // Mark scene as started (in the background, don't wait for response)
        api.scene.markStarted(arcId, sceneOrder, studentId).catch(err => {
          console.error('Failed to mark scene as started:', err);
          // Non-critical error, scene data already loaded
        });
      } catch (err: any) {
        console.error('Failed to fetch scene:', err);
        setError(err.message || 'Failed to load scene');
      } finally {
        setLoading(false);
      }
    };

    fetchSceneData();
  }, [sceneId, studentId, arcId]);

  const handleSceneComplete = async (conversationHistory: any[]) => {
    if (!studentId || !arcId) {
      console.error('Cannot complete scene: student ID or arc ID missing');
      return;
    }

    try {
      // Extract scene_order from sceneId
      const sceneOrderMatch = sceneId.match(/scene(\d+)/);
      const sceneOrder = sceneOrderMatch ? parseInt(sceneOrderMatch[1], 10) : 1;

      // For deep scenes with Socratic dialogue, save reasoning trace
      // For bridge scenes (simple choice), skip reasoning trace
      const hasDialogue = conversationHistory.some(entry => entry.role === 'character');
      if (hasDialogue && conversationHistory.length > 1) {
        console.log('Saving reasoning trace for deep scene');
        try {
          await saveTraceMutation.mutateAsync({
            student_id: studentId,
            scene_id: sceneId,
            conversation_history: conversationHistory,
            initial_answer: conversationHistory[0]?.content || '',
            revised_answer: conversationHistory[conversationHistory.length - 1]?.content || '',
          });
        } catch (traceError) {
          // Non-critical - reasoning trace save failed but continue
          console.error('Failed to save reasoning trace:', traceError);
        }
      } else {
        console.log('Skipping reasoning trace for bridge scene');
      }

      // Mark scene as completed
      await api.scene.markCompleted(arcId, sceneOrder, studentId);

      // Check if there's a next scene
      const nextSceneId = `scene${sceneOrder + 1}`;

      try {
        // Try to fetch the next scene to see if it exists
        const nextSceneData = await api.scene.getByOrder(arcId, sceneOrder + 1, studentId);

        // If it exists, navigate to it
        if (nextSceneData) {
          console.log(`Scene ${sceneOrder} complete, navigating to scene ${sceneOrder + 1}`);
          router.push(`/scene/${nextSceneId}?studentId=${studentId}&arcId=${arcId}`);
          return;
        }
      } catch (err: any) {
        // No next scene - this is the climax scene, generate arc ending
        console.log('No more scenes, this is the climax scene. Generating arc ending...');

        try {
          // Determine performance level based on conversation quality
          // For now, use simple heuristic: if conversation has multiple turns with character pushback, likely mastery
          // TODO: Get actual performance from signal extraction
          const hasMultipleTurns = conversationHistory.filter(entry => entry.role === 'character').length >= 2;
          const performanceLevel = hasMultipleTurns ? 'mastery' : 'needs_improvement';

          console.log('Generating arc ending with performance:', performanceLevel);

          // Generate arc ending
          const endingResponse = await fetch('http://localhost:8080/api/arc-endings/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              student_id: studentId,
              arc_id: arcId,
              climax_scene_id: sceneId,
              performance_level: performanceLevel,
            }),
          });

          if (!endingResponse.ok) {
            throw new Error('Arc ending generation failed');
          }

          const endingData = await endingResponse.json();
          console.log('Arc ending generated:', endingData.ending_type);

          // Navigate to ending display page
          router.push(`/arc-ending/${endingData.ending_id}?studentId=${studentId}&arcId=${arcId}`);
          return;
        } catch (endingError) {
          console.error('Failed to generate arc ending:', endingError);
          // Fall back to journal if ending generation fails
        }
      }

      // Fallback - go to journal
      console.log('Redirecting to journal');
      router.push('/journal');
    } catch (error) {
      console.error('Failed to complete scene:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-near-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-parchment/60 text-sm">Loading scene...</p>
        </div>
      </div>
    );
  }

  if (error || !sceneData) {
    return (
      <div className="min-h-screen bg-near-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-near-black border border-parchment/20 rounded-xl p-6 text-center">
          <span className="material-symbols-outlined text-5xl text-critical mb-4 block">error</span>
          <h1 className="text-xl font-bold text-parchment mb-2">Scene Not Found</h1>
          <p className="text-parchment/60 text-sm mb-6">{error || 'This scene does not exist or could not be loaded.'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-terracotta text-parchment font-bold rounded transition-colors hover:bg-terracotta/80"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <SceneRenderer
      sceneId={sceneId}
      sceneData={sceneData}
      onComplete={handleSceneComplete}
    />
  );
}
