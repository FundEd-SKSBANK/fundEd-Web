'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, PackageCheck, Loader2, Trash2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Student, PrintDistribution, Event, Payment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { sendPrintDistributionEmail } from '@/app/actions';
import { getPrintData, distributePrint, deleteDistribution } from '@/actions/prints';
import { PageLoader } from '@/components/ui/page-loader';
import { formatDate, getStudentsWhoPaid, filterStudentsBySearch } from './page.utils';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

export default function PrintsPage() {
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [printEvents, setPrintEvents] = useState<Event[]>([]);
  const [distributions, setDistributions] = useState<PrintDistribution[]>([]);
  const [paidPayments, setPaidPayments] = useState<Payment[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Track whether the initial mount has been completed
  const isInitialMount = useRef(true);

  // Derived filtered distributions for the history view
  const filteredDistributions = useMemo(() => {
    if (!selectedEventId || !distributions) return [];
    return distributions.filter(d => d.eventId === selectedEventId);
  }, [distributions, selectedEventId]);

  // ── Initial data load (runs once on mount with a full-screen loader) ──
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      const res = await getPrintData();
      if (res.success && res.data) {
        setPrintEvents(res.data.events as unknown as Event[]);
        setDistributions(res.data.distributions as unknown as PrintDistribution[]);
        setPaidPayments(res.data.payments as unknown as Payment[]);
        setAllStudents(res.data.students as unknown as Student[]);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch data' });
      }
      setIsLoading(false);
      isInitialMount.current = false;
    };
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Silent re-fetch when event changes (no full-page loader) ──
  useEffect(() => {
    // Skip the very first render — initial fetch above handles it
    if (isInitialMount.current) return;
    if (!selectedEventId) return;

    const fetchEventData = async () => {
      const res = await getPrintData();
      if (res.success && res.data) {
        setDistributions(res.data.distributions as unknown as PrintDistribution[]);
        setPaidPayments(res.data.payments as unknown as Payment[]);
        setAllStudents(res.data.students as unknown as Student[]);
      }
    };
    fetchEventData();
  }, [selectedEventId]);


  const studentsWhoPaid = useMemo(() => {
    return getStudentsWhoPaid(allStudents, paidPayments, distributions, selectedEventId);
  }, [allStudents, paidPayments, distributions, selectedEventId]);


  const filteredStudents = useMemo(() => {
    return filterStudentsBySearch(studentsWhoPaid, searchValue);
  }, [searchValue, studentsWhoPaid]);

  const selectedEvent = printEvents?.find(e => e.id === selectedEventId);

  const handleDistribute = async () => {
    if (selectedStudent && selectedEventId && selectedEvent) {
      setIsSubmitting(true);

      const res = await distributePrint({
        studentId: selectedStudent.id,
        eventId: selectedEventId,
      });

      if (res.success) {
        const emailResult = await sendPrintDistributionEmail({
          studentName: selectedStudent.name,
          studentEmail: selectedStudent.email,
          eventName: selectedEvent.name,
        });

        if (emailResult.success) {
          toast({
            title: 'Print Distributed & Email Sent',
            description: `${selectedStudent.name} has received their prints and an email has been sent.`,
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Print Distributed, but Email Failed',
            description: `The print for ${selectedStudent.name} was marked as distributed, but the email failed to send. Reason: ${emailResult.message}`,
          });
        }

        // Refresh distributions locally
        const newData = await getPrintData();
        if (newData.success && newData.data) {
          setDistributions(newData.data.distributions as unknown as PrintDistribution[]);
          setPaidPayments(newData.data.payments as unknown as Payment[]);
          setAllStudents(newData.data.students as unknown as Student[]);
        }

        setSelectedStudent(null);
        setSearchValue('');
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to distribute print' });
      }

      setIsSubmitting(false);
    }
  };

  const handleDelete = async (distId: string) => {
    setDeletingId(distId);
    const res = await deleteDistribution(distId);
    if (res.success) {
      // Remove from local state immediately — no full reload needed
      setDistributions(prev => prev.filter(d => d.id !== distId));
      toast({ title: 'Distribution Deleted', description: 'The distribution record has been removed.' });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete distribution' });
    }
    setDeletingId(null);
  };

  if (isLoading) {
    return <PageLoader message="Loading print distribution data..." />;
  }

  return (
    <div className="grid gap-8">
      <GlassCard>
        <CardHeader>
          <CardTitle>Print Distribution</CardTitle>
          <CardDescription>
            Manage the distribution of prints to students who have paid.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 md:gap-6">
          <div className="grid gap-2">
            <Label>Select Print Event</Label>
            <Select onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {printEvents?.map(event => (
                  <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="student">Search Student (Name or Roll No.)</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                  disabled={!selectedEventId || studentsWhoPaid.length === 0}
                >
                  {selectedStudent
                    ? `${selectedStudent.name} (${selectedStudent.rollNo})`
                    : studentsWhoPaid.length > 0 ? 'Select student...' : 'All prints distributed'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search by name or roll no..."
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>No student found.</CommandEmpty>
                    <CommandGroup>
                      {filteredStudents.map((student) => (
                        <CommandItem
                          key={student.id}
                          value={`${student.name} ${student.rollNo}`}
                          onSelect={() => {
                            setSelectedStudent(student);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedStudent?.id === student.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.rollNo}</p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          {selectedEventId && (
            <div className="md:col-span-2 grid grid-cols-2 gap-4 mt-2">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400 opacity-70">Distributed</p>
                <p className="text-xl font-bold text-white">{filteredDistributions.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-orange-400 opacity-70">Pending</p>
                <p className="text-xl font-bold text-white">{studentsWhoPaid.length}</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button disabled={!selectedStudent || isSubmitting} onClick={handleDistribute}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-4 w-4" />}
            Mark as Distributed
          </Button>
        </CardFooter>
      </GlassCard>

      <GlassCard>
        <CardHeader>
          <CardTitle>Distribution History</CardTitle>
          <CardDescription>
            A log of all students who have received their prints for the selected event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile View */}
          <div className="grid gap-4 md:hidden">
            {filteredDistributions?.map(dist => (
              <GlassCard key={dist.id} variant="bordered" className="bg-white/5">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{dist.studentName}</p>
                    <p className="text-sm text-muted-foreground">{dist.studentRoll}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{formatDate(dist.distributedAt)}</p>
                      <p>{new Date(dist.distributedAt).toLocaleTimeString()}</p>
                    </div>
                    <DeleteConfirmationDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {deletingId === dist.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />}
                        </Button>
                      }
                      title="Delete Distribution Record?"
                      description={
                        <span>
                          This will remove the distribution record for <strong>{dist.studentName}</strong>. They will
                          appear again in the distribution list and can be re-distributed. This action cannot be undone.
                        </span>
                      }
                      confirmationString={dist.studentName ?? ''}
                      onConfirm={() => handleDelete(dist.id)}
                      isDeleting={deletingId === dist.id}
                    />
                  </div>
                </CardContent>
              </GlassCard>
            ))}
          </div>
          {/* Desktop View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Date Distributed</TableHead>
                  <TableHead>Time Distributed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDistributions?.map(dist => (
                  <TableRow key={dist.id}>
                    <TableCell className="font-medium">{dist.studentName}</TableCell>
                    <TableCell>{dist.studentRoll}</TableCell>
                    <TableCell>{formatDate(dist.distributedAt)}</TableCell>
                    <TableCell>{new Date(dist.distributedAt).toLocaleTimeString()}</TableCell>
                    <TableCell className="text-right">
                      <DeleteConfirmationDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {deletingId === dist.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />}
                          </Button>
                        }
                        title="Delete Distribution Record?"
                        description={
                          <span>
                            This will remove the distribution record for <strong>{dist.studentName}</strong>. They will
                            appear again in the distribution list and can be re-distributed. This action cannot be undone.
                          </span>
                        }
                        confirmationString={dist.studentName ?? ''}
                        onConfirm={() => handleDelete(dist.id)}
                        isDeleting={deletingId === dist.id}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredDistributions?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No distribution history for this event yet.
            </div>
          )}
        </CardContent>
      </GlassCard>
    </div>
  );
}
