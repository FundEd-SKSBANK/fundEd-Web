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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAdmins, createUser, deleteUser, updateUser } from '@/actions/users';
import { Pencil } from 'lucide-react';

function getInitials(email?: string | null, name?: string | null): string {
    if (name) {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return name.slice(0, 2).toUpperCase();
    }
    if (!email) return 'AD';
    const local = email.split('@')[0];
    const segments = local.split(/[.\-_]/);
    if (segments.length >= 2) return (segments[0][0] + segments[1][0]).toUpperCase();
    return local.slice(0, 2).toUpperCase();
}

interface AdminUser {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
    createdAt: Date;
}

export function AdminManagementTable() {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    // Add Admin Form State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminName, setNewAdminName] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');

    // Edit Admin Form State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadAdmins();
    }, []);

    async function loadAdmins() {
        setLoading(true);
        const res = await getAdmins();
        if (res.success && res.data) {
            setAdmins(res.data as AdminUser[]);
        } else {
            toast({
                title: "Error",
                description: "Failed to load admins",
                variant: "destructive"
            });
        }
        setLoading(false);
    }

    async function handleAddAdmin(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        const res = await createUser({
            name: newAdminName,
            email: newAdminEmail,
            password: newAdminPassword,
            role: 'admin'
        });

        if (res.success) {
            toast({
                title: "Success",
                description: "Admin created successfully"
            });
            setIsAddOpen(false);
            setNewAdminName('');
            setNewAdminEmail('');
            setNewAdminPassword('');
            loadAdmins();
        } else {
            toast({
                title: "Error",
                description: res.error || "Failed to create admin",
                variant: "destructive"
            });
        }
        setIsSubmitting(false);
    }

    const startEdit = (admin: AdminUser) => {
        setEditingAdmin(admin);
        setEditName(admin.name || '');
        setEditEmail(admin.email);
        setEditPassword('');
        setIsEditOpen(true);
    };

    async function handleUpdateAdmin(e: React.FormEvent) {
        e.preventDefault();
        if (!editingAdmin) return;
        setIsSubmitting(true);

        const res = await updateUser({
            id: editingAdmin.id,
            name: editName,
            email: editEmail,
            password: editPassword
        });

        if (res.success) {
            toast({
                title: "Success",
                description: "Admin updated successfully"
            });
            setIsEditOpen(false);
            setEditingAdmin(null);
            loadAdmins();
        } else {
            toast({
                title: "Error",
                description: res.error || "Failed to update admin",
                variant: "destructive"
            });
        }
        setIsSubmitting(false);
    }

    async function handleDeleteAdmin(id: string) {
        const res = await deleteUser(id);
        if (res.success) {
            toast({
                title: "Success",
                description: "Admin deleted successfully"
            });
            loadAdmins();
        } else {
            toast({
                title: "Error",
                description: res.error || "Failed to delete admin",
                variant: "destructive"
            });
        }
    }

    const filteredAdmins = admins.filter(admin =>
    (admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search admins..."
                        className="pl-8 bg-white/5 border-white/10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Plus className="mr-2 h-4 w-4" /> Add Admin
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-black/95 border-white/10 backdrop-blur-xl">
                        <DialogHeader>
                            <DialogTitle>Add New Admin</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddAdmin} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    value={newAdminName}
                                    onChange={(e) => setNewAdminName(e.target.value)}
                                    required
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    type="email"
                                    value={newAdminEmail}
                                    onChange={(e) => setNewAdminEmail(e.target.value)}
                                    required
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password</label>
                                <Input
                                    type="password"
                                    value={newAdminPassword}
                                    onChange={(e) => setNewAdminPassword(e.target.value)}
                                    required
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Admin
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[425px] bg-black/95 border-white/10 backdrop-blur-xl">
                        <DialogHeader>
                            <DialogTitle>Edit Admin</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdateAdmin} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    required
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    required
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">New Password (Optional)</label>
                                <Input
                                    type="password"
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                    placeholder="Leave blank to keep current"
                                    className="bg-white/5 border-white/10"
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
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead className="text-stone-400">Admin</TableHead>
                            <TableHead className="text-stone-400">Role</TableHead>
                            <TableHead className="text-stone-400">Joined</TableHead>
                            <TableHead className="text-right text-stone-400">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : filteredAdmins.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-stone-500">
                                    No admins found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAdmins.map((admin) => (
                                <TableRow key={admin.id} className="border-white/10 hover:bg-white/5">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 ring-1 ring-emerald-500/20">
                                                {admin.image ? (
                                                    <AvatarImage src={admin.image} />
                                                ) : null}
                                                <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                                                    {getInitials(admin.email, admin.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-stone-200">{admin.name}</span>
                                                <span className="text-xs text-stone-500">{admin.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                                            {admin.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-stone-400">
                                        {new Date(admin.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-white" onClick={() => startEdit(admin)}>
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
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the admin account
                                                            and remove their data from our servers.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10">Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteAdmin(admin.id)} className="bg-red-600 hover:bg-red-700">
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
