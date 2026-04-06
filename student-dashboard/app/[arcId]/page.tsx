// Arc landing page - server component wrapper

import { ArcLandingClient } from './ArcLandingClient';

export function generateStaticParams() {
  return [];
}

export default function ArcLandingPage({ params }: { params: Promise<{ arcId: string }> }) {
  return <ArcLandingClient params={params} />;
}
