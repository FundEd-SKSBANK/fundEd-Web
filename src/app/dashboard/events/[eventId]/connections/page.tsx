'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { GlassCard } from '@/components/ui/glass-card';
import { PageLoader } from '@/components/ui/page-loader';
import { useToast } from '@/hooks/use-toast';
import {
    generateToken,
    listTokens,
    getMajorEventConnections,
    approveConnection,
    rejectConnection,
    removeMajorConnection,
} from '@/actions/major-events';
import type { ConnectionToken, SubEventConnection } from '@/lib/types';
import {
    Key,
    Copy,
    Check,
    ChevronDown,
    RefreshCw,
    Network,
    Users,
    CheckCircle2,
    XCircle,
    Trash2,
    ArrowLeft,
    Clock,
    ChevronRight,
    BarChart2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

function TokenCountdown({ expiresAt }: { expiresAt: string }) {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(id);
    }, []);
    const expiry = new Date(expiresAt);
    const expired = now >= expiry;
    const underDay = !expired && (expiry.getTime() - now.getTime()) < 86400000;
    return (
        <span className={cn('text-xs font-mono', expired ? 'text-red-400' : underDay ? 'text-amber-400' : 'text-emerald-400')}>
            {expired ? 'Expired' : `Expires ${formatDistanceToNow(expiry, { addSuffix: true })}`}
        </span>
    );
}

export default function ConnectionsPage() {
    const params = useParams();
    const eventId = params.eventId as string;
    const { toast } = useToast();

    const [tokens, setTokens] = useState<ConnectionToken[]>([]);
    const [connections, setConnections] = useState<SubEventConnection[]>([]);
    const [loading, setLoading] = useState(true);
    const [generateOpen, setGenerateOpen] = useState(false);
    const [genLabel, setGenLabel] = useState('');
    const [genExpiry, setGenExpiry] = useState('1'); // Default to 1 hour
    const [genLoading, setGenLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [rejectedOpen, setRejectedOpen] = useState(false);
    const [removedOpen, setRemovedOpen] = useState(false);

    const fetchAll = useCallback(async () => {
        const [tokRes, connRes] = await Promise.all([
            listTokens(eventId),
            getMajorEventConnections(eventId),
        ]);
        if (tokRes.success) setTokens(tokRes.data || []);
        if (connRes.success) setConnections((connRes.data || []) as SubEventConnection[]);
        setLoading(false);
    }, [eventId]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleGenerateToken = async () => {
        setGenLoading(true);
        const result = await generateToken(eventId, genLabel || undefined, parseInt(genExpiry));
        if (result.success) {
            toast({ title: 'Token Generated', description: 'Share the connection string with sub-event admins.' });
            setTokens(prev => [result.data as ConnectionToken, ...prev]);
            setGenerateOpen(false);
            setGenLabel('');
            setGenExpiry('1');
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setGenLoading(false);
    };

    const handleCopy = (token: ConnectionToken) => {
        navigator.clipboard.writeText(token.token);
        setCopiedId(token.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleApprove = async (connectionId: string) => {
        const result = await approveConnection(connectionId);
        if (result.success) {
            toast({ title: 'Approved', description: 'The sub-event is now connected.' });
            setConnections(prev => prev.map(c => c.id === connectionId ? { ...c, status: 'APPROVED' as const } : c));
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };

    const handleReject = async (connectionId: string) => {
        const result = await rejectConnection(connectionId);
        if (result.success) {
            toast({ title: 'Rejected', description: 'The connection request has been rejected.' });
            setConnections(prev => prev.map(c => c.id === connectionId ? { ...c, status: 'REJECTED' as const } : c));
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };

    const handleRemove = async (connectionId: string) => {
        const result = await removeMajorConnection(connectionId);
        if (result.success) {
            toast({ title: 'Removed', description: 'The sub-event has been removed from this Major Event.' });
            setConnections(prev => prev.map(c => c.id === connectionId ? { ...c, disconnectedBy: 'MAJOR_ADMIN', disconnectedAt: new Date().toISOString() } : c));
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };

    const pendingConns = connections.filter(c => c.status === 'PENDING' && !c.disconnectedAt);
    const approvedConns = connections.filter(c => c.status === 'APPROVED' && !c.disconnectedAt);
    const rejectedConns = connections.filter(c => c.status === 'REJECTED');
    const removedConns = connections.filter(c => c.disconnectedAt);

    if (loading) return <PageLoader message="Loading connections..." />;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/events">
                        <Button variant="ghost" size="icon" className="h-9 w-9 border border-white/10 hover:bg-white/5 rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Manage Connections</h2>
                        <p className="text-sm text-muted-foreground">Control which sub-events are part of this Major Event</p>
                    </div>
                </div>
            </div>

            {/* ── Tokens Section ── */}
            <GlassCard>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Key className="h-4 w-4" /> Connection Tokens</CardTitle>
                            <CardDescription>Share these strings with sub-event admins to let them request a connection</CardDescription>
                        </div>
                        <Button size="sm" className="gap-2 gradient-success border-0 w-full sm:w-auto" onClick={() => setGenerateOpen(true)}>
                            <Key className="h-3 w-3" /> Generate New
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {tokens.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No tokens yet. Generate one to start accepting connection requests.</p>
                    ) : (
                        tokens.map(token => (
                            <div key={token.id} className="flex items-center gap-3 rounded-lg border bg-muted/10 p-3">
                                <div className="flex-1 min-w-0">
                                    {token.label && <p className="text-xs text-muted-foreground mb-1">{token.label}</p>}
                                    <p className="font-mono text-xs truncate">{token.token}</p>
                                    <TokenCountdown expiresAt={token.expiresAt} />
                                </div>
                                <Button size="sm" variant="ghost" className="h-7 px-2 shrink-0" onClick={() => handleCopy(token)}>
                                    {copiedId === token.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                </Button>
                            </div>
                        ))
                    )}
                </CardContent>
            </GlassCard>

            {/* ── Pending Requests ── */}
            <GlassCard>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-400" />
                        Pending Requests
                        {pendingConns.length > 0 && <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 ml-2">{pendingConns.length}</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {pendingConns.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No pending connection requests.</p>
                    ) : (
                        pendingConns.map(conn => (
                            <div key={conn.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border bg-amber-500/5 border-amber-500/20 p-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold text-sm truncate">{conn.subEventName}</p>
                                        {conn.tokenLabel && (
                                            <Badge variant="outline" className="text-[10px] font-bold text-blue-400 border-blue-400/20 px-1.5 h-4 bg-blue-400/5">
                                                {conn.tokenLabel}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-2 text-xs text-muted-foreground">
                                        <span>{conn.subEventAdminName}</span>
                                        <span className="hidden sm:inline">·</span>
                                        <span>{format(new Date(conn.createdAt), 'dd MMM, HH:mm')}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <Button size="sm" className="flex-1 sm:flex-none h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white border-0" onClick={() => handleApprove(conn.id)}>
                                        <CheckCircle2 className="h-3 w-3" /> Approve
                                    </Button>
                                    <Button size="sm" variant="outline" className="flex-1 sm:flex-none h-8 gap-1 text-destructive border-white/10" onClick={() => handleReject(conn.id)}>
                                        <XCircle className="h-3 w-3" /> Reject
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </GlassCard>

            {/* ── Connected Sub-Events ── */}
            <GlassCard>
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Network className="h-5 w-5 text-emerald-400" />
                                Connected Sub-Events
                            </CardTitle>
                            {approvedConns.length > 0 && (
                                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                                    {approvedConns.length}
                                </Badge>
                            )}
                        </div>
                        <Link href={`/dashboard/events/${eventId}/analytics`}>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-2 text-xs border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all font-medium w-full sm:w-auto"
                            >
                                <BarChart2 className="h-3.5 w-3.5" />
                                View Analytics
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {approvedConns.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <Network className="h-6 w-6 text-emerald-400/50" />
                            </div>
                            <p className="text-sm text-muted-foreground">No approved connections yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {approvedConns.map(conn => (
                                <div
                                    key={conn.id}
                                    className="group relative flex flex-col rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all duration-200 overflow-hidden"
                                >
                                    {/* Card Top */}
                                    <div className="flex items-start justify-between px-4 pt-6 pb-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_1px_rgba(52,211,153,0.6)]" />
                                                <p className="font-semibold text-sm truncate">{conn.subEventName}</p>
                                                {conn.tokenLabel && (
                                                    <Badge variant="outline" className="text-[10px] font-bold text-blue-400 border-blue-400/20 px-1.5 h-4 bg-blue-400/5 ml-auto">
                                                        {conn.tokenLabel}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 pl-3.5">
                                                <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                                                <p className="text-xs text-muted-foreground truncate">{conn.subEventAdminName}</p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 shrink-0 text-destructive/60 hover:text-destructive hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleRemove(conn.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>

                                    {/* Divider */}
                                    <div className="mx-4 h-px bg-white/5" />

                                    {/* Stats Row */}
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">Collected</p>
                                            <p className="text-sm font-bold text-emerald-400">
                                                ₹{(conn.subEventTotalCollected || 0).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div className="w-px h-8 bg-white/10 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">Students</p>
                                            <p className="text-sm font-bold text-foreground">
                                                {conn.subEventParticipantCount || 0}
                                            </p>
                                        </div>
                                        {(conn.subEventPrintTotal || 0) > 0 && (
                                            <>
                                                <div className="w-px h-8 bg-white/10 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">Prints</p>
                                                    <p className="text-sm font-bold text-foreground">
                                                        {conn.subEventPrintDistributed || 0}
                                                        <span className="text-muted-foreground font-normal text-xs">/{conn.subEventPrintTotal}</span>
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </GlassCard>

            {/* ── Rejected (collapsed) ── */}
            {rejectedConns.length > 0 && (
                <Collapsible open={rejectedOpen} onOpenChange={setRejectedOpen}>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between text-muted-foreground" size="sm">
                            <span className="flex items-center gap-2"><XCircle className="h-4 w-4" /> Rejected Requests ({rejectedConns.length})</span>
                            <ChevronDown className={cn('h-4 w-4 transition-transform', rejectedOpen && 'rotate-180')} />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-2">
                        {rejectedConns.map(conn => (
                            <div key={conn.id} className="flex items-center gap-3 rounded-lg border bg-muted/5 p-3 opacity-60">
                                <div className="min-w-0">
                                    <p className="text-sm truncate">{conn.subEventName}</p>
                                    <p className="text-xs text-muted-foreground">{conn.subEventAdminName} · Rejected</p>
                                </div>
                            </div>
                        ))}
                    </CollapsibleContent>
                </Collapsible>
            )}

            {/* ── Removed (collapsed) ── */}
            {removedConns.length > 0 && (
                <Collapsible open={removedOpen} onOpenChange={setRemovedOpen}>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between text-muted-foreground" size="sm">
                            <span className="flex items-center gap-2"><Trash2 className="h-4 w-4" /> Removed Connections ({removedConns.length})</span>
                            <ChevronDown className={cn('h-4 w-4 transition-transform', removedOpen && 'rotate-180')} />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-2">
                        {removedConns.map(conn => (
                            <div key={conn.id} className="flex items-center gap-3 rounded-lg border bg-muted/5 p-3 opacity-60">
                                <div className="min-w-0">
                                    <p className="text-sm truncate">{conn.subEventName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {conn.subEventAdminName} · Removed by {conn.disconnectedBy === 'MAJOR_ADMIN' ? 'you' : 'sub-event admin'}
                                        {conn.disconnectedAt && ` · ${format(new Date(conn.disconnectedAt), 'dd MMM yyyy')}`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </CollapsibleContent>
                </Collapsible>
            )}

            {/* Generate Token Dialog */}
            <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Key className="h-4 w-4" /> Generate Connection Token</DialogTitle>
                        <DialogDescription>Create a new token to share with sub-event admins.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="grid gap-1.5">
                            <Label>Label (optional)</Label>
                            <Input value={genLabel} onChange={e => setGenLabel(e.target.value)} placeholder="e.g. Batch 1 — IT classes" />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Expiry</Label>
                            <Select value={genExpiry} onValueChange={setGenExpiry}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 hour</SelectItem>
                                    <SelectItem value="12">12 hours</SelectItem>
                                    <SelectItem value="24">1 day</SelectItem>
                                    <SelectItem value="72">3 days</SelectItem>
                                    <SelectItem value="168">7 days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGenerateOpen(false)}>Cancel</Button>
                        <Button onClick={handleGenerateToken} disabled={genLoading} className="gap-2 gradient-success border-0">
                            {genLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Key className="h-3 w-3" />}
                            Generate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
