import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { signToken, verifyToken } from '@/lib/auth/session';
import { locales, defaultLocale } from '@/app/i18n/config';

const protectedRoutes = ['/dashboard'];
const publicRoutes = ['/sign-in', '/sign-up', '/login']; // Add other public routes

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale
});

export async function middleware(request: NextRequest) {
  // 1. Run next-intl middleware first to handle redirects and locale extraction
  const response = intlMiddleware(request);

  // If next-intl redirects (e.g. to add locale), return immediately
  if (response.headers.get('Location')) {
    return response;
  }

  // 2. Auth Logic
  const { pathname } = request.nextUrl;
  
  // Extract locale from pathname to check protected routes correctly
  // Pathname will be like /en/dashboard or /dashboard
  const pathWithoutLocale = pathname.replace(/^\/(en|zh-hant)/, '') || '/';
  
  const isProtectedRoute = protectedRoutes.some(route => pathWithoutLocale.startsWith(route));
  const sessionCookie = request.cookies.get('session');

  if (isProtectedRoute && !sessionCookie) {
    // Redirect to sign-in, preserving locale if present
    const locale = pathname.match(/^\/(en|zh-hant)/)?.[1] || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/sign-in`, request.url));
  }

  // 3. Session Refresh Logic
  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

      response.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString()
        }),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresInOneDay
      });
    } catch (error) {
      console.error('Error updating session:', error);
      response.cookies.delete('session');
      if (isProtectedRoute) {
        const locale = pathname.match(/^\/(en|zh-hant)/)?.[1] || defaultLocale;
        return NextResponse.redirect(new URL(`/${locale}/sign-in`, request.url));
      }
    }
  }

  return response;
}

export const config = {
  // Matcher ignoring internals but capturing everything else
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};
