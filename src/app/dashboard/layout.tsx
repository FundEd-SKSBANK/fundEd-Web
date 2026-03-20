import DashboardClientLayout from './client-layout';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getEvents } from '@/actions/events';
async function getUser() {
  const session = await getSession();
  if (!session || !session.user || !session.user.id) {
    return null;
  }
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
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const eventsRes = await getEvents();
  const initialEvents = eventsRes.success && eventsRes.data ? (eventsRes.data as any[]).map(e => ({ id: e.id, name: e.name })) : [];

  return (
    <DashboardClientLayout user={user} initialEvents={initialEvents}>
      {children}
    </DashboardClientLayout>
  );
}
