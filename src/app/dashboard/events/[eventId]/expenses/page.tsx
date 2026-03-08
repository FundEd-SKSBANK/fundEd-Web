'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getEventExpenses, getEventBalance, getEventExpensesBreakdown, getEventFinancialsOverTime } from '@/actions/expenses';

import dynamic from 'next/dynamic';

const ExpenseBreakdownChart = dynamic(() => import('@/components/super-analytics-charts').then(mod => mod.ExpenseBreakdownChart), { ssr: false });
const RevenueTrendChart = dynamic(() => import('@/components/super-analytics-charts').then(mod => mod.RevenueTrendChart), { ssr: false });
import { ExpenseTable } from '@/components/expense-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, DollarSign, TrendingDown, TrendingUp, Wallet, Download } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/page-loader';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function EventExpensesPage() {
    const params = useParams();
    const eventId = params.eventId as string;
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [stats, setStats] = useState({
        eventName: '',
        totalCollected: 0,
        totalExpenses: 0,
        netBalance: 0
    });
    const [breakdown, setBreakdown] = useState<any[]>([]);
    const [financials, setFinancials] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, [eventId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [expensesRes, balanceRes, breakdownRes, financialsRes] = await Promise.all([
                getEventExpenses(eventId),
                getEventBalance(eventId),
                getEventExpensesBreakdown(eventId),
                getEventFinancialsOverTime(eventId, 'week')
            ]);

            if (expensesRes.success && expensesRes.data) {
                setExpenses(expensesRes.data.expenses);
            }

            if (balanceRes.success && balanceRes.data) {
                setStats(balanceRes.data);
            } else {
                toast({
                    title: "Error",
                    description: "Failed to load event data",
                    variant: "destructive"
                });
            }

            if (breakdownRes.success && breakdownRes.data) {
                setBreakdown(breakdownRes.data);
            }
            if (financialsRes && financialsRes.success && financialsRes.data) {
                setFinancials(financialsRes.data);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast({
                title: "Error",
                description: "Something went wrong while loading data.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const generatePdf = async () => {
        try {
            toast({
                title: "Generating Report",
                description: "Please wait while we generate your PDF...",
            });

            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            const addWatermarks = (data?: any) => {
                doc.setFontSize(10);
                doc.setTextColor(180, 180, 180);
                doc.text('FUNDED', pageWidth - 14, 10, { align: 'right' });
                doc.text('GENERATED USING FUNDED', pageWidth - 14, pageHeight - 10, { align: 'right' });
                doc.setTextColor(0, 0, 0); // Reset
            };

            // First Page Watermarks
            addWatermarks();

            // Title
            doc.setFontSize(20);
            doc.text(`${stats.eventName || 'Event'} Expense Report`, 14, 22);

            doc.setFontSize(11);
            doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 30);

            // Summary Statistics
            doc.setFontSize(14);
            doc.text('Financial Summary', 14, 45);

            const summaryData = [
                ['Total Collected', `Rs. ${stats.totalCollected.toLocaleString()}`],
                ['Total Expenses', `Rs. ${stats.totalExpenses.toLocaleString()}`],
                ['Net Balance', `Rs. ${stats.netBalance.toLocaleString()}`]
            ];

            autoTable(doc, {
                startY: 50,
                head: [['Metric', 'Amount']],
                body: summaryData,
                theme: 'grid',
                headStyles: { fillColor: [22, 163, 74] }, // Emerald color
                didDrawPage: addWatermarks,
            });

            // Expenses Table
            doc.setFontSize(14);
            doc.text('Detailed Expenses', 14, (doc as any).lastAutoTable.finalY + 15);

            const tableData = expenses.map(expense => [
                format(new Date(expense.date), 'MMM dd, yyyy'),
                expense.title,
                expense.category,
                `Rs. ${expense.amount.toLocaleString()}`
            ]);

            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 20,
                head: [['Date', 'Title', 'Category', 'Amount']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [40, 40, 40] },
                didDrawPage: addWatermarks,
            });

            const safeName = (stats.eventName || 'Event').replace(/[^a-zA-Z0-9-_]/g, '-');
            doc.save(`Expense-Report-${safeName}.pdf`);

            toast({
                title: "Success",
                description: "Report generated successfully!",
            });
        } catch (error) {
            console.error("PDF Generation failed:", error);
            toast({
                title: "Error",
                description: "Failed to generate PDF report.",
                variant: "destructive"
            });
        }
    };

    if (loading) return <PageLoader message="Loading expenses..." />;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Link href="/dashboard/events">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Event Finances</h2>
                        <p className="text-muted-foreground">Manage expenses and view financial health</p>
                    </div>
                </div>
                <Button onClick={generatePdf} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full md:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-emerald-500/10 border-emerald-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-500">Total Collected</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-400">₹{stats.totalCollected.toLocaleString()}</div>
                        <p className="text-xs text-emerald-500/60 flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Revenue from payments
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-red-500/10 border-red-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-500">Total Expenses</CardTitle>
                        <Wallet className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-400">₹{stats.totalExpenses.toLocaleString()}</div>
                        <p className="text-xs text-red-500/60 flex items-center mt-1">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Total outflow
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-500">Net Balance</CardTitle>
                        <Wallet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-400">₹{stats.netBalance.toLocaleString()}</div>
                        <p className="text-xs text-blue-500/60 flex items-center mt-1">
                            Available for use
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <ExpenseTable
                    expenses={expenses}
                    eventId={eventId}
                    eventName={stats.eventName}
                    onUpdate={() => fetchData()}
                />
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                <Card className="bg-white/5 border-white/10 h-full">
                    <CardHeader>
                        <CardTitle>Revenue vs Expenses (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <RevenueTrendChart data={financials} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 h-full">
                    <CardHeader>
                        <CardTitle>Expense Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {breakdown.length > 0 ? (
                            <ExpenseBreakdownChart data={breakdown} />
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                No expense data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
