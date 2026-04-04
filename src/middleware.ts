import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth-edge';

// Rate limiter state (In-memory, per isolate)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export async function middleware(request: NextRequest) {
  // 1. Rate Limiting Check
  // In Next.js 14+, request.ip is deprecated or missing from types, so we use headers
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  
  if (ip) {
    const windowMs = 60 * 1000; // 1 min window
    const maxRequests = 60; // Max 60 requests per window
    const now = Date.now();
    
    // Prevent Edge isolate memory leak
    if (rateLimitMap.size > 1000) {
      rateLimitMap.clear();
    }

    const userData = rateLimitMap.get(ip);

    if (!userData) {
      rateLimitMap.set(ip, { count: 1, timestamp: now });
    } else {
      if (now - userData.timestamp > windowMs) {
        // Reset window
        userData.count = 1;
        userData.timestamp = now;
      } else {
        if (userData.count >= maxRequests) {
          return new NextResponse('Too Many Requests - Rate Limit Exceeded', { status: 429 });
        }
        userData.count += 1;
      }
    }
  }

  // 2. Auth Logic
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
