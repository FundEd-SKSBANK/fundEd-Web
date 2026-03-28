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
    <GlassCard className="min-w-0">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6 min-w-0">
        <div className="space-y-1.5 min-w-0">
          <CardTitle className="text-lg sm:text-xl break-words">Collab Users (Team)</CardTitle>
          <CardDescription className="text-xs sm:text-sm break-words">Create assistant accounts to help manage your data.</CardDescription>
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto shrink-0">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Collab User
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 relative w-full overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : collabUsers.length === 0 ? (
          <div className="text-center py-8 px-4 text-muted-foreground border-2 border-dashed rounded-lg border-white/10 text-sm">
            No collab users found. Add your first assistant above.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collabUsers.map((user) => (
              <div key={user.id} className="bg-black/20 border border-white/10 rounded-xl p-4 flex flex-col gap-4 relative group transition-colors hover:bg-white/[0.02]">
                <div className="flex flex-col min-w-0 space-y-1">
                  <h4 className="font-semibold text-white text-base truncate">{user.name}</h4>
                  <p className="text-sm text-emerald-400/80 truncate font-medium" title={user.email}>{user.email}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
                  <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                    Added {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-1 -mr-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(user)}
                      className="h-8 w-8 text-stone-400 hover:text-white hover:bg-white/10"
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[425px] w-full mx-auto sm:rounded-2xl border-white/10 p-5 sm:p-6 !max-h-[90vh] overflow-y-auto">
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
