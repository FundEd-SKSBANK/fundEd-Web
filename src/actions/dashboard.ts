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
    const [events, transactions] = await Promise.all([
      prisma.event.findMany({ where: eventWhere }),
      prisma.payment.findMany({ 
          where: paymentWhere,
          include: { student: true, event: true } 
      })
    ]);
    
    // Calculate recentTransactions locally to save a massive 2-second global connection ping!
    const recentTransactions = [...transactions]
      .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())
      .slice(0, 5);

    console.timeEnd(` [DashboardData] PrismaParallel-${callId}`);

    const mapTransaction = (t: any) => ({
      ...t,
      studentName: t.student?.name || 'Unknown',
      eventName: t.event?.name || 'Unknown',
      eventCost: t.event?.cost || 0,
      paymentDate: t.paymentDate.toISOString(),
    });

    console.timeEnd(` [DashboardData] Total-${callId}`);

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

