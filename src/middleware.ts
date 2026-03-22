import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth-edge';

export async function middleware(request: NextRequest) {
  try {
    const session = request.cookies.get('session')?.value;
    const parsed = session ? await decrypt(session) : null;

    if (!parsed && request.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (parsed && request.nextUrl.pathname === '/login') {
      const role = (parsed as any).user?.role;
      if (role === 'superadmin') {
        return NextResponse.redirect(new URL('/dashboard/super', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } catch (error) {
    console.error('Middleware error:', error);
    // If middleware fails, allow the request to proceed as unauthenticated
    // instead of crashing the whole site with a 500 error.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
