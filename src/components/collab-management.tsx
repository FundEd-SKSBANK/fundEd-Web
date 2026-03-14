'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, Edit } from 'lucide-react';
import { getUsers, createCollabUser, deleteUser, updateUser } from '@/actions/users';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

export function CollabManagement({ currentUserId }: { currentUserId: string }) {
  const { toast } = useToast();
  const [collabUsers, setCollabUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create/Edit Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  // Delete State
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const fetchCollabs = async () => {
    setIsLoading(true);
    const res = await getUsers();
    if (res.success && res.data) {
      // Filter out the admin themselves; only show collab users
      const collabs = res.data.filter((u: any) => u.id !== currentUserId && u.role === 'collab');
      setCollabUsers(collabs);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCollabs();
  }, [currentUserId]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setFormData({ name: user.name || '', email: user.email || '', password: '' });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || (!editingUser && !formData.password)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in required fields.' });
      return;
    }

    setIsSubmitting(true);
    let res;

    if (editingUser) {
      res = await updateUser({
        id: editingUser.id,
        name: formData.name,
        email: formData.email,
        password: formData.password || undefined // Only update if provided
      });
    } else {
      res = await createCollabUser({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
    }

    setIsSubmitting(false);

    if (res.success) {
      toast({ title: `Collab User ${editingUser ? 'updated' : 'created'} successfully.` });
      setIsDialogOpen(false);
      fetchCollabs();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Operation failed.' });
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingUserId(id);
    const res = await deleteUser(id);
    setDeletingUserId(null);

    if (res.success) {
      toast({ title: 'Collab User deleted' });
      fetchCollabs();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to delete user.' });
    }
  };

  return (
    <GlassCard>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle>Collab Users (Team)</CardTitle>
          <CardDescription>Create assistant accounts to help manage your data.</CardDescription>
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Collab User
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : collabUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg border-white/10">
            No collab users found. Add your first assistant above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-stone-400">Name</TableHead>
                  <TableHead className="text-stone-400">Email</TableHead>
                  <TableHead className="text-stone-400">Created</TableHead>
                  <TableHead className="text-right text-stone-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collabUsers.map((user) => (
                  <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(user)}
                          className="hover:bg-white/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DeleteConfirmationDialog
                          title="Delete Collab User?"
                          description={
                            <span>
                              Are you sure you want to delete <strong>{user.name}</strong>? They will lose access immediately.
                            </span>
                          }
                          confirmationString={user.name}
                          isDeleting={deletingUserId === user.id}
                          onConfirm={() => handleDelete(user.id)}
                          trigger={
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit Collab User' : 'Add Collab User'}</DialogTitle>
              <DialogDescription>
                {editingUser ? "Update this assistant's details." : "Create a new assistant to help manage your platform."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required={!editingUser}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingUser ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}
