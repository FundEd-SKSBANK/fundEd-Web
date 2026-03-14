'use server'

import prisma from '@/lib/db';
import { getSession, getWorkspaceId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { startOfDay, startOfWeek, subDays, subWeeks, subMonths, format, startOfMonth } from 'date-fns';

export async function getEventExpenses(eventId: string) {
    try {
        const session = await getSession();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const expenses = await prisma.expense.findMany({
            where: { eventId },
            orderBy: { date: 'desc' },
            include: { recorder: { select: { name: true } } }
        });

        // Calculate totals
        const totalExpenses = expenses.reduce((sum: number, e) => sum + e.amount, 0);

        return { success: true, data: { expenses, totalExpenses } };
    } catch (error) {
        console.error("Failed to fetch expenses:", error);
        return { success: false, error: "Failed to fetch expenses" };
    }
}
// ... (skipping middle parts to target specific chunks if possible, but replace_file_content works best with contiguous blocks. I'll do two replaces if needed, but the file is small enough to maybe just target the top and bottom or use multi_replace? No, I'll use multi_replace to be safe and efficient)

export async function createExpense(data: {
    title: string;
    amount: number;
    category: string;
    date: Date;
    eventId: string;
    billUrl?: string;
    note?: string;
}) {
    try {
        const session = await getSession();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const expense = await prisma.expense.create({
            data: {
                title: data.title,
                amount: data.amount,
                category: data.category,
                date: data.date,
                eventId: data.eventId,
                recordedBy: getWorkspaceId(session.user),
                billUrl: data.billUrl || null,
                note: data.note || null,
            }
        });

        revalidatePath(`/dashboard/events/${data.eventId}`);
        revalidatePath(`/dashboard/events/${data.eventId}/expenses`);
        return { success: true, data: expense };
    } catch (error) {
        console.error("Failed to create expense:", error);
        return { success: false, error: "Failed to create expense" };
    }
}

export async function deleteExpense(id: string, eventId: string) {
    try {
        const session = await getSession();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        await prisma.expense.delete({
            where: { id }
        });

        revalidatePath(`/dashboard/events/${eventId}`);
        revalidatePath(`/dashboard/events/${eventId}/expenses`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete expense:", error);
        return { success: false, error: "Failed to delete expense" };
    }
}

export async function updateExpense(id: string, eventId: string, data: {
    title: string;
    amount: number;
    category: string;
    date: Date;
    billUrl?: string | null;
    note?: string | null;
}) {
    try {
        const session = await getSession();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const expense = await prisma.expense.update({
            where: { id },
            data: {
                title: data.title,
                amount: data.amount,
                category: data.category,
                date: data.date,
                billUrl: data.billUrl !== undefined ? data.billUrl : undefined,
                note: data.note !== undefined ? data.note : undefined,
            }
        });

        revalidatePath(`/dashboard/events/${eventId}`);
        revalidatePath(`/dashboard/events/${eventId}/expenses`);
        return { success: true, data: expense };
    } catch (error) {
        console.error("Failed to update expense:", error);
        return { success: false, error: "Failed to update expense" };
    }
}

export async function getEventBalance(eventId: string) {
    try {
        const session = await getSession();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                payments: {
                    where: { status: 'Paid' }
                }
            }
        });
        
        const expenses = await prisma.expense.findMany({
            where: { eventId }
        });

        if (!event) return { success: false, error: "Event not found" };

        const totalCollected = event.payments.reduce((sum: number, p) => sum + p.amount, 0);
        const totalExpenses = expenses.reduce((sum: number, e) => sum + e.amount, 0);


        return {
            success: true,
            data: {
                eventName: event.name,
                totalCollected,
                totalExpenses,
                netBalance: totalCollected - totalExpenses
            }
        };
    } catch (error) {
         console.error("Failed to fetch balance:", error);
        return { success: false, error: "Failed to fetch balance" };
    }
}

export async function getEventExpensesBreakdown(eventId: string) {
    try {
        const session = await getSession();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const expenses = await prisma.expense.groupBy({
            by: ['category'],
            where: { eventId },
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
        console.error("Failed to fetch event expense breakdown:", error);
        return { success: false, error: "Failed to fetch breakdown" };
    }
}

export async function getEventFinancialsOverTime(eventId: string, period: 'day' | 'week' | 'month' = 'week') {
    try {
        const session = await getSession();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const now = new Date();
        const dataPoints: { date: string; revenue: number; expenses: number }[] = [];

        // Determine buckets based on period
        // Use a simpler approach: fetch raw data and aggregate in JS to avoid complex Prisma queries for now
        let startDate: Date;
        if (period === 'day') startDate = startOfDay(subDays(now, 6));
        else if (period === 'week') startDate = startOfWeek(subWeeks(now, 7));
        else startDate = startOfMonth(subMonths(now, 5));

        const payments = await prisma.payment.findMany({
            where: {
                eventId,
                paymentDate: { gte: startDate },
                status: 'Paid'
            },
            select: { amount: true, paymentDate: true }
        });
        
        const expenses = await prisma.expense.findMany({
            where: {
                eventId,
                date: { gte: startDate }
            },
            select: { amount: true, date: true }
        });

        if (period === 'day') {
             for (let i = 6; i >= 0; i--) {
                const date = subDays(now, i);
                const dayStart = startOfDay(date);
                const dayEnd = new Date(dayStart);
                dayEnd.setDate(dayEnd.getDate() + 1);
                
                const dayRevenue = payments
                    .filter(p => p.paymentDate >= dayStart && p.paymentDate < dayEnd)
                    .reduce((sum, p) => sum + p.amount, 0);
                const dayExpenses = expenses
                    .filter(e => e.date >= dayStart && e.date < dayEnd)
                    .reduce((sum, e) => sum + e.amount, 0);

                dataPoints.push({
                    date: format(date, 'MMM dd'),
                    revenue: dayRevenue,
                    expenses: dayExpenses
                });
             }
        } else if (period === 'week') {
             for(let i=7; i>=0; i--) {
                const date = subWeeks(now, i);
                const weekStart = startOfWeek(date);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 7);
                
                const weekRevenue = payments
                    .filter(p => p.paymentDate >= weekStart && p.paymentDate < weekEnd)
                    .reduce((sum, p) => sum + p.amount, 0);
                const weekExpenses = expenses
                    .filter(e => e.date >= weekStart && e.date < weekEnd)
                    .reduce((sum, e) => sum + e.amount, 0);

                dataPoints.push({
                    date: `Week ${format(weekStart, 'MMM dd')}`,
                    revenue: weekRevenue,
                    expenses: weekExpenses
                });
             }
        } else {
             for(let i=5; i>=0; i--) {
                 const date = subMonths(now, i);
                 const monthStart = startOfMonth(date);
                 const monthEnd = new Date(monthStart);
                 monthEnd.setMonth(monthEnd.getMonth() + 1);

                 const monthRevenue = payments
                    .filter(p => p.paymentDate >= monthStart && p.paymentDate < monthEnd)
                    .reduce((sum, p) => sum + p.amount, 0);
                 const monthExpenses = expenses
                    .filter(e => e.date >= monthStart && e.date < monthEnd)
                    .reduce((sum, e) => sum + e.amount, 0);

                 dataPoints.push({
                     date: format(date, 'MMM yyyy'),
                     revenue: monthRevenue,
                     expenses: monthExpenses
                 });
             }
        }

        return { success: true, data: dataPoints };

    } catch (error) {
        console.error("Failed to fetch event financials:", error);
        // Return empty data instead of crashing
        return { success: true, data: [] };
    }
}
