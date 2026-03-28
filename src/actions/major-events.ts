'use server'

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getSession, getWorkspaceId } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  sendConnectionRequestEmail,
  sendConnectionApprovedEmail,
  sendConnectionRejectedEmail,
  sendSubEventDisconnectedEmail,
  sendSubEventRemovedEmail,
} from '@/lib/email-templates';

// ─── Token helpers ────────────────────────────────────────────────────────────

function generateTokenString(): string {
  const full = crypto.randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase();
  const short = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `MEVT-${full}-${short}`;
}

function getExpiryDate(expiryHours: number | string): Date {
  const d = new Date();
  if (expiryHours === 999999 || expiryHours === '999999') {
    // Return a date in the far future (year 2100)
    return new Date('2100-01-01T00:00:00Z');
  }
  if (typeof expiryHours === 'string') {
    // If it's a valid number string, treat as hours
    const parsed = parseInt(expiryHours);
    if (!isNaN(parsed)) {
      d.setHours(d.getHours() + parsed);
      return d;
    }
    // Otherwise treat as a custom date string
    return new Date(expiryHours);
  }
  d.setHours(d.getHours() + expiryHours);
  return d;
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'http://localhost:3000';
}

// ─── Generate a new connection token ─────────────────────────────────────────

export async function generateToken(
  eventId: string,
  label: string | undefined,
  expiryHours: number | string
) {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { success: false, error: 'Event not found' };
    if (!(event as any).isMajorEvent) return { success: false, error: 'Not a major event' };
    if (session.user.role !== 'superadmin' && (event as any).createdById !== getWorkspaceId(session.user)) {
      return { success: false, error: 'Unauthorized' };
    }

    const token = generateTokenString();
    const expiresAt = getExpiryDate(expiryHours);

    const record = await (prisma as any).connectionToken.create({
      data: {
        token,
        label: label || null,
        expiresAt,
        eventId,
      },
    });

    revalidatePath(`/dashboard/events/${eventId}/connections`);
    return {
      success: true,
      data: {
        ...record,
        expiresAt: record.expiresAt.toISOString(),
        createdAt: record.createdAt.toISOString(),
        status: new Date() < record.expiresAt ? 'active' : 'expired',
      },
    };
  } catch (error) {
    console.error('Error generating token:', error);
    return { success: false, error: 'Failed to generate token' };
  }
}

// ─── List tokens for a major event ───────────────────────────────────────────

export async function listTokens(eventId: string) {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { success: false, error: 'Event not found' };
    if (session.user.role !== 'superadmin' && (event as any).createdById !== getWorkspaceId(session.user)) {
      return { success: false, error: 'Unauthorized' };
    }

    const tokens = await (prisma as any).connectionToken.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    return {
      success: true,
      data: tokens.map((t: any) => ({
        ...t,
        expiresAt: t.expiresAt.toISOString(),
        createdAt: t.createdAt.toISOString(),
        status: now < t.expiresAt ? 'active' : 'expired',
      })),
    };
  } catch (error) {
    console.error('Error listing tokens:', error);
    return { success: false, error: 'Failed to list tokens' };
  }
}

// ─── Delete a connection token ───────────────────────────────────────────────

export async function deleteToken(tokenId: string) {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const token = await (prisma as any).connectionToken.findUnique({
      where: { id: tokenId },
      include: { event: true, connections: { take: 1 } },
    });

    if (!token) return { success: false, error: 'Token not found' };

    const workspaceId = getWorkspaceId(session.user);
    if (session.user.role !== 'superadmin' && token.event.createdById !== workspaceId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if used
    if (token.connections.length > 0) {
      return { success: false, error: 'Cannot delete a token that is currently in use by connected sub-events.' };
    }

    await (prisma as any).connectionToken.delete({ where: { id: tokenId } });

    revalidatePath(`/dashboard/events/${token.eventId}/connections`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting token:', error);
    return { success: false, error: 'Failed to delete token' };
  }
}

// ─── Get all connections for a major event ────────────────────────────────────

export async function getMajorEventConnections(eventId: string) {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { success: false, error: 'Event not found' };
    if (session.user.role !== 'superadmin' && (event as any).createdById !== getWorkspaceId(session.user)) {
      return { success: false, error: 'Unauthorized' };
    }

    const connections = await (prisma as any).subEventConnection.findMany({
      where: { majorEventId: eventId },
      include: {
        subEvent: {
          include: {
            createdBy: { select: { name: true, email: true } },
            payments: { select: { amount: true, status: true } },
            participants: { select: { id: true } },
            additionalRevenues: { select: { amount: true } },
            printDistributions: { select: { id: true } },
          },
        },
        token: { select: { label: true, token: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = connections.map((c: any) => {
      const payments = c.subEvent.payments || [];
      const participants = c.subEvent.participants || [];
      const paidPayments = payments.filter((p: any) => p.status === 'Paid');
      const totalCollected = paidPayments.reduce((s: number, p: any) => s + p.amount, 0);
      const totalCost = c.subEvent.cost * participants.length;
      const pendingCount = participants.length - paidPayments.length;
      const additionalRevenue = (c.subEvent.additionalRevenues || []).reduce((s: number, r: any) => s + r.amount, 0);

      return {
        id: c.id,
        tokenId: c.tokenId,
        majorEventId: c.majorEventId,
        subEventId: c.subEventId,
        status: c.status,
        disconnectedAt: c.disconnectedAt?.toISOString() || null,
        disconnectedBy: c.disconnectedBy || null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        tokenLabel: c.token?.label || null,
        tokenString: c.token?.token || null,
        subEventName: c.subEvent.name,
        subEventAdminName: c.subEvent.createdBy?.name || 'Unknown',
        subEventAdminEmail: c.subEvent.createdBy?.email || '',
        subEventTotalCollected: totalCollected,
        subEventTotalCost: totalCost,
        subEventParticipantCount: participants.length,
        subEventPendingCount: Math.max(0, pendingCount),
        subEventPendingAmount: Math.max(0, totalCost - totalCollected),
        subEventAdditionalRevenue: additionalRevenue,
        subEventPrintDistributed: c.subEvent.category === 'Print' ? (c.subEvent.printDistributions?.length || 0) : 0,
        subEventPrintTotal: c.subEvent.category === 'Print' ? participants.length : 0,
        subEventCategory: c.subEvent.category,
      };
    });

    return { success: true, data: mapped };
  } catch (error) {
    console.error('Error getting connections:', error);
    return { success: false, error: 'Failed to get connections' };
  }
}

// ─── Connect a sub-event via token ───────────────────────────────────────────

export async function connectSubEvent(tokenStr: string, subEventId: string) {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const workspaceId = getWorkspaceId(session.user);

    // Validate sub-event ownership
    const subEvent = await prisma.event.findUnique({
      where: { id: subEventId },
      include: { createdBy: { select: { name: true, email: true } } },
    });
    if (!subEvent) return { success: false, error: 'Sub-event not found' };
    if (session.user.role !== 'superadmin' && (subEvent as any).createdById !== workspaceId) {
      return { success: false, error: 'Unauthorized' };
    }
    if ((subEvent as any).isMajorEvent) {
      return { success: false, error: 'A Major Event cannot connect to another Major Event' };
    }

    // Check if sub-event already has an active connection
    const existingConn = await (prisma as any).subEventConnection.findFirst({
      where: {
        subEventId,
        status: { in: ['PENDING', 'APPROVED'] },
        disconnectedAt: null,
      },
    });
    if (existingConn) {
      return { success: false, error: 'This event already has an active or pending connection to a Major Event' };
    }

    // Validate token
    const tokenRecord = await (prisma as any).connectionToken.findUnique({
      where: { token: tokenStr },
      include: {
        event: {
          include: { createdBy: { select: { name: true, email: true } } },
        },
      },
    });
    if (!tokenRecord) return { success: false, error: 'Invalid token — check the connection string and try again' };
    if (new Date() > tokenRecord.expiresAt) {
      return { success: false, error: 'Token expired — ask the event creator for a new one' };
    }

    // Prevent connecting to itself
    if (tokenRecord.eventId === subEventId) {
      return { success: false, error: 'An event cannot connect to itself' };
    }

    // Create connection
    const connection = await (prisma as any).subEventConnection.create({
      data: {
        tokenId: tokenRecord.id,
        majorEventId: tokenRecord.eventId,
        subEventId,
        status: 'PENDING',
      },
    });

    // Send email to Major Event admin
    const headerList = await headers();
    const host = headerList.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const appUrl = `${protocol}://${host}`;

    if (tokenRecord.event.createdBy?.email) {
      const approveUrl = `${appUrl}/dashboard/events/${tokenRecord.eventId}/connections`;
      sendConnectionRequestEmail({
        adminEmail: tokenRecord.event.createdBy.email,
        adminName: tokenRecord.event.createdBy.name || 'Admin',
        majorEventName: tokenRecord.event.name,
        subEventName: subEvent.name,
        requesterName: (subEvent as any).createdBy?.name || session.user.name || 'Unknown',
        manageUrl: approveUrl,
      }).catch(console.error);
    }

    revalidatePath('/dashboard/events');
    revalidatePath(`/dashboard/events/${subEventId}`);
    revalidatePath(`/dashboard/events/${tokenRecord.eventId}/connections`);

    return {
      success: true,
      data: {
        connectionId: connection.id,
        majorEventName: tokenRecord.event.name,
        majorEventId: tokenRecord.eventId,
      },
    };
  } catch (error) {
    console.error('Error connecting sub-event:', error);
    return { success: false, error: 'Failed to connect to Major Event' };
  }
}

// ─── Approve a connection request ─────────────────────────────────────────────

export async function approveConnection(connectionId: string) {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const conn = await (prisma as any).subEventConnection.findUnique({
      where: { id: connectionId },
      include: {
        majorEvent: { include: { createdBy: { select: { name: true, email: true } } } },
        subEvent: { include: { createdBy: { select: { name: true, email: true } } } },
      },
    });
    if (!conn) return { success: false, error: 'Connection not found' };

    // Auth: must be major event admin
    const workspaceId = getWorkspaceId(session.user);
    if (session.user.role !== 'superadmin' && conn.majorEvent.createdById !== workspaceId) {
      return { success: false, error: 'Unauthorized' };
    }

    await (prisma as any).subEventConnection.update({
      where: { id: connectionId },
      data: { status: 'APPROVED' },
    });

    // Notify sub-event admin
    if (conn.subEvent.createdBy?.email) {
      const appUrl = getAppUrl();
      sendConnectionApprovedEmail({
        adminEmail: conn.subEvent.createdBy.email,
        adminName: conn.subEvent.createdBy.name || 'Admin',
        subEventName: conn.subEvent.name,
        majorEventName: conn.majorEvent.name,
        dashboardUrl: `${appUrl}/dashboard/events`,
      }).catch(console.error);
    }

    revalidatePath(`/dashboard/events/${conn.majorEventId}/connections`);
    revalidatePath('/dashboard/events');
    return { success: true };
  } catch (error) {
    console.error('Error approving connection:', error);
    return { success: false, error: 'Failed to approve connection' };
  }
}

// ─── Reject a connection request ──────────────────────────────────────────────

export async function rejectConnection(connectionId: string) {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const conn = await (prisma as any).subEventConnection.findUnique({
      where: { id: connectionId },
      include: {
        majorEvent: true,
        subEvent: { include: { createdBy: { select: { name: true, email: true } } } },
      },
    });
    if (!conn) return { success: false, error: 'Connection not found' };

    const workspaceId = getWorkspaceId(session.user);
    if (session.user.role !== 'superadmin' && conn.majorEvent.createdById !== workspaceId) {
      return { success: false, error: 'Unauthorized' };
    }

    await (prisma as any).subEventConnection.update({
      where: { id: connectionId },
      data: { status: 'REJECTED' },
    });

    if (conn.subEvent.createdBy?.email) {
      const appUrl = getAppUrl();
      sendConnectionRejectedEmail({
        adminEmail: conn.subEvent.createdBy.email,
        adminName: conn.subEvent.createdBy.name || 'Admin',
        subEventName: conn.subEvent.name,
        majorEventName: conn.majorEvent.name,
        dashboardUrl: `${appUrl}/dashboard/events`,
      }).catch(console.error);
    }

    revalidatePath(`/dashboard/events/${conn.majorEventId}/connections`);
    revalidatePath('/dashboard/events');
    return { success: true };
  } catch (error) {
    console.error('Error rejecting connection:', error);
    return { success: false, error: 'Failed to reject connection' };
  }
}

// ─── Sub-admin disconnects from major event ───────────────────────────────────

export async function disconnectSubEvent(connectionId: string) {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const conn = await (prisma as any).subEventConnection.findUnique({
      where: { id: connectionId },
      include: {
        majorEvent: { include: { createdBy: { select: { name: true, email: true } } } },
        subEvent: { include: { createdBy: { select: { name: true, email: true } } } },
      },
    });
    if (!conn) return { success: false, error: 'Connection not found' };

    const workspaceId = getWorkspaceId(session.user);
    if (session.user.role !== 'superadmin' && conn.subEvent.createdById !== workspaceId) {
      return { success: false, error: 'Unauthorized' };
    }

    await (prisma as any).subEventConnection.update({
      where: { id: connectionId },
      data: {
        status: 'APPROVED', // keep status, just mark disconnected
        disconnectedAt: new Date(),
        disconnectedBy: 'SUB_ADMIN',
      },
    });

    // Notify major event admin
    if (conn.majorEvent.createdBy?.email) {
      const appUrl = getAppUrl();
      sendSubEventDisconnectedEmail({
        adminEmail: conn.majorEvent.createdBy.email,
        adminName: conn.majorEvent.createdBy.name || 'Admin',
        subEventName: conn.subEvent.name,
        majorEventName: conn.majorEvent.name,
        subAdminName: conn.subEvent.createdBy?.name || 'Unknown',
        manageUrl: `${appUrl}/dashboard/events/${conn.majorEventId}/connections`,
      }).catch(console.error);
    }

    revalidatePath('/dashboard/events');
    revalidatePath(`/dashboard/events/${conn.majorEventId}/connections`);
    return { success: true };
  } catch (error) {
    console.error('Error disconnecting sub-event:', error);
    return { success: false, error: 'Failed to disconnect' };
  }
}

// ─── Major admin removes a sub-event ─────────────────────────────────────────

export async function removeMajorConnection(connectionId: string) {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const conn = await (prisma as any).subEventConnection.findUnique({
      where: { id: connectionId },
      include: {
        majorEvent: { include: { createdBy: { select: { name: true, email: true } } } },
        subEvent: { include: { createdBy: { select: { name: true, email: true } } } },
      },
    });
    if (!conn) return { success: false, error: 'Connection not found' };

    const workspaceId = getWorkspaceId(session.user);
    if (session.user.role !== 'superadmin' && conn.majorEvent.createdById !== workspaceId) {
      return { success: false, error: 'Unauthorized' };
    }

    await (prisma as any).subEventConnection.update({
      where: { id: connectionId },
      data: {
        disconnectedAt: new Date(),
        disconnectedBy: 'MAJOR_ADMIN',
      },
    });

    // Notify sub-event admin
    if (conn.subEvent.createdBy?.email) {
      const appUrl = getAppUrl();
      sendSubEventRemovedEmail({
        adminEmail: conn.subEvent.createdBy.email,
        adminName: conn.subEvent.createdBy.name || 'Admin',
        subEventName: conn.subEvent.name,
        majorEventName: conn.majorEvent.name,
        dashboardUrl: `${appUrl}/dashboard/events`,
      }).catch(console.error);
    }

    revalidatePath(`/dashboard/events/${conn.majorEventId}/connections`);
    revalidatePath('/dashboard/events');
    return { success: true };
  } catch (error) {
    console.error('Error removing connection:', error);
    return { success: false, error: 'Failed to remove connection' };
  }
}

// ─── Analytics for a major event ─────────────────────────────────────────────

export async function getMajorEventAnalytics(eventId: string) {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { success: false, error: 'Event not found' };

    const workspaceId = getWorkspaceId(session.user);
    const isMajorEventOwner = session.user.role === 'superadmin' || (event as any).createdById === workspaceId;

    if (!isMajorEventOwner) {
      // Also allow sub-event admins who have an approved connection to see the hub
      const approvedConn = await (prisma as any).subEventConnection.findFirst({
        where: {
          majorEventId: eventId,
          status: 'APPROVED',
          disconnectedAt: null,
          subEvent: { createdById: workspaceId },
        },
      });
      if (!approvedConn) return { success: false, error: 'Unauthorized' };
    }

    const connections = await (prisma as any).subEventConnection.findMany({
      where: {
        majorEventId: eventId,
        status: 'APPROVED',
        disconnectedAt: null,
      },
      include: {
        subEvent: {
          include: {
            createdBy: { select: { name: true, email: true } },
            payments: { select: { amount: true, status: true, studentId: true } },
            participants: { select: { id: true, name: true, rollNo: true } },
            additionalRevenues: { select: { amount: true } },
            printDistributions: { select: { id: true } },
          },
        },
        token: { select: { label: true } },
      },
    });

    let totalCollected = 0;
    let totalPending = 0;
    let totalAdditionalRevenue = 0;
    let totalStudents = 0;

    const subEvents = connections.map((c: any) => {
      const payments = c.subEvent.payments || [];
      const participants = c.subEvent.participants || [];
      const paidPayments = payments.filter((p: any) => p.status === 'Paid');
      const collected = paidPayments.reduce((s: number, p: any) => s + p.amount, 0);
      const costPerStudent = c.subEvent.cost;
      const expectedTotal = costPerStudent * participants.length;
      const pending = Math.max(0, expectedTotal - collected);
      const addRevenue = (c.subEvent.additionalRevenues || []).reduce((s: number, r: any) => s + r.amount, 0);

      // Identify students who haven't paid
      const paidStudentIds = new Set(paidPayments.map((p: any) => p.studentId));
      const pendingStudents = participants
        .filter((p: any) => !paidStudentIds.has(p.id))
        .map((p: any) => ({
          id: p.id,
          name: p.name || 'Unknown',
          rollNo: p.rollNo || 'N/A',
          amountDue: costPerStudent
        }));

      totalCollected += collected;
      totalPending += pending;
      totalAdditionalRevenue += addRevenue;
      totalStudents += participants.length;

      return {
        id: c.id,
        tokenId: c.tokenId,
        majorEventId: c.majorEventId,
        subEventId: c.subEventId,
        status: c.status,
        disconnectedAt: null,
        disconnectedBy: null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        subEventName: c.subEvent.name,
        subEventAdminName: c.subEvent.createdBy?.name || 'Unknown',
        subEventAdminEmail: c.subEvent.createdBy?.email || '',
        subEventTotalCollected: collected,
        subEventTotalCost: expectedTotal,
        subEventParticipantCount: participants.length,
        subEventPendingCount: Math.max(0, participants.length - paidPayments.length),
        subEventPendingAmount: pending,
        subEventAdditionalRevenue: addRevenue,
        subEventPrintDistributed: c.subEvent.category === 'Print' ? (c.subEvent.printDistributions?.length || 0) : 0,
        subEventPrintTotal: c.subEvent.category === 'Print' ? participants.length : 0,
        subEventCategory: c.subEvent.category,
        subEventPendingStudents: pendingStudents,
        tokenLabel: c.token?.label || null,
      };
    });
    const majorRevenues = await prisma.additionalRevenue.findMany({ where: { eventId } });
    const majorRevenueTotal = majorRevenues.reduce((s: number, r: any) => s + r.amount, 0);

    totalAdditionalRevenue += majorRevenueTotal;
    const grandTotal = totalCollected + totalAdditionalRevenue;
    return {
      success: true,
      data: {
        totalCollected,
        totalPending,
        totalAdditionalRevenue,
        grandTotal,
        totalStudents,
        connectedSubEventsCount: connections.length,
        fundBreakdown: {
          studentCollections: totalCollected + totalPending,
          additionalRevenue: totalAdditionalRevenue,
          grandTotal: totalCollected + totalPending + totalAdditionalRevenue,
        },
        subEvents,
      },
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    return { success: false, error: 'Failed to get analytics' };
  }
}

// ─── Get a sub-event's active connection (for card badge) ─────────────────────

export async function getSubEventConnection(subEventId: string) {
  try {
    const conn = await (prisma as any).subEventConnection.findFirst({
      where: {
        subEventId,
        status: { in: ['PENDING', 'APPROVED'] },
        disconnectedAt: null,
      },
      include: {
        majorEvent: { select: { name: true, id: true } },
      },
    });

    if (!conn) return { success: true, data: null };

    return {
      success: true,
      data: {
        id: conn.id,
        status: conn.status,
        majorEventName: conn.majorEvent.name,
        majorEventId: conn.majorEvent.id,
      },
    };
  } catch (error) {
    console.error('Error getting sub-event connection:', error);
    return { success: false, error: 'Failed to get connection' };
  }
}

// ─── Get payments for a sub-event (read-only, for major-event admin) ──────────

export async function getSubEventPaymentsReadOnly(subEventId: string, requestingMajorEventId: string) {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    // Verify: requesting user must be major event admin
    const majorEvent = await prisma.event.findUnique({ where: { id: requestingMajorEventId } });
    if (!majorEvent) return { success: false, error: 'Major Event not found' };
    if (session.user.role !== 'superadmin' && (majorEvent as any).createdById !== getWorkspaceId(session.user)) {
      // Also allow if the user is the owner of the sub-event being requested
      const subEvent = await prisma.event.findUnique({ where: { id: subEventId } });
      if (!subEvent || (subEvent as any).createdById !== getWorkspaceId(session.user)) {
        return { success: false, error: 'Unauthorized' };
      }
    }

    // Verify there is an approved connection
    const conn = await (prisma as any).subEventConnection.findFirst({
      where: {
        majorEventId: requestingMajorEventId,
        subEventId,
        status: 'APPROVED',
        disconnectedAt: null,
      },
    });
    if (!conn) return { success: false, error: 'No approved connection found' };

    const payments = await prisma.payment.findMany({
      where: { eventId: subEventId },
      include: { student: true, event: true },
      orderBy: { paymentDate: 'desc' },
    });

    const mapped = payments.map(p => ({
      id: p.id,
      studentId: p.studentId,
      studentName: p.student.name,
      studentRoll: p.student.rollNo,
      eventId: p.eventId,
      eventName: p.event.name,
      amount: p.amount,
      paymentDate: p.paymentDate.toISOString(),
      transactionId: p.transactionId || '',
      status: p.status,
      paymentMethod: p.paymentMethod,
      screenshotUrl: p.screenshotUrl || undefined,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return { success: true, data: mapped };
  } catch (error) {
    console.error('Error getting sub-event payments:', error);
    return { success: false, error: 'Failed to get payments' };
  }
}

// ─── Generate major event PDF report data ────────────────────────────────────

export async function generateMajorEventReport(eventId: string) {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        createdBy: { select: { name: true, email: true } },
        expenses: true,
      },
    });
    if (!event) return { success: false, error: 'Event not found' };
    if (session.user.role !== 'superadmin' && (event as any).createdById !== getWorkspaceId(session.user)) {
      return { success: false, error: 'Unauthorized' };
    }

    const analyticsResult = await getMajorEventAnalytics(eventId);
    if (!analyticsResult.success) return analyticsResult;

    const analytics = analyticsResult.data!;
    const totalExpenses = event.expenses.reduce((s: number, e: any) => s + e.amount, 0);

    return {
      success: true,
      data: {
        event: {
          id: event.id,
          name: event.name,
          description: event.description,
          creatorName: (event as any).createdBy?.name || 'Unknown',
          createdAt: event.createdAt.toISOString(),
          deadline: event.deadline.toISOString(),
        },
        analytics,
        expenses: event.expenses.map((e: any) => ({
          title: e.title,
          amount: e.amount,
          category: e.category,
          date: e.date.toISOString(),
          note: e.note || '',
          billUrl: e.billUrl || '',
        })),
        totalExpenses,
      },
    };
  } catch (error) {
    console.error('Error generating major event report:', error);
    return { success: false, error: 'Failed to generate report' };
  }
}
