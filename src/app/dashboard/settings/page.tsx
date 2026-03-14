'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, PlusCircle, Loader2, ShieldAlert, CheckCircle2, XCircle, Link2, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { QrCode } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { getQrCodes, addQrCode, deleteQrCode } from '@/actions/settings';
import { getCurrentAdmin, updateAdminSlug, checkSlugAvailability } from '@/actions/users';
import { PageLoader } from '@/components/ui/page-loader';
import { ImageDropzone } from '@/components/image-dropzone';
import { validateFileSize, fileToDataURL, validateImageType } from './page.utils';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { CollabManagement } from '@/components/collab-management';

export default function SettingsPage() {
  const { toast } = useToast();
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // QR Code State
  const [openQr, setOpenQr] = useState(false);
  const [isSubmittingQr, setIsSubmittingQr] = useState(false);
  const [newQrName, setNewQrName] = useState('');
  const [newQrUrl, setNewQrUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Slug / Student Portal State
  const [slug, setSlug] = useState('');
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [isSavingSlug, setIsSavingSlug] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [slugCopied, setSlugCopied] = useState(false);
  const [slugAvailability, setSlugAvailability] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [isAdminRole, setIsAdminRole] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const adminRes = await getCurrentAdmin();
      if (adminRes.success && adminRes.data) {
        const data = adminRes.data as any;
        setIsAdminRole(data.role === 'admin' || data.role === 'superadmin');
        const s = data.slug || '';
        setCurrentSlug(s || null);
        setSlug(s || '');
        setCurrentUserId(data.id);
      }
      
      const qrRes = await getQrCodes();
      if (qrRes.success) setQrCodes(qrRes.data as QrCode[]);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Debounced real-time slug availability check
  useEffect(() => {
    const val = slug.trim().toLowerCase();
    if (!val || val.length < 3) { setSlugAvailability('idle'); return; }
    if (!/^[a-z0-9-]+$/.test(val)) { setSlugAvailability('invalid'); return; }
    if (val === currentSlug) { setSlugAvailability('available'); return; } // unchanged slug

    setSlugAvailability('checking');
    const timer = setTimeout(async () => {
      const res = await checkSlugAvailability(val);
      if (res.available === true) setSlugAvailability('available');
      else if (res.available === false) setSlugAvailability('taken');
      else setSlugAvailability('idle');
    }, 500);
    return () => clearTimeout(timer);
  }, [slug, currentSlug]);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    if (!validateFileSize(file, 2)) {
      toast({ variant: 'destructive', title: 'File Too Large', description: 'Max 2MB allowed.' });
      return;
    }
    if (!validateImageType(file)) {
      toast({ variant: 'destructive', title: 'Invalid Format', description: 'PNG, JPG or WebP only.' });
      return;
    }

    try {
      const imageUrl = await fileToDataURL(file);
      setNewQrUrl(imageUrl);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to process the image.' });
    }
  };

  const handleAddQrCode = async () => {
    setSubmitted(true);
    if (!newQrName || !newQrUrl) {
      return;
    }
    setIsSubmittingQr(true);
    const res = await addQrCode({ name: newQrName, url: newQrUrl });
    if (res.success) {
      toast({ title: 'QR Code Added' });
      setNewQrName(''); setNewQrUrl('');
      setOpenQr(false);
      fetchData();
    } else {
      toast({ variant: 'destructive', title: 'Operation Failed', description: 'Error saving QR code.' });
    }
    setIsSubmittingQr(false);
  };

  const [deletingQrId, setDeletingQrId] = useState<string | null>(null);

  const handleDeleteQr = async (id: string) => {
    setDeletingQrId(id);
    const res = await deleteQrCode(id);
    if (res.success) {
      toast({ title: 'QR Code Deleted' });
      fetchData();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error });
    }
    setDeletingQrId(null);
  };

  const handleSaveSlug = async () => {
    setSlugError('');
    setIsSavingSlug(true);
    const res = await updateAdminSlug(slug);
    if (res.success) {
      setCurrentSlug(res.slug || slug.trim().toLowerCase());
      toast({ title: 'Student Portal Link Saved', description: 'Your unique check-status URL is now active.' });
    } else {
      setSlugError(res.error || 'Failed to save.');
    }
    setIsSavingSlug(false);
  };

  const handleCopySlugLink = () => {
    const url = `${window.location.origin}/check-status/${currentSlug}`;
    navigator.clipboard.writeText(url);
    setSlugCopied(true);
    setTimeout(() => setSlugCopied(false), 2000);
    toast({ title: 'Link Copied', description: 'Share this link with your students.' });
  };

  const resetDialog = () => {
    setNewQrName(''); setNewQrUrl(''); setSubmitted(false);
  };

  if (isLoading) return <PageLoader message="Loading settings..." />;

  const slugPreview = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const portalUrl = slugPreview ? `${typeof window !== 'undefined' ? window.location.origin : ''}/check-status/${slugPreview}` : '';
  const canSaveSlug = slugPreview.length >= 3 && !isSavingSlug && slugAvailability !== 'taken' && slugAvailability !== 'checking' && slugAvailability !== 'invalid';

  // Save is enabled only when image is uploaded
  const canSave = !!newQrUrl && !isSubmittingQr;

  return (
    <div className="grid gap-8">
      <GlassCard>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Manage your payment QR codes.</CardDescription>
        </CardHeader>
      </GlassCard>

      <div className="grid gap-6">
        {/* Student Portal Card */}
        <GlassCard>
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-emerald-400" />
                Student Portal Link
              </CardTitle>
              <CardDescription>
                Set a unique URL slug so students can check their payment status. Share this link with them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug-input">Your Unique Slug</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className={`flex items-center w-full sm:w-[320px] bg-white/5 border rounded-md overflow-hidden transition-colors ${slugAvailability === 'available' ? 'border-emerald-500/50' :
                    slugAvailability === 'taken' || slugAvailability === 'invalid' ? 'border-red-500/40' :
                      'border-white/10'
                    }`}>
                    <Input
                      id="slug-input"
                      placeholder="e.g., sks-bank-2025"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                        setSlugError('');
                      }}
                      className="border-none bg-transparent focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none ring-0 ring-offset-0 shadow-none flex-1 h-9 text-sm px-3"
                    />
                    {/* Availability indicator */}
                    <div className="pr-3 shrink-0">
                      {slugAvailability === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-stone-400" />}
                      {slugAvailability === 'available' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                      {(slugAvailability === 'taken' || slugAvailability === 'invalid') && <XCircle className="h-4 w-4 text-red-400" />}
                    </div>
                  </div>
                  <Button
                    onClick={handleSaveSlug}
                    disabled={!canSaveSlug}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all"
                  >
                    {isSavingSlug ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Slug
                  </Button>
                </div>
                {/* Availability status text */}
                {slugAvailability === 'taken' && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 shrink-0" /> This slug is already taken. Try another.
                  </p>
                )}
                {slugAvailability === 'invalid' && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 shrink-0" /> Only lowercase letters, numbers, and hyphens.
                  </p>
                )}
                {slugAvailability === 'available' && slug !== currentSlug && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> This slug is available!
                  </p>
                )}
              </div>

              {/* Preview & Copy */}
              {(slugPreview || currentSlug) && (
                <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-4 py-3">
                  <p className="text-sm text-stone-400 flex-1 font-mono truncate">
                    <span className="text-stone-600">…/check-status/</span>
                    <span className="text-emerald-300">{slugPreview || currentSlug}</span>
                  </p>
                  {currentSlug && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopySlugLink}
                      className="shrink-0 text-stone-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                    >
                      {slugCopied
                        ? <><Check className="h-4 w-4 mr-1.5 text-emerald-400" /> Copied</>
                        : <><Copy className="h-4 w-4 mr-1.5" /> Copy Link</>
                      }
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </GlassCard>

        <GlassCard>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Manage QR Codes</CardTitle>
                <CardDescription>Add or remove your payment QR codes.</CardDescription>
              </div>
              <Dialog
                open={openQr}
                onOpenChange={(open) => { setOpenQr(open); if (!open) resetDialog(); }}
              >
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New QR
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add a Payment QR Code</DialogTitle>
                    <DialogDescription>
                      Upload your UPI payment QR code (GPay, PhonePe, Paytm, etc.)
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="qr-name" className={submitted && !newQrName ? 'text-red-400' : ''}>
                        QR Code Name
                      </Label>
                      <Input
                        id="qr-name"
                        placeholder="e.g., GPay Business"
                        value={newQrName}
                        onChange={(e) => setNewQrName(e.target.value)}
                        className={submitted && !newQrName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                      />
                      {submitted && !newQrName && (
                        <p className="text-xs text-red-400">QR Code Name is required.</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label className={submitted && !newQrUrl ? 'text-red-400' : ''}>
                        QR Code Image
                      </Label>
                      <ImageDropzone
                        onFileSelect={handleFileSelect}
                        previewUrl={newQrUrl}
                        onClear={() => { setNewQrUrl(''); }}
                      />

                      {!newQrUrl && submitted && (
                        <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                          <XCircle className="h-3.5 w-3.5 shrink-0" />
                          Please upload a payment QR code image.
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" disabled={isSubmittingQr} onClick={() => setOpenQr(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddQrCode} disabled={!canSave}>
                      {isSubmittingQr ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save QR Code
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {qrCodes?.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg border-white/10">
                    No QR codes found. Add your first payment QR code above.
                  </div>
                )}
                {qrCodes?.map((qr) => (
                  <GlassCard key={qr.id} variant="bordered" className="bg-black/20 overflow-hidden flex flex-col h-full">
                    <CardContent className="p-6 pt-10 flex flex-col items-center gap-4 flex-1">
                      <div className="relative w-40 h-40 bg-white rounded-xl p-2 flex items-center justify-center shadow-inner overflow-hidden">
                        <Image src={qr.url} alt={qr.name} fill className="object-contain p-2" />
                      </div>
                      <p className="font-medium text-center text-sm mt-2">{qr.name}</p>
                    </CardContent>
                    <CardFooter className="p-0 border-t border-white/10">
                      <DeleteConfirmationDialog
                        title="Delete QR Code?"
                        description={
                          <span>
                            This will permanently delete <strong>{qr.name}</strong>. This action cannot be undone.
                          </span>
                        }
                        confirmationString={qr.name}
                        isDeleting={deletingQrId === qr.id}
                        onConfirm={() => handleDeleteQr(qr.id)}
                        trigger={
                          <Button
                            variant="ghost" size="lg"
                            className="w-full h-12 rounded-t-none text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center justify-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" /> Delete QR Code
                          </Button>
                        }
                      />
                    </CardFooter>
                  </GlassCard>
                ))}
              </div>
            </CardContent>
          </GlassCard>

        {isAdminRole && currentUserId && (
          <CollabManagement currentUserId={currentUserId} />
        )}
      </div>
    </div>
  );
}
