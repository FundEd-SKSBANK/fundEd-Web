'use client';

import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, IndianRupee, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getGlobalEventFinancials } from '@/actions/super/analytics';
import { Button } from '@/components/ui/button';

interface EventFinancials {
    id: string;
    name: string;
    creator: string;
    totalCollected: number;
    totalExpenses: number;
    netBalance: number;
    status: string;
    createdAt: string;
}

export function SuperFinancialsTable() {
    const [data, setData] = useState<EventFinancials[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const res = await getGlobalEventFinancials();
        if (res.success && res.data) {
            setData(res.data as EventFinancials[]);
        } else {
            toast({
                title: "Error",
                description: "Failed to load financial data",
                variant: "destructive"
            });
        }
        setLoading(false);
    }

    const filteredData = data.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.creator.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPlatformCollected = data.reduce((sum, item) => sum + item.totalCollected, 0);
    const totalPlatformExpenses = data.reduce((sum, item) => sum + item.totalExpenses, 0);
    // User requested that negative balances (deficits) should not be considered as balance.
    // So we sum up the individual net balances, clamping each to at least 0.
    const totalPlatformBalance = data.reduce((sum, item) => sum + Math.max(0, item.netBalance), 0);

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Total Collected</p>
                    <p className="text-2xl font-bold text-emerald-400 flex items-center">
                        <IndianRupee className="h-5 w-5 mr-1" />
                        {totalPlatformCollected.toLocaleString('en-IN')}
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-400 flex items-center">
                        <IndianRupee className="h-5 w-5 mr-1" />
                        {totalPlatformExpenses.toLocaleString('en-IN')}
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Net Balance</p>
                    <p className="text-2xl font-bold text-blue-400 flex items-center">
                        <IndianRupee className="h-5 w-5 mr-1" />
                        {totalPlatformBalance.toLocaleString('en-IN')}
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
                <div className="relative flex-1 sm:max-w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search events or admins..."
                        className="pl-8 bg-white/5 border-white/10 text-stone-200 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-white/10 bg-white/5 text-stone-300 hover:bg-white/10 hover:text-white w-full sm:w-auto" 
                    onClick={() => toast({ title: "Coming Soon", description: "Global report export is being developed." })}
                >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            {/* Mobile View - Cards */}
            <div className="grid gap-3 md:hidden">
                {loading ? (
                    <div className="h-24 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="h-24 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg text-stone-500 text-sm">
                        No financial records found.
                    </div>
                ) : (
                    filteredData.map((item) => (
                        <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 overflow-hidden">
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-stone-200 truncate text-sm">{item.name}</h4>
                                    <p className="text-[10px] text-stone-400 mt-0.5 truncate">{item.creator}</p>
                                </div>
                                <Badge variant="outline" className={`shrink-0 text-[9px] px-1.5 py-0 h-5
                                    ${item.status === 'PUBLISHED' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' :
                                        item.status === 'COMPLETED' ? 'border-blue-500/30 text-blue-400 bg-blue-500/5' :
                                            'border-stone-500/30 text-stone-400 bg-stone-500/5'}
                                `}>
                                    {item.status}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-2">
                                <div className="min-w-0">
                                    <p className="text-[9px] text-stone-500 uppercase tracking-wider mb-0.5">Collected</p>
                                    <p className="text-xs font-semibold text-emerald-400/90 truncate">₹{item.totalCollected.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] text-stone-500 uppercase tracking-wider mb-0.5">Expenses</p>
                                    <p className="text-xs font-semibold text-red-400/90 truncate">₹{item.totalExpenses.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="text-right min-w-0">
                                    <p className="text-[9px] text-stone-500 uppercase tracking-wider mb-0.5">Balance</p>
                                    <p className={`text-xs font-bold truncate ${item.netBalance >= 0 ? 'text-blue-400' : 'text-stone-500'}`}>
                                        ₹{Math.max(0, item.netBalance).toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block rounded-md border border-white/10 bg-white/5 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/10">
                            <TableHead className="text-stone-400">Event</TableHead>
                            <TableHead className="text-stone-400">Admin</TableHead>
                            <TableHead className="text-stone-400 text-right">Collected</TableHead>
                            <TableHead className="text-stone-400 text-right">Expenses</TableHead>
                            <TableHead className="text-stone-400 text-right">Balance</TableHead>
                            <TableHead className="text-stone-400">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500" />
                                </TableCell>
                            </TableRow>
                        ) : filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-stone-500">
                                    No financial records found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((item) => (
                                <TableRow key={item.id} className="border-white/10 hover:bg-white/5 whitespace-nowrap">
                                    <TableCell className="font-medium text-stone-200">
                                        {item.name}
                                    </TableCell>
                                    <TableCell className="text-stone-400">
                                        {item.creator}
                                    </TableCell>
                                    <TableCell className="text-right text-emerald-400/90 font-medium">
                                        {item.totalCollected.toLocaleString('en-IN')}
                                    </TableCell>
                                    <TableCell className="text-right text-red-400/90 font-medium">
                                        {item.totalExpenses.toLocaleString('en-IN')}
                                    </TableCell>
                                    <TableCell className={`text-right font-bold ${item.netBalance >= 0 ? 'text-blue-400' : 'text-stone-500'}`}>
                                        {Math.max(0, item.netBalance).toLocaleString('en-IN')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`
                                            ${item.status === 'PUBLISHED' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' :
                                                item.status === 'COMPLETED' ? 'border-blue-500/30 text-blue-400 bg-blue-500/5' :
                                                    'border-stone-500/30 text-stone-400 bg-stone-500/5'}
                                        `}>
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
