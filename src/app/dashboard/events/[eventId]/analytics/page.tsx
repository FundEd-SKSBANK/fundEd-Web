'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlassCard } from '@/components/ui/glass-card';
import { PageLoader } from '@/components/ui/page-loader';
import { useToast } from '@/hooks/use-toast';
import { getMajorEventAnalytics, generateMajorEventReport, getSubEventPaymentsReadOnly } from '@/actions/major-events';
import type { MajorEventAnalytics, SubEventConnection, Payment } from '@/lib/types';
import {
    ArrowLeft,
    BarChart2,
    Users,
    Wallet,
    TrendingUp,
    DollarSign,
    Network,
    Eye,
    FileDown,
    RefreshCw,
    Printer,
    ExternalLink,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// ─── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: React.ReactNode; highlight?: string }) {
    return (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-1 hover:bg-white/[0.07] transition-colors">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
            <p className={cn('text-2xl font-bold tracking-tight', highlight)}>{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">{sub}</p>}
        </div>
    );
}

// ─── Read-only payments modal ──────────────────────────────────────────────

function ReadOnlyPaymentsModal({ subEventId, majorEventId, subEventName, pendingStudents = [], open, onOpenChange }: {
    subEventId: string;
    majorEventId: string;
    subEventName: string;
    pendingStudents: any[];
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        getSubEventPaymentsReadOnly(subEventId, majorEventId).then(res => {
            if (res.success) setPayments(res.data || []);
            setLoading(false);
        });
    }, [open, subEventId, majorEventId]);

    const statusColor = (status: string) =>
        status === 'Paid' ? 'text-emerald-400' :
            status === 'Verification Pending' ? 'text-amber-400' : 'text-muted-foreground';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-white/10 bg-zinc-950/95 backdrop-blur-xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-xl tracking-tight">
                        <Network className="h-5 w-5 text-emerald-400" />
                        {subEventName}
                    </DialogTitle>
                    <DialogDescription>
                        Comprehensive collection data for this connected sub-event.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="payments" className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 border-b border-white/5 overflow-x-auto no-scrollbar shrink-0">
                        <TabsList className="bg-transparent border-0 p-0 h-11 w-max justify-start gap-6">
                            <TabsTrigger value="payments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:text-emerald-400 px-1 font-medium transition-all whitespace-nowrap">
                                Paid Payments ({payments.length})
                            </TabsTrigger>
                            <TabsTrigger value="pending" className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:text-amber-400 px-1 font-medium transition-all whitespace-nowrap">
                                Still Pending ({pendingStudents.length})
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-auto p-6 pt-4 min-h-[300px]">
                        <TabsContent value="payments" className="m-0 focus-visible:outline-none">
                            {loading ? (
                                <div className="flex items-center justify-center py-20"><RefreshCw className="h-8 w-8 animate-spin text-emerald-500/20" /></div>
                            ) : payments.length === 0 ? (
                                <div className="text-center py-12 space-y-3">
                                    <div className="h-12 w-12 rounded-full bg-white/5 mx-auto flex items-center justify-center">
                                        <CheckCircle2 className="h-6 w-6 text-muted-foreground opacity-20" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Desktop Table View */}
                                    <div className="hidden sm:block overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-xs text-muted-foreground border-b border-white/10">
                                                    <th className="text-left font-medium py-3 pr-3 min-w-[140px]">Student</th>
                                                    <th className="text-left font-medium py-3 pr-3">Amount</th>
                                                    <th className="text-left font-medium py-3 pr-3 hidden sm:table-cell">Method</th>
                                                    <th className="text-left font-medium py-3 pr-3">Status</th>
                                                    <th className="text-left font-medium py-3 hidden md:table-cell">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {payments.map(p => (
                                                    <tr key={p.id} className="group hover:bg-white/[0.02]">
                                                        <td className="py-3 pr-3">
                                                            <p className="font-semibold">{p.studentName}</p>
                                                            <p className="text-[10px] text-muted-foreground tracking-tight">{p.studentRoll}</p>
                                                        </td>
                                                        <td className="py-3 pr-3 font-bold text-emerald-400">₹{p.amount.toLocaleString('en-IN')}</td>
                                                        <td className="py-3 pr-3 text-muted-foreground text-xs hidden sm:table-cell">{p.paymentMethod}</td>
                                                        <td className="py-3 pr-3">
                                                            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap',
                                                                p.status === 'Paid' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                                    p.status === 'Verification Pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                                                        'bg-white/5 border-white/10 text-muted-foreground'
                                                            )}>
                                                                {p.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-xs text-muted-foreground hidden md:table-cell">{format(new Date(p.paymentDate), 'dd MMM, HH:mm')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="grid grid-cols-1 gap-3 sm:hidden">
                                        {payments.map(p => (
                                            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 transition-all border-emerald-500/10">
                                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center mt-0.5 shrink-0", 
                                                        p.status === 'Paid' ? 'bg-emerald-500/10' : 'bg-amber-500/10')}>
                                                        <Users className={cn("h-4 w-4", p.status === 'Paid' ? 'text-emerald-400' : 'text-amber-400')} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-semibold text-sm leading-tight truncate">{p.studentName}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate">{p.studentRoll}</p>
                                                        <p className="text-[9px] text-muted-foreground mt-0.5">{p.paymentMethod}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className={cn("text-xs font-bold leading-none mb-1", p.status === 'Paid' ? 'text-emerald-400' : 'text-amber-400')}>
                                                        {p.status === 'Verification Pending' ? 'Pending' : p.status}
                                                    </p>
                                                    <p className="text-[11px] font-black text-white/90">₹{p.amount.toLocaleString('en-IN')}</p>
                                                    <p className="text-[8px] text-muted-foreground tracking-tighter mt-0.5">{format(new Date(p.paymentDate), 'dd MMM, HH:mm')}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="pending" className="m-0 focus-visible:outline-none">
                            {pendingStudents.length === 0 ? (
                                <div className="text-center py-12 space-y-3">
                                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 mx-auto flex items-center justify-center">
                                        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-emerald-400">Perfect Records!</p>
                                        <p className="text-sm text-muted-foreground">Every student in this batch has successfully paid.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {pendingStudents.map(s => (
                                        <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 group hover:border-amber-500/30 transition-all">
                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                                <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center mt-0.5 shrink-0">
                                                    <Users className="h-4 w-4 text-amber-500" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-sm leading-tight truncate">{s.name}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate">{s.rollNo}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-amber-400">Not Paid</p>
                                                <p className="text-[10px] text-muted-foreground">₹{s.amountDue}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main analytics page ───────────────────────────────────────────────────

export default function MajorEventAnalyticsPage() {
    const params = useParams();
    const eventId = params.eventId as string;
    const { toast } = useToast();

    const [exportLoading, setExportLoading] = useState(false);
    const [viewingPayments, setViewingPayments] = useState<SubEventConnection | null>(null);

    const refreshMs = process.env.NEXT_PUBLIC_ANALYTICS_REFRESH_MS 
        ? parseInt(process.env.NEXT_PUBLIC_ANALYTICS_REFRESH_MS as string) 
        : 60000;

    const { data: analyticsRes, isLoading } = useSWR(
        ['majorEventAnalytics', eventId],
        () => getMajorEventAnalytics(eventId),
        { refreshInterval: refreshMs }
    );

    const analytics = analyticsRes?.success ? (analyticsRes.data as MajorEventAnalytics) : null;
    const loading = isLoading && !analytics;

    useEffect(() => {
        if (analyticsRes && !analyticsRes.success) {
            toast({ variant: 'destructive', title: 'Error', description: analyticsRes.error });
        }
    }, [analyticsRes, toast]);

    const handleExport = async () => {
        setExportLoading(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');

            const result = await generateMajorEventReport(eventId);
            if (!result.success || !result.data) {
                toast({ variant: 'destructive', title: 'Export Failed', description: (result as any).error || 'Failed to generate report' });
                return;
            }
            const { event, analytics: a, expenses, totalExpenses } = result.data as any;

            const doc = new jsPDF();
            const pageW = doc.internal.pageSize.getWidth();

            // Cover
            doc.setFillColor(16, 185, 129); // Emerald 500
            doc.rect(0, 0, pageW, 50, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('Event Report', pageW / 2, 22, { align: 'center' });
            doc.setFontSize(13);
            doc.setFont('helvetica', 'normal');
            doc.text(event.name, pageW / 2, 32, { align: 'center' });
            doc.setFontSize(9);
            doc.text(`Created by ${event.creatorName} · Generated ${format(new Date(), 'dd MMM yyyy')}`, pageW / 2, 42, { align: 'center' });

            // Aggregate summary
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Aggregate Summary', 14, 62);
            autoTable(doc, {
                startY: 66,
                head: [['Metric', 'Value']],
                body: [
                    ['Total Collected', `Rs. ${a.totalCollected.toLocaleString('en-IN')}`],
                    ['Total Pending', `Rs. ${a.totalPending.toLocaleString('en-IN')}`],
                    ['Additional Revenue', `Rs. ${a.totalAdditionalRevenue.toLocaleString('en-IN')}`],
                    ['Grand Total Available', `Rs. ${a.grandTotal.toLocaleString('en-IN')}`],
                    ['Total Students', a.totalStudents.toString()],
                    ['Connected Sub-Events', a.connectedSubEventsCount.toString()],
                ],
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] }
            });

            // Per sub-event
            if (a.subEvents.length > 0) {
                doc.addPage();
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(15, 23, 42);
                doc.text('Sub-Event Details', 14, 20);

                const hasPrintEvent = a.subEvents.some((s: SubEventConnection) => s.subEventCategory === 'Print');
                const head = hasPrintEvent
                    ? [['Event', 'Admin', 'Students', 'Collected', 'Pending', 'Addl. Rev.', 'Prints Dist.']]
                    : [['Event', 'Admin', 'Students', 'Collected', 'Pending', 'Addl. Rev.']];

                const body = a.subEvents.map((s: SubEventConnection) => {
                    const row = [
                        s.subEventName || '',
                        s.subEventAdminName || '',
                        s.subEventParticipantCount?.toString() || '0',
                        `Rs. ${(s.subEventTotalCollected || 0).toLocaleString('en-IN')}`,
                        `Rs. ${(s.subEventPendingAmount || 0).toLocaleString('en-IN')}`,
                        `Rs. ${(s.subEventAdditionalRevenue || 0).toLocaleString('en-IN')}`,
                    ];
                    if (hasPrintEvent) {
                        row.push(s.subEventCategory === 'Print' ? `${s.subEventPrintDistributed || 0}/${s.subEventPrintTotal || 0}` : 'N/A');
                    }
                    return row;
                });

                autoTable(doc, {
                    startY: 24,
                    head,
                    body,
                    theme: 'grid',
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [16, 185, 129] }
                });
            }

            // Expenses
            if (expenses.length > 0) {
                doc.addPage();
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(15, 23, 42);
                doc.text('Expenses', 14, 20);
                autoTable(doc, {
                    startY: 24,
                    head: [['Title', 'Category', 'Amount', 'Date', 'Note']],
                    body: expenses.map((e: any) => [
                        e.title, e.category,
                        `Rs. ${e.amount.toLocaleString('en-IN')}`,
                        format(new Date(e.date), 'dd MMM yyyy'),
                        e.note || '',
                    ]),
                    theme: 'grid',
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [16, 185, 129] },
                    foot: [['', 'Total Spent', `Rs. ${totalExpenses.toLocaleString('en-IN')}`, '', '']],
                });
            }

            // Add watermark/footer
            const pageCount = (doc.internal as any).getNumberOfPages();
            const pageH = doc.internal.pageSize.getHeight();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setTextColor(200, 200, 200); // More subtle grey
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                
                // Position for elements
                const textWidth = doc.getTextWidth('FundEd');
                const textX = pageW - 15;
                const textY = pageH - 10;
                const iconSize = 4.5; // mm
                const iconPadding = 1.5; // mm gap
                const iconX = textX - textWidth - iconSize - iconPadding;
                const iconY = textY - 3.8; // Centered with 10pt text
                
                // Add the text
                doc.text('FundEd', textX, textY, { align: 'right' });
                
                // Add the graduation cap symbol
                try {
                    const scale = iconSize / 24; 

                    doc.setDrawColor(13, 148, 136); // #0d9488 (Teal)
                    doc.setLineWidth(0.4);

                    // Path 1 (Tassel/Vertical line side): M22 10v6
                    doc.line(iconX + 22 * scale, iconY + 10 * scale, iconX + 22 * scale, iconY + 16 * scale);

                    // Path 2 (Diamond top): M2 10l10-5 10 5-10 5z
                    doc.setFillColor(13, 148, 136);
                    doc.lines(
                        [
                            [10 * scale, -5 * scale], 
                            [10 * scale, 5 * scale], 
                            [-10 * scale, 5 * scale], 
                            [-10 * scale, -5 * scale]
                        ], 
                        iconX + 2 * scale, iconY + 10 * scale, 
                        [1, 1], 
                        'FD', 
                        true
                    );

                    // Path 3: Base (Filled)
                    doc.setFillColor(13, 148, 136);
                    (doc as any).moveTo(iconX + 6 * scale, iconY + 12 * scale);
                    (doc as any).lineTo(iconX + 6 * scale, iconY + 17 * scale);
                    (doc as any).curveTo(
                        iconX + 9 * scale, iconY + 19.5 * scale, // CP1
                        iconX + 15 * scale, iconY + 19.5 * scale, // CP2
                        iconX + 18 * scale, iconY + 17 * scale  // Destination
                    );
                    (doc as any).lineTo(iconX + 18 * scale, iconY + 12 * scale);
                    (doc as any).lineTo(iconX + 6 * scale, iconY + 12 * scale);
                    (doc as any).fill('F');

                    // Redraw outline for sharpness
                    doc.setLineWidth(0.3);
                    doc.line(iconX + 6 * scale, iconY + 12 * scale, iconX + 6 * scale, iconY + 17 * scale);
                    (doc as any).curveTo(
                        iconX + 9 * scale, iconY + 19.5 * scale,
                        iconX + 15 * scale, iconY + 19.5 * scale,
                        iconX + 18 * scale, iconY + 17 * scale
                    );
                    doc.line(iconX + 18 * scale, iconY + 17 * scale, iconX + 18 * scale, iconY + 12 * scale);
                    doc.line(iconX + 18 * scale, iconY + 12 * scale, iconX + 6 * scale, iconY + 12 * scale);
                } catch (e) {
                    console.error('Error drawing SVG to PDF:', e);
                }
            }

            doc.save(`${event.name.replace(/\s+/g, '_')}_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            toast({ title: 'Report Exported', description: 'PDF has been downloaded.' });
        } catch (err) {
            console.error(err);
            toast({ variant: 'destructive', title: 'Export Error', description: 'Failed to generate PDF.' });
        } finally {
            setExportLoading(false);
        }
    };

    if (loading) return <PageLoader message="Loading analytics..." />;

    const a = analytics;

    return (
        <div className="space-y-6 animate-fade-in p-4 lg:p-0">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                    <Link href="/dashboard/events" className="shrink-0 mt-0.5 sm:mt-0">
                        <Button variant="ghost" size="icon" className="h-9 w-9 border border-white/10 hover:bg-white/5 rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
                    </Link>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 truncate">
                                <BarChart2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 shrink-0" />
                                Event Analytics
                            </h2>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-500 border-emerald-500/20 px-1.5 h-4 bg-emerald-500/5">Live Hub</Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-tight truncate">Aggregated data from connected sub-events</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <Link href={`/dashboard/events/${eventId}/expenses`} className="flex-1 lg:flex-none">
                        <Button variant="outline" className="w-full gap-2 border-emerald-500/20 hover:bg-emerald-500/5 text-emerald-400 h-10 px-5">
                            <Wallet className="h-4 w-4" />
                            View Expenses
                        </Button>
                    </Link>
                    <Button
                        onClick={handleExport}
                        disabled={exportLoading || !a}
                        className="flex-1 lg:flex-none gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0 h-10 px-5 shadow-lg shadow-emerald-900/20"
                    >
                        {exportLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                        Export
                    </Button>
                </div>
            </div>

            {/* Aggregate stats bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                <StatCard label="Collected" value={`₹${(a?.totalCollected || 0).toLocaleString('en-IN')}`} highlight="text-emerald-400" sub={<span className="text-emerald-400/50 flex items-center gap-1"><CheckCircle2 className="h-2 w-2" /> Verified Payments</span>} />
                <StatCard label="Pending" value={`₹${(a?.totalPending || 0).toLocaleString('en-IN')}`} highlight="text-amber-400" sub={<span className="text-amber-400/50 flex items-center gap-1"><AlertCircle className="h-2 w-2" /> Outstanding debt</span>} />
                <StatCard label="Addl. Revenue" value={`₹${(a?.totalAdditionalRevenue || 0).toLocaleString('en-IN')}`} highlight="text-blue-400" sub={<span className="text-blue-400/50 flex items-center gap-1"><TrendingUp className="h-2 w-2" /> Other sources</span>} />
                <StatCard label="Grand Total" value={`₹${(a?.grandTotal || 0).toLocaleString('en-IN')}`} highlight="text-emerald-400" sub={<span className="text-muted-foreground flex items-center gap-1">Wallet Capacity</span>} />
                <StatCard label="Total Students" value={(a?.totalStudents || 0).toString()} sub={<span className="text-muted-foreground flex items-center gap-1"><Users className="h-2 w-2" /> Across all batches</span>} />
                <StatCard label="Connected" value={(a?.connectedSubEventsCount || 0).toString()} sub={<span className="text-muted-foreground flex items-center gap-1"><Network className="h-2 w-2" /> Active clusters</span>} />
            </div>

            {/* Fund breakdown */}
            <GlassCard className="border-emerald-500/10">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base"><DollarSign className="h-4 w-4 text-emerald-400" /> Fund Source Breakdown</CardTitle>
                    <CardDescription>Visual summary of total funds available for the major event budget.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="text-center md:text-left rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-5 group hover:bg-emerald-500/10 transition-colors">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase">Student Collections</p>
                            <p className="text-2xl font-bold text-emerald-400">₹{(a?.fundBreakdown.studentCollections || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="text-center md:text-left rounded-xl bg-blue-500/5 border border-blue-500/10 p-5 group hover:bg-blue-500/10 transition-colors">
                            <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase">Additional Revenue</p>
                            <p className="text-2xl font-bold text-blue-400">₹{(a?.fundBreakdown.additionalRevenue || 0).toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">Sponsors, gate, stalls, etc.</p>
                        </div>
                        <div className="text-center md:text-left rounded-xl bg-emerald-500/10 border border-emerald-400/20 p-5 ring-1 ring-emerald-400/20">
                            <p className="text-xs text-emerald-500/70 mb-1 font-bold uppercase tracking-widest">Grand Total</p>
                            <p className="text-3xl font-black text-emerald-400">₹{(a?.fundBreakdown.grandTotal || 0).toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-emerald-500/70 font-medium">100% Allocated for Expenses</p>
                        </div>
                    </div>
                </CardContent>
            </GlassCard>

            {/* Sub-events list */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold flex items-center gap-2 lg:text-xl text-white/90">
                            <Network className="h-5 w-5 text-emerald-400 shrink-0" />
                            Connected Sub-Events
                        </h3>
                        {a && a.subEvents.length > 0 && (
                            <Link href={`/dashboard/events/${eventId}/connections`}>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] sm:text-[11px] font-bold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 transition-all">
                                    <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    Manage
                                </Button>
                            </Link>
                        )}
                    </div>
                    <div className="text-[10px] sm:text-xs font-bold text-muted-foreground bg-white/5 px-2 py-1 rounded-md border border-white/10 uppercase tracking-tighter w-max">
                        {a?.connectedSubEventsCount || 0} TOTAL CLUSTERS
                    </div>
                </div>

                {(!a || a.subEvents.length === 0) ? (
                    <Card className="py-10 bg-white/[0.02] border-dashed border-white/10">
                        <CardContent className="text-center px-6">
                            <div className="h-16 w-16 rounded-full bg-emerald-500/5 mx-auto flex items-center justify-center mb-4 border border-emerald-500/10">
                                <Network className="h-7 w-7 text-emerald-500/40" />
                            </div>
                            <div className="mb-6">
                                <p className="text-base font-bold text-emerald-50/90">No sub-events connected</p>
                                <p className="text-xs text-muted-foreground max-w-[240px] mx-auto mt-1 leading-relaxed">
                                    Connect other events to start aggregating financial and participation data.
                                </p>
                            </div>
                            <Link href={`/dashboard/events/${eventId}/connections`}>
                                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg shadow-emerald-900/20 px-6">
                                    <ExternalLink className="h-4 w-4" /> Manage Connections
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {a.subEvents.map((conn: SubEventConnection) => (
                            <GlassCard key={conn.id} className="hover:border-emerald-500/30 transition-all group flex flex-col h-full bg-white/[0.02]">
                                <CardContent className="pt-4 sm:pt-6 px-4 pb-4 flex flex-col h-full">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between gap-2 mb-2 pt-1 sm:pt-2">
                                            <h4 className="text-base sm:text-lg font-bold leading-tight line-clamp-2 min-h-[3rem] text-white/90">{conn.subEventName}</h4>
                                            <div className="shrink-0 h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                        </div>

                                        <div className="flex items-center justify-between gap-2 mb-4">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                                    <Users className="h-3 w-3 text-muted-foreground" />
                                                </div>
                                                <span className="text-xs sm:text-sm text-stone-300 truncate font-semibold">{conn.subEventAdminName}</span>
                                            </div>
                                            {conn.tokenLabel && (
                                                <Badge variant="outline" className="text-[9px] sm:text-[10px] font-bold text-blue-400 border-blue-400/20 px-1.5 h-4 bg-blue-400/5 shrink-0">
                                                    {conn.tokenLabel}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-4 py-3 border-y border-white/5">
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-tight">Collected</p>
                                                <p className="font-bold text-emerald-400 text-sm sm:text-base lg:text-lg">₹{(conn.subEventTotalCollected || 0).toLocaleString('en-IN')}</p>
                                            </div>
                                            <div className="space-y-0.5 text-right">
                                                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-tight">Pending</p>
                                                <div className="flex flex-col items-end">
                                                    <p className="font-bold text-amber-500 text-sm sm:text-base lg:text-lg">₹{(conn.subEventPendingAmount || 0).toLocaleString('en-IN')}</p>
                                                    <p className="text-[9px] text-muted-foreground leading-none">{(conn.subEventPendingCount || 0)}/{(conn.subEventParticipantCount || 0)} students</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Only show for Print events */}
                                        {conn.subEventCategory === 'Print' && (conn.subEventPrintTotal || 0) > 0 && (
                                            <div className="space-y-1.5 mb-4">
                                                <div className="flex items-center justify-between text-[9px]">
                                                    <span className="text-muted-foreground font-medium flex items-center gap-1"><Printer className="h-2.5 w-2.5" /> Distribution</span>
                                                    <span className="font-bold text-emerald-500">{Math.round(((conn.subEventPrintDistributed || 0) / (conn.subEventPrintTotal || 1)) * 100)}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                                        style={{ width: `${((conn.subEventPrintDistributed || 0) / (conn.subEventPrintTotal || 1)) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        variant="secondary"
                                        className="w-full gap-2 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 h-8 text-[11px] font-bold"
                                        onClick={() => setViewingPayments(conn)}
                                    >
                                        <Eye className="h-3.5 w-3.5" /> View Details
                                    </Button>
                                </CardContent>
                            </GlassCard>
                        ))}
                    </div>
                )}
            </div>

            {/* Read-only payments modal */}
            {viewingPayments && (
                <ReadOnlyPaymentsModal
                    subEventId={viewingPayments.subEventId}
                    majorEventId={eventId}
                    subEventName={viewingPayments.subEventName || ''}
                    pendingStudents={viewingPayments.subEventPendingStudents || []}
                    open={!!viewingPayments}
                    onOpenChange={open => !open && setViewingPayments(null)}
                />
            )}
        </div>
    );
}
