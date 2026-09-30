import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';

// Configuration des routes
const ROUTES = {
  public: ['/', '/about', '/contact', '/pricing'],
  auth: ['/auth/login', '/auth/register', '/auth/forgot-password'],
  superAdmin: ['/tenants', '/plans'],
  admin: ['/users', '/chantiers', '/sites', '/metres', '/devis', '/factures', '/planning', '/comptabilite'],
  common: ['/dashboard', '/profile'],
  defaultAfterLogin: '/dashboard',
  defaultLoginPage: '/auth/login',
} as const;

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Vérifier le type de route
  const isPublicRoute = ROUTES.public.some(route => route === pathname);
  const isAuthPage = ROUTES.auth.some(route => pathname.startsWith(route));
  const isSuperAdminRoute = ROUTES.superAdmin.some(route => pathname.startsWith(route));
  const isAdminRoute = ROUTES.admin.some(route => pathname.startsWith(route));
  const isCommonRoute = ROUTES.common.some(route => pathname.startsWith(route));
  const isProtectedRoute = isSuperAdminRoute || isAdminRoute || isCommonRoute;

  // 0. Pas de site vitrine : "/" mène au dashboard si connecté, sinon au login
  if (pathname === '/') {
    const target = isLoggedIn ? ROUTES.defaultAfterLogin : ROUTES.defaultLoginPage;
    return NextResponse.redirect(new URL(target, req.url));
  }

  // 1. Rediriger les utilisateurs connectés des pages d'auth vers le dashboard
  if (isAuthPage && isLoggedIn) {
    console.log('→ Redirecting logged user to dashboard');
    return NextResponse.redirect(new URL(ROUTES.defaultAfterLogin, req.url));
  }

  // 2. Rediriger les utilisateurs non connectés des routes protégées vers login
  if (isProtectedRoute && !isLoggedIn) {
    console.log('→ Redirecting to login with callback');
    const loginUrl = new URL(ROUTES.defaultLoginPage, req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Vérifier les permissions par rôle
  if (isLoggedIn && isProtectedRoute) {
    // SUPER_ADMIN peut accéder aux routes SUPER_ADMIN et communes
    if (userRole === 'SUPER_ADMIN') {
      if (isAdminRoute) {
        console.log('→ SUPER_ADMIN trying to access ADMIN route, redirecting to dashboard');
        return NextResponse.redirect(new URL(ROUTES.defaultAfterLogin, req.url));
      }
      return NextResponse.next();
    }

    // ADMIN peut accéder aux routes ADMIN et communes
    if (userRole === 'ADMIN') {
      if (isSuperAdminRoute) {
        console.log('→ ADMIN trying to access SUPER_ADMIN route, redirecting to dashboard');
        return NextResponse.redirect(new URL(ROUTES.defaultAfterLogin, req.url));
      }
      return NextResponse.next();
    }

    // Autres rôles - rediriger vers dashboard s'ils tentent d'accéder aux routes protégées
    if (isSuperAdminRoute || isAdminRoute) {
      console.log('→ Unauthorized role trying to access protected route');
      return NextResponse.redirect(new URL(ROUTES.defaultAfterLogin, req.url));
    }
  }

  // 4. Laisser passer
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};