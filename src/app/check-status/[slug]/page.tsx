import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import { CheckStatusClient } from './check-status-client';

interface Props {
    params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
    const admin = await prisma.user.findUnique({
        where: { slug: params.slug },
        select: { name: true }
    });

    return {
        title: admin?.name ? `${admin.name} — Student Status Portal` : 'Student Status Portal',
        description: 'Check your payment status and event history.',
    };
}

export default async function CheckStatusSlugPage({ params }: Props) {
    const admin = await prisma.user.findUnique({
        where: { slug: params.slug },
        select: { id: true, name: true }
    });

    if (!admin) {
        notFound();
    }

    return <CheckStatusClient slug={params.slug} adminName={admin.name} />;
}
