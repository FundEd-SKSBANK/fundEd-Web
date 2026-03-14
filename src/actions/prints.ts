'use server'

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getSession, getWorkspaceId } from '@/lib/auth';

export async function getPrintData() {
  try {
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    const eventWhere: any = { category: 'Print' };
    const studentWhere: any = {};
    if (session.user.role !== 'superadmin') {
        const workspaceId = getWorkspaceId(session.user);
        eventWhere.createdById = workspaceId;
        studentWhere.createdById = workspaceId;
    }

    const events = await prisma.event.findMany({
        where: eventWhere,
        orderBy: { createdAt: 'desc' }
    });
    
    const distributions = await prisma.printDistribution.findMany({
        where: session.user.role !== 'superadmin' ? { event: { createdById: getWorkspaceId(session.user) } } : {},
        include: {
          student: true,
          event: true,
        },
        orderBy: { distributedAt: 'desc' }
    });
    
    const payments = await prisma.payment.findMany({
        where: {
          event: eventWhere,
          status: 'Paid'
        },
        include: {
          student: true,
          event: true,
        }
    });
    
    const students = await prisma.student.findMany({
        where: studentWhere,
        orderBy: { name: 'asc' }
    });

    return {
      success: true,
      data: {
        events: events.map(e => ({
          ...e,
          deadline: e.deadline.toISOString(),
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
        })),
        distributions: distributions.map(d => ({
          ...d,
          studentName: d.student.name,
          studentRoll: d.student.rollNo,
          distributedAt: d.distributedAt.toISOString(),
        })),
        payments: payments.map(p => ({
          ...p,
          paymentDate: p.paymentDate.toISOString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
        students: students.map(s => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
      }
    };
  } catch (error) {
    console.error('Error fetching print data:', error);
    return { success: false, error: 'Failed to fetch print data' };
  }
}

export async function deleteDistribution(id: string) {
  try {
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    const targetDistribution = await prisma.printDistribution.findUnique({
      where: { id },
      include: { event: true }
    });

    if (!targetDistribution) return { success: false, error: "Distribution not found" };

    if (session.user.role !== 'superadmin' && targetDistribution.event.createdById !== getWorkspaceId(session.user)) {
        return { success: false, error: "Unauthorized to delete this distribution" };
    }

    await prisma.printDistribution.delete({
      where: { id },
    });

    revalidatePath('/dashboard/prints');
    return { success: true };
  } catch (error) {
    console.error('Error deleting distribution:', error);
    return { success: false, error: 'Failed to delete distribution' };
  }
}

export async function distributePrint(data: {
  studentId: string;
  eventId: string;
}) {
  try {
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) return { success: false, error: "Event not found" };
    
    if (session.user.role !== 'superadmin' && event.createdById !== getWorkspaceId(session.user)) {
        return { success: false, error: "Unauthorized to distribute for this event" };
    }

    // Check if already distributed
    const existing = await prisma.printDistribution.findFirst({
      where: {
        studentId: data.studentId,
        eventId: data.eventId,
      }
    });

    if (existing) {
      return { success: false, error: 'Print already distributed to this student' };
    }

    const distribution = await prisma.printDistribution.create({
      data: {
        studentId: data.studentId,
        eventId: data.eventId,
      },
      include: {
        student: true,
        event: true,
      }
    });

    revalidatePath('/dashboard/prints');

    return {
      success: true,
      data: {
        ...distribution,
        distributedAt: distribution.distributedAt.toISOString(),
      }
    };
  } catch (error) {
    console.error('Error distributing print:', error);
    return { success: false, error: 'Failed to distribute print' };
  }
}
