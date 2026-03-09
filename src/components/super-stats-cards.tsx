'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, Calendar, IndianRupee, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface SuperStatsProps {
    stats: {
        admins: number;
        students: number;
        events: number;
        revenue: number;
        expenses: number;
        netBalance: number;
    }
}

export function SuperStatsCards({ stats }: SuperStatsProps) {
    const cards = [
        {
            title: "Total Admins",
            value: stats.admins,
            icon: Users,
            description: "Active admin accounts",
            color: "text-blue-400"
        },
        {
            title: "Total Students",
            value: stats.students,
            icon: GraduationCap,
            description: "Across all workspaces",
            color: "text-emerald-400"
        },
        {
            title: "Total Events",
            value: stats.events,
            icon: Calendar,
            description: "Published events",
            color: "text-purple-400"
        },
        {
            title: "Total Revenue",
            value: `₹${stats.revenue.toLocaleString('en-IN')}`,
            icon: IndianRupee,
            description: "Lifetime collections",
            color: "text-lime-400"
        },
        {
            title: "Total Expenses",
            value: `₹${stats.expenses.toLocaleString('en-IN')}`,
            icon: Wallet,
            description: "Lifetime expenses",
            color: "text-red-400"
        },
        {
            title: "Net Balance",
            value: `₹${stats.netBalance.toLocaleString('en-IN')}`,
            icon: stats.netBalance >= 0 ? TrendingUp : TrendingDown,
            description: "Revenue - Expenses",
            color: stats.netBalance >= 0 ? "text-emerald-400" : "text-red-400"
        }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => (
                <Card key={index} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-stone-300">
                            {card.title}
                        </CardTitle>
                        <card.icon className={`h-4 w-4 ${card.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-stone-100">{card.value}</div>
                        <p className="text-xs text-stone-500">
                            {card.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
