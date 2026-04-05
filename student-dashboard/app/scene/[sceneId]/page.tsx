// Scene page - loads and displays VN scene with player
// Handles scene completion and saves reasoning trace

import { ScenePageClient } from './ScenePageClient';

export function generateStaticParams() {
  return [];
}

export default function ScenePage({ params }: { params: Promise<{ sceneId: string }> }) {
  return <ScenePageClient params={params} />;
}
