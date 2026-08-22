'use server'

import prisma from '@/lib/db';
import { getSession, getWorkspaceId } from '@/lib/auth';
import { getUserRole } from '@/actions/auth';

export async function getDashboardData(passedRole?: string | null) {
  const callId = Date.now();
  try {
    console.time(` [DashboardData] Total-${callId}`);
    
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    let role = passedRole;
    if (!role) {
      console.time(` [DashboardData] GetRole-${callId}`);
      role = await getUserRole();
      console.timeEnd(` [DashboardData] GetRole-${callId}`);
    }

    const workspaceId = getWorkspaceId(session.user);
    const eventWhere: any = role === 'superadmin' ? {} : { createdById: workspaceId };
    const paymentWhere: any = role === 'superadmin' ? {} : { event: { createdById: workspaceId } };

    console.time(` [DashboardData] PrismaParallel-${callId}`);
    const [events, paidAgg, pendingAgg, uniqueStudents, recentTransactionsRaw] = await Promise.all([
      prisma.event.findMany({ where: eventWhere }),
      prisma.payment.aggregate({
        where: { ...paymentWhere, status: 'Paid' },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { ...paymentWhere, status: { in: ['Pending', 'Verification Pending'] } },
        _sum: { amount: true }
      }),
      prisma.payment.groupBy({
        by: ['studentId'],
        where: paymentWhere,
      }),
      prisma.payment.findMany({
        where: paymentWhere,
        include: { student: true, event: true },
        orderBy: { paymentDate: 'desc' },
        take: 5
      })
    ]);
    
    console.timeEnd(` [DashboardData] PrismaParallel-${callId}`);

    const mapTransaction = (t: any) => ({
      ...t,
      studentName: t.student?.name || 'Unknown',
      eventName: t.event?.name || 'Unknown',
      eventCost: t.event?.cost || 0,
      paymentDate: t.paymentDate.toISOString(),
    });

    const stats = {
      totalCollected: paidAgg._sum.amount || 0,
      pendingAmount: pendingAgg._sum.amount || 0,
      uniqueStudents: uniqueStudents.length
    };

    console.timeEnd(` [DashboardData] Total-${callId}`);

    return {
      success: true,
      data: {
        events: events.map(e => ({...e, deadline: e.deadline.toISOString()})),
        stats,
        recentTransactions: recentTransactionsRaw.map(mapTransaction),
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return { success: false, error: 'Failed to fetch dashboard data' };
  }
}

