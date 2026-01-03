import type { Student, PrintDistribution, Payment } from '@/lib/types';

/**
 * Format a date to DD/MM/YY format
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

/**
 * Filter students who have paid but haven't received prints for a specific event
 */
export const getStudentsWhoPaid = (
  allStudents: Student[],
  paidPayments: Payment[],
  distributions: PrintDistribution[],
  selectedEventId: string | undefined
): Student[] => {
  if (!allStudents || !paidPayments || !distributions || !selectedEventId) return [];

  const eventPaidStudentIds = paidPayments
    .filter(p => p.eventId === selectedEventId)
    .map(p => p.studentId);

  const eventDistributedStudentIds = distributions
    .filter(d => d.eventId === selectedEventId)
    .map(d => d.studentId);

  return allStudents.filter(s => eventPaidStudentIds.includes(s.id) && !eventDistributedStudentIds.includes(s.id));
};

/**
 * Filter students by search query (name or roll number)
 */
export const filterStudentsBySearch = (
  students: Student[],
  searchValue: string
): Student[] => {
  if (!searchValue) return students;
  return students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchValue.toLowerCase())
  );
};
