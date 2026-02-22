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
