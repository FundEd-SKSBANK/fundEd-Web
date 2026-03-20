'use server'

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function getPendingTransactions() {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const transactions = await prisma.payment.findMany({
      where: { 
        status: 'Verification Pending',
        ...(session.user.role !== 'superadmin' && {
          event: {
            createdById: session.user.id
          }
        })
      },
      include: {
        student: true,
        event: true,
      }
    });

    const mappedTransactions = transactions.map(t => ({
      ...t,
      studentName: t.student.name,
      studentRoll: t.student.rollNo,
      eventName: t.event.name,
      paymentDate: t.paymentDate.toISOString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return { success: true, data: mappedTransactions };
  } catch (error) {
    console.error('Error fetching pending transactions:', error);
    return { success: false, error: 'Failed to fetch pending transactions' };
  }
}

export async function getUserNotifications() {
  try {
    const session = await getSession();
    if (!session || !session.user || session.user.role !== 'superadmin') {
      return { success: false, error: 'Unauthorized' };
    }

    // Fetch admins created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newAdmins = await prisma.user.findMany({
      where: {
        role: 'admin',
        createdAt: { gte: sevenDaysAgo }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    return { 
      success: true, 
      data: newAdmins.map(admin => ({
        id: admin.id,
        title: 'New Admin Registered',
        description: `${admin.name || admin.email} just joined FundEd.`,
        date: admin.createdAt.toISOString(),
        type: 'user'
      }))
    };
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return { success: false, error: 'Failed to fetch user notifications' };
  }
}
