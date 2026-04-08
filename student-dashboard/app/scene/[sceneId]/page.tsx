// Scene page - loads and displays VN scene with player
// Handles scene completion and saves reasoning trace

import { Suspense } from 'react';
import { ScenePageClient } from './ScenePageClient';

export function generateStaticParams() {
  return [];
}

function SceneLoading() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-terracotta/30 border-t-terracotta rounded-full animate-spin mx-auto mb-4" />
        <p className="text-warm-grey text-sm">Loading scene...</p>
      </div>
    </div>
  );
}

export default function ScenePage({ params }: { params: Promise<{ sceneId: string }> }) {
  return (
    <Suspense fallback={<SceneLoading />}>
      <ScenePageClient params={params} />
    </Suspense>
  );
}
