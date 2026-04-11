'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap, Link2, CalendarDays, IndianRupee, Users,
  ShieldAlert, CheckCircle2, ChevronRight, ArrowLeft,
  Search, Loader2, Tag, AlertCircle, Zap, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { autoCreateAndConnectSubEvent } from '@/actions/major-events';
import { getStudents } from '@/actions/students';
import type { JoinTokenData, JoinSessionUser, Student } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  token: string;
  tokenData: JoinTokenData | null;
  tokenError: string | null;
  initialSession: JoinSessionUser | null;
}

type Step = 'preview' | 'customise' | 'success';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-stone-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-100 flex flex-col items-center justify-center p-3 sm:p-4 py-6 sm:py-8">
      {/* BG Orbs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-emerald-600/30 via-emerald-800/20 to-transparent blur-[130px] opacity-70" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-teal-600/25 via-teal-800/15 to-transparent blur-[120px] opacity-60" />
        <div className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] rounded-full bg-gradient-to-br from-lime-600/15 to-transparent blur-[100px] opacity-40" />
      </div>
      {/* Brand bar */}
      <Link href="/" className="flex items-center gap-2.5 mb-4 sm:mb-8 group z-10 relative">
        <GraduationCap className="w-8 h-8 text-emerald-400" />
        <div className="flex flex-col">
          <span className="text-xl font-bold text-white leading-none">FundEd</span>
          <span className="text-[10px] text-emerald-400/80 uppercase tracking-widest mt-1 leading-none font-medium">Classroom OS</span>
        </div>
      </Link>
      <div className="relative z-10 w-full max-w-lg">
        {children}
      </div>
    </div>
  );
}

// ─── State Views ──────────────────────────────────────────────────────────────

function ErrorCard({ message }: { message: string }) {
  return (
    <PageShell>
      <div className="rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 backdrop-blur-xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Link Unavailable</h1>
        <p className="text-stone-400 text-sm mb-6">{message}</p>
        <Link href="/login">
          <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0 rounded-full px-8">
            Back to Login
          </Button>
        </Link>
      </div>
    </PageShell>
  );
}

function NotLoggedInCard({ token, tokenData }: { token: string; tokenData: JoinTokenData }) {
  return (
    <PageShell>
      <div className="rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 backdrop-blur-xl p-8 shadow-2xl">
        {/* Event Preview */}
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Quick-Join Invite</span>
          </div>
          <p className="text-stone-400 text-xs mb-1">from <span className="text-white font-medium">{tokenData.creatorName}</span></p>
          <h2 className="text-lg font-bold text-white mb-1">{tokenData.majorEventName}</h2>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-stone-400">
            <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />{formatCurrency(tokenData.cost)}/student</span>
            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />Due {formatDate(tokenData.deadline)}</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Sign in to Join</h1>
        <p className="text-stone-400 text-sm mb-6">
          You need a FundEd admin account to use this Quick-Join link. Sign in to create your class event.
        </p>
        <Link href={`/login?redirect=/join/${token}`}>
          <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0 rounded-full h-11 font-bold shadow-xl shadow-emerald-500/30">
            Sign In to Continue <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </PageShell>
  );
}

function CollabBlockCard() {
  return (
    <PageShell>
      <div className="rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 backdrop-blur-xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Admin Account Required</h1>
        <p className="text-stone-400 text-sm mb-6">
          Quick-Join links are only available for admin accounts. Collab users cannot create or own events.
          Contact your admin to use this link on their behalf.
        </p>
        <Link href="/dashboard">
          <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 rounded-full px-8">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </PageShell>
  );
}

function AlreadyJoinedCard({ eventId, eventName, majorEventName }: { eventId: string; eventName: string; majorEventName: string }) {
  return (
    <PageShell>
      <div className="rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 backdrop-blur-xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Already Connected</h1>
        <p className="text-stone-400 text-sm mb-2">
          You've already joined <span className="text-emerald-400 font-medium">{majorEventName}</span>.
        </p>
        <p className="text-xs text-stone-500 mb-6">Your event: <span className="text-white">{eventName}</span></p>
        <Link href={`/dashboard/events/${eventId}/payments`}>
          <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 rounded-full px-8 h-11 font-bold">
            Open My Event →
          </Button>
        </Link>
      </div>
    </PageShell>
  );
}

// ─── Class Group (for student picker) ─────────────────────────────────────────

function ClassGroup({
  className,
  students,
  selectedStudents,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: {
  className: string;
  students: Student[];
  selectedStudents: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onDeselectAll: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ids = students.map(s => s.id);
  const selectedCount = students.filter(s => selectedStudents.has(s.id)).length;
  const allSelected = selectedCount === students.length;

  return (
    <div className="rounded-xl border border-white/[0.07] overflow-hidden">
      {/* Group header */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.04] cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}
      >
        <div
          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${allSelected ? 'border-emerald-400 bg-emerald-400' : selectedCount > 0 ? 'border-emerald-400' : 'border-stone-600'}`}
          onClick={(e) => {
            e.stopPropagation();
            if (allSelected) onDeselectAll(ids); else onSelectAll(ids);
          }}
        >
          {allSelected && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {!allSelected && selectedCount > 0 && (
            <div className="w-1.5 h-1.5 rounded-sm bg-emerald-400" />
          )}
        </div>
        <span className="text-xs font-semibold text-stone-300 flex-1">{className}</span>
        <span className="text-[10px] text-stone-500">{selectedCount}/{students.length}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {/* Student rows (collapsed by default) */}
      {open && (
        <div className="divide-y divide-white/[0.04]">
          {students.map(student => (
            <div
              key={student.id}
              onClick={() => onToggle(student.id)}
              className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors select-none ${selectedStudents.has(student.id) ? 'bg-emerald-500/8' : 'hover:bg-white/[0.03]'}`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedStudents.has(student.id) ? 'border-emerald-400 bg-emerald-400' : 'border-stone-600'}`}>
                {selectedStudents.has(student.id) && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{student.name}</p>
                <p className="text-[10px] text-stone-500">{student.rollNo}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Join Flow ───────────────────────────────────────────────────────────

export function JoinClient({ token, tokenData, tokenError, initialSession }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('preview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Duplicate join state
  const [alreadyJoined, setAlreadyJoined] = useState<{ eventId: string; eventName: string } | null>(null);

  // Step 2 state
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [classLabel, setClassLabel] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  // Success state
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [createdEventName, setCreatedEventName] = useState<string | null>(null);

  // Error states
  if (tokenError) return <ErrorCard message={tokenError} />;
  if (!tokenData) return <ErrorCard message="Invalid Quick-Join link." />;
  if (!initialSession) return <NotLoggedInCard token={token} tokenData={tokenData} />;
  if (initialSession.role === 'collab') return <CollabBlockCard />;
  if (alreadyJoined) return <AlreadyJoinedCard eventId={alreadyJoined.eventId} eventName={alreadyJoined.eventName} majorEventName={tokenData.majorEventName} />;

  // Load students when moving to step 2
  const handleApprove = async () => {
    setStudentsLoading(true);
    const studentsRes = await getStudents();
    if (studentsRes.success && studentsRes.students) {
      const all = studentsRes.students as Student[];
      setStudents(all);
      // Auto-select all students by default
      setSelectedStudents(new Set(all.map(s => s.id)));
    }
    setStudentsLoading(false);
    setStep('customise');
  };

  // Group students by class
  const groupedByClass = useMemo(() => {
    const filtered = students.filter(s =>
      !studentSearch ||
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(studentSearch.toLowerCase())
    );
    const map: Record<string, Student[]> = {};
    filtered.forEach(s => {
      const key = s.class || 'No Class';
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [students, studentSearch]);

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllInGroup = (ids: string[]) => {
    setSelectedStudents(prev => { const next = new Set(prev); ids.forEach(id => next.add(id)); return next; });
  };

  const deselectAllInGroup = (ids: string[]) => {
    setSelectedStudents(prev => { const next = new Set(prev); ids.forEach(id => next.delete(id)); return next; });
  };

  const handleCreate = async () => {
    if (!classLabel.trim()) {
      setError('Please enter a class label.');
      return;
    }
    setIsLoading(true);
    setError(null);
    const result = await autoCreateAndConnectSubEvent(token, {
      classLabel: classLabel.trim(),
      selectedStudentIds: Array.from(selectedStudents),
      qrCodeUrl: undefined,
    }) as any;
    setIsLoading(false);

    if (!result.success) {
      if (result.alreadyConnected) {
        setAlreadyJoined({ eventId: result.existingEventId, eventName: result.existingEventName });
        return;
      }
      setError(result.error || 'Something went wrong');
      return;
    }

    // result.data = { newEventId, newEventName }
    setCreatedEventId(result.data.newEventId);
    setCreatedEventName(result.data.newEventName);
    setStep('success');
  };

  // ── Step: Success ──────────────────────────────────────────────────────────
  if (step === 'success' && createdEventId) {
    return (
      <PageShell>
        <div className="rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 backdrop-blur-xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Event Created! 🎉</h1>
          <p className="text-stone-400 text-xs sm:text-sm mb-1">Your class event is live and connected to</p>
          <p className="text-emerald-400 font-semibold mb-1 text-sm sm:text-base">{tokenData.majorEventName}</p>
          <p className="text-xs text-stone-500 mb-6 px-4">"{createdEventName}"</p>
          <Button
            onClick={() => router.push(`/dashboard/events/${createdEventId}/payments`)}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0 rounded-full h-11 font-bold shadow-xl shadow-emerald-500/30"
          >
            Open My Event <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <Link href="/dashboard/events" className="block mt-3 text-sm text-stone-500 hover:text-stone-300 transition-colors">
            Go to Dashboard instead
          </Link>
        </div>
      </PageShell>
    );
  }

  // ── Step 1: Preview ────────────────────────────────────────────────────────
  if (step === 'preview') {
    return (
      <PageShell>
        <div className="rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Header banner */}
          <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-b border-white/10 px-5 sm:px-8 py-4 sm:py-5">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Quick-Join Invite</span>
            </div>
            <p className="text-stone-400 text-xs">
              from <span className="text-white font-semibold">{tokenData.creatorName}</span>
            </p>
          </div>

          <div className="p-5 sm:p-8">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-0.5 sm:mb-1">{tokenData.majorEventName}</h1>
            <p className="text-stone-400 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed">{tokenData.description || 'Join this event to track your class payments.'}</p>

            {/* Event details grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
              {[
                { icon: IndianRupee, label: 'Amount/Student', value: formatCurrency(tokenData.cost) },
                { icon: CalendarDays, label: 'Deadline', value: formatDate(tokenData.deadline) },
                { icon: Link2, label: 'Connected To', value: tokenData.majorEventName },
                { icon: Users, label: 'Participants', value: 'select in next step' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="p-2.5 sm:p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                    <Icon className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[9px] sm:text-[10px] text-stone-500 uppercase tracking-wider line-clamp-1">{label}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-white truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* What will be created */}
            <div className="p-3 sm:p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/15 mb-4 sm:mb-6">
              <p className="text-xs text-emerald-400 font-medium mb-1.5 sm:mb-2">✦ What happens when you approve:</p>
              <ul className="space-y-1 sm:space-y-1.5 text-[11px] sm:text-xs text-stone-400">
                <li className="flex items-start gap-1.5 sm:gap-2"><CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" /> An event will be created in your dashboard</li>
                <li className="flex items-start gap-1.5 sm:gap-2"><CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" /> You choose which students to add</li>
                <li className="flex items-start gap-1.5 sm:gap-2"><CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" /> Automatically connected to {tokenData.creatorName}'s event</li>
              </ul>
            </div>

            <p className="text-[11px] sm:text-xs text-stone-500 mb-3 sm:mb-5">
              Signed in as <span className="text-white">{initialSession.name || initialSession.email}</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-stone-300 h-11">
                  Decline
                </Button>
              </Link>
              <Button
                onClick={handleApprove}
                className="flex-1 w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0 rounded-full font-bold shadow-lg shadow-emerald-500/25 h-11"
              >
                Approve & Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Step 2: Customise ──────────────────────────────────────────────────────
  return (
    <PageShell>
      <div className="rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-white/10">
          <button onClick={() => setStep('preview')} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4 text-stone-400" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-white">Customise Your Event</h2>
            <p className="text-xs text-stone-500">Step 2 of 2</p>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">

          {/* Sub-event name preview */}
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <p className="text-xs text-stone-500 mb-1">Event name preview</p>
            <p className="text-sm font-semibold text-emerald-400 truncate">
              {tokenData.eventName}{classLabel ? ` — ${classLabel}` : ' — [your class label]'}
            </p>
          </div>

          {/* Class label */}
          <div>
            <label className="text-xs font-medium text-stone-300 mb-1.5 block flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-400" /> Class Label <span className="text-red-400">*</span>
            </label>
            <Input
              placeholder="e.g. CS-A 3rd Year, B.Tech ECE Batch 2"
              value={classLabel}
              onChange={e => setClassLabel(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-emerald-500/50 text-white placeholder:text-stone-500 rounded-xl h-10"
            />
            <p className="text-xs text-stone-600 mt-1">This label will be appended to the event name</p>
          </div>

          {/* Student picker — grouped by class */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-stone-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                Students ({selectedStudents.size} selected)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedStudents(new Set(students.map(s => s.id)))}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Select All
                </button>
                <span className="text-stone-600">·</span>
                <button
                  onClick={() => setSelectedStudents(new Set())}
                  className="text-xs text-stone-400 hover:text-stone-200 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {studentsLoading ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center text-xs text-stone-500">
                No students found in your workspace. You can add students to the event later.
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" />
                  <Input
                    placeholder="Search by name or roll no..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="bg-white/5 border-white/10 focus:border-emerald-500/50 text-white placeholder:text-stone-500 rounded-xl h-8 pl-8 text-xs"
                  />
                </div>

                {/* Class groups */}
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
                  {groupedByClass.length === 0 ? (
                    <p className="text-xs text-stone-500 text-center py-3">No students match your search.</p>
                  ) : (
                    groupedByClass.map(([cls, clsStudents]) => (
                      <ClassGroup
                        key={cls}
                        className={cls}
                        students={clsStudents}
                        selectedStudents={selectedStudents}
                        onToggle={toggleStudent}
                        onSelectAll={selectAllInGroup}
                        onDeselectAll={deselectAllInGroup}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Create button */}
          <Button
            onClick={handleCreate}
            disabled={isLoading || !classLabel.trim()}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0 rounded-full h-11 font-bold shadow-xl shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Event...</>
            ) : (
              <>Create My Class Event <Zap className="w-4 h-4 ml-1" /></>
            )}
          </Button>

          <p className="text-xs text-stone-600 text-center -mt-2">
            {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} will be enrolled
          </p>
        </div>
      </div>
    </PageShell>
  );
}
