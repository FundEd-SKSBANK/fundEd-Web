'use server'

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { startOfDay, startOfWeek, startOfMonth, subDays, subWeeks, subMonths, format } from 'date-fns';

export async function getDashboardStatistics(period: 'day' | 'week' | 'month' = 'week', adminId?: string) {
  try {
    const now = new Date();
    let startDate: Date;
    let dataPoints: { date: string; collections: number; transactions: number }[] = [];

    const whereClause: any = {
      status: 'Paid',
    };
    
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    if (session.user.role !== 'superadmin') {
        whereClause.event = { createdById: session.user.id };
    } else if (adminId) {
        whereClause.event = { createdById: adminId };
    }

    if (period === 'day') {
      startDate = subDays(now, 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate = subWeeks(now, 7);
      startDate = startOfWeek(startDate);
    } else {
      startDate = subMonths(now, 5);
      startDate = startOfMonth(startDate);
    }

    // Fetch all relevant payments in a single query
    const allPayments = await prisma.payment.findMany({
      where: {
        ...whereClause,
        paymentDate: { gte: startDate }
      },
      select: {
        amount: true,
        paymentDate: true
      }
    });

    if (period === 'day') {
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        const dayStart = startOfDay(date);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const dayPayments = allPayments.filter(p => p.paymentDate >= dayStart && p.paymentDate < dayEnd);

        dataPoints.push({
          date: format(date, 'MMM dd'),
          collections: dayPayments.reduce((sum, p) => sum + p.amount, 0),
          transactions: dayPayments.length,
        });
      }
    } else if (period === 'week') {
      for (let i = 7; i >= 0; i--) {
        const date = subWeeks(now, i);
        const weekStart = startOfWeek(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekPayments = allPayments.filter(p => p.paymentDate >= weekStart && p.paymentDate < weekEnd);

        dataPoints.push({
          date: `Week ${format(weekStart, 'MMM dd')}`,
          collections: weekPayments.reduce((sum, p) => sum + p.amount, 0),
          transactions: weekPayments.length,
        });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthStart = startOfMonth(date);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        const monthPayments = allPayments.filter(p => p.paymentDate >= monthStart && p.paymentDate < monthEnd);

        dataPoints.push({
          date: format(date, 'MMM yyyy'),
          collections: monthPayments.reduce((sum, p) => sum + p.amount, 0),
          transactions: monthPayments.length,
        });
      }
    }

    return {
      success: true,
      data: dataPoints,
    };
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    return { success: false, error: 'Failed to fetch statistics' };
  }
}
