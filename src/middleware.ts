import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth-edge';

export async function middleware(request: NextRequest) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
