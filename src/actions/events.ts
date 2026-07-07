'use server'

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { sendNewEventEmail } from '@/lib/email-templates';
import { getSession, getWorkspaceId } from '@/lib/auth';
import { getMyVisibleEventIds } from '@/actions/users';


export async function getEvents() {
  try {
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    const workspaceId = getWorkspaceId(session.user);

    let whereClause: any;
    if (session.user.role === 'superadmin') {
      whereClause = {};
    } else if (session.user.role === 'collab') {
      // Collab users only see explicitly granted events
      const { eventIds } = await getMyVisibleEventIds();
      whereClause = { createdById: workspaceId, id: { in: eventIds } };
    } else {
      whereClause = { createdById: workspaceId };
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        payments: {
          select: {
            amount: true,
            status: true,
            studentId: true,
          }
        },
        _count: {
          select: { 
            participants: true,
            subEventConns: {
              where: { status: 'APPROVED', disconnectedAt: null }
            }
          }
        },
        subEventConns: {
          where: { status: 'APPROVED', disconnectedAt: null },
          include: {
            subEvent: {
              select: {
                id: true,
                cost: true,
                _count: { select: { participants: true } },
                participants: { select: { id: true } }, // Keep for fullPaidCount logic for now, but count is faster
                payments: { select: { amount: true, status: true, studentId: true } }
              }
            }
          }
        },
        participants: {
          select: { id: true }
        },
        majorEventConn: {
          where: {
            status: { in: ['PENDING', 'APPROVED'] },
            disconnectedAt: null,
          },
          include: {
            majorEvent: { select: { name: true, id: true } },
          },
          take: 1,
        },
      } as any,
    });

    const globalTotalStudents = await prisma.student.count();
    
    // Correct student count for workspace
    const workspaceTotalStudents = session.user.role === 'superadmin' 
        ? globalTotalStudents 
        : await prisma.student.count({ where: { createdById: workspaceId } });

    // Calculate totals
    const eventsWithStats = events.map(event => {

      let participantCount = 0;
      let finalPaidCount = 0;
      let totalCollected = 0;
      let totalPending = 0;

      const isMajor = (event as any).isMajorEvent || false;

      if (isMajor) {
          const conns = (event as any).subEventConns || [];
          conns.forEach((c: any) => {
              const subEvent = c.subEvent;
              if (!subEvent) return;
              
              const sCount = subEvent.participants.length;
              const sIds = new Set(subEvent.participants.map((p: any) => p.id));
              const sPayments = new Map<string, number>();

              (subEvent.payments || []).forEach((p: any) => {
                  if (p.status === 'Paid' && sIds.has(p.studentId)) {
                      sPayments.set(p.studentId, (sPayments.get(p.studentId) || 0) + p.amount);
                  }
              });

              let sPaidCount = 0;
              sPayments.forEach((amt) => {
                  if (amt >= subEvent.cost - 0.01) sPaidCount++;
              });
              
              const sCollected = (subEvent.payments || [])
                  .filter((p: any) => p.status === 'Paid')
                  .reduce((acc: number, p: any) => acc + p.amount, 0);

              totalCollected += sCollected;
              totalPending += Math.max(0, (subEvent.cost * sCount) - sCollected);
              participantCount += sCount;
              finalPaidCount += Math.min(sPaidCount, sCount);
          });
      } else {
          participantCount = (event as any).participants.length;
          const participantIds = new Set((event as any).participants.map((p: any) => p.id));
          const studentPayments = new Map<string, number>();

          const payments = (event as any).payments || [];
          payments.forEach((p: any) => {
              if (p.status === 'Paid' && participantIds.has(p.studentId)) {
                  studentPayments.set(p.studentId, (studentPayments.get(p.studentId) || 0) + p.amount);
              }
          });

          let fullPaidCount = 0;
          studentPayments.forEach((totalAmount) => {
              if (totalAmount >= event.cost - 0.01) fullPaidCount++;
          });

          finalPaidCount = Math.min(fullPaidCount, participantCount);
          totalCollected = payments
            .filter((p: any) => p.status === 'Paid')
            .reduce((acc: number, p: any) => acc + p.amount, 0);
          totalPending = Math.max(0, (event.cost * participantCount) - totalCollected);
      }
        
      const connRecord = (event as any).majorEventConn?.[0] || null;
      const activeConnection = connRecord ? {
        id: connRecord.id,
        status: connRecord.status,
        majorEventName: connRecord.majorEvent?.name || '',
        majorEventId: connRecord.majorEvent?.id || '',
      } : null;

      return {
        ...event,
        isMajorEvent: isMajor,
        totalCollected,
        totalPending,
        participantCount,
        paidCount: finalPaidCount,
        pendingCount: Math.max(0, participantCount - finalPaidCount),
        subEventCount: (event as any)._count?.subEventConns || 0,
        deadline: event.deadline.toISOString(),
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        paymentOptions: JSON.parse(event.paymentOptions),
        participantIds: event.participants.map(p => p.id),
        activeConnection,
      };

    });

    return { success: true, data: eventsWithStats };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { success: false, error: 'Failed to fetch events' };
  }
}

export async function createEvent(data: {
  name: string;
  description: string;
  cost: number;
  deadline: string;
  paymentOptions: string[];
  qrCodeUrl?: string;
  category: string;
  semester?: string;
  className?: string;
  year?: string;
  selectedStudents: string[];
  isMajorEvent?: boolean;
}) {
  try {
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };
    if (session.user.role === 'collab') return { success: false, error: "Unauthorized" };

    if (new Date(data.deadline) < new Date(new Date().setHours(0, 0, 0, 0))) {
        return { success: false, error: 'Deadline must be today or in the future' };
    }

    // Generate slug
    let slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existingSlug = await prisma.event.findUnique({ where: { slug } });
    if (existingSlug) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    const event = await prisma.event.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        cost: data.isMajorEvent ? 0 : data.cost,
        deadline: new Date(data.deadline),
        paymentOptions: data.isMajorEvent ? JSON.stringify([]) : JSON.stringify(data.paymentOptions),
        qrCodeUrl: data.isMajorEvent ? null : data.qrCodeUrl,
        category: data.category,
        semester: data.semester,
        className: data.className,
        year: data.year,
        isMajorEvent: data.isMajorEvent || false,
        status: 'PUBLISHED',
        createdById: getWorkspaceId(session.user),
        participants: data.isMajorEvent ? undefined : {
             connect: data.selectedStudents.map(id => ({ id }))
        }
      } as any,
    });

    // Send notifications
    if (data.selectedStudents.length > 0) {
        const students = await prisma.student.findMany({
            where: { id: { in: data.selectedStudents } },
            select: { name: true, email: true }
        });

        const headerList = await headers();
        const host = headerList.get('host');
        const protocol = host?.includes('localhost') ? 'http' : 'https';
        const appUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'http://localhost:3000');
        const baseUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;

        Promise.allSettled(students.map(student => {
            if (!student.email) return Promise.resolve();
            return sendNewEventEmail({
                studentName: student.name,
                studentEmail: student.email,
                eventName: event.name,
                eventDescription: event.description,
                cost: event.cost,
                deadline: event.deadline.toISOString(),
                // Updated link format
                paymentLink: `${baseUrl}/${event.slug}/pay`
            });
        })).then(results => {
            const rejected = results.filter(r => r.status === 'rejected');
            if (rejected.length > 0) console.error(`Failed to send ${rejected.length} new event emails`);
        });
    }

    revalidatePath('/dashboard/events');
    return { success: true, data: event };
  } catch (error) {
    console.error('>>> createEvent ERROR:', error);
    return { success: false, error: 'Failed to create event' };
  }
}

export async function getEventBySlug(slug: string) {
    try {
        const event = await prisma.event.findUnique({
            where: { slug },
            include: {
                participants: { select: { id: true } }
            }
        });
        
        if (!event) return { success: false, error: "Event not found" };

        return { 
            success: true, 
            data: {
                ...event,
                paymentOptions: JSON.parse(event.paymentOptions),
                deadline: event.deadline.toISOString(),
                createdAt: event.createdAt.toISOString(),
                updatedAt: event.updatedAt.toISOString(),
            }
        };
    } catch (error) {
        console.error("Error fetching event by slug:", error);
        return { success: false, error: "Failed to fetch event" };
    }
}

export async function saveDraft(data: {
  id?: string;
  name?: string;
  description?: string;
  cost?: number;
  deadline?: string;
  paymentOptions?: string[];
  qrCodeUrl?: string;
  category?: string;
  semester?: string;
  className?: string;
  year?: string;
  selectedStudents?: string[];
}) {
  try {
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };
    if (session.user.role === 'collab') return { success: false, error: "Unauthorized" };

    const eventData: any = {
      status: 'DRAFT',
    };

    if (data.name) eventData.name = data.name;
    if (data.description) eventData.description = data.description;
    if (data.cost !== undefined) eventData.cost = data.cost;
    if (data.deadline) {
        if (new Date(data.deadline) < new Date(new Date().setHours(0, 0, 0, 0))) {
            return { success: false, error: 'Deadline must be today or in the future' };
        }
        eventData.deadline = new Date(data.deadline);
    }
    if (data.paymentOptions) eventData.paymentOptions = JSON.stringify(data.paymentOptions);
    if (data.qrCodeUrl !== undefined) eventData.qrCodeUrl = data.qrCodeUrl;
    if (data.category) eventData.category = data.category;
    if (data.semester !== undefined) eventData.semester = data.semester;
    if (data.className !== undefined) eventData.className = data.className;
    if (data.year !== undefined) eventData.year = data.year;
    
    let event;
    if (data.id) {
      // Verify ownership
      const existing = await prisma.event.findUnique({ where: { id: data.id }});
      if (!existing) return { success: false, error: "Event not found" };
      if (session.user.role !== 'superadmin' && (existing as any).createdById !== getWorkspaceId(session.user)) {
          return { success: false, error: "Unauthorized" };
      }

      if (data.selectedStudents) {
        eventData.participants = {
          set: data.selectedStudents.map(id => ({ id }))
        };
      }
      event = await prisma.event.update({
        where: { id: data.id },
        data: eventData,
      });
    } else {
      eventData.createdById = getWorkspaceId(session.user);
      if (data.selectedStudents) {
        eventData.participants = {
          connect: data.selectedStudents.map(id => ({ id }))
        };
      }
      event = await prisma.event.create({
        data: eventData as any,
      });
    }

    revalidatePath('/dashboard/events');
    return { success: true, data: event };
  } catch (error) {
    console.error('Error saving draft:', error);
    return { success: false, error: `Failed to save draft: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function updateEvent(id: string, data: {
  name: string;
  description: string;
  cost: number;
  deadline: string;
  paymentOptions: string[];
  qrCodeUrl?: string;
  category: string;
  semester?: string;
  className?: string;
  year?: string;
  selectedStudents: string[];
  isMajorEvent?: boolean;
}) {
  try {
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };
    if (session.user.role === 'collab') return { success: false, error: "Unauthorized" };

    // Verify ownership
    const existing = await prisma.event.findUnique({ where: { id }});
    if (!existing) return { success: false, error: "Event not found" };
    if (session.user.role !== 'superadmin' && (existing as any).createdById !== getWorkspaceId(session.user)) {
        return { success: false, error: "Unauthorized" };
    }

    if (new Date(data.deadline) < new Date(new Date().setHours(0, 0, 0, 0))) {
        return { success: false, error: 'Deadline must be today or in the future' };
    }

    // Generate slug if name changed or if it creates a conflict? 
    // For simplicity in this iteration, let's update slug if name is updated, 
    // but we need to check uniqueness.
    let slug = undefined;
    if (data.name !== existing.name) {
        slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const conflict = await prisma.event.findUnique({ where: { slug } });
        if (conflict && conflict.id !== id) {
             slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
        }
    }

    const isMajorEvent = data.isMajorEvent ?? (existing as any).isMajorEvent ?? false;
    const event = await prisma.event.update({
      where: { id },
      data: {
        name: data.name,
        ...(slug && { slug }),
        description: data.description,
        cost: isMajorEvent ? 0 : data.cost,
        deadline: new Date(data.deadline),
        paymentOptions: isMajorEvent ? JSON.stringify([]) : JSON.stringify(data.paymentOptions),
        qrCodeUrl: isMajorEvent ? null : data.qrCodeUrl,
        category: data.category,
        semester: data.semester,
        className: data.className,
        year: data.year,
        isMajorEvent,
        status: 'PUBLISHED',
        participants: isMajorEvent ? undefined : {
             set: data.selectedStudents.map(id => ({ id }))
        }
      } as any,
    });
    revalidatePath('/dashboard/events');
    return { success: true, data: event };
  } catch (error) {
    console.error('Error updating event:', error);
    return { success: false, error: 'Failed to update event' };
  }
}

export async function deleteEvent(id: string) {
  try {
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };
    if (session.user.role === 'collab') return { success: false, error: "Unauthorized" };

    const existing = await prisma.event.findUnique({ where: { id }});
    if (!existing) return { success: false, error: "Event not found" };
    if (session.user.role !== 'superadmin' && (existing as any).createdById !== getWorkspaceId(session.user)) {
        return { success: false, error: "Unauthorized" };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete payments
      await tx.payment.deleteMany({
        where: { eventId: id }
      });

      // 2. Delete print distributions
      await tx.printDistribution.deleteMany({
        where: { eventId: id }
      });

      // 3. Delete the event
      await tx.event.delete({
        where: { id },
      });
    });

    revalidatePath('/dashboard/events');
    return { success: true };
  } catch (error) {
    console.error('Error deleting event:', error);
    return { success: false, error: 'Failed to delete event. Please check if there are unrelated records linked.' };
  }
}


