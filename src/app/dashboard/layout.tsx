import DashboardClientLayout from './client-layout';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getEvents } from '@/actions/events';
import { getPendingTransactions, getUserNotifications } from '@/actions/notifications';

async function getUser() {
  const session = await getSession();
  if (!session || !session.user || !session.user.id) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, role: true, image: true }
    });

    if (user?.email === 'super@funded.com' && user?.role === 'admin') {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'superadmin' },
        select: { id: true, name: true, email: true, role: true, image: true }
      });
      return updatedUser;
    }

    return user;
  } catch (error) {
    console.error('Error fetching user for dashboard layout:', error);
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const isSuperUser = user?.role === 'superadmin';

  const [eventsRes, pendingRes, notificationsRes] = await Promise.all([
    getEvents(),
    !isSuperUser ? getPendingTransactions() : Promise.resolve({ success: true, data: [] }),
    isSuperUser ? getUserNotifications() : Promise.resolve({ success: true, data: [] })
  ]);

  const initialEvents = eventsRes.success && eventsRes.data ? (eventsRes.data as any[]).map(e => ({ id: e.id, name: e.name })) : [];
  const initialPending = pendingRes.success && pendingRes.data ? pendingRes.data : [];
  const initialNotifications = notificationsRes.success && notificationsRes.data ? notificationsRes.data : [];

  return (
    <DashboardClientLayout 
      user={user} 
      initialEvents={initialEvents}
      initialPending={initialPending}
      initialNotifications={initialNotifications}
    >
      {children}
    </DashboardClientLayout>
  );
}
