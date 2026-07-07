import { z } from 'zod';

export type Payment = {
  id: string;
  studentId: string;
  studentName: string; // denormalized for easier display
  studentRoll: string; // denormalized
  eventId: string;
  eventName: string; // denormalized
  eventCost?: number; // denormalized for balance calculation
  amount: number;
  paymentDate: Date | string;
  transactionId: string;
  status: 'Paid' | 'Pending' | 'Failed' | 'Verification Pending';
  paymentMethod: 'Razorpay' | 'QR Scan' | 'Cash' | 'N/A';
  razorpay_order_id?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

// Re-exporting Payment as Transaction for backwards compatibility in some components
export type Transaction = Payment;

export type Event = {
  id: string;
  name: string;
  description: string;
  deadline: Date | string;
  cost: number;
  totalCollected: number;
  totalPending: number;
  paymentOptions: ('Razorpay' | 'QR' | 'Cash')[];
  qrCodeUrl?: string;
  upiId?: string | null;
  category: 'Normal' | 'Print' | 'MajorEvent';
  semester?: string | null;
  className?: string | null;
  year?: string | null;
  isMajorEvent?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  payments?: Payment[];
  participantIds?: string[];
  participantCount?: number;
  paidCount?: number;
  pendingCount?: number;
  subEventCount?: number;
  status?: string;
  slug?: string | null;
  adminSlug?: string | null;
  // Connection status for sub-events
  activeConnection?: {
    id: string;
    status: 'PENDING' | 'APPROVED';
    majorEventName: string;
    majorEventId: string;
  } | null;
};

export type ConnectionToken = {
  id: string;
  token: string;
  label?: string | null;
  expiresAt: string;
  eventId: string;
  createdAt: string;
  status: 'active' | 'expired';
  isQuickJoin?: boolean; // true when token has autoCreatePayload
};

export type SubEventConnection = {
  id: string;
  tokenId: string;
  majorEventId: string;
  subEventId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  disconnectedAt?: string | null;
  disconnectedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  subEventName?: string;
  subEventAdminName?: string;
  subEventAdminEmail?: string;
  tokenLabel?: string | null;
  subEventTotalCollected?: number;
  subEventTotalCost?: number;
  subEventParticipantCount?: number;
  subEventPendingCount?: number;
  subEventPendingAmount?: number;
  subEventAdditionalRevenue?: number;
  subEventPrintDistributed?: number;
  subEventPrintTotal?: number;
  subEventCategory?: string;
  subEventPendingStudents?: {
    id: string;
    name: string;
    rollNo: string;
    amountDue: number;
  }[];
};

export type MajorEventAnalytics = {
  totalCollected: number;
  totalPending: number;
  totalAdditionalRevenue: number;
  grandTotal: number;
  totalStudents: number;
  connectedSubEventsCount: number;
  fundBreakdown: {
    studentCollections: number;
    additionalRevenue: number;
    grandTotal: number;
  };
  subEvents: SubEventConnection[];
};

export type Student = {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  phone?: string | null;
  class: string;
};

export type QrCode = {
  id: string;
  name: string;
  url: string;
};

export type PrintDistribution = {
  id: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  eventId: string;
  distributedAt: Date | string;
};

export const SendEmailInputSchema = z.object({
  studentName: z.string().describe('The name of the student.'),
  studentEmail: z.string().email().describe('The email address of the student.'),
  eventName: z.string().describe('The name of the event for which the print was distributed.'),
});

export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;

export const SendEmailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type SendEmailOutput = z.infer<typeof SendEmailOutputSchema>;

export const PaymentConfirmationEmailInputSchema = z.object({
  studentName: z.string(),
  studentEmail: z.string().email(),
  eventName: z.string(),
  amount: z.number(),
  paymentMethod: z.string(),
});
export type PaymentConfirmationEmailInput = z.infer<typeof PaymentConfirmationEmailInputSchema>;

export const PaymentApprovedEmailInputSchema = z.object({
  studentName: z.string(),
  studentEmail: z.string().email(),
  eventName: z.string(),
  amount: z.number(),
  checkStatusLink: z.string(),
});
export type PaymentApprovedEmailInput = z.infer<typeof PaymentApprovedEmailInputSchema>;

export const SendNewEventEmailInputSchema = z.object({
  studentName: z.string(),
  studentEmail: z.string().email(),
  eventName: z.string(),
  eventDescription: z.string().optional(),
  cost: z.number(),
  deadline: z.string(),
  paymentLink: z.string(),
});
export type SendNewEventEmailInput = z.infer<typeof SendNewEventEmailInputSchema>;

export const PaymentReceiptEmailInputSchema = z.object({
  studentName: z.string(),
  studentEmail: z.string().email(),
  eventName: z.string(),
  amountPaid: z.number(),
  transactionId: z.string(),
  paymentDate: z.string(),
  balanceDue: z.number(),
  totalCost: z.number(),
  checkStatusLink: z.string(),
});
export type PaymentReceiptEmailInput = z.infer<typeof PaymentReceiptEmailInputSchema>;

export const ResetPasswordEmailInputSchema = z.object({
  email: z.string().email(),
  resetLink: z.string(),
  name: z.string().optional(),
});
export type ResetPasswordEmailInput = z.infer<typeof ResetPasswordEmailInputSchema>;

export const VerificationOTPEmailInputSchema = z.object({
  email: z.string().email(),
  otp: z.string(),
  name: z.string().optional(),
});
export type VerificationOTPEmailInput = z.infer<typeof VerificationOTPEmailInputSchema>;

// ─── Quick-Join Flow Types ──────────────────────────────────────────────────

export interface JoinTokenData {
  tokenStr: string;
  majorEventId: string;
  majorEventName: string;
  creatorName: string;
  eventName: string;
  description: string;
  cost: number;
  deadline: string;
  paymentOptions: string;
  expiresAt: string;
}

export interface JoinSessionUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  adminId?: string | null;
}
