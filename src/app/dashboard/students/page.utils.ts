import type { Student } from '@/lib/types';

/**
 * Get initials from a name (first two letters)
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Filter students by search query (name, roll number, or email)
 */
export const filterStudents = (
  students: Student[],
  searchQuery: string
): Student[] => {
  return students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
};

/**
 * Copy public portal link to clipboard
 */
export const copyPublicPortalLink = (origin: string): string => {
  const link = `${origin}/check-status`;
  navigator.clipboard.writeText(link);
  return link;
};
