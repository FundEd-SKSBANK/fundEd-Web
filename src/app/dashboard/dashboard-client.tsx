'use client';

import { GlassCard } from '@/components/ui/glass-card';
import {
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Transaction, Event } from '@/lib/types';
import { useMemo } from 'react';
import { Wallet, TrendingUp, Clock, Users, Receipt, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatisticsChart } from '@/components/statistics-chart';
import { formatDate, getStatusBadgeVariant } from './page.utils';

interface StatCardProps {
    title: string;
    value: string;
    description: string;
    icon: React.ReactNode;
    trend?: string;
    className?: string;
}

function StatCard({ title, value, description, icon, trend, className }: StatCardProps) {
    return (
        <GlassCard className={`relative overflow-hidden transition-all hover:shadow-lg w-full min-w-0 ${className}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">{title}</CardTitle>
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-lg sm:text-xl md:text-2xl font-bold truncate">{value}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
                    {description}
                </p>
                {trend && (
                    <div className="flex items-center mt-2 text-[10px] sm:text-xs text-green-600 dark:text-green-400 truncate">
                        <TrendingUp className="h-3 w-3 mr-1 shrink-0" />
                        <span className="truncate">{trend}</span>
                    </div>
                )}
            </CardContent>
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -mr-10 -mt-10 sm:-mr-12 sm:-mt-12 md:-mr-16 md:-mt-16 pointer-events-none" />
        </GlassCard>
    );
}

interface DashboardClientProps {
    events: Event[];
    transactions: Transaction[];
    recentTransactions: Transaction[];
}

export function DashboardClient({ events, transactions, recentTransactions }: DashboardClientProps) {

    const stats = useMemo(() => {
        const totalCollected = transactions
            .filter(t => t.status === 'Paid')
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const pendingAmount = transactions
            .filter(t => t.status === 'Pending' || t.status === 'Verification Pending')
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const uniqueStudents = new Set(transactions.map(t => t.studentId)).size;

        return {
            totalEvents: events.length,
            totalCollected,
            pendingAmount,
            uniqueStudents,
        };
    }, [events, transactions]);

    const StatusBadge = ({ status }: { status: Transaction['status'] }) => {
        const variant = getStatusBadgeVariant(status);
        return (
            <Badge variant={variant as any}>
                {status}
            </Badge>
        );
    };

    return (
        <div className="space-y-6 sm:space-y-8 w-full max-w-full overflow-hidden">
            {/* Welcome Section */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground mt-2">
                    Welcome back! Here's an overview of your fund collection activities.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-4 w-full max-w-full">
                <StatCard
                    title="Total Events"
                    value={stats.totalEvents.toString()}
                    description="Active fund collection events"
                    icon={<Wallet className="h-3 w-3 sm:h-4 sm:w-4" />}
                />
                <StatCard
                    title="Total Collected"
                    value={`₹${stats.totalCollected.toLocaleString()}`}
                    description="Successfully collected funds"
                    icon={<TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />}
                    trend="+12% from last month"
                    className="border-green-200 dark:border-green-900"
                />
                <StatCard
                    title="Pending Payments"
                    value={`₹${stats.pendingAmount.toLocaleString()}`}
                    description="Awaiting verification"
                    icon={<Clock className="h-3 w-3 sm:h-4 sm:w-4" />}
                    className="border-orange-200 dark:border-orange-900"
                />
                <StatCard
                    title="Active Students"
                    value={stats.uniqueStudents.toString()}
                    description="Students with transactions"
                    icon={<Users className="h-3 w-3 sm:h-4 sm:w-4" />}
                />
            </div>

            {/* Statistics Chart */}
            <StatisticsChart />

            {/* Active Events - Quick Access */}
            {events && events.length > 0 && (
                <GlassCard className="shadow-md">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="min-w-0">
                                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                    <Receipt className="h-5 w-5 text-emerald-400 shrink-0" />
                                    <span className="truncate">Quick Access — Expenses</span>
                                </CardTitle>
                                <CardDescription className="mt-1 line-clamp-1 sm:line-clamp-none">
                                    Jump directly to any event's expense tracker
                                </CardDescription>
                            </div>
                            <Link href="/dashboard/events" className="shrink-0">
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 h-auto p-0 font-medium">
                                    All Events <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {events.slice(0, 6).map(event => (
                                <Link
                                    key={event.id}
                                    href={`/dashboard/events/${event.id}/expenses`}
                                    className="group flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all"
                                >
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm text-stone-200 truncate">{event.name}</p>
                                        <p className="text-xs text-stone-500 mt-0.5">View &amp; add expenses</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-stone-500 group-hover:text-emerald-400 shrink-0 transition-colors" />
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </GlassCard>
            )}

            {/* Recent Transactions */}
            <GlassCard className="shadow-md">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="min-w-0">
                            <CardTitle className="text-lg sm:text-xl truncate">Recent Transactions</CardTitle>
                            <CardDescription className="mt-1 line-clamp-1 sm:line-clamp-none">
                                Latest payment activities across all events
                            </CardDescription>
                        </div>
                        <Link href="/dashboard/reports" className="shrink-0">
                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 h-auto p-0 font-medium">
                                View all <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Mobile View */}
                    <div className="grid gap-4 md:hidden">
                        {recentTransactions?.map(transaction => (
                            <GlassCard key={transaction.id} className="w-full border-l-4 border-l-primary/20">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="min-w-0 flex-1">
                                            <CardTitle className="text-sm font-code break-all" title={transaction.id}>
                                                #{transaction.id.slice(-8)}
                                            </CardTitle>
                                            <CardDescription className="mt-1 break-words">{transaction.studentName}</CardDescription>
                                        </div>
                                        <div className="shrink-0 ml-2">
                                            <StatusBadge status={transaction.status} />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid gap-3 pt-0">
                                    <div className="flex items-center justify-between text-sm gap-4">
                                        <span className="text-muted-foreground shrink-0">Event</span>
                                        <span className="font-medium text-right break-words">{transaction.eventName}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm gap-4">
                                        <span className="text-muted-foreground shrink-0">Amount</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400 shrink-0">
                                            ₹{transaction.amount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm gap-4">
                                        <span className="text-muted-foreground shrink-0">Date</span>
                                        <span className="shrink-0">{formatDate(transaction.paymentDate)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm gap-4">
                                        <span className="text-muted-foreground shrink-0">Method</span>
                                        <span className="text-right break-words">{transaction.paymentMethod}</span>
                                    </div>
                                </CardContent>
                            </GlassCard>
                        ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-center">Transaction ID</TableHead>
                                    <TableHead className="text-center">Student</TableHead>
                                    <TableHead className="text-center">Event</TableHead>
                                    <TableHead className="text-center">Amount</TableHead>
                                    <TableHead className="text-center">Date</TableHead>
                                    <TableHead className="text-center">Method</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentTransactions?.map((transaction) => (
                                    <TableRow key={transaction.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-code text-center text-xs">{transaction.id}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="font-medium">{transaction.studentName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {transaction.studentRoll}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-sm">{transaction.eventName}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-semibold text-green-600 dark:text-green-400">
                                                ₹{transaction.amount.toLocaleString()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center text-sm">{formatDate(transaction.paymentDate)}</TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-xs px-2 py-1 rounded-full bg-muted">
                                                {transaction.paymentMethod}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                <StatusBadge status={transaction.status} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {recentTransactions?.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">No transactions yet</p>
                            <p className="text-sm mt-1">Transactions will appear here once students start making payments</p>
                        </div>
                    )}
                </CardContent>
            </GlassCard>
        </div>
    );
}
