'use server'

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function getDashboardData() {
  try {
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    const eventWhere: any = {};
    const paymentWhere: any = {};

    if (session.user.role !== 'superadmin') {
        eventWhere.createdById = session.user.id;
        paymentWhere.event = { createdById: session.user.id };
    }

    const [events, transactions, recentTransactions] = await Promise.all([
      prisma.event.findMany({ where: eventWhere }),
      prisma.payment.findMany({ 
          where: paymentWhere,
          include: { student: true, event: true } 
      }),
      prisma.payment.findMany({
        where: paymentWhere,
        take: 5,
        orderBy: { paymentDate: 'desc' },
        include: { student: true, event: true }
      })
    ]);

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
