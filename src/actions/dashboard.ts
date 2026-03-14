'use server'

import prisma from '@/lib/db';
import { getSession, getWorkspaceId } from '@/lib/auth';

export async function getDashboardData() {
  try {
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    const workspaceId = getWorkspaceId(session.user);
    const eventWhere: any = { createdById: workspaceId };
    const paymentWhere: any = { event: { createdById: workspaceId } };

    const events = await prisma.event.findMany({ where: eventWhere });
    const transactions = await prisma.payment.findMany({ 
        where: paymentWhere,
        include: { student: true, event: true } 
    });
    const recentTransactions = await prisma.payment.findMany({
      where: paymentWhere,
      take: 5,
      orderBy: { paymentDate: 'desc' },
      include: { student: true, event: true }
    });

    const mapTransaction = (t: any) => ({
      ...t,
      studentName: t.student?.name || 'Unknown',
      eventName: t.event?.name || 'Unknown',
      eventCost: t.event?.cost || 0,
      paymentDate: t.paymentDate.toISOString(),
    });

    return {
      success: true,
      data: {
        events: events.map(e => ({...e, deadline: e.deadline.toISOString()})),
        transactions: transactions.map(mapTransaction),
        recentTransactions: recentTransactions.map(mapTransaction),
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return { success: false, error: 'Failed to fetch dashboard data' };
  }
}
