'use server'

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getSession, getWorkspaceId } from '@/lib/auth';

export async function getQrCodes() {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };
    
    const adminId = getWorkspaceId(session.user);
    const role = session.user.role;

    const qrCodes = await prisma.qrCode.findMany({
      where: role === 'superadmin' ? {} : { adminId },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: qrCodes };
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return { success: false, error: 'Failed to fetch QR codes' };
  }
}

export async function addQrCode(data: { name: string; url: string; upiString?: string }) {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };
    const adminId = getWorkspaceId(session.user);
    const qrCode = await prisma.qrCode.create({
      data: {
        name: data.name,
        url: data.url,
        upiString: data.upiString,
        adminId,
      },
    });
    revalidatePath('/dashboard/settings');
    return { success: true, data: qrCode };
  } catch (error) {
    console.error('Error adding QR code:', error);
    return { success: false, error: 'Failed to add QR code' };
  }
}

export async function deleteQrCode(id: string) {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };
    const adminId = getWorkspaceId(session.user);
    // Ensure the QR belongs to this admin
    await prisma.qrCode.delete({
      where: { id, adminId },
    });
    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error) {
    console.error('Error deleting QR code:', error);
    return { success: false, error: 'Failed to delete QR code' };
  }
}
