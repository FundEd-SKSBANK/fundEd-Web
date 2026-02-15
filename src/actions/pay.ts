'use server'

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { sendPaymentReceiptEmail } from '@/ai/flows/payment-emails';

export async function getPaymentPageData(slugOrId: string) {
  try {
    const [event, students, payments] = await Promise.all([
      prisma.event.findFirst({ 
        where: { 
            OR: [
                { id: slugOrId },
                { slug: slugOrId }
            ]
        },
        include: { participants: { select: { id: true } } }
      }),
      prisma.student.findMany({ orderBy: { rollNo: 'asc' } }),
      // We need to fetch payments for the event ID once we have the event, 
      // but here we are running in parallel.
      // This is a problem if we don't know the ID yet.
      // We must fetch event FIRST.
      null
    ]);

    if (!event) return { success: false, error: 'Event not found' };
    
    // Now fetch payments for this event
    const realPayments = await prisma.payment.findMany({ where: { eventId: event.id } });

    // Calculate total paid per student
    const studentPaidMap = new Map<string, number>();
    
    realPayments.forEach(p => {
        if (p.status === 'Paid' || p.status === 'Verification Pending') {
            const current = studentPaidMap.get(p.studentId) || 0;
            studentPaidMap.set(p.studentId, current + p.amount);
        }
    });

    // Determine eligible students (participants only, or all if none specified)
    const participantIds = new Set((event as any).participants.map((p: any) => p.id));
    let eligibleStudents = students;

    if (participantIds.size > 0) {
        eligibleStudents = students.filter(s => participantIds.has(s.id));
    }

    // Filter out students who have paid the full cost (or more)
    // And attach the paidAmount to the student object
    const availableStudents = eligibleStudents
        .map(s => ({
            ...s,
            paidAmount: studentPaidMap.get(s.id) || 0
        }))
        .filter(s => s.paidAmount < event.cost);

    return { 
      success: true, 
      data: {
        event: { ...event, deadline: event.deadline.toISOString(), createdAt: event.createdAt.toISOString(), updatedAt: event.updatedAt.toISOString(), paymentOptions: JSON.parse(event.paymentOptions) },
        availableStudents
      }
    };
  } catch (error) {
    console.error('Error fetching payment page data:', error);
    return { success: false, error: 'Failed to fetch data' };
  }
}

export async function createPayment(data: {
  studentId: string;
  eventId: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  status?: string;
  razorpay_order_id?: string;
}) {
  try {
    if (data.amount <= 0) {
        return { success: false, error: "Amount must be greater than 0" };
    }

    const payment = await prisma.payment.create({
      data: {
        studentId: data.studentId,
        eventId: data.eventId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        status: data.status || 'Pending',
        razorpay_order_id: data.razorpay_order_id,
      },
      include: {
        student: true,
        event: true,
      }
    });

    // Send Receipt Email (Async)
    (async () => {
        try {
             // Only send if confirmed 'Paid'
             if (data.status === 'Paid' && payment.student?.email) {
                 const [eventDetails, allPayments] = await Promise.all([
                     prisma.event.findUnique({ where: { id: data.eventId } }),
                     prisma.payment.findMany({
                        where: {
                            eventId: data.eventId,
                            studentId: data.studentId,
                            status: 'Paid' 
                        },
                        select: { amount: true }
                     })
                 ]);
                 
                 if (eventDetails) {
                     const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0); 
                     const balanceDue = Math.max(0, eventDetails.cost - totalPaid);
                     const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'http://localhost:3000';
                     const baseUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;
                     
                     await sendPaymentReceiptEmail({
                        studentName: payment.student.name,
                        studentEmail: payment.student.email,
                        eventName: eventDetails.name,
                        amountPaid: data.amount,
                        transactionId: payment.transactionId || 'N/A',
                        paymentDate: payment.paymentDate.toISOString(),
                        balanceDue: balanceDue,
                        totalCost: eventDetails.cost,
                        checkStatusLink: `${baseUrl}/check-status`
                    });
                 }
             }
        } catch (e) {
            console.error('Error sending receipt email:', e);
        }
    })();

    return { success: true, data: payment };
  } catch (error) {
    console.error('Error creating payment:', error);
    return { success: false, error: 'Failed to create payment' };
  }
}
