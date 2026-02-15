'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getEventExpenses, getEventBalance } from '@/actions/expenses';
import { ExpenseTable } from '@/components/expense-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, DollarSign, TrendingDown, TrendingUp, Wallet, Download } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/page-loader';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

    useEffect(() => {
        fetchData();
    }, [eventId]);

    const fetchData = async () => {
        setLoading(true);
        const [expensesRes, balanceRes] = await Promise.all([
            getEventExpenses(eventId),
            getEventBalance(eventId)
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
        setLoading(false);
    };

    const generatePdf = () => {
        const doc = new jsPDF();

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
        });

        // Expenses Table
        doc.setFontSize(14);
        doc.text('Detailed Expenses', 14, (doc as any).lastAutoTable.finalY + 15);

        const tableData = expenses.map(expense => [
            format(new Date(expense.date), 'MMM dd, yyyy'),
            expense.title,
            expense.category,
            expense.recorder?.name || 'Unknown',
            `Rs. ${expense.amount.toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [['Date', 'Title', 'Category', 'Recorded By', 'Amount']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [40, 40, 40] },
        });

        const safeName = (stats.eventName || 'Event').replace(/[^a-zA-Z0-9-_]/g, '-');
        doc.save(`Expense-Report-${safeName}.pdf`);
    };

    if (loading) return <PageLoader message="Loading expenses..." />;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
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
                <Button onClick={generatePdf} className="bg-emerald-600 hover:bg-emerald-700 text-white">
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

            <ExpenseTable
                expenses={expenses}
                eventId={eventId}
                onUpdate={() => fetchData()}
            />
        </div>
    );
}
