'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateStudent } from '@/actions/students';
import type { Student } from '@/lib/types';

interface EditStudentDialogProps {
    student: Student | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function EditStudentDialog({ student, open, onOpenChange, onSuccess }: EditStudentDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        rollNumber: '',
        class: '',
        email: '',
        phone: '',
    });

    useEffect(() => {
        if (student) {
            setFormData({
                name: student.name,
                rollNumber: student.rollNo,
                class: student.class || '',
                email: student.email || '',
                phone: '', // Phone is not often exposed in basic type but we can keep it blank or populated if we had it
            });
        }
    }, [student]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!student) return;

        if (!formData.name || !formData.rollNumber || !formData.class) {
            toast({
                title: 'Error',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        // Validate Email
        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                toast({
                    title: 'Invalid Email',
                    description: 'Please enter a valid email address (e.g., student@example.com).',
                    variant: 'destructive',
                });
                return;
            }
        }

        // Validate Phone
        if (formData.phone) {
            const phoneDigits = formData.phone.replace(/\D/g, '');
            if (phoneDigits.length < 10) {
                toast({
                    title: 'Invalid Phone Number',
                    description: 'Please enter a valid phone number with at least 10 digits.',
                    variant: 'destructive',
                });
                return;
            }
        }

        setLoading(true);

        try {
            const result = await updateStudent({
                id: student.id,
                name: formData.name,
                rollNumber: formData.rollNumber,
                class: formData.class,
                email: formData.email || undefined,
                phone: formData.phone || undefined,
            });

            if (result.success) {
                toast({
                    title: 'Success',
                    description: `${formData.name} has been updated successfully.`,
                });

                onOpenChange(false);

                if (onSuccess) {
                    onSuccess();
                }
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'An error occurred while updating the student.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error updating student:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Student Details</DialogTitle>
                    <DialogDescription>
                        Update the details for this student. Required fields are marked with *.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">
                                Student Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="edit-name"
                                placeholder="Enter student name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        {/* Roll Number */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-rollNumber">
                                Roll Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="edit-rollNumber"
                                placeholder="Enter roll number"
                                value={formData.rollNumber}
                                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                                required
                            />
                        </div>

                        {/* Class */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-class">
                                Class / Grade <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="edit-class"
                                placeholder="Enter class (e.g. 10A)"
                                value={formData.class}
                                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email (Optional)</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                placeholder="student@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">Phone Number (Optional)</Label>
                            <Input
                                id="edit-phone"
                                type="tel"
                                placeholder="+91 98765 43210"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="gradient-primary"
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
