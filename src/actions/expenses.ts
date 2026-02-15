'use server'

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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
                recordedBy: session.user.id
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

        const [event, expenses] = await Promise.all([
            prisma.event.findUnique({
                where: { id: eventId },
                include: {
                    payments: {
                        where: { status: 'Paid' }
                    }
                }
            }),
            prisma.expense.findMany({
                where: { eventId }
            })
        ]);

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
