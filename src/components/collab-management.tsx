'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
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
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, PlusCircle, Trash2, Edit, Eye, ShieldCheck,
  Search, LayoutGrid, CheckCircle2, Lock,
} from 'lucide-react';
import {
  getUsers, createCollabUser, deleteUser, updateUser,
  getCollabVisibleEvents, updateCollabVisibleEvents,
} from '@/actions/users';
import { getEvents } from '@/actions/events';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { cn } from '@/lib/utils';

// ─── Collab Event Visibility Modal ────────────────────────────────────────────

interface Grant { eventId: string; grantType: 'full' | 'view_only' }

function CollabVisibilityModal({
  collabId,
  collabName,
  open,
  onOpenChange,
}: {
  collabId: string;
  collabName: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([getEvents(), getCollabVisibleEvents(collabId)]).then(([evRes, grRes]) => {
      if (evRes.success) setEvents(evRes.data ?? []);
      if (grRes.success && grRes.data) setGrants(grRes.data as Grant[]);
      setLoading(false);
    });
  }, [open, collabId]);

  const grantMap = useMemo(() => {
    const m: Record<string, 'full' | 'view_only'> = {};
    grants.forEach(g => { m[g.eventId] = g.grantType; });
    return m;
  }, [grants]);

  const filteredEvents = useMemo(() =>
    events.filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase())),
    [events, search]);

  const toggle = (eventId: string) => {
    setGrants(prev => {
      const existing = prev.find(g => g.eventId === eventId);
      if (existing) return prev.filter(g => g.eventId !== eventId);
      return [...prev, { eventId, grantType: 'full' }];
    });
  };

  const setGrantType = (eventId: string, grantType: 'full' | 'view_only') => {
    setGrants(prev => prev.map(g => g.eventId === eventId ? { ...g, grantType } : g));
  };

  const grantAll = () => setGrants(events.map(e => ({ eventId: e.id, grantType: 'full' as const })));
  const revokeAll = () => setGrants([]);

  const save = async () => {
    setSaving(true);
    const result = await updateCollabVisibleEvents(collabId, grants);
    setSaving(false);
    if (result.success) {
      toast({ title: 'Event access updated', description: `${collabName} can now see ${grants.length} event(s).` });
      onOpenChange(false);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full border-white/10 p-0 gap-0 overflow-hidden sm:rounded-2xl">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-white/10">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            Event Access
          </DialogTitle>
          <DialogDescription>
            Control which events <span className="text-white font-medium">{collabName}</span> can see.
            Grant "Full" for payment recording, "View Only" for read-only access.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Search + bulk */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" />
              <Input
                placeholder="Search events..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-white/5 border-white/10 pl-8 h-8 text-xs focus:border-emerald-500/50 rounded-lg"
              />
            </div>
            <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-emerald-400 hover:text-emerald-300" onClick={grantAll}>
              Grant All
            </Button>
            <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-stone-400 hover:text-stone-200" onClick={revokeAll}>
              Revoke All
            </Button>
          </div>

          {/* Summary */}
          <div className="flex gap-2 text-xs">
            <span className="text-stone-500">{grants.length} of {events.length} events granted</span>
            {grants.filter(g => g.grantType === 'view_only').length > 0 && (
              <span className="text-amber-400">· {grants.filter(g => g.grantType === 'view_only').length} view-only</span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-stone-500" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-6">
              {search ? 'No events match your search.' : 'No events found in your workspace.'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredEvents.map(event => {
                const granted = !!grantMap[event.id];
                const grantType = grantMap[event.id] ?? 'full';
                return (
                  <div
                    key={event.id}
                    className={cn(
                      'rounded-xl border transition-all',
                      granted
                        ? 'border-emerald-500/30 bg-emerald-500/8'
                        : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                    )}
                  >
                    {/* Row */}
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer select-none"
                      onClick={() => toggle(event.id)}
                    >
                      {/* Checkbox */}
                      <div className={cn(
                        'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                        granted ? 'border-emerald-400 bg-emerald-400' : 'border-stone-600'
                      )}>
                        {granted && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{event.name}</p>
                        <p className="text-[10px] text-stone-500">{event.category || 'Normal'} · {
                          event.deadline ? new Date(event.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No deadline'
                        }</p>
                      </div>
                      {granted && (
                        <Badge className={cn(
                          'text-[10px] px-1.5 h-4 border shrink-0',
                          grantType === 'full'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                        )}>
                          {grantType === 'full' ? 'Full' : 'View Only'}
                        </Badge>
                      )}
                    </div>

                    {/* Grant type selector — shown when granted */}
                    {granted && (
                      <div className="flex items-center gap-1 px-3 pb-3 -mt-1">
                        <p className="text-[10px] text-stone-500 mr-1">Access level:</p>
                        <button
                          onClick={() => setGrantType(event.id, 'full')}
                          className={cn(
                            'flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-all',
                            grantType === 'full'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'text-stone-500 border-white/10 hover:border-white/20'
                          )}
                        >
                          <ShieldCheck className="w-2.5 h-2.5" /> Full Access
                        </button>
                        <button
                          onClick={() => setGrantType(event.id, 'view_only')}
                          className={cn(
                            'flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-all',
                            grantType === 'view_only'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'text-stone-500 border-white/10 hover:border-white/20'
                          )}
                        >
                          <Lock className="w-2.5 h-2.5" /> View Only
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="px-5 py-4 border-t border-white/10">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 text-stone-400">
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
            Save Access ({grants.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Collab Management Component ─────────────────────────────────────────

export function CollabManagement({ currentUserId }: { currentUserId: string }) {
  const { toast } = useToast();
  const { data: collabData, mutate: refetchCollabs, isLoading } = useSWR(
    ['collabUsers', currentUserId],
    async () => {
      const res = await getUsers();
      if (res.success && res.data) {
        return res.data.filter((u: any) => u.id !== currentUserId && u.role === 'collab');
      }
      return [];
    },
    { revalidateOnFocus: false }
  );

  const collabUsers = collabData || [];

  // Create/Edit Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  // Delete State
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Visibility modal state
  const [visibilityUser, setVisibilityUser] = useState<{ id: string; name: string } | null>(null);

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
        password: formData.password || undefined,
      });
    } else {
      res = await createCollabUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
    }

    setIsSubmitting(false);

    if (res.success) {
      toast({ title: `Collab User ${editingUser ? 'updated' : 'created'} successfully.` });
      setIsDialogOpen(false);
      refetchCollabs();
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
      refetchCollabs();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error || 'Failed to delete user.' });
    }
  };

  return (
    <GlassCard className="min-w-0">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6 min-w-0">
        <div className="space-y-1.5 min-w-0">
          <CardTitle className="text-lg sm:text-xl break-words">Collab Users (Team)</CardTitle>
          <CardDescription className="text-xs sm:text-sm break-words">
            Create assistant accounts and control their event access.
          </CardDescription>
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
              <div key={user.id} className="bg-black/20 border border-white/10 rounded-xl p-4 flex flex-col gap-3 relative group transition-colors hover:bg-white/[0.02]">
                <div className="flex flex-col min-w-0 space-y-1">
                  <h4 className="font-semibold text-white text-base truncate">{user.name}</h4>
                  <p className="text-sm text-emerald-400/80 truncate font-medium" title={user.email}>{user.email}</p>
                </div>

                {/* Event Access button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 gap-1.5 text-xs border-white/10 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
                  onClick={() => setVisibilityUser({ id: user.id, name: user.name })}
                >
                  <Eye className="h-3 w-3" />
                  Manage Event Access
                </Button>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-auto">
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

      {/* Create / Edit Dialog */}
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

      {/* Collab Event Visibility Modal */}
      {visibilityUser && (
        <CollabVisibilityModal
          collabId={visibilityUser.id}
          collabName={visibilityUser.name}
          open={!!visibilityUser}
          onOpenChange={(v) => { if (!v) setVisibilityUser(null); }}
        />
      )}
    </GlassCard>
  );
}
