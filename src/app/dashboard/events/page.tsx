'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Plus,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    Link as LinkIcon,
    Calendar as CalendarIcon,
    Wallet,
    Share2,
    Plug,
    Unplug,
    Network,
    BarChart2,
    Key,
    Copy,
    Check,
    Clock,
    RefreshCw,
    CheckCircle2,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getEvents, createEvent, updateEvent, deleteEvent } from '@/actions/events';
import { generateToken } from '@/actions/major-events';
import { connectSubEvent, disconnectSubEvent, getSubEventConnection } from '@/actions/major-events';
import { getStudents } from '@/actions/students';
import { getCurrentAdmin } from '@/actions/users';
import { getQrCodes } from '@/actions/settings';
import type { Event, Student, QrCode } from '@/lib/types';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { GlassCard } from '@/components/ui/glass-card';
import { PageLoader } from '@/components/ui/page-loader';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getCollectionProgress, copyPaymentLink, filterStudents } from './page.utils';

// ─── Token countdown component ─────────────────────────────────────────────

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
        <span className={cn(
            'text-xs font-mono',
            expired ? 'text-red-400' : underDay ? 'text-amber-400' : 'text-emerald-400'
        )}>
            {expired ? 'Expired' : `Expires ${formatDistanceToNow(expiry, { addSuffix: true })}`}
        </span>
    );
}

// ─── Token generator card (shows inside the dialog for Major Events) ────────

function TokenGeneratorCard({ eventId, onTokenGenerated }: { eventId?: string; onTokenGenerated?: (token: string) => void }) {
    const [label, setLabel] = useState('');
    const [expiryDays, setExpiryDays] = useState<string>('7');
    const [generatedToken, setGeneratedToken] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!eventId) {
            toast({ variant: 'destructive', title: 'Save event first', description: 'Publish the event before generating a token.' });
            return;
        }
        setLoading(true);
        try {
            const result = await generateToken(eventId, label || undefined, parseInt(expiryDays));
            if (result.success && result.data) {
                setGeneratedToken(result.data.token);
                setExpiresAt(result.data.expiresAt);
                onTokenGenerated?.(result.data.token);
                toast({ title: 'Token Generated', description: 'Share this connection string with sub-event admins.' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (generatedToken) {
            navigator.clipboard.writeText(generatedToken);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
                <Key className="h-4 w-4" />
                <span className="text-sm font-semibold">Connection Token</span>
            </div>
            <p className="text-xs text-muted-foreground">
                Generate a token to share with sub-event admins. They paste it to connect their event.
            </p>
            <div className="grid gap-3">
                <div className="grid gap-1.5">
                    <Label className="text-xs">Token Label (optional)</Label>
                    <Input
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                        placeholder="e.g. Batch 1 — CSE classes"
                        className="h-8 text-sm"
                    />
                </div>
                <div className="grid gap-1.5">
                    <Label className="text-xs">Expiry</Label>
                    <Select value={expiryDays} onValueChange={setExpiryDays}>
                        <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    type="button"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={loading || !eventId}
                    className="gap-2 gradient-success border-0"
                >
                    {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Key className="h-3 w-3" />}
                    {loading ? 'Generating...' : 'Generate Token'}
                </Button>
                {generatedToken && (
                    <div className="space-y-1.5 animate-fade-in">
                        <Label className="text-xs">Connection String</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                value={generatedToken}
                                readOnly
                                className="h-8 text-xs font-mono bg-muted/30"
                            />
                            <Button type="button" size="sm" variant="outline" className="h-8 px-2 shrink-0" onClick={handleCopy}>
                                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </Button>
                        </div>
                        <TokenCountdown expiresAt={expiresAt} />
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Major Event Success modal ──────────────────────────────────────────

function MajorEventSuccessDialog({ eventId, open, onOpenChange }: {
    eventId: string;
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    const router = useRouter();

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-[95vw] sm:max-w-md border-emerald-500/20 bg-[#09090b] shadow-2xl shadow-emerald-900/20 p-4 sm:p-6">
                <AlertDialogHeader>
                    <div className="flex justify-center mb-2">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                            <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 fill-emerald-400/20" />
                        </div>
                    </div>
                    <AlertDialogTitle className="text-center text-lg sm:text-xl font-bold text-emerald-50">Major Event Published!</AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-muted-foreground pt-1 text-xs sm:text-sm">
                        Your major event is live. Now you need to connect sub-events to start aggregating data.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="bg-emerald-500/5 rounded-lg p-3 sm:p-4 my-3 sm:my-4 border border-emerald-500/10">
                    <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2 text-emerald-400 mb-1.5">
                        <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Next Step: Generate Keys
                    </h4>
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                        Go to the <strong>Manage Connections</strong> page to generate connection tokens. Share these with other event admins to link their events.
                    </p>
                </div>

                <AlertDialogFooter className="flex-col sm:flex-row sm:justify-center gap-2">
                    <AlertDialogCancel className="w-full sm:w-auto bg-white/5 border-white/10 hover:bg-white/10 text-white h-9 px-4 text-xs sm:text-sm">
                        Maybe Later
                    </AlertDialogCancel>
                    <Button
                        onClick={() => {
                            onOpenChange(false);
                            router.push(`/dashboard/events/${eventId}/connections`);
                        }}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white border-0 h-9 px-4 shadow-lg shadow-emerald-900/20 text-xs sm:text-sm"
                    >
                        Go to Connections
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// ─── Connect to Major Event modal ──────────────────────────────────────────

function ConnectModal({ event, onSuccess, open, onOpenChange }: {
    event: Event;
    onSuccess: (majorEventName: string, majorEventId: string, connectionId: string) => void;
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { toast } = useToast();

    const handleConnect = async () => {
        if (!token.trim()) { setError('Please paste a connection string'); return; }
        setLoading(true);
        setError('');
        try {
            const result = await connectSubEvent(token.trim(), event.id);
            if (result.success && result.data) {
                toast({ title: 'Connection Requested', description: `Pending approval from "${result.data.majorEventName}" admin.` });
                onSuccess(result.data.majorEventName, result.data.majorEventId, result.data.connectionId);
                onOpenChange(false);
                setToken('');
            } else {
                setError(result.error || 'Failed to connect');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-sm border-white/10 bg-zinc-950/95 backdrop-blur-xl p-5 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl"><Network className="h-5 w-5 text-emerald-400" /> Connect to Major Event</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        Link "{event.name}" to a major event to aggregate your data.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="token" className="text-xs sm:text-sm">Connection Token</Label>
                        <Input
                            id="token"
                            placeholder="Paste the token here..."
                            value={token}
                            onChange={(e) => { setToken(e.target.value); setError(''); }}
                            className="bg-white/5 border-white/10"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Ask the Major Event admin for a connection token.
                        </p>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto border-white/10 text-xs sm:text-sm">Cancel</Button>
                    <Button onClick={handleConnect} disabled={loading} className="w-full sm:w-auto gap-2 gradient-success border-0 h-9 text-xs sm:text-sm">
                        {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                        Connect Now
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EventsPage() {

    const [events, setEvents] = useState<Event[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [isStudentsLoading, setIsStudentsLoading] = useState(false);
    const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [adminSlug, setAdminSlug] = useState<string | null>(null);
    const [publishedEventId, setPublishedEventId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [cost, setCost] = useState('');
    const [deadline, setDeadline] = useState<Date | undefined>(new Date());
    const [category, setCategory] = useState<'Normal' | 'Print' | 'MajorEvent'>('Normal');
    const [paymentOptions, setPaymentOptions] = useState<string[]>(['Razorpay']);
    const [selectedQrCode, setSelectedQrCode] = useState<string>('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSelectionDialogOpen, setIsSelectionDialogOpen] = useState(false);

    // Connection modal state
    const [connectingEvent, setConnectingEvent] = useState<Event | null>(null);
    const [disconnectingConnection, setDisconnectingConnection] = useState<{ eventId: string; connectionId: string; majorEventName: string } | null>(null);

    const filteredStudents = filterStudents(students, searchQuery);

    useEffect(() => {
        async function checkRole() {
            const adminRes = await getCurrentAdmin();
            if (adminRes.success && adminRes.data) {
                if (adminRes.data.role === 'superadmin') {
                    router.replace('/dashboard/super');
                    return;
                }
                setUserRole(adminRes.data.role);
                setAdminSlug(adminRes.data.slug);
            }
        }
        checkRole();
        fetchData();
    }, []);

    const fetchStudents = async () => {
        if (students.length > 0) return; // Already fetched
        setIsStudentsLoading(true);
        try {
            const res = await getStudents();
            if (res.success && res.students) {
                setStudents(res.students as unknown as Student[]);
            }
        } finally {
            setIsStudentsLoading(false);
        }
    };

    const fetchData = async (isBackground = false) => {
        if (!isBackground) setIsLoading(true);
        const [eventsRes, qrRes, adminRes] = await Promise.all([
            getEvents(),
            getQrCodes(),
            getCurrentAdmin()
        ]);

        if (eventsRes.success && eventsRes.data) setEvents(eventsRes.data as unknown as Event[]);
        if (qrRes.success) setQrCodes(qrRes.data as QrCode[]);
        if (adminRes.success && adminRes.data) setAdminSlug(adminRes.data.slug);
        setIsLoading(false);
    };

    const isMajorEvent = category === 'MajorEvent';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !description || !deadline) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields' });
            return;
        }
        if (!isMajorEvent && !cost) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a cost per student' });
            return;
        }

        const eventData = {
            name,
            description,
            cost: isMajorEvent ? 0 : parseFloat(cost),
            deadline: deadline.toISOString(),
            category,
            paymentOptions: isMajorEvent ? [] : paymentOptions,
            qrCodeUrl: isMajorEvent ? undefined : selectedQrCode,
            selectedStudents: isMajorEvent ? [] : selectedStudents,
            isMajorEvent,
        };

        const optimisticEventBase = {
            name,
            description,
            cost: eventData.cost,
            deadline: deadline.toISOString(),
            category,
            paymentOptions: eventData.paymentOptions,
            qrCodeUrl: eventData.qrCodeUrl,
            participantIds: eventData.selectedStudents,
            status: 'PUBLISHED',
            participantCount: selectedStudents.length,
            updatedAt: new Date().toISOString(),
            isMajorEvent,
        };

        let result;
        if (editingEvent?.id) {
            setEvents(events.map(e => e.id === editingEvent.id ? { ...e, ...optimisticEventBase } as Event : e));
            setIsDialogOpen(false);
            result = await updateEvent(editingEvent.id, eventData);
        } else {
            setIsDialogOpen(false);
            result = await createEvent(eventData);
        }

        if (result.success) {
            toast({
                title: editingEvent ? 'Event Updated' : 'Event Published',
                description: `${name} has been ${editingEvent ? 'updated' : 'published'} successfully`,
            });
            if (!editingEvent && result.data && isMajorEvent) {
                setPublishedEventId((result.data as any).id);
            }
            resetForm();
            fetchData(true);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
            if (editingEvent?.id) fetchData(true);
        }
    };

    const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);

    const handleDelete = (event: Event) => setDeletingEvent(event);

    const confirmDelete = async () => {
        if (!deletingEvent) return;
        const previousEvents = [...events];
        setEvents(events.filter(e => e.id !== deletingEvent.id));
        const result = await deleteEvent(deletingEvent.id);
        if (result.success) {
            toast({ title: 'Event Deleted', description: 'Event has been deleted successfully' });
        } else {
            setEvents(previousEvents);
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setDeletingEvent(null);
    };

    const handleEdit = (event: Event) => {
        fetchStudents();
        setEditingEvent(event);
        setName(event.name);
        setDescription(event.description);
        setCost(event.cost.toString());
        setDeadline(new Date(event.deadline));
        setCategory((event.isMajorEvent ? 'MajorEvent' : event.category) as 'Normal' | 'Print' | 'MajorEvent');
        setPaymentOptions(event.paymentOptions);
        setSelectedQrCode(event.qrCodeUrl || '');
        setSelectedStudents(event.participantIds || []);
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setEditingEvent(null);
        setName('');
        setDescription('');
        setCost('');
        setDeadline(new Date());
        setCategory('Normal');
        setPaymentOptions(['Razorpay']);
        setSelectedQrCode('');
        setSelectedStudents(students.map(s => s.id));
        setSearchQuery('');
        setPublishedEventId(null);
    };

    const handleCopyPaymentLink = (event: Event) => {
        copyPaymentLink(event, window.location.origin);
        toast({ title: 'Link Copied', description: 'Payment link copied to clipboard' });
    };

    const handleSharePortal = () => {
        if (!adminSlug) {
            toast({ variant: 'destructive', title: 'Portal Not Configured', description: 'Please set up your student portal link in Settings before sharing.' });
            return;
        }
        const url = `${window.location.origin}/check-status/${adminSlug}`;
        navigator.clipboard.writeText(url);
        toast({ title: 'Link Copied', description: 'Student portal link copied to clipboard!' });
    };

    const handleConnectSuccess = (majorEventName: string, majorEventId: string, connectionId: string, subEventId: string) => {
        setEvents(prev => prev.map(e => e.id === subEventId
            ? { ...e, activeConnection: { id: connectionId, status: 'PENDING', majorEventName, majorEventId } }
            : e
        ));
        setConnectingEvent(null);
    };

    const handleDisconnect = async () => {
        if (!disconnectingConnection) return;
        const result = await disconnectSubEvent(disconnectingConnection.connectionId);
        if (result.success) {
            toast({ title: 'Disconnected', description: 'Successfully disconnected from the Major Event.' });
            setEvents(prev => prev.map(e => e.id === disconnectingConnection.eventId
                ? { ...e, activeConnection: null }
                : e
            ));
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setDisconnectingConnection(null);
    };

    if (isLoading) return <PageLoader message="Loading events..." />;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Events</h2>
                    <p className="text-muted-foreground mt-0.5 md:mt-1 text-sm md:text-base">
                        Manage fund collection events and track payments
                    </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <Button
                        variant="ghost"
                        onClick={handleSharePortal}
                        className={cn(
                            "gap-2 bg-white/5 border border-white/10 flex-1 md:flex-none transition-opacity h-10",
                            !adminSlug ? "opacity-40 hover:bg-white/5" : "hover:bg-white/10"
                        )}
                    >
                        <Share2 className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline">Share Portal</span>
                        <span className="sm:hidden">Share</span>
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        if (!open) fetchData(true);
                        else fetchStudents();
                        setIsDialogOpen(open);
                    }}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm} className="gap-2 gradient-success w-full md:w-auto border-0 shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 transition-all duration-300">
                                <Plus className="h-4 w-4" />
                                Create Event
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
                                    <DialogDescription>
                                        {editingEvent ? 'Update event details' : 'Create a new fund collection event'}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Event Name *</Label>
                                        <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Annual Day Fund" required />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Description *</Label>
                                        <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the event..." rows={3} required />
                                    </div>

                                    {/* Category */}
                                    <div className="grid gap-2">
                                        <Label>Category</Label>
                                        <div className="flex flex-wrap gap-4">
                                            {[
                                                { value: 'Normal', label: 'Normal' },
                                                { value: 'Print', label: 'Print' },
                                                { value: 'MajorEvent', label: 'Major Event' },
                                            ].map(opt => (
                                                <div key={opt.value} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`cat-${opt.value}`}
                                                        checked={category === opt.value}
                                                        onCheckedChange={() => setCategory(opt.value as any)}
                                                        className="rounded-sm"
                                                    />
                                                    <label htmlFor={`cat-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</label>
                                                </div>
                                            ))}
                                        </div>
                                        {isMajorEvent && (
                                            <div className="text-xs text-emerald-400/80 bg-emerald-500/10 rounded-md px-3 py-2 border border-emerald-500/20 space-y-1">
                                                <p>Events aggregate payment data from connected sub-events. No direct student payments.</p>
                                                <p className="font-medium text-emerald-300">After publishing, go to "Manage Connections" to generate tokens for sub-events.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Deadline *</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className={cn('justify-start text-left font-normal', !deadline && 'text-muted-foreground')}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {deadline ? format(deadline, 'PPP') : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={deadline}
                                                    onSelect={setDeadline}
                                                    disabled={date => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Fields hidden for Major Events */}
                                    {!isMajorEvent && (
                                        <>
                                            <div className="grid gap-2">
                                                <Label htmlFor="cost">Cost (₹) *</Label>
                                                <Input id="cost" type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" required />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label>Participants ({selectedStudents.length} selected)</Label>
                                                <div className="flex items-center justify-between border rounded-md p-3 bg-muted/20">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="main-select-all"
                                                            checked={selectedStudents.length === students.length && students.length > 0}
                                                            onCheckedChange={checked => {
                                                                if (checked) setSelectedStudents(students.map(s => s.id));
                                                                else setSelectedStudents([]);
                                                            }}
                                                        />
                                                        <label htmlFor="main-select-all" className="text-sm font-medium cursor-pointer">Select All</label>
                                                    </div>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => setIsSelectionDialogOpen(true)}>
                                                        Select Specific
                                                    </Button>
                                                </div>
                                            </div>

                                            <Dialog open={isSelectionDialogOpen} onOpenChange={setIsSelectionDialogOpen}>
                                                <DialogContent className="max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Select Participants</DialogTitle>
                                                        <DialogDescription>Search and select students for this event.</DialogDescription>
                                                    </DialogHeader>
                                                    <div className="py-4 space-y-4">
                                                        <Input placeholder="Search by name, class or roll no..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus />
                                                        <div className="border rounded-md p-3 max-h-[60vh] overflow-y-auto space-y-2">
                                                            <div className="flex items-center space-x-2 pb-2 border-b mb-2 sticky top-0 bg-background/95 backdrop-blur z-10">
                                                                <Checkbox
                                                                    id="modal-select-all"
                                                                    checked={selectedStudents.length === students.length && students.length > 0}
                                                                    onCheckedChange={checked => {
                                                                        if (checked) setSelectedStudents(students.map(s => s.id));
                                                                        else setSelectedStudents([]);
                                                                    }}
                                                                />
                                                                <label htmlFor="modal-select-all" className="text-sm font-medium cursor-pointer">Select All</label>
                                                            </div>
                                                            {isStudentsLoading ? (
                                                                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                                                                    <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
                                                                    <p className="text-sm text-muted-foreground">Loading student records...</p>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {filteredStudents.map((student) => (
                                                                        <div key={student.id} className="flex items-center space-x-2">
                                                                            <Checkbox
                                                                                id={`student-${student.id}`}
                                                                                checked={selectedStudents.includes(student.id)}
                                                                                onCheckedChange={checked => {
                                                                                    if (checked) setSelectedStudents([...selectedStudents, student.id]);
                                                                                    else setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                                                                }}
                                                                            />
                                                                            <label htmlFor={`student-${student.id}`} className="text-sm cursor-pointer flex-1">
                                                                                {student.name} <span className="text-muted-foreground text-xs">({student.class} - {student.rollNo})</span>
                                                                            </label>
                                                                        </div>
                                                                    ))}
                                                                    {filteredStudents.length === 0 && (
                                                                        <p className="text-sm text-muted-foreground text-center py-2">No students match your search.</p>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button type="button" onClick={() => setIsSelectionDialogOpen(false)}>Done</Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>

                                            <div className="grid gap-2">
                                                <Label>Payment Options</Label>
                                                <div className="flex gap-4">
                                                    {['Razorpay', 'QR', 'Cash'].map(option => (
                                                        <div key={option} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={option}
                                                                checked={paymentOptions.includes(option)}
                                                                onCheckedChange={checked => {
                                                                    if (checked) setPaymentOptions([...paymentOptions, option]);
                                                                    else setPaymentOptions(paymentOptions.filter(o => o !== option));
                                                                }}
                                                            />
                                                            <label htmlFor={option} className="text-sm cursor-pointer">{option}</label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {paymentOptions.includes('QR') && (
                                                <div className="grid gap-2 animate-fade-in">
                                                    <Label>Select Payment QR</Label>
                                                    <Select value={selectedQrCode} onValueChange={setSelectedQrCode}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Choose a QR code" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {qrCodes.length === 0 ? (
                                                                <div className="p-2 text-sm text-muted-foreground text-center">No QR codes found. Add one in Settings.</div>
                                                            ) : (
                                                                qrCodes.map(qr => (
                                                                    <SelectItem key={qr.id} value={qr.url}>{qr.name}</SelectItem>
                                                                ))
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <DialogFooter className="gap-2 sm:gap-0">
                                    <div className="flex gap-2 w-full justify-end">
                                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                        <Button type="submit">
                                            {editingEvent?.status === 'PUBLISHED' ? 'Update Event' : 'Publish Event'}
                                        </Button>
                                    </div>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Events Grid */}
            {events.length === 0 ? (
                <Card className="py-12">
                    <CardContent className="text-center">
                        <Wallet className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No Events Yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Create your first fund collection event to get started</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => {
                        const isMajor = event.isMajorEvent;
                        const conn = event.activeConnection;

                        return (
                            <GlassCard key={event.id} className={cn(
                                "group hover-lift relative overflow-hidden",
                                isMajor && "border-emerald-500/20 shadow-lg shadow-emerald-900/10 ring-1 ring-emerald-500/10"
                            )}>
                                <div className={cn(
                                    "absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 pointer-events-none transition-transform duration-700 group-hover:scale-150",
                                    isMajor
                                        ? "bg-gradient-to-br from-emerald-500/20 to-transparent"
                                        : "bg-gradient-to-br from-primary/10 to-transparent"
                                )} />

                                <CardHeader className="p-4 pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <CardTitle className={cn("text-lg truncate font-bold", (isMajor || true) && "text-emerald-50 drop-shadow-sm")}>{event.name}</CardTitle>
                                                {isMajor && (
                                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider shrink-0 h-5 flex items-center px-1.5 py-0">
                                                        <Network className="h-3 w-3 mr-1" /> Major
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardDescription className="mt-0.5 line-clamp-1 text-xs">{event.description}</CardDescription>
                                            {/* Connection status badge for sub-events */}
                                            {!isMajor && conn && (
                                                <div className="mt-2">
                                                    <Badge variant="outline" className={cn(
                                                        "text-xs",
                                                        conn.status === 'PENDING'
                                                            ? "border-amber-500/40 text-amber-400"
                                                            : "border-emerald-500/40 text-emerald-400"
                                                    )}>
                                                        <Network className="h-3 w-3 mr-1" />
                                                        {conn.status === 'PENDING' ? 'Pending connection to' : 'Connected to'} {conn.majorEventName}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 relative z-10 shrink-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {isMajor ? (
                                                    <>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/dashboard/events/${event.id}/analytics`}>
                                                                <BarChart2 className="mr-2 h-4 w-4" />
                                                                Analytics
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/dashboard/events/${event.id}/connections`}>
                                                                <Network className="mr-2 h-4 w-4" />
                                                                Manage Connections
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/dashboard/events/${event.id}/expenses`}>
                                                                <Wallet className="mr-2 h-4 w-4" />
                                                                Manage Expenses
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleEdit(event)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(event)} className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </>
                                                ) : (
                                                    <>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/dashboard/events/${event.id}/payments`}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Payments
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/dashboard/events/${event.id}/expenses`}>
                                                                <Wallet className="mr-2 h-4 w-4" />
                                                                Manage Expenses
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEdit(event)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleCopyPaymentLink(event)}>
                                                            <LinkIcon className="mr-2 h-4 w-4" />
                                                            Copy Payment Link
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {conn ? (
                                                            <DropdownMenuItem
                                                                onClick={() => setDisconnectingConnection({ eventId: event.id, connectionId: conn.id, majorEventName: conn.majorEventName })}
                                                                className="text-amber-400"
                                                            >
                                                                <Unplug className="mr-2 h-4 w-4" />
                                                                Disconnect from Major Event
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem onClick={() => setConnectingEvent(event)}>
                                                                <Plug className="mr-2 h-4 w-4" />
                                                                Connect to Major Event
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => handleDelete(event)} className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4 pt-2 space-y-3">
                                    {isMajor ? (
                                        // Major event card body
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2 text-[11px] pb-2 border-b border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Deadline</span>
                                                    <span className="font-semibold">{format(new Date(event.deadline), 'MMM dd, yyyy')}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-muted-foreground flex items-center gap-1 justify-end"><Network className="h-3 w-3" /> Sub-events</span>
                                                    <span className="font-bold text-emerald-400">{event.subEventCount || 0} Connected</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2 bg-emerald-500/5 p-2 rounded-md border border-emerald-500/10">
                                                <div className="flex items-center justify-between text-[10px]">
                                                    <span className="text-muted-foreground font-bold uppercase tracking-tight">Progress</span>
                                                    <span className="font-bold text-emerald-400">
                                                        {event.participantCount ? ((event.paidCount || 0) / event.participantCount * 100).toFixed(1) : '0'}%
                                                    </span>
                                                </div>
                                                <Progress value={event.participantCount ? ((event.paidCount || 0) / event.participantCount * 100) : 0} className="h-1 bg-white/5" />

                                                <div className="grid grid-cols-2 gap-2 pt-0.5">
                                                    <div className="flex flex-col">
                                                        <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-tight">Collected</span>
                                                        <span className="font-bold text-emerald-400 text-sm">₹{event.totalCollected?.toLocaleString('en-IN') || '0'}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-tight">Paid</span>
                                                        <span className="font-bold text-emerald-50 text-sm">{event.paidCount || 0} / {event.participantCount || 0}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-[10px] pt-0.5">
                                                <span className="text-muted-foreground uppercase font-bold tracking-tight">Category</span>
                                                <span className="text-emerald-500 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">Analytics Hub</span>
                                            </div>
                                            <div className="flex gap-2 pt-1">
                                                <Link href={`/dashboard/events/${event.id}/analytics`} className="flex-1">
                                                    <Button className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/30 h-8 text-xs font-semibold" size="sm">
                                                        <BarChart2 className="h-3.5 w-3.5" /> Analytics
                                                    </Button>
                                                </Link>
                                                <Link href={`/dashboard/events/${event.id}/connections`} className="flex-1">
                                                    <Button className="w-full gap-1.5 border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400 h-8 text-xs font-semibold" variant="outline" size="sm">
                                                        <Network className="h-3.5 w-3.5" /> Connections
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                        // Regular event card body (Redesigned to match Major Event style)
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2 text-[11px] pb-2 border-b border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-muted-foreground">Cost per student</span>
                                                    <span className="font-bold text-emerald-400 text-base">₹{event.cost.toLocaleString('en-IN')}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-muted-foreground flex items-center gap-1 justify-end"><Clock className="h-3 w-3" /> Deadline</span>
                                                    <span className="font-semibold text-emerald-100">{format(new Date(event.deadline), 'MMM dd, yyyy')}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2 bg-emerald-500/5 p-2 rounded-md border border-emerald-500/10">
                                                <div className="flex items-center justify-between text-[10px]">
                                                    <span className="text-muted-foreground font-bold uppercase tracking-tight">Progress</span>
                                                    <span className="font-bold text-emerald-400">{getCollectionProgress(event, students).toFixed(1)}%</span>
                                                </div>
                                                <Progress value={getCollectionProgress(event, students)} className="h-1 bg-white/5" />

                                                <div className="grid grid-cols-2 gap-2 pt-0.5">
                                                    <div className="flex flex-col">
                                                        <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-tight">Collected</span>
                                                        <span className="font-bold text-emerald-400 text-sm">₹{event.totalCollected?.toLocaleString('en-IN') || '0'}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-tight">Paid</span>
                                                        <span className="font-bold text-emerald-50 text-sm">{event.paidCount || 0} / {event.participantCount || 0}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-1">
                                                <Link href={`/dashboard/events/${event.id}/payments`} className="w-full block">
                                                    <Button className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/30 h-8 text-xs font-semibold">
                                                        <Eye className="h-3.5 w-3.5" /> View Payments
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </GlassCard>
                        );
                    })}
                </div>
            )}

            {/* Connect to Major Event Modal */}
            {connectingEvent && (
                <ConnectModal
                    event={connectingEvent}
                    open={!!connectingEvent}
                    onOpenChange={open => !open && setConnectingEvent(null)}
                    onSuccess={(name, id, connId) => handleConnectSuccess(name, id, connId, connectingEvent.id)}
                />
            )}

            {/* Disconnect confirmation */}
            <AlertDialog open={!!disconnectingConnection} onOpenChange={open => !open && setDisconnectingConnection(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect from Major Event?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove your event from <strong>{disconnectingConnection?.majorEventName}</strong>. The Major Event admin will be notified. Your event continues to function normally.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDisconnect} className="bg-amber-600 hover:bg-amber-700 text-white">
                            Disconnect
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Major Event Success Dialog */}
            <MajorEventSuccessDialog
                eventId={publishedEventId || ''}
                open={!!publishedEventId}
                onOpenChange={(open) => !open && setPublishedEventId(null)}
            />

            <DeleteConfirmationDialog
                open={!!deletingEvent}
                onOpenChange={open => !open && setDeletingEvent(null)}
                title={`Delete ${deletingEvent?.name}?`}
                description={
                    <span>
                        This action cannot be undone. This will permanently delete the event <strong>{deletingEvent?.name}</strong> and all associated payments and records.
                    </span>
                }
                confirmationString={deletingEvent?.name || ''}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
