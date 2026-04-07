// Arc ending display page - shows outcome-based narrative ending
// Rendered after arc completion with good/bad/iffy end based on performance

import { ArcEndingClient } from './ArcEndingClient';

export default function ArcEndingPage({ params }: { params: Promise<{ endingId: string }> }) {
  return <ArcEndingClient params={params} />;
}
