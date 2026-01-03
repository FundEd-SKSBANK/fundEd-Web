import type { Event, Student } from '@/lib/types';

/**
 * Calculate the collection progress percentage for an event
 */
export const getCollectionProgress = (event: Event, students: Student[]): number => {
  if (students.length === 0) return 0;

  const paidStudentsCount = event.payments
    ? new Set(event.payments.filter(p => p.status === 'Paid').map(p => p.studentId)).size
    : 0;

  const totalParticipants = event.participantCount || students.length;
  if (totalParticipants === 0) return 0;
  return (paidStudentsCount / totalParticipants) * 100;
};

/**
 * Copy payment link to clipboard
 */
export const copyPaymentLink = (eventId: string, origin: string): string => {
  const link = `${origin}/pay/${eventId}`;
  navigator.clipboard.writeText(link);
  return link;
};

/**
 * Filter students by search query (name, roll number, or class)
 */
export const filterStudents = (
  students: Student[],
  searchQuery: string
): Student[] => {
  return students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rollNo.includes(searchQuery) ||
    student.class.toLowerCase().includes(searchQuery.toLowerCase())
  );
};
