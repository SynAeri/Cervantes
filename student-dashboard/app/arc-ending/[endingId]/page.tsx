// Arc ending display page - shows outcome-based narrative ending
// Rendered after arc completion with good/bad/iffy end based on performance

import { Suspense } from 'react';
import { ArcEndingClient } from './ArcEndingClient';

export default function ArcEndingPage({ params }: { params: Promise<{ endingId: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center"><p className="text-warm-grey">Loading...</p></div>}>
      <ArcEndingClient params={params} />
    </Suspense>
  );
}
