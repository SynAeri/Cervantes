// Landing page for La Mancha - redirects to login

import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/login');
}
