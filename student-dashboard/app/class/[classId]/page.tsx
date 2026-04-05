// Class dashboard page wrapper

import { ClassPageClient } from './ClassPageClient';

export function generateStaticParams() {
  return [];
}

export default function ClassPage() {
  return <ClassPageClient />;
}
