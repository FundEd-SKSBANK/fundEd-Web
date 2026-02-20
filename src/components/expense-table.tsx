'use client';

import { useState, useRef } from 'react';
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
import { Plus, Trash2, Pencil, Calendar as CalendarIcon, Loader2, Receipt, Download, X, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { createExpense, deleteExpense, updateExpense } from '@/actions/expenses';

interface Expense {
    id: string;
    title: string;
    amount: number;
    category: string;
    date: Date;
    billUrl?: string | null;
    note?: string | null;
    eventId?: string;
    recorder?: {
        name: string | null;
    } | null;
}

interface ExpenseTableProps {
    expenses: Expense[];
    eventId: string;
    eventName: string;
    onUpdate: () => void;
}

const CATEGORIES = ['General', 'Food', 'Transport', 'Logistics', 'Equipment', 'Decorations', 'Prizes', 'Marketing', 'Other'];

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function downloadWithWatermark(billUrl: string, eventName: string, category: string) {
    return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('Canvas not supported')); return; }

            // Draw image
            ctx.drawImage(img, 0, 0);

            // Watermark settings
            const fontSize = Math.max(18, Math.floor(img.width / 30));
            ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
            ctx.globalAlpha = 0.55;

            const text = 'fundEd';
            const padding = Math.floor(fontSize * 0.8);
            const textWidth = ctx.measureText(text).width;
            const x = img.width - textWidth - padding;
            const y = img.height - padding;

            // Shadow for readability
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowBlur = 6;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(text, x, y);

            ctx.globalAlpha = 1;

            // Build filename
            const safeName = eventName.trim().replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            const safeCat = category.trim().replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            const filename = `${safeName}-${safeCat}.png`;

            canvas.toBlob((blob) => {
                if (!blob) { reject(new Error('Failed to create blob')); return; }
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                resolve();
            }, 'image/png');
        };
        img.onerror = reject;
        img.src = billUrl;
    });
}

function BillViewerDialog({ expense, eventName }: { expense: Expense; eventName: string }) {
    const [open, setOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const { toast } = useToast();

    const handleDownload = async () => {
        if (!expense.billUrl) return;
        setDownloading(true);
        try {
            await downloadWithWatermark(expense.billUrl, eventName, expense.category);
            toast({ title: 'Downloaded', description: 'Bill downloaded with watermark.' });
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to download bill.' });
        }
        setDownloading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                    title="View Bill"
                >
                    <Receipt className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-black/95 border-white/10 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-emerald-400" />
                        Bill — {expense.title}
                    </DialogTitle>
                </DialogHeader>
                <div className="py-2">
                    <div className="rounded-lg overflow-hidden border border-white/10 bg-white/5 max-h-[65vh] flex items-center justify-center">
                        {expense.billUrl ? (
                            <img
                                src={expense.billUrl}
                                alt={`Bill for ${expense.title}`}
                                className="max-w-full max-h-[65vh] object-contain"
                            />
                        ) : (
                            <p className="text-stone-500 p-8">No bill image available.</p>
                        )}
                    </div>
                    <p className="text-xs text-stone-500 mt-2">
                        Category: <span className="text-stone-400">{expense.category}</span> · Amount: <span className="text-red-400">₹{expense.amount.toLocaleString()}</span>
                    </p>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {downloading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        Download Bill
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function BillUploadField({
    billUrl,
    onChange,
}: {
    billUrl: string | null;
    onChange: (val: string | null) => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const base64 = await fileToBase64(file);
        onChange(base64);
    };

    const handleRemove = () => {
        onChange(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">Bill / Receipt <span className="text-stone-500">(optional)</span></label>
            {billUrl ? (
                <div className="relative rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                    <img
                        src={billUrl}
                        alt="Bill preview"
                        className="w-full max-h-40 object-contain"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white hover:bg-red-600/80 transition-colors"
                        title="Remove bill"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ) : (
                <label
                    className="flex items-center gap-3 rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-3 cursor-pointer hover:bg-white/10 transition-colors"
                >
                    <Upload className="h-4 w-4 text-stone-400 shrink-0" />
                    <div>
                        <span className="text-sm text-stone-400">Click to upload bill image</span>
                        <span className="block text-xs text-stone-600">JPG, PNG, WEBP (optional)</span>
                    </div>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFile}
                    />
                </label>
            )}
        </div>
    );
}

export function ExpenseTable({ expenses, eventId, eventName, onUpdate }: ExpenseTableProps) {
    const { toast } = useToast();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form States
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('General');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [billUrl, setBillUrl] = useState<string | null>(null);
    const [note, setNote] = useState('');

    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    const resetForm = () => {
        setTitle('');
        setAmount('');
        setCategory('General');
        setDate(new Date());
        setBillUrl(null);
        setNote('');
        setEditingExpense(null);
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !amount || !date) return;

        setIsSubmitting(true);
        const res = await createExpense({
            title,
            amount: parseFloat(amount),
            category,
            date,
            eventId,
            billUrl: billUrl || undefined,
            note: note || undefined,
        });

        if (res.success) {
            toast({ title: 'Success', description: 'Expense added successfully' });
            setIsAddOpen(false);
            resetForm();
            onUpdate();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to add expense' });
        }
        setIsSubmitting(false);
    };

    const startEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setTitle(expense.title);
        setAmount(expense.amount.toString());
        setCategory(expense.category);
        setDate(new Date(expense.date));
        setBillUrl(expense.billUrl || null);
        setNote(expense.note || '');
        setIsEditOpen(true);
    };

    const handleUpdateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingExpense || !title || !amount || !date) return;

        setIsSubmitting(true);
        const res = await updateExpense(editingExpense.id, eventId, {
            title,
            amount: parseFloat(amount),
            category,
            date,
            billUrl: billUrl,
            note: note || null,
        });

        if (res.success) {
            toast({ title: 'Success', description: 'Expense updated successfully' });
            setIsEditOpen(false);
            resetForm();
            onUpdate();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to update expense' });
        }
        setIsSubmitting(false);
    };

    const handleDeleteExpense = async (id: string) => {
        const res = await deleteExpense(id, eventId);
        if (res.success) {
            toast({ title: 'Success', description: 'Expense deleted successfully' });
            onUpdate();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to delete expense' });
        }
    };


    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Expense History</h3>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Plus className="mr-2 h-4 w-4" /> Add Expense
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[440px] w-[calc(100%-2rem)] bg-black/95 border-white/10 backdrop-blur-xl max-h-[90dvh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New Expense</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddExpense} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Refreshments" required className="bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Amount (₹)</label>
                                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required className="bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                    <SelectContent>{CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
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
                            <BillUploadField billUrl={billUrl} onChange={setBillUrl} />
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Note <span className="text-stone-500">(optional)</span></label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="e.g. Paid via cash to vendor"
                                    rows={2}
                                    className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-stone-600 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Add Expense
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[440px] w-[calc(100%-2rem)] bg-black/95 border-white/10 backdrop-blur-xl max-h-[90dvh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Expense</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdateExpense} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Amount (₹)</label>
                                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                    <SelectContent>{CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
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
                            <BillUploadField billUrl={billUrl} onChange={setBillUrl} />
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Note <span className="text-stone-500">(optional)</span></label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="e.g. Paid via cash to vendor"
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
                    {expenses.length === 0 ? (
                        <div className="h-24 flex items-center justify-center text-stone-500 text-sm">
                            No expenses recorded yet.
                        </div>
                    ) : (
                        expenses.map((expense) => (
                            <div key={expense.id} className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-stone-200 truncate">{expense.title}</p>
                                        <p className="text-xs text-stone-500 mt-0.5">{format(new Date(expense.date), 'MMM dd, yyyy')}</p>
                                    </div>
                                    <span className="font-semibold text-red-400 shrink-0 text-sm">-₹{expense.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-stone-400">
                                        {expense.category}
                                    </span>
                                    {expense.note && (
                                        <span className="text-xs text-stone-500 truncate max-w-[180px]" title={expense.note}>
                                            📝 {expense.note}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-1">
                                        {expense.billUrl && (
                                            <BillViewerDialog expense={expense} eventName={eventName} />
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-white" onClick={() => startEdit(expense)}>
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
                                                    <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete this expense? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteExpense(expense.id)} className="bg-red-600 hover:bg-red-700">
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
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
                                <TableHead className="text-stone-400">Category</TableHead>
                                <TableHead className="text-stone-400">Note</TableHead>
                                <TableHead className="text-right text-stone-400">Amount</TableHead>
                                <TableHead className="text-center text-stone-400">Bill / Receipt</TableHead>
                                <TableHead className="text-right text-stone-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-stone-500">
                                        No expenses recorded yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                expenses.map((expense) => (
                                    <TableRow key={expense.id} className="border-white/10 hover:bg-white/5">
                                        <TableCell className="text-stone-400">
                                            {format(new Date(expense.date), 'MMM dd, yyyy')}
                                        </TableCell>
                                        <TableCell className="font-medium text-stone-200">
                                            {expense.title}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-stone-400">
                                                {expense.category}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-stone-400 max-w-[160px]">
                                            {expense.note ? (
                                                <span className="block truncate text-sm" title={expense.note}>{expense.note}</span>
                                            ) : (
                                                <span className="text-stone-600 text-xs">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-red-400">
                                            -₹{expense.amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {expense.billUrl ? (
                                                <BillViewerDialog expense={expense} eventName={eventName} />
                                            ) : (
                                                <span className="text-stone-600 text-xs">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-white" onClick={() => startEdit(expense)}>
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
                                                            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete this expense? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10">Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteExpense(expense.id)} className="bg-red-600 hover:bg-red-700">
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

