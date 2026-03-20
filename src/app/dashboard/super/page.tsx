import { getUserRole } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { getSuperuserStats, getGlobalFinancialsOverTime, getExpenseCategoryBreakdown } from '@/actions/super/analytics';
import { SuperStatsCards } from '@/components/super-stats-cards';
import { AdminManagementTable } from '@/components/admin-management-table';
import { RevenueTrendChart, ExpenseBreakdownChart } from '@/components/super-analytics-charts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SuperFinancialsTable } from '@/components/super-financials-table';

export const dynamic = 'force-dynamic';

export default async function SuperDashboardPage() {
    const role = await getUserRole();
    if (role !== 'superadmin') {
        redirect('/dashboard');
    }

    const [statsRes, financialsRes, expenseBreakdownRes] = await Promise.all([
        getSuperuserStats(),
        getGlobalFinancialsOverTime('week'),
        getExpenseCategoryBreakdown()
    ]);

    const stats = statsRes.success && statsRes.data ? statsRes.data : {
        admins: 0,
        students: 0,
        events: 0,
        revenue: 0,
        expenses: 0,
        netBalance: 0
    };

    const financialData = financialsRes.success && financialsRes.data ? financialsRes.data : [];
    const expenseData = expenseBreakdownRes.success && expenseBreakdownRes.data ? expenseBreakdownRes.data : [];

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-white glow-text">Superuser Dashboard</h2>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-white/5 border border-white/10">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="admins">Admins</TabsTrigger>
                    <TabsTrigger value="financials">Financials</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <SuperStatsCards stats={stats} />

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <div className="col-span-4 bg-white/5 border border-white/10 rounded-xl p-6 min-h-[300px]">
                            <h3 className="text-lg font-medium text-stone-200 mb-4">Revenue vs Expenses (Last 7 Days)</h3>
                            <RevenueTrendChart data={financialData} />
                        </div>
                        <div className="col-span-3 bg-white/5 border border-white/10 rounded-xl p-6 min-h-[300px]">
                            <h3 className="text-lg font-medium text-stone-200 mb-4">Expense Breakdown</h3>
                            {expenseData.length > 0 ? (
                                <ExpenseBreakdownChart data={expenseData} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-stone-500">
                                    No expense data available
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="admins" className="space-y-4">
                    <AdminManagementTable />
                </TabsContent>

                <TabsContent value="financials" className="space-y-4">
                    <SuperFinancialsTable />
                </TabsContent>
            </Tabs>
        </div>
    );
}
