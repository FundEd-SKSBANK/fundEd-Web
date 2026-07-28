'use server'

import { cookies, headers } from 'next/headers';
import prisma from '@/lib/db';
import { encrypt, getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { sendResetPasswordEmail, sendVerificationLinkEmail } from '@/lib/email-templates';
import { redirect } from 'next/navigation';



export async function signup(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const name = formData.get('name') as string;
  const defaultClass = formData.get('defaultClass') as string | undefined;

  const crypto = await import('crypto');

  if (!email || !password || !confirmPassword || !name) {
    return { error: 'Please fill in all fields' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long' };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: 'A user with this email already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await (prisma as any).verificationOTP.upsert({
      where: { email },
      update: {
        otp: token,
        expiresAt,
        verified: false,
        name,
        password: hashedPassword,
        defaultClass
      },
      create: {
        email,
        otp: token,
        expiresAt,
        name,
        password: hashedPassword,
        defaultClass
      },
    });

    const headerList = await headers();
    const host = headerList.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const appUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'http://localhost:3000');
    const verificationLink = `${appUrl}/api/auth/verify?token=${token}`;

    const result = await sendVerificationLinkEmail({
      email,
      verificationLink,
      name: name || undefined,
    });

    if (!result.success) {
      return { error: result.message || 'Failed to send verification email' };
    }

    return { success: 'Verification link sent to your email. Please check your inbox to complete signup.' };
  } catch (error: any) {
    console.error('❌ [AuthAction] Signup error:', error);
    
    if (error.message?.includes('Prisma') || error.message?.includes('database')) {
      return { error: 'Database connection failed. Please try again.' };
    }
    
    return { error: 'An error occurred during signup. Please try again.' };
  }
}

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please provide both email and password' };
  }

  try {
    console.time(' [AuthAction] LogIn: FindUser');
    const user = await prisma.user.findUnique({
      where: { email },
    });
    console.timeEnd(' [AuthAction] LogIn: FindUser');

    if (!user) {
      return { error: 'Invalid credentials' };
    }

    console.time(' [AuthAction] LogIn: BcryptCompare');
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    console.timeEnd(' [AuthAction] LogIn: BcryptCompare');

    if (!isPasswordCorrect) {
      return { error: 'Invalid credentials' };
    }

    // Auto-upgrade special superadmin email if it's currently just 'admin'
    if (user.email === 'super@funded.com' && user.role === 'admin') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'superadmin' }
      });
      user.role = 'superadmin';
    }

    console.time(' [AuthAction] LogIn: EncryptSession');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const sessionToken = await encrypt({ 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role, 
        adminId: (user as any).adminId 
      }, 
      expires 
    });
    console.timeEnd(' [AuthAction] LogIn: EncryptSession');

    (await cookies()).set('session', sessionToken, { 
      expires, 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax', 
      path: '/' 
    });
    
    console.log('✅ [AuthAction] Login successful, redirecting...');

    // Support safe post-login redirect — only /join/* paths allowed (prevents open redirect)
    const rawRedirect = formData.get('redirectTo') as string | null;
    if (rawRedirect && /^\/join\/[A-Z0-9\-]+$/.test(rawRedirect)) {
      redirect(rawRedirect);
    }
    
    // Directly redirect superadmins to their dashboard
    if (user.role === 'superadmin') {
        redirect('/dashboard/super');
    }
    
    redirect('/dashboard');
  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('❌ [AuthAction] Login error:', error);
    
    // Check for specific Prisma errors
    if (error.message?.includes('Prisma') || error.message?.includes('database')) {
      return { error: 'Database connection failed. Please try again in a moment.' };
    }
    
    return { error: 'An unexpected error occurred during login. Please try again.' };
  }
}

export async function forgotPassword(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const crypto = await import('crypto');

  if (!email) {
    return { error: 'Please provide your email' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: 'If an account exists with that email, we have sent a reset link.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await (prisma.user as any).update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpires: expires,
      },
    });

    // Send actual email
    const headerList = await headers();
    const host = headerList.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const appUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'http://localhost:3000');
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    const result = await sendResetPasswordEmail({
        email: user.email,
        name: user.name || undefined,
        resetLink
    });

    if (!result.success) {
        return { error: 'Failed to send reset email. Please try again later.' };
    }
    
    return { success: 'If an account exists with that email, we have sent a reset link to your registered email address.' };
  } catch (error: any) {
    console.error('❌ [AuthAction] Forgot password error:', error);
    if (error.message?.includes('Prisma') || error.message?.includes('database')) {
      return { error: 'Database connection failed. Please try again.' };
    }
    return { error: 'An error occurred. Please try again.' };
  }
}

export async function resetPassword(prevState: any, formData: FormData) {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!token || !password || !confirmPassword) {
    return { error: 'Please fill in all fields' };
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long' };
  }

  try {
    const user = await (prisma.user as any).findUnique({
      where: { resetToken: token },
    });

    if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      return { error: 'Invalid or expired reset token' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await (prisma.user as any).update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return { success: 'Password reset successfully. You can now login.' };
  } catch (error: any) {
    console.error('❌ [AuthAction] Reset password error:', error);
    if (error.message?.includes('Prisma') || error.message?.includes('database')) {
      return { error: 'Database connection failed. Please try again.' };
    }
    return { error: 'An error occurred. Please try again.' };
  }
}

export async function logout() {
  (await cookies()).delete('session');
  redirect('/login');
}

export async function getUserRole() {
  console.time(' [AuthAction] GetUserRole');
  const session = await getSession();
  
  if (!session || !session.user) {
    console.timeEnd(' [AuthAction] GetUserRole');
    return null;
  }
  
  // High-performance: Use role from session JWT instead of DB hit
  // This saves one DB query on every protected page load or server action.
  const role = session.user.role;
  console.log('🔍 [AuthAction] Role from session:', role);
  
  // Only hit DB if it's the special superadmin email and we need to check'admin' status
  // but usually login handles this upgrade.
  if (session.user.email === 'super@funded.com' && role === 'admin') {
    console.time(' [AuthAction] GetUserRole: DB-UpgradeCheck');
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, role: true }
    });
    
    if (user && user.email === 'super@funded.com' && user.role === 'admin') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'superadmin' }
      });
      console.timeEnd(' [AuthAction] GetUserRole: DB-UpgradeCheck');
      console.timeEnd(' [AuthAction] GetUserRole');
      return 'superadmin';
    }
    console.timeEnd(' [AuthAction] GetUserRole: DB-UpgradeCheck');
  }

  console.timeEnd(' [AuthAction] GetUserRole');
  return role;
}
