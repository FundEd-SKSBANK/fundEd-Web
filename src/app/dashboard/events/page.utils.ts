import type { Event, Student } from '@/lib/types';

/**
 * Calculate the collection progress percentage for an event
 */
export const getCollectionProgress = (event: Event, students: Student[]): number => {
  const totalParticipants = event.participantCount ?? 0;
  if (totalParticipants === 0) return 0;
  
  if (event.cost === 0) return 100; // Free event is always 100% collected efficiently

  const totalExpected = totalParticipants * event.cost;
  const collected = event.totalCollected ?? 0;

  return Math.min(100, (collected / totalExpected) * 100);
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
