import { getUserRole } from '@/actions/auth';
import { getDashboardData } from '@/actions/dashboard';
import { redirect } from 'next/navigation';
import { DashboardClient } from './dashboard-client';
import { PageLoader } from '@/components/ui/page-loader';
import type { Event, Transaction } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    // 1. Server-side Role Check & Redirect
    const role = await getUserRole();
    if (role === 'superadmin') {
        redirect('/dashboard/super');
    }

    // 2. Server-side Data Fetching
    const res = await getDashboardData();

    // Handle loading/error states if needed, though for a Server Component 
    // simply returning the UI is standard.
    if (!res.success || !res.data) {
        return (
            <div className="p-8 text-center text-red-500">
                Failed to load dashboard data: {res.error}. Please try again later.
            </div>
        );
    }

    const { events, transactions, recentTransactions } = res.data;

    return (
        <DashboardClient
            events={events as unknown as Event[]}
            transactions={transactions as unknown as Transaction[]}
            recentTransactions={recentTransactions as unknown as Transaction[]}
        />
    );
}
