// SceneRenderer - wrapper for VNPlayer with scene data fetching
// Handles scene loading and completion

'use client';

import { VNPlayer } from './VNPlayer';

interface SceneRendererProps {
  sceneId: string;
  sceneData: any;
  onComplete: (conversationHistory: any[]) => void;
}

export function SceneRenderer({ sceneId, sceneData, onComplete }: SceneRendererProps) {
  if (!sceneData) {
    return (
      <div className="min-h-screen bg-vn-bg flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-tertiary/30 mb-4 block">
            auto_stories
          </span>
          <p className="text-parchment text-xl">Scene not found</p>
        </div>
      </div>
    );
  }

  return (
    <VNPlayer
      sceneContent={sceneData.content || sceneData.generated_scene_content || ''}
      characterName={sceneData.assigned_character?.name || sceneData.character?.name || 'Character'}
      characterRole={sceneData.assigned_character?.role || sceneData.character?.role || 'Unknown'}
      sceneId={sceneId}
      onSceneComplete={onComplete}
    />
  );
}
