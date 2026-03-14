'use server'

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { sendNewEventEmail } from '@/lib/email-templates';
import { getSession, getWorkspaceId } from '@/lib/auth';

export async function getEvents() {
  try {
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    const workspaceId = getWorkspaceId(session.user);
    const whereClause: any = {
        createdById: workspaceId
    };

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
          select: { participants: true }
        },
        participants: {
          select: { id: true }
        }
      }
    });

    const globalTotalStudents = await prisma.student.count();
    
    // Correct student count for workspace
    const workspaceTotalStudents = session.user.role === 'superadmin' 
        ? globalTotalStudents 
        : await prisma.student.count({ where: { createdById: workspaceId } });

    // Calculate totals
    const eventsWithStats = events.map(event => {

      // Ensure participant count is consistent with the IDs we use for filtering
      const participantCount = event.participants.length;

      const participantIds = new Set(event.participants.map(p => p.id));
      const studentPayments = new Map<string, number>();

      event.payments.forEach(p => {
          if (p.status === 'Paid' && participantIds.has(p.studentId)) {
              const current = studentPayments.get(p.studentId) || 0;
              studentPayments.set(p.studentId, current + p.amount);
          }
      });

      let fullPaidCount = 0;
      studentPayments.forEach((totalAmount) => {
          // Use a small epsilon for float comparison to handle potential precision issues
          if (totalAmount >= event.cost - 0.01) {
              fullPaidCount++;
          }
      });

      // Cap paid count at participant count to ensure UI consistency
      const finalPaidCount = Math.min(fullPaidCount, participantCount);

      const totalCollected = event.payments
        .filter(p => p.status === 'Paid')
        .reduce((acc, p) => acc + p.amount, 0);

      const expectedCollection = event.cost * participantCount;
      const totalPending = Math.max(0, expectedCollection - totalCollected);
        
      return {
        ...event,
        totalCollected,
        totalPending,
        participantCount,
        paidCount: finalPaidCount,
        pendingCount: Math.max(0, participantCount - finalPaidCount),
        deadline: event.deadline.toISOString(),
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        paymentOptions: JSON.parse(event.paymentOptions),
        participantIds: event.participants.map(p => p.id), 
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
  selectedStudents: string[];
}) {
  try {
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    if (new Date(data.deadline) < new Date(new Date().setHours(0, 0, 0, 0))) {
        return { success: false, error: 'Deadline must be today or in the future' };
    }

    // Generate slug
    let slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    // Ensure uniqueness (simple append if exists - though collisions on create are rare for distinct events, we can append random chars or check)
    // For now, let's just append a short random string if it's very common, or just trust the name + ID suffix strategy if we wanted to be robust. 
    // But user wants "eventname". Let's try name first, and if error, we might fail or handle it. 
    // Ideally, we check for existence.
    const existingSlug = await prisma.event.findUnique({ where: { slug } });
    if (existingSlug) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    const event = await prisma.event.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        cost: data.cost,
        deadline: new Date(data.deadline),
        paymentOptions: JSON.stringify(data.paymentOptions),
        qrCodeUrl: data.qrCodeUrl,
        category: data.category,
        status: 'PUBLISHED',
        createdById: getWorkspaceId(session.user),
        participants: { 
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
    console.error('Error creating event:', error);
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
  selectedStudents?: string[];
}) {
  try {
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

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
  selectedStudents: string[];
}) {
  try {
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

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

    const event = await prisma.event.update({
      where: { id },
      data: {
        name: data.name,
        ...(slug && { slug }), // Only update if new slug generated
        description: data.description,
        cost: data.cost,
        deadline: new Date(data.deadline),
        paymentOptions: JSON.stringify(data.paymentOptions),
        qrCodeUrl: data.qrCodeUrl,
        category: data.category,
        status: 'PUBLISHED', 
        participants: {
             set: data.selectedStudents.map(id => ({ id }))
        }
      },
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

export async function getQrCodes() {
    try {
        const qrCodes = await prisma.qrCode.findMany();
        return { success: true, data: qrCodes };
    } catch (error) {
        console.error('Error fetching QR codes:', error);
        return { success: false, error: 'Failed to fetch QR codes' };
    }
}
