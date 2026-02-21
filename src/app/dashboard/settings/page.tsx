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
import { Trash2, PlusCircle, Loader2, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
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
import { PageLoader } from '@/components/ui/page-loader';
import { ImageDropzone } from '@/components/image-dropzone';
import { fileToDataURL, validateFileSize, validateImageType } from './page.utils';
import jsQR from 'jsqr';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

/** Returns true if decoded QR text looks like a UPI payment QR */
function isUpiQr(text: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    t.startsWith('upi://') ||
    t.startsWith('gpay://') ||
    t.startsWith('phonepe://') ||
    t.startsWith('paytm://') ||
    t.includes('pa=')
  );
}

/** Decode a base64 data URL and run jsQR on it. Returns the decoded text or null. */
function decodeQrFromDataUrl(dataUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imgData.data, imgData.width, imgData.height);
      resolve(result ? result.data : null);
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // QR Code State
  const [openQr, setOpenQr] = useState(false);
  const [isSubmittingQr, setIsSubmittingQr] = useState(false);
  const [newQrName, setNewQrName] = useState('');
  const [newQrUrl, setNewQrUrl] = useState('');

  // null = no image yet | true = valid payment QR | false = invalid QR
  const [isValidQr, setIsValidQr] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Compute the validation status for the dropzone icon
  const validationStatus = !newQrUrl
    ? null
    : isValidating
      ? 'pending'
      : isValidQr === true
        ? 'valid'
        : isValidQr === false
          ? 'invalid'
          : null;

  const fetchData = async () => {
    setIsLoading(true);
    const qrRes = await getQrCodes();
    if (qrRes.success) setQrCodes(qrRes.data as QrCode[]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      setNewQrUrl(imageUrl);   // always show preview
      setIsValidQr(null);
      setIsValidating(true);

      const decoded = await decodeQrFromDataUrl(imageUrl);
      const valid = decoded !== null && isUpiQr(decoded);
      setIsValidQr(valid);
      setIsValidating(false);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to process the image.' });
      setIsValidating(false);
    }
  };

  const handleAddQrCode = async () => {
    setSubmitted(true);
    if (!newQrName || !newQrUrl || isValidQr !== true) {
      return;
    }
    setIsSubmittingQr(true);
    const res = await addQrCode({ name: newQrName, url: newQrUrl });
    if (res.success) {
      toast({ title: 'QR Code Added' });
      setNewQrName(''); setNewQrUrl(''); setIsValidQr(null);
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

  const resetDialog = () => {
    setNewQrName(''); setNewQrUrl(''); setIsValidQr(null); setIsValidating(false); setSubmitted(false);
  };

  if (isLoading) return <PageLoader message="Loading settings..." />;

  // Save is enabled only when: image uploaded + validated + valid UPI QR
  const canSave = !!newQrUrl && isValidQr === true && !isSubmittingQr && !isValidating;

  return (
    <div className="grid gap-8">
      <GlassCard>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Manage your payment QR codes.</CardDescription>
        </CardHeader>
      </GlassCard>

      <div className="grid gap-6">
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
                      onClear={() => { setNewQrUrl(''); setIsValidQr(null); }}
                      validationStatus={validationStatus as any}
                    />

                    {/* Validation status line */}
                    {!newQrUrl && submitted && (
                      <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                        <XCircle className="h-3.5 w-3.5 shrink-0" />
                        Please upload a payment QR code image.
                      </p>
                    )}
                    {!newQrUrl && !submitted && (
                      <p className="flex items-center gap-1.5 text-xs text-amber-400/80 mt-1">
                        <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                        Only a Payment QR Code is accepted (GPay, PhonePe, Paytm, UPI).
                      </p>
                    )}
                    {newQrUrl && isValidating && (
                      <p className="flex items-center gap-1.5 text-xs text-stone-400 mt-1">
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                        Validating QR code…
                      </p>
                    )}
                    {newQrUrl && !isValidating && isValidQr === true && (
                      <p className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        Valid payment QR code detected.
                      </p>
                    )}
                    {newQrUrl && !isValidating && isValidQr === false && (
                      <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                        <XCircle className="h-3.5 w-3.5 shrink-0" />
                        Not a payment QR code. Only UPI payment QR codes are accepted.
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
      </div>
    </div>
  );
}
