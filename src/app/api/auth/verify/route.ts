import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=Invalid+verification+link', request.url));
  }

  try {
    const record = await (prisma as any).verificationOTP.findFirst({
      where: {
        otp: token,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      return NextResponse.redirect(new URL('/login?error=Invalid+or+expired+verification+link', request.url));
    }

    if (!record.name || !record.password) {
      return NextResponse.redirect(new URL('/signup?error=Signup+data+missing.+Please+try+again.', request.url));
    }

    // Create the actual user
    const user = await prisma.user.create({
      data: {
        email: record.email,
        password: record.password,
        name: record.name,
        role: 'admin',
        defaultClass: record.defaultClass,
      },
    });

    // Clean up verification record
    await (prisma as any).verificationOTP.delete({
      where: { id: record.id },
    });

    // Sign in the user
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const sessionToken = await encrypt({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        adminId: (user as any).adminId,
      },
      expires,
    });

    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('❌ [VerifyRoute] Error verifying email:', error);
    return NextResponse.redirect(new URL('/login?error=An+error+occurred+during+verification', request.url));
  }
}
