import type { Transaction } from '@/lib/types';

/**
 * Format a date to DD/MM/YY format
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

/**
 * Get the badge variant based on transaction status
 */
export const getStatusBadgeVariant = (status: Transaction['status']): string => {
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
