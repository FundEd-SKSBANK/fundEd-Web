'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface DeleteConfirmationDialogProps {
    trigger?: React.ReactNode;
    title?: string;
    description: React.ReactNode;
    confirmationString: string;
    onConfirm: () => Promise<void> | void;
    isDeleting?: boolean;
    className?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function DeleteConfirmationDialog({
    trigger,
    title = "Are you absolutely sure?",
    description,
    confirmationString,
    onConfirm,
    isDeleting = false,
    className,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
}: DeleteConfirmationDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled && controlledOnOpenChange ? controlledOnOpenChange : setInternalOpen;

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setInputValue(''); // Reset input when closing
        }
        setOpen(newOpen);
    };

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue !== confirmationString) return;

        await onConfirm();
        if (!isControlled) {
            setOpen(false);
        }
    };

    const isMatch = inputValue === confirmationString;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {trigger && (
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
            )}
            <DialogContent className={cn("sm:max-w-[425px]", className)}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="text-foreground">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="confirmation-input" className="text-sm font-medium">
                            To confirm, type <span className="font-bold select-all bg-muted px-1 rounded">{confirmationString}</span> in the box below
                        </Label>
                        <Input
                            id="confirmation-input"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="font-mono text-sm"
                            placeholder={confirmationString}
                            autoComplete="off"
                            disabled={isDeleting}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => handleOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!isMatch || isDeleting}
                        className="w-full sm:w-auto"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
