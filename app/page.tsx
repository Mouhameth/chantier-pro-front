import { redirect } from 'next/navigation';

// Pas de page d'accueil : le middleware redirige "/" vers le login (ou le dashboard si connecté).
// Cette redirection sert de filet si le middleware ne s'applique pas.
export default function Home() {
  redirect('/auth/login');
}
