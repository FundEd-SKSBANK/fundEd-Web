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
import { Plus, Trash2, Pencil, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
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
    eventId?: string;
    recorder?: {
        name: string | null;
    } | null;
}

interface ExpenseTableProps {
    expenses: Expense[];
    eventId: string;
    onUpdate: () => void;
}

const CATEGORIES = ['General', 'Food', 'Transport', 'Logistics', 'Equipment', 'Decorations', 'Prizes', 'Marketing', 'Other'];

export function ExpenseTable({ expenses, eventId, onUpdate }: ExpenseTableProps) {
    const { toast } = useToast();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form States
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('General');
    const [date, setDate] = useState<Date | undefined>(new Date());

    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    const resetForm = () => {
        setTitle('');
        setAmount('');
        setCategory('General');
        setDate(new Date());
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
            eventId
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
            date
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
                    <DialogContent className="sm:max-w-[425px] bg-black/95 border-white/10 backdrop-blur-xl">
                        <DialogHeader>
                            <DialogTitle>Add New Expense</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddExpense} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Refreshments"
                                    required
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Amount (₹)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    required
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="bg-white/5 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start text-left font-normal bg-white/5 border-white/10',
                                                !date && 'text-muted-foreground'
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, 'PPP') : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
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
                    <DialogContent className="sm:max-w-[425px] bg-black/95 border-white/10 backdrop-blur-xl">
                        <DialogHeader>
                            <DialogTitle>Edit Expense</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdateExpense} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Amount (₹)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="bg-white/5 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start text-left font-normal bg-white/5 border-white/10',
                                                !date && 'text-muted-foreground'
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, 'PPP') : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
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
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead className="text-stone-400">Date</TableHead>
                            <TableHead className="text-stone-400">Title</TableHead>
                            <TableHead className="text-stone-400">Category</TableHead>
                            <TableHead className="text-stone-400">Recorded By</TableHead>
                            <TableHead className="text-right text-stone-400">Amount</TableHead>
                            <TableHead className="text-right text-stone-400">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expenses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-stone-500">
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
                                    <TableCell className="text-stone-500 text-sm">
                                        {expense.recorder?.name || 'Unknown'}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-red-400">
                                        -₹{expense.amount.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
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
    );
}
