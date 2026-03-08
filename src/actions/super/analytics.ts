'use server'

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { startOfDay, startOfWeek, subDays, subWeeks, subMonths, format, startOfMonth } from 'date-fns';

export async function getSuperuserStats() {
    try {
        const session = await getSession();
        if (session?.user?.role !== 'superadmin') {
            return { success: false, error: "Unauthorized" };
        }

        const [
            adminCount,
            studentCount,
            eventCount,
            payments,
            expenses
        ] = await Promise.all([
            prisma.user.count({ where: { role: 'admin' } }),
            prisma.student.count(),
            prisma.event.count(),
            prisma.payment.aggregate({
                where: { status: 'Paid' },
                _sum: { amount: true }
            }),
            prisma.expense.aggregate({
                _sum: { amount: true }
            })
        ]);

        const totalRevenue = payments._sum.amount || 0;
        const totalExpenses = expenses._sum.amount || 0;
        const netBalance = totalRevenue - totalExpenses;

        return {
            success: true,
            data: {
                admins: adminCount,
                students: studentCount,
                events: eventCount,
                revenue: totalRevenue,
                expenses: totalExpenses,
                netBalance
            }
        };

    } catch (error) {
        console.error("Failed to fetch superadmin stats:", error);
        return { success: false, error: "Failed to fetch stats" };
    }
}

export async function getGlobalFinancialsOverTime(period: 'day' | 'week' | 'month' = 'week') {
    try {
        const session = await getSession();
        if (session?.user?.role !== 'superadmin') {
            return { success: false, error: "Unauthorized" };
        }

        const now = new Date();
        let startDate: Date;
        let dataPoints: { date: string; revenue: number; expenses: number }[] = [];

        if (period === 'day') {
            startDate = subDays(now, 6);
            for (let i = 6; i >= 0; i--) {
                const date = subDays(now, i);
                const dayStart = startOfDay(date);
                const dayEnd = new Date(dayStart);
                dayEnd.setDate(dayEnd.getDate() + 1);

                const [dailyPayments, dailyExpenses] = await Promise.all([
                    prisma.payment.aggregate({
                        where: {
                           paymentDate: { gte: dayStart, lt: dayEnd },
                           status: 'Paid'
                        },
                        _sum: { amount: true }
                    }),
                    prisma.expense.aggregate({
                        where: {
                            date: { gte: dayStart, lt: dayEnd }
                        },
                        _sum: { amount: true }
                    })
                ]);

                dataPoints.push({
                    date: format(date, 'MMM dd'),
                    revenue: dailyPayments._sum.amount || 0,
                    expenses: dailyExpenses._sum.amount || 0
                });
            }
        } else if (period === 'week') {
             startDate = subWeeks(now, 7);
             for(let i=7; i>=0; i--) {
                 const date = subWeeks(now, i);
                 const weekStart = startOfWeek(date);
                 const weekEnd = new Date(weekStart);
                 weekEnd.setDate(weekEnd.getDate() + 7);

                 const [weeklyPayments, weeklyExpenses] = await Promise.all([
                     prisma.payment.aggregate({
                         where: { paymentDate: { gte: weekStart, lt: weekEnd }, status: 'Paid' },
                         _sum: { amount: true }
                     }),
                     prisma.expense.aggregate({
                         where: { date: { gte: weekStart, lt: weekEnd } },
                         _sum: { amount: true }
                     })
                 ]);
                 
                 dataPoints.push({
                     date: `Week ${format(weekStart, 'MMM dd')}`,
                     revenue: weeklyPayments._sum.amount || 0,
                     expenses: weeklyExpenses._sum.amount || 0
                 });
             }
        } else {
            // Month
            startDate = subMonths(now, 5);
            for(let i=5; i>=0; i--) {
                const date = subMonths(now, i);
                const monthStart = startOfMonth(date);
                const monthEnd = new Date(monthStart);
                monthEnd.setMonth(monthEnd.getMonth() + 1);
                
                const [monthlyPayments, monthlyExpenses] = await Promise.all([
                     prisma.payment.aggregate({
                         where: { paymentDate: { gte: monthStart, lt: monthEnd }, status: 'Paid' },
                         _sum: { amount: true }
                     }),
                     prisma.expense.aggregate({
                         where: { date: { gte: monthStart, lt: monthEnd } },
                         _sum: { amount: true }
                     })
                 ]);

                 dataPoints.push({
                     date: format(date, 'MMM yyyy'),
                     revenue: monthlyPayments._sum.amount || 0,
                     expenses: monthlyExpenses._sum.amount || 0
                 });
            }
        }

        return { success: true, data: dataPoints };

    } catch (error) {
        console.error("Failed to fetch global financials:", error);
        return { success: false, error: "Failed to fetch financials" };
    }
}

export async function getExpenseCategoryBreakdown() {
    try {
        const session = await getSession();
         if (session?.user?.role !== 'superadmin') {
            return { success: false, error: "Unauthorized" };
        }

        const expenses = await prisma.expense.groupBy({
            by: ['category'],
            _sum: {
                amount: true
            }
        });

        const formatted = expenses.map(e => ({
            name: e.category,
            value: e._sum.amount || 0
        }));

        return { success: true, data: formatted };
    } catch (error) {
        console.error("Failed to fetch expense breakdown:", error);
        return { success: false, error: "Failed to fetch expense breakdown" };
    }
}
