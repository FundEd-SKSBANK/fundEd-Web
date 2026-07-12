'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDashboardStatistics } from '@/actions/statistics';
import { TrendingUp, DollarSign, Hash } from 'lucide-react';

interface StatisticsChartProps {
    className?: string;
}

export function StatisticsChart({ className }: StatisticsChartProps) {
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
    const [metric, setMetric] = useState<'collections' | 'transactions'>('collections');
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const res = await getDashboardStatistics(period);
            if (res.success && res.data) {
                setData(res.data);
            }
            setIsLoading(false);
        };
        fetchData();
    }, [period]);

    const maxValue = data.length > 0
        ? Math.max(...data.map(d => metric === 'collections' ? (Number(d.collections) || 0) : (Number(d.transactions) || 0)), 1)
        : 1;
    const totalValue = data.reduce((sum, d) => sum + (metric === 'collections' ? (Number(d.collections) || 0) : (Number(d.transactions) || 0)), 0);

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                        <div>
                            <CardTitle className="text-lg">Collection Statistics</CardTitle>
                            <CardDescription className="text-xs">Track performance over time</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tabs value={metric} onValueChange={(v: any) => setMetric(v)} className="w-auto">
                            <TabsList className="grid w-full grid-cols-2 h-9">
                                <TabsTrigger value="collections" className="text-xs gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    Amount
                                </TabsTrigger>
                                <TabsTrigger value="transactions" className="text-xs gap-1">
                                    <Hash className="h-3 w-3" />
                                    Count
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                            <SelectTrigger className="w-28 h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="day">Daily</SelectItem>
                                <SelectItem value="week">Weekly</SelectItem>
                                <SelectItem value="month">Monthly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mb-2 opacity-20" />
                        <p className="text-sm">No data available</p>
                    </div>
                ) : (
                    <div>
                        {/* Summary */}
                        <div className="mb-4 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Total {metric === 'collections' ? 'Collections' : 'Transactions'}
                            </span>
                            <span className="text-lg font-bold text-emerald-600">
                                {metric === 'collections' ? `₹${totalValue.toLocaleString('en-IN')}` : totalValue}
                            </span>
                        </div>

                        {/* Vertical Bar Chart with Horizontal Scroll on Mobile */}
                        <div className="overflow-x-auto pb-4 -mx-2 px-2 no-scrollbar">
                            <div className="flex items-stretch justify-between gap-2 h-60 pt-12 min-w-[max-content] md:min-w-min">
                                {data.map((item, index) => {
                                    const value = metric === 'collections' ? Number(item.collections) : Number(item.transactions);
                                    const heightPercent = (value / maxValue) * 100;

                                    return (
                                        <div key={index} className="flex-1 min-w-[50px] sm:min-w-[60px] md:min-w-0 flex flex-col items-center justify-end gap-2 group h-full transition-all">
                                            {/* Value on hover */}
                                            <div className="h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] font-bold text-emerald-500 whitespace-nowrap">
                                                    {metric === 'collections' ? `₹${(value / 1000).toFixed(1)}k` : value}
                                                </span>
                                            </div>

                                            {/* Bar */}
                                            <div className="w-full flex-1 flex items-end px-0.5">
                                                <div
                                                    className="w-full rounded-t-md bg-gradient-to-t from-emerald-600/80 to-teal-500/80 transition-all duration-500 hover:from-emerald-500 hover:to-teal-400 cursor-pointer relative group"
                                                    style={{ height: `${heightPercent}%`, minHeight: value > 0 ? '4px' : '0' }}
                                                >
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-900 border border-white/10 text-white text-[10px] font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 backdrop-blur-md">
                                                        <p className="text-emerald-400">
                                                            {metric === 'collections' ? `₹${value.toLocaleString('en-IN')}` : `${value} txns`}
                                                        </p>
                                                        <p className="text-[8px] text-muted-foreground mt-0.5">{item.date}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Label */}
                                            <span className="text-[10px] text-muted-foreground font-medium text-center line-clamp-1 w-full px-1">
                                                {item.date}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
