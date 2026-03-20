'use server'

import { cookies, headers } from 'next/headers';
import prisma from '@/lib/db';
import { encrypt, getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { sendResetPasswordEmail } from '@/lib/email-templates';
import { redirect } from 'next/navigation';


export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please provide both email and password' };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
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

  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ user: { id: user.id, email: user.email, name: user.name, role: user.role, adminId: (user as any).adminId }, expires }); // Save the session in a cookie
  (await cookies()).set('session', session, { expires, httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
  
  // Directly redirect superadmins to their dashboard
  if (user.role === 'superadmin') {
      redirect('/dashboard/super');
  }
  
  redirect('/dashboard');
}

export async function signup(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const name = formData.get('name') as string;

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
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'admin', // Default to admin for now as per current schema logic
      },
    });

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await encrypt({ user: { id: user.id, email: user.email, name: user.name, role: user.role, adminId: (user as any).adminId }, expires });
    (await cookies()).set('session', session, { expires, httpOnly: true });

    redirect('/dashboard');
  } catch (error: any) {
    console.error('Signup error:', error);
    return { error: 'An error occurred during signup. Please try again.' };
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
      // For security, don't reveal if user exists. 
      // But for this app's context, a friendly message is fine or just success.
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
  } catch (error) {
    console.error('Forgot password error:', error);
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
  } catch (error) {
    console.error('Reset password error:', error);
    return { error: 'An error occurred. Please try again.' };
  }
}

export async function logout() {
  (await cookies()).delete('session');
  redirect('/login');
}

export async function getUserRole() {
  const session = await getSession();
  
  if (!session || !session.user) return null;
  
  // Fetch fresh user data from DB
  const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true }
  });

  if (!user) return null;

  // Auto-upgrade special superadmin email if it's currently just 'admin'
  if (user.email === 'super@funded.com' && user.role === 'admin') {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'superadmin' }
    });
    return 'superadmin';
  }
  
  return user.role;
}
