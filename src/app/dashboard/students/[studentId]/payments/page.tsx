'use client';

export const dynamic = 'force-dynamic';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import type { Transaction, Student } from '@/lib/types';
import { BrandedLoader } from '@/components/ui/branded-loader';
import { PageLoader } from '@/components/ui/page-loader';
import { useState, useEffect } from 'react';
import { getStudentPayments } from '@/actions/student-payments';
import { GlassCard } from '@/components/ui/glass-card';
import { useToast } from '@/hooks/use-toast';
import { Wallet, CheckCircle, AlertCircle, Clock, Share2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const getStatusBadgeVariant = (status: Transaction['status']) => {
  switch (status) {
    case 'Paid':
      return 'paid';
    case 'Pending':
      return 'pending';
    case 'Failed':
      return 'failed';
    case 'Verification Pending':
      return 'verification';
    default:
      return 'default';
  }
};

export default function StudentPaymentsPage() {
  const { studentId } = useParams();
  const studentIdStr = studentId as string;
  const { toast } = useToast();

  const [student, setStudent] = useState<Student | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoading(true);
      const res = await getStudentPayments(studentIdStr);
      if (res.success && res.data) {
        setStudent(res.data.student as unknown as Student);
        setTransactions(res.data.transactions as unknown as Transaction[]);
        setPaymentSummary(res.data.paymentSummary || []);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch payments' });
      }
      setIsLoading(false);
    };
    if (studentIdStr) {
      fetchPayments();
    }
  }, [studentIdStr]);


  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toUpperCase();
  };





  if (isLoading) {
    return <PageLoader message="Loading payments..." />;
  }

  if (!student) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The student you are looking for does not exist.</p>
          <Button asChild variant="link" className="mt-4 px-0">
            <Link href="/dashboard/students">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Students
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const StatusBadge = ({ status }: { status: Transaction['status'] }) => {
    const variant = getStatusBadgeVariant(status);
    return (
      <Badge variant={variant as any}>
        {status}
      </Badge>
    );
  };

  const handleCopyPublicLink = () => {
    const link = `${window.location.origin}/check-status`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Public Portal Link Copied',
      description: `Share this link. Student Roll No: ${student?.rollNo}`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/students">
            <Button variant="ghost" size="icon" className="h-9 w-9 border border-white/10 hover:bg-white/5 rounded-full shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Payments for {student.name}</h2>
            <p className="text-sm text-stone-400 mt-1">A list of all transactions made by this student.</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleCopyPublicLink} className="gap-2 bg-white/5 border-white/10 hover:bg-white/10 text-white shadow-sm transition-all w-full sm:w-auto h-10 px-4">
          <Share2 className="h-4 w-4" />
          <span>Share Portal</span>
        </Button>
      </div>

      <div className="space-y-8">
        {/* Financial Overview / Event Balances */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-stone-200">
            <Wallet className="h-5 w-5 text-emerald-400" />
            Event Payment Status
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paymentSummary.map((summary, mbIndex) => {
              const progress = summary.eventCost > 0 ? (summary.totalPaid / summary.eventCost) * 100 : 0;
              return (
                <GlassCard key={mbIndex} className="p-5 space-y-4 hover-lift border-white/10">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-3">
                      <h4 className="font-semibold text-stone-200 truncate" title={summary.eventName}>{summary.eventName}</h4>
                      <Badge variant={summary.status === 'Fully Paid' ? 'paid' : summary.status === 'Partially Paid' ? 'pending' : 'destructive'} className="mt-2 text-[10px] uppercase font-bold tracking-wider">
                        {summary.status}
                      </Badge>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-0.5">Cost</p>
                      <p className="font-bold text-emerald-400">₹{summary.eventCost.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-stone-400">Paid: <strong className="text-white">₹{summary.totalPaid.toLocaleString('en-IN')}</strong></span>
                      <span className={summary.pendingAmount > 0 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                        {summary.pendingAmount > 0 ? `Due: ₹${summary.pendingAmount.toLocaleString('en-IN')}` : "Cleared"}
                      </span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-1.5 bg-white/5" />
                  </div>
                </GlassCard>
              );
            })}
            {paymentSummary.length === 0 && (
              <GlassCard className="col-span-full flex flex-col items-center justify-center py-10 px-4 text-center border-dashed border-white/10 bg-white/[0.02]">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                  <Wallet className="h-6 w-6 text-emerald-500/40" />
                </div>
                <p className="text-stone-300 font-medium">No active participations</p>
                <p className="text-sm text-stone-500 mt-1">This student has not joined any events yet.</p>
              </GlassCard>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-stone-200">
            <Clock className="h-5 w-5 text-emerald-400" />
            Transaction History
          </h3>

          {transactions?.length === 0 ? (
            <GlassCard className="flex flex-col items-center justify-center py-12 px-4 text-center border-dashed border-white/10 bg-white/[0.02]">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <Clock className="h-6 w-6 text-emerald-500/40" />
              </div>
              <p className="text-stone-300 font-medium">No payments found</p>
              <p className="text-sm text-stone-500 mt-1">There is no transaction history for this student.</p>
            </GlassCard>
          ) : (
            <GlassCard className="border-white/10 overflow-hidden">
              {/* Mobile View */}
              <div className="grid gap-[1px] bg-white/10 md:hidden">
                {transactions?.map(transaction => (
                  <div key={transaction.id} className="w-full bg-[#09090b] p-4 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-stone-200 truncate" title={transaction.eventName}>
                          {transaction.eventName}
                        </div>
                        <div className="text-xs text-stone-500 font-mono mt-0.5">
                          #{transaction.id.slice(-8)}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge status={transaction.status} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                      <div>
                        <div className="text-[10px] uppercase text-stone-500 font-medium mb-0.5">Amount</div>
                        <div className="text-sm font-bold text-emerald-400">₹{transaction.amount.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase text-stone-500 font-medium mb-0.5">Date</div>
                        <div className="text-xs text-stone-300">{formatDate(transaction.paymentDate)}</div>
                      </div>
                      <div className="col-span-2 pt-1">
                        <div className="text-[10px] uppercase text-stone-500 font-medium mb-0.5">Method</div>
                        <div className="text-xs text-stone-300 bg-white/5 inline-flex px-2 py-1 rounded">{transaction.paymentMethod}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white/[0.02]">
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="font-semibold text-stone-400 w-[120px]">Transaction ID</TableHead>
                      <TableHead className="font-semibold text-stone-400">Event</TableHead>
                      <TableHead className="font-semibold text-stone-400 text-right">Amount</TableHead>
                      <TableHead className="font-semibold text-stone-400">Date</TableHead>
                      <TableHead className="font-semibold text-stone-400">Method</TableHead>
                      <TableHead className="font-semibold text-stone-400 text-center w-[120px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map((transaction) => (
                      <TableRow key={transaction.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                        <TableCell className="font-mono text-xs text-stone-500">#{transaction.id.slice(-8)}</TableCell>
                        <TableCell>
                          <div className="font-medium text-stone-200">{transaction.eventName}</div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-400">₹{transaction.amount.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-stone-300 text-sm">{formatDate(transaction.paymentDate)}</TableCell>
                        <TableCell>
                          <span className="text-xs text-stone-300 bg-white/5 px-2 py-1 rounded inline-block">{transaction.paymentMethod}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={transaction.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
