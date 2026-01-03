/**
 * Format a date to DD/MM/YY format
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

/**
 * Get the badge variant based on transaction status
 */
export const getStatusBadgeVariant = (status: string): string => {
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
