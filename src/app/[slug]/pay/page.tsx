'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, ChevronsUpDown, QrCode as QrCodeIcon, Loader2, GraduationCap, Lock, Info, ExternalLink } from 'lucide-react';
import { Logo } from '@/components/icons';
import Link from 'next/link';
import { useState, useMemo, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { Event, Student } from '@/lib/types';
import { getPaymentPageData, createPayment } from '@/actions/pay';
import { CustomCursor } from '@/components/custom-cursor';
import { MouseFollower } from '@/components/mouse-follower';

declare global {
  interface Window {
    Razorpay: any;
  }
}


export default function PaymentPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [availableStudents, setAvailableStudents] = useState<(Student & { paidAmount?: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedMethod, setSelectedMethod] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<(Student & { paidAmount?: number }) | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // New state for custom amount
  const [amountToPay, setAmountToPay] = useState<string>('');

  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const res = await getPaymentPageData(slug);
      if (res.success && res.data) {
        setEvent(res.data.event as unknown as Event);
        const students = res.data.availableStudents as unknown as (Student & { paidAmount?: number })[];
        students.sort((a, b) => a.name.localeCompare(b.name));
        setAvailableStudents(students);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load event data' });
      }
      setIsLoading(false);
    };
    if (slug) {
      fetchData();
    }
  }, [slug]);

  // Update amount when student is selected
  useEffect(() => {
    if (selectedStudent && event) {
      const paid = selectedStudent.paidAmount || 0;
      const balance = Math.max(0, event.cost - paid);
      // setAmountToPay(balance.toString()); // User requested no default value
    } else {
      setAmountToPay('');
    }
  }, [selectedStudent, event]);

  const filteredStudents = useMemo(() => {
    if (!availableStudents) return [];
    if (!searchValue) return availableStudents;
    return availableStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [searchValue, availableStudents]);



  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-stone-200 font-sans relative cursor-none flex items-center justify-center overflow-hidden">
        <CustomCursor />
        {/* Noise Texture */}
        <div className="fixed inset-0 z-[50] opacity-[0.07] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
        </div>

        {/* Background Orbs */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
          <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-emerald-600/30 via-emerald-900/20 to-transparent blur-[120px] mix-blend-screen opacity-60 animate-float" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-teal-500/30 via-cyan-900/20 to-transparent blur-[100px] mix-blend-screen opacity-50 animate-float-delayed" />
        </div>

        {/* Loader Animation */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse-slow"></div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 backdrop-blur-md flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-stone-400">Loading Event</span>
            <span className="text-sm text-emerald-500/60 animate-pulse">Please wait...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center items-center text-white p-4">
        <Info className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
        <p className="text-muted-foreground text-center max-w-md">
          The event you are looking for does not exist or has been removed.
        </p>
        <Button asChild variant="link" className="mt-6 text-emerald-400">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  const getButtonText = () => {
    if (isSubmitting) {
      return <Loader2 className="h-5 w-5 animate-spin" />
    }
    const amountDisplay = amountToPay ? `₹${parseFloat(amountToPay).toLocaleString('en-IN')}` : '';

    if (!selectedMethod) return amountDisplay ? `Pay ${amountDisplay}` : 'Select Amount';

    switch (selectedMethod) {
      case 'razorpay':
        return `Pay ${amountDisplay} with Razorpay`;
      case 'qr':
        return 'Show QR Code & Pay';
      case 'cash':
        return 'Submit for Verification';
      default:
        return `Pay ${amountDisplay}`;
    }
  };


  const createPendingPayment = async (orderId: string) => {
    if (!selectedStudent) return null;
    const amount = parseFloat(amountToPay);

    const res = await createPayment({
      studentId: selectedStudent.id,
      eventId: event.id,
      amount: amount,
      paymentMethod: 'Razorpay',
      transactionId: 'N/A',
      status: 'Pending',
      razorpay_order_id: orderId,
    });

    return res.success ? res.data : null;
  };


  const handleRazorpayPayment = async () => {
    if (!selectedStudent || !event || !amountToPay) return;
    const amount = parseFloat(amountToPay);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid amount greater than 0." });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create Order
      const orderResponse = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          eventId: event.id,
          studentId: selectedStudent.id,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create Razorpay order');
      }

      const order = await orderResponse.json();

      // 2. Create pending payment document in DB
      await createPendingPayment(order.id);

      // 3. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'FundEd',
        description: `Payment for ${event.name}`,
        order_id: order.id,
        handler: async function (response: any) {
          setIsSubmitting(true);
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (verifyRes.ok) {
              setShowSuccessDialog(true);
            } else {
              const errorData = await verifyRes.json();
              toast({
                variant: 'destructive',
                title: 'Verification Failed',
                description: errorData.error || 'Payment was successful but we couldn\'t verify it. Please contact support.'
              });
            }
          } catch (error) {
            console.error('Verification error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'An error occurred during verification.' });
          } finally {
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: selectedStudent.name,
          email: selectedStudent.email,
        },
        notes: {
          eventId: event.id,
          studentId: selectedStudent.id,
        },
        theme: {
          color: '#10b981', // emerald-500
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast({
          variant: 'destructive',
          title: 'Payment Failed',
          description: response.error.description || 'Something went wrong.'
        });
      });
      rzp.open();

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not initiate payment. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }


  const handleOtherPaymentSubmission = async (paymentMethod: 'QR Scan' | 'Cash', status: 'Verification Pending') => {
    if (!selectedStudent || !amountToPay) return;
    const amount = parseFloat(amountToPay);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid amount greater than 0." });
      return;
    }

    setIsSubmitting(true);

    const res = await createPayment({
      studentId: selectedStudent.id,
      eventId: event.id,
      amount: amount,
      paymentMethod: paymentMethod,
      transactionId: `${paymentMethod.replace(' ', '')}_${Date.now()}`,
      status: status,
    });

    if (res.success) {
      setShowSuccessDialog(true);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit payment' });
    }

    setIsSubmitting(false);
  }


  const handlePayClick = () => {
    if (isSubmitting) return;

    if (selectedMethod === 'razorpay') {
      handleRazorpayPayment();
    } else if (selectedMethod === 'qr') {
      if (event.qrCodeUrl) {
        setShowQrDialog(true);
      } else {
        toast({
          variant: "destructive",
          title: "QR Code Not Available",
          description: "The class representative has not uploaded a QR code for this event."
        })
      }
    } else if (selectedMethod === 'cash') {
      handleOtherPaymentSubmission('Cash', 'Verification Pending');
    }
  };

  const handleSubmitQrPayment = async () => {
    if (isSubmitting) return;
    setShowQrDialog(false);
    await handleOtherPaymentSubmission('QR Scan', 'Verification Pending');
  }

  const handleDownloadQr = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-qr-${event.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    a.click();
  };


  return (
    <div className="min-h-screen bg-black text-stone-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-100 overflow-x-hidden relative cursor-none">

      {/* Custom Cursor */}
      <CustomCursor />

      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 z-[50] opacity-[0.07] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* Enhanced Floating Orbs Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
        <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-emerald-600/30 via-emerald-900/20 to-transparent blur-[120px] mix-blend-screen opacity-60 animate-float" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-teal-500/30 via-cyan-900/20 to-transparent blur-[100px] mix-blend-screen opacity-50 animate-float-delayed" />
        <MouseFollower />
      </div>

      {/* Navigation */}
      <header className="relative z-20 w-full px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full group-hover:bg-emerald-500/40 transition-all"></div>
              <GraduationCap className="h-8 w-8 text-emerald-400 relative z-10" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-200 transition-colors leading-none">
                FundEd
              </span>
              <span className="text-[10px] text-emerald-500/80 font-medium tracking-widest uppercase mt-0.5">
                Classroom OS
              </span>
            </div>
          </Link>

          <Button variant="ghost" className="text-stone-400 hover:text-white hover:bg-white/5" asChild>
            <Link href="/login">Admin Login</Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-2 flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">

        <GlassCard className="w-full max-w-xl border-white/10 p-1 backdrop-blur-2xl shadow-2xl">
          <div className="bg-black/40 rounded-lg p-6">
            <CardHeader className="px-0 pt-0 pb-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center mb-3 border border-emerald-500/20 shadow-inner">
                <Lock className="w-6 h-6 text-emerald-400" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-white mb-1">{event.name}</CardTitle>
              <CardDescription className="text-base text-stone-400 max-w-lg mx-auto leading-relaxed line-clamp-2">{event.description}</CardDescription>
            </CardHeader>


            <CardContent className="grid gap-5 px-0">
              <div className="flex flex-col items-center justify-center py-4 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="text-stone-400 text-xs font-medium uppercase tracking-wider mb-1">
                  {selectedStudent ? 'Balance Due' : 'Total Amount Due'}
                </span>
                <span className="font-bold text-3xl text-white tracking-tight flex items-center">
                  <span className="text-emerald-500 mr-1">₹</span>
                  {selectedStudent
                    ? (event.cost - (selectedStudent.paidAmount || 0)).toLocaleString('en-IN')
                    : event.cost.toLocaleString('en-IN')
                  }
                </span>
              </div>


              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="student" className="text-stone-300">Select Student</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between h-10 bg-black/20 border-white/10 hover:bg-white/5 hover:border-emerald-500/50 text-stone-200"
                      >
                        {selectedStudent
                          ? <span className="text-white font-medium">{selectedStudent.name} ({selectedStudent.rollNo})</span>
                          : <span className="text-stone-500">Search for your name...</span>}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-black/90 border-white/10 backdrop-blur-xl">
                      <Command className="bg-transparent">
                        <CommandInput
                          placeholder="Search by name or roll no..."
                          value={searchValue}
                          onValueChange={setSearchValue}
                          className="border-none focus:ring-0 text-white placeholder:text-stone-500"
                        />
                        <CommandList>
                          <CommandEmpty className="py-4 text-center text-stone-500">No student found.</CommandEmpty>
                          <CommandGroup className="text-stone-400">
                            {filteredStudents.map((student) => (
                              <CommandItem
                                key={student.id}
                                value={`${student.name} ${student.rollNo}`}
                                onSelect={() => {
                                  setSelectedStudent(student);
                                  setOpen(false);
                                }}
                                className="data-[selected=true]:bg-emerald-900/30 data-[selected=true]:text-emerald-50 cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4 text-emerald-500',
                                    selectedStudent?.id === student.id ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                <div className="flex flex-col">
                                  <p className="font-medium text-white">{student.name}</p>
                                  <p className="text-xs text-stone-500">{student.rollNo}</p>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>


                {selectedStudent && (
                  <div className="grid gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-400">Full Name</span>
                      <span className="text-emerald-100 font-medium">{selectedStudent.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-400">Roll Number</span>
                      <span className="text-emerald-100 font-medium">{selectedStudent.rollNo}</span>
                    </div>
                    {/* Partial Payment Details */}
                    {(selectedStudent.paidAmount || 0) > 0 && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-stone-400">Total Cost</span>
                          <span className="text-stone-400 font-medium">₹{event.cost.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-stone-400">Already Paid</span>
                          <span className="text-emerald-400 font-medium">- ₹{selectedStudent.paidAmount?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-white/10 mt-1">
                          <span className="text-stone-300 font-medium">Balance Due</span>
                          <span className="text-white font-bold">₹{(event.cost - (selectedStudent.paidAmount || 0)).toLocaleString('en-IN')}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {selectedStudent && (
                  <div className="grid gap-2">
                    <Label htmlFor="amount" className="text-stone-300">Amount to Pay</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-stone-500">₹</span>
                      <Input
                        id="amount"
                        type="number"
                        value={amountToPay}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const val = parseFloat(e.target.value);
                          if (e.target.value === '') {
                            setAmountToPay('');
                            return;
                          }

                          if (val < 0) {
                            // Prevent negative numbers
                            return;
                          }

                          const balance = event.cost - (selectedStudent.paidAmount || 0);
                          if (val > balance) {
                            setAmountToPay(balance.toString());
                          } else {
                            setAmountToPay(e.target.value);
                          }
                        }}
                        min={1}
                        onKeyDown={(e) => {
                          if (e.key === '-' || e.key === 'e') {
                            e.preventDefault();
                          }
                        }}
                        max={event.cost - (selectedStudent.paidAmount || 0)}
                        className="pl-7 bg-black/20 border-white/10 hover:bg-white/5 focus-visible:ring-emerald-500/20 text-stone-200"
                        placeholder="Enter the amount going to pay"
                      />
                    </div>
                    <p className="text-xs text-stone-500 text-right">
                      Max: ₹{(event.cost - (selectedStudent.paidAmount || 0)).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}


                <div className="grid gap-2">
                  <Label htmlFor="paymentMethod" className="text-stone-300">Payment Method</Label>
                  <Select onValueChange={setSelectedMethod} disabled={!selectedStudent}>
                    <SelectTrigger className="h-10 bg-black/20 border-white/10 hover:bg-white/5 focus:ring-emerald-500/20 text-stone-200">
                      <SelectValue placeholder="Select a payment method" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl text-stone-200">
                      {event.paymentOptions.map((option) => (
                        <SelectItem
                          key={option}
                          value={option.toLowerCase()}
                          className="focus:bg-emerald-900/30 focus:text-emerald-50 cursor-pointer"
                        >
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="px-0 pb-0 pt-2">
              <Button
                className="w-full h-12 text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02]"
                size="lg"
                disabled={!selectedStudent || !selectedMethod || isSubmitting}
                onClick={handlePayClick}
              >
                {getButtonText()}
              </Button>
            </CardFooter>
          </div>
        </GlassCard>

        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-center text-xs text-stone-500 flex items-center gap-1 opacity-60">
            <Lock className="w-3 h-3" />
            Secure payment powered by FundEd
          </p>
          <p className="flex items-center gap-1 text-xs text-stone-600">
            A sub-product of <span className="text-emerald-500 font-semibold">SKS DM</span>
          </p>
        </div>

      </main>

      <AlertDialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <AlertDialogContent className="max-w-md bg-zinc-950 border-white/10 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-[95vw] sm:w-full rounded-2xl p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white">
              <QrCodeIcon className="h-6 w-6 text-emerald-500" />
              Scan to Pay
            </AlertDialogTitle>
            <AlertDialogDescription className="text-stone-400">
              Use any UPI app to scan the QR code below to pay{' '}
              <span className="text-white font-bold">
                ₹{amountToPay ? parseFloat(amountToPay).toLocaleString('en-IN') : event.cost.toLocaleString('en-IN')}
              </span>.
              After paying, click the submit button below for verification.
              <br />
              <span className="block mt-2 text-xs text-yellow-500/80">
                Disclaimer: Use another device to scan the QR to pay above ₹2000.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col items-center gap-3 py-1 sm:py-3">
            {event.upiId && amountToPay ? (
              <>
                {/* Dynamic UPI QR Code */}
                <div className="p-4 bg-white rounded-xl shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20">
                  <QRCodeCanvas
                    ref={qrCanvasRef}
                    value={`upi://pay?pa=${event.upiId}&pn=${encodeURIComponent('FundEd')}&am=${parseFloat(amountToPay).toFixed(2)}&cu=INR&tn=${encodeURIComponent(event.name)}`}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                    includeMargin={true}
                  />
                </div>

                {/* UPI Details */}
                <div className="w-full rounded-lg bg-white/5 border border-white/10 p-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">UPI ID</span>
                    <span className="font-mono text-emerald-300 text-xs">{event.upiId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Amount</span>
                    <span className="text-white font-bold">₹{parseFloat(amountToPay).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Download Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadQr}
                  className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download QR Code
                </Button>
              </>
            ) : event.qrCodeUrl ? (
              // Fallback: show admin-uploaded QR image if no UPI ID stored
              <div className="p-4 bg-white rounded-xl">
                <Image
                  src={event.qrCodeUrl}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="mix-blend-multiply"
                />
              </div>
            ) : (
              <div className="py-6 text-center text-stone-500 text-sm">
                QR code not available.
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setShowQrDialog(false)} disabled={isSubmitting} className="text-stone-400 hover:text-white">Cancel</Button>
            <Button onClick={handleSubmitQrPayment} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit for Verification
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="bg-zinc-950 border-white/10">
          <AlertDialogHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mb-4 animate-bounce-slow">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <AlertDialogTitle className="text-center text-2xl text-white">Payment Submitted!</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-stone-400 text-base mt-2">
              Your payment has been successfully recorded. You will receive an email confirmation shortly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-4">
            <AlertDialogAction asChild className="bg-emerald-600 hover:bg-emerald-500 text-white px-8">
              <Link href={`/check-status/${event.adminSlug || slug}`}>Check Status</Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
