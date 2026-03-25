'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pencil, Calendar as CalendarIcon, Loader2, HandCoins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { createAdditionalRevenue, deleteAdditionalRevenue, updateAdditionalRevenue } from '@/actions/expenses';

interface AdditionalRevenue {
    id: string;
    title: string;
    amount: number;
    source: string;
    date: Date;
    note?: string | null;
    eventId: string;
    recorder?: {
        name: string | null;
    } | null;
}

interface AdditionalRevenuePanelProps {
    revenues: AdditionalRevenue[];
    eventId: string;
    onUpdate: () => void;
}

const INCOME_SOURCES = ['Tutors', 'Sponsors', 'Donations', 'College Fund', 'Class Fund', 'Other'];

export function AdditionalRevenuePanel({ revenues, eventId, onUpdate }: AdditionalRevenuePanelProps) {
    const { toast } = useToast();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form States
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [source, setSource] = useState('Other');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [note, setNote] = useState('');

    const [editingRevenue, setEditingRevenue] = useState<AdditionalRevenue | null>(null);

    const resetForm = () => {
        setTitle('');
        setAmount('');
        setSource('Other');
        setDate(new Date());
        setNote('');
        setEditingRevenue(null);
    };

    const handleAddRevenue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !amount || !date) return;

        setIsSubmitting(true);
        const res = await createAdditionalRevenue({
            title,
            amount: parseFloat(amount),
            source,
            date,
            eventId,
            note: note || undefined,
        });

        if (res.success) {
            toast({ title: 'Success', description: 'Income added successfully' });
            setIsAddOpen(false);
            resetForm();
            onUpdate();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to add income' });
        }
        setIsSubmitting(false);
    };

    const startEdit = (revenue: AdditionalRevenue) => {
        setEditingRevenue(revenue);
        setTitle(revenue.title);
        setAmount(revenue.amount.toString());
        setSource(revenue.source);
        setDate(new Date(revenue.date));
        setNote(revenue.note || '');
        setIsEditOpen(true);
    };

    const handleUpdateRevenue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRevenue || !title || !amount || !date) return;

        setIsSubmitting(true);
        const res = await updateAdditionalRevenue(editingRevenue.id, eventId, {
            title,
            amount: parseFloat(amount),
            source,
            date,
            note: note || null,
        });

        if (res.success) {
            toast({ title: 'Success', description: 'Income updated successfully' });
            setIsEditOpen(false);
            resetForm();
            onUpdate();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to update income' });
        }
        setIsSubmitting(false);
    };

    const handleDeleteRevenue = async (id: string) => {
        const res = await deleteAdditionalRevenue(id, eventId);
        if (res.success) {
            toast({ title: 'Success', description: 'Income deleted successfully' });
            onUpdate();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to delete income' });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <HandCoins className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span>Additional Income Sources</span>
                </h3>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" /> Add Income
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[440px] w-[calc(100%-2rem)] bg-black/95 border-white/10 backdrop-blur-xl max-h-[90dvh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add Additional Income</DialogTitle>
                            <DialogDescription className="sr-only">
                                Form to add a new additional income source.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddRevenue} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Class fund or other" required className="bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Amount (₹)</label>
                                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required className="bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Source</label>
                                <Select value={source} onValueChange={setSource}>
                                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                    <SelectContent>{INCOME_SOURCES.map(src => <SelectItem key={src} value={src}>{src}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn('w-full justify-start text-left font-normal bg-white/5 border-white/10', !date && 'text-muted-foreground')}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, 'PPP') : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Note <span className="text-stone-500">(optional)</span></label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Any extra details..."
                                    rows={2}
                                    className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-stone-600 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Add Income
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[440px] w-[calc(100%-2rem)] bg-black/95 border-white/10 backdrop-blur-xl max-h-[90dvh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Income Entry</DialogTitle>
                            <DialogDescription className="sr-only">
                                Form to edit an existing income entry.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdateRevenue} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Amount (₹)</label>
                                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Source</label>
                                <Select value={source} onValueChange={setSource}>
                                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                    <SelectContent>{INCOME_SOURCES.map(src => <SelectItem key={src} value={src}>{src}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn('w-full justify-start text-left font-normal bg-white/5 border-white/10', !date && 'text-muted-foreground')}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, 'PPP') : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Note <span className="text-stone-500">(optional)</span></label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={2}
                                    className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-stone-600 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border border-white/10 bg-white/5">
                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-white/5">
                    {revenues.length === 0 ? (
                        <div className="h-24 flex items-center justify-center text-stone-500 text-sm">
                            No additional income recorded yet.
                        </div>
                    ) : (
                        revenues.map((rev) => (
                            <div key={rev.id} className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-stone-200 truncate">{rev.title}</p>
                                        <p className="text-xs text-stone-500 mt-0.5">{format(new Date(rev.date), 'dd/MM/yy hh:mm a').toUpperCase()}</p>
                                    </div>
                                    <span className="font-semibold text-emerald-400 shrink-0 text-sm">+₹{rev.amount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-stone-400">
                                        {rev.source}
                                    </span>
                                    {rev.note && (
                                        <span className="text-xs text-stone-500 truncate max-w-[180px]" title={rev.note}>
                                            📝 {rev.note}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-white" onClick={() => startEdit(rev)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-black/95 border-white/10 backdrop-blur-xl w-[calc(100%-2rem)]">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Income Entry?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete this income entry? This cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10">Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteRevenue(rev.id)} className="bg-red-600 hover:bg-red-700">
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-white/5">
                                <TableHead className="text-stone-400">Date</TableHead>
                                <TableHead className="text-stone-400">Title</TableHead>
                                <TableHead className="text-stone-400">Source</TableHead>
                                <TableHead className="text-stone-400">Note</TableHead>
                                <TableHead className="text-right text-stone-400">Amount</TableHead>
                                <TableHead className="text-right text-stone-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {revenues.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-stone-500">
                                        No additional income recorded yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                revenues.map((rev) => (
                                    <TableRow key={rev.id} className="border-white/10 hover:bg-white/5">
                                        <TableCell className="text-stone-400">
                                            {format(new Date(rev.date), 'dd/MM/yy hh:mm a').toUpperCase()}
                                        </TableCell>
                                        <TableCell className="font-medium text-stone-200">
                                            {rev.title}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-stone-400">
                                                {rev.source}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-stone-400 max-w-[160px]">
                                            {rev.note ? (
                                                <span className="block truncate text-sm" title={rev.note}>{rev.note}</span>
                                            ) : (
                                                <span className="text-stone-600 text-xs">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-emerald-400">
                                            +₹{rev.amount.toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-white" onClick={() => startEdit(rev)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="bg-black/95 border-white/10 backdrop-blur-xl">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Income Entry?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete this income entry?
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10">Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteRevenue(rev.id)} className="bg-red-600 hover:bg-red-700">
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
