'use server'

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getPaymentPageData(eventId: string) {
  try {
    const [event, students, payments] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.student.findMany({ orderBy: { rollNo: 'asc' } }),
      prisma.payment.findMany({ where: { eventId } })
    ]);

    if (!event) return { success: false, error: 'Event not found' };

    // Calculate total paid per student
    const studentPaidMap = new Map<string, number>();
    
    payments.forEach(p => {
        if (p.status === 'Paid' || p.status === 'Verification Pending') {
            const current = studentPaidMap.get(p.studentId) || 0;
            studentPaidMap.set(p.studentId, current + p.amount);
        }
    });

    // Filter out students who have paid the full cost (or more)
    // And attach the paidAmount to the student object
    const availableStudents = students
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

    return { success: true, data: payment };
  } catch (error) {
    console.error('Error creating payment:', error);
    return { success: false, error: 'Failed to create payment' };
  }
}
