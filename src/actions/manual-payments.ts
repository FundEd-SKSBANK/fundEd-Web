'use server'

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { sendPaymentReceiptEmail } from '@/lib/email-templates';

export async function recordCashPayment(data: {
  studentId: string;
  eventId: string;
  amount: number;
  paymentDate: string;
  notes?: string;
  receiptNumber?: string;
}) {
  try {
    // Get current user session for audit trail
    const session = await getSession();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    if (data.amount <= 0) {
        return { success: false, error: "Amount must be greater than 0" };
    }

    // Validate student and event exist
    const [student, event] = await Promise.all([
      prisma.student.findUnique({ where: { id: data.studentId } }),
      prisma.event.findUnique({ where: { id: data.eventId } })
    ]);

    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    // Check if payment already exists (Full payment check? Or duplicate?)
    // Note: A student can pay in installments. This check prevents duplicate "Paid" status if intended to be unique?
    // The previous logic was: findFirst where status = 'Paid'. 
    // If strict on single payment, this blocks installments. 
    // Assuming we want to allow installments, we might remove this or refine it.
    // However, keeping legacy behavior for now: Block if strictly duplicate? 
    // Let's assume we want to RECORD it.
    // Wait, previous code BLOCKED if existing 'Paid' found. I will preserve that behavior.
    const existingPayment = await prisma.payment.findFirst({
      where: {
        studentId: data.studentId,
        eventId: data.eventId,
        status: 'Paid'
      }
    });

    if (existingPayment) {
      return { success: false, error: 'Payment already recorded for this student and event' };
    }
    
    // Create manual payment entry
    const payment = await prisma.payment.create({
      data: {
        studentId: data.studentId,
        eventId: data.eventId,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        status: 'Paid',
        paymentMethod: 'Cash',
        transactionId: `CASH_${Date.now()}`,
        isManualEntry: true,
        recordedBy: session.userId,
        manualEntryNotes: data.notes,
        receiptNumber: data.receiptNumber,
      },
      include: {
        student: true,
        event: true,
      }
    });

    // Send Payment Receipt Email
    (async () => {
        try {
            // Calculate total paid including this one
            const allPayments = await prisma.payment.findMany({
                where: {
                    eventId: data.eventId,
                    studentId: data.studentId,
                    status: 'Paid'
                },
                select: { amount: true }
            });

            const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
            const balanceDue = Math.max(0, event.cost - totalPaid);
            const headerList = await headers();
            const host = headerList.get('host');
            const protocol = host?.includes('localhost') ? 'http' : 'https';
            const appUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'http://localhost:3000');
            const baseUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;

            if (student.email) {
                await sendPaymentReceiptEmail({
                    studentName: student.name,
                    studentEmail: student.email,
                    eventName: event.name,
                    amountPaid: data.amount,
                    transactionId: payment.transactionId || 'N/A',
                    paymentDate: payment.paymentDate.toISOString(),
                    balanceDue: balanceDue,
                    totalCost: event.cost,
                    checkStatusLink: `${baseUrl}/check-status`
                });
            }
        } catch (emailError) {
            console.error('Failed to send payment receipt:', emailError);
        }
    })();

    revalidatePath('/dashboard/events');
    revalidatePath('/dashboard/students');
    revalidatePath(`/dashboard/events/${data.eventId}/payments`);

    return { 
      success: true, 
      data: {
        ...payment,
        paymentDate: payment.paymentDate.toISOString(),
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
      }
    };
  } catch (error) {
    console.error('Error recording cash payment:', error);
    return { success: false, error: 'Failed to record payment' };
  }
}

export async function getManualPayments() {
  try {
    const payments = await prisma.payment.findMany({
      where: { isManualEntry: true },
      include: {
        student: true,
        event: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      data: payments.map(p => ({
        ...p,
        paymentDate: p.paymentDate.toISOString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))
    };
  } catch (error) {
    console.error('Error fetching manual payments:', error);
    return { success: false, error: 'Failed to fetch manual payments' };
  }
}
