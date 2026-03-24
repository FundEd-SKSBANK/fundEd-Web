'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Wallet, Share2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStudentPublicStatus } from '@/actions/public-student';
import { Badge } from '@/components/ui/badge';

interface CheckStatusClientProps {
    slug: string;
    adminName: string | null;
}

export function CheckStatusClient({ slug, adminName }: CheckStatusClientProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const { toast } = useToast();

    // Persist portal info for landing page return button
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('lastStatusSlug', slug);
            if (adminName) {
                localStorage.setItem('lastStatusAdminName', adminName);
            }
        }
    }, [slug, adminName]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setResults([]);
        setHasSearched(true);

        const res = await getStudentPublicStatus(query.trim(), slug);

        if (res.success && res.data) {
            setResults(res.data);
        } else {
            toast({
                variant: 'destructive',
                title: 'Search Failed',
                description: res.error || 'No matched records found.',
            });
        }
        setIsLoading(false);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast({ title: 'Link Copied', description: 'Portal link copied to clipboard.' });
    };

    return (
        <div className="min-h-screen bg-black text-stone-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-100 overflow-x-hidden relative cursor-default">
            {/* Noise Texture */}
            <div className="fixed inset-0 z-[50] opacity-[0.07] pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            {/* Orbs Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
                <div className="absolute top-[-15%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-emerald-600/40 via-emerald-800/30 to-transparent blur-[140px] mix-blend-screen opacity-70 animate-float" />
                <div className="absolute top-[25%] right-[-15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-lime-500/30 via-lime-700/20 to-transparent blur-[120px] mix-blend-screen opacity-60 animate-float-delayed" />
                <div className="absolute bottom-[-25%] left-[15%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-teal-600/35 via-teal-800/25 to-transparent blur-[130px] mix-blend-screen opacity-65 animate-float-slow" />
            </div>

            {/* Nav */}
            <nav className="fixed top-0 w-full z-[60] bg-transparent py-8 backdrop-blur-sm">
                <div className="w-full px-6 md:px-16 flex items-center justify-between">
                    <Link href="/">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-500/30 transition-all"></div>
                            <span className="relative text-base font-bold tracking-[0.25em] text-white group-hover:text-emerald-200 transition-colors uppercase">
                                FundEd
                                <span className="text-emerald-500/50 mx-3 hidden sm:inline">●</span>
                                <span className="hidden sm:inline">check status</span>
                            </span>
                        </div>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={handleCopyLink} className="text-xs tracking-[0.1em] text-emerald-100 hover:text-white uppercase hover:bg-emerald-500/10 hidden md:flex">
                        <Share2 className="w-4 h-4 mr-2" /> Share Page
                    </Button>
                </div>
            </nav>

            <div className="w-full max-w-4xl mx-auto z-10 relative pt-32 px-4 md:px-6 flex flex-col items-center min-h-[80vh]">

                {/* Header */}
                <div className="text-center space-y-6 mb-12">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-2">
                        <Wallet className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300/90 font-mono text-xs tracking-wider">STUDENT PORTAL</span>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-bold text-white tracking-tight leading-tight">
                        Check your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">payment status</span>
                    </h1>
                    <p className="text-stone-300 text-lg font-light max-w-lg mx-auto leading-relaxed">
                        View your complete event history and outstanding dues by entering your details below.
                    </p>
                </div>

                {/* Simple Search Bar */}
                <div className="w-full max-w-xl relative mb-16 px-4">
                    <form onSubmit={handleSearch} className="relative flex items-center gap-2">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 group-focus-within:text-emerald-500 transition-colors" />
                            <Input
                                placeholder="Name or Roll Number..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-11 h-12 bg-white/[0.05] border-white/10 rounded-xl text-white placeholder:text-stone-500 focus-visible:ring-1 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 transition-all font-normal"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading || !query.trim()}
                            className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-lg shadow-emerald-900/20 active:scale-95 shrink-0"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                        </Button>
                    </form>
                </div>

                {/* Results */}
                <div className="w-full space-y-8 pb-20">
                    {hasSearched && results.length === 0 && !isLoading && (
                        <div className="text-center py-12 text-stone-500 bg-white/[0.02] rounded-3xl border border-white/5 backdrop-blur-md">
                            No records found for &quot;{query}&quot;.
                        </div>
                    )}

                    {results.map((item) => (
                        <div key={item.student.id} className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 p-8 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10">

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/5 pb-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-1 group-hover:text-emerald-100 transition-colors">{item.student.name}</h2>
                                    <p className="text-emerald-400 font-mono text-sm tracking-wider flex items-center gap-3">
                                        <span className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">{item.student.rollNo}</span>
                                        <span className="text-stone-500">/</span>
                                        <span>{item.student.class}</span>
                                    </p>
                                </div>
                                <div className="text-right hidden md:block">
                                    <span className="text-stone-500 text-xs tracking-widest uppercase">Events</span>
                                    <div className="text-2xl font-bold text-white">{item.paymentSummary.length}</div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {item.paymentSummary.length === 0 ? (
                                    <div className="col-span-full p-6 text-center text-stone-500 bg-white/5 rounded-2xl">No active events found.</div>
                                ) : (
                                    item.paymentSummary.map((summary: any, idx: number) => {
                                        const progress = summary.eventCost > 0 ? (summary.totalPaid / summary.eventCost) * 100 : 0;
                                        const isPaid = summary.status === 'Fully Paid';

                                        return (
                                            <div key={idx} className="relative p-5 rounded-2xl bg-black/20 border border-white/5 hover:border-emerald-500/30 transition-colors group/card overflow-hidden">
                                                <div className="flex justify-between items-start mb-4 gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-stone-200 truncate group-hover/card:text-emerald-200 transition-colors" title={summary.eventName}>
                                                            {summary.eventName}
                                                        </h3>
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            <Badge variant={isPaid ? 'paid' : summary.status === 'Partially Paid' ? 'pending' : 'destructive'}
                                                                className={`text-[10px] px-2 h-5 tracking-wide ${isPaid ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : ''}`}>
                                                                {summary.status}
                                                            </Badge>
                                                            {summary.majorEventName && (
                                                                <Badge variant="outline" className="text-[10px] px-2 h-5 tracking-wide border-violet-500/40 text-violet-300 bg-violet-500/10">
                                                                    🌐 {summary.majorEventName}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right whitespace-nowrap shrink-0">
                                                        <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-0.5">Total</p>
                                                        <p className="font-bold text-lg text-white">₹{summary.eventCost.toLocaleString('en-IN')}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-3 pt-2 border-t border-white/5">
                                                    <div className="flex justify-between items-center text-sm font-medium gap-2">
                                                        <span className="text-stone-400 truncate">Paid: <span className="text-stone-200">₹{summary.totalPaid.toLocaleString('en-IN')}</span></span>
                                                        <span className="whitespace-nowrap text-emerald-400">
                                                            {summary.pendingAmount > 0 ? `₹${summary.pendingAmount.toLocaleString('en-IN')} Due` : 'Settled'}
                                                        </span>
                                                    </div>
                                                    {summary.lastPaymentDate && (
                                                        <div className="flex justify-between items-center text-[10px] text-stone-500">
                                                            <span>Last Paid:</span>
                                                            <span className="font-mono">
                                                                {new Date(summary.lastPaymentDate).toLocaleString('en-GB', { 
                                                                    day: '2-digit', 
                                                                    month: '2-digit', 
                                                                    year: '2-digit',
                                                                    hour: '2-digit', 
                                                                    minute: '2-digit', 
                                                                    hour12: true 
                                                                }).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full transition-all duration-1000 bg-emerald-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
