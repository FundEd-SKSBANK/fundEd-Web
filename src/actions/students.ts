'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getSession, getWorkspaceId } from '@/lib/auth';

interface AddStudentInput {
  name: string;
  rollNumber: string;
  class: string;
  email?: string;
  phone?: string;
}

interface UpdateStudentInput {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  email?: string;
  phone?: string;
}

export async function addStudent(input: AddStudentInput) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
        return { success: false, error: "Unauthorized" };
    }

    const workspaceId = getWorkspaceId(session.user);
    const whereClause: any = { 
        rollNo: input.rollNumber,
        createdById: workspaceId
    };

    const existingStudent = await prisma.student.findFirst({
      where: whereClause
    });
    
    if (existingStudent) {
      return { success: false, error: 'A student with this roll number already exists in your workspace' };
    }

    // Create new student
    const student = await prisma.student.create({
      data: {
        name: input.name,
        rollNo: input.rollNumber,
        email: input.email || '',
        phone: input.phone || '',
        class: input.class,
        createdById: workspaceId,
      } as any,
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/students');
    revalidatePath('/dashboard/events');

    return { 
      success: true, 
      student: {
        id: student.id,
        name: student.name,
        rollNumber: student.rollNo,
      }
    };
  } catch (error) {
    console.error('Error adding student:', error);
    return { success: false, error: `Failed to add student: ${(error as any).message}` };
  }
}

export async function updateStudent(input: UpdateStudentInput) {
  try {
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    // Verify ownership
    const targetStudent = await prisma.student.findUnique({ where: { id: input.id } });
    if (!targetStudent) return { success: false, error: "Student not found" };

    const workspaceId = getWorkspaceId(session.user);
    if (session.user.role !== 'superadmin' && (targetStudent as any).createdById !== workspaceId) {
        return { success: false, error: "Unauthorized to update this student" };
    }

    // Check for duplicates
    const whereClause: any = { 
        rollNo: input.rollNumber,
        NOT: { id: input.id },
        createdById: workspaceId
    };

    const existingStudent = await prisma.student.findFirst({
      where: whereClause
    });
    
    if (existingStudent) {
      return { success: false, error: 'Another student with this roll number already exists' };
    }

    // Update student
    const student = await prisma.student.update({
      where: { id: input.id },
      data: {
        name: input.name,
        rollNo: input.rollNumber,
        email: input.email || '',
        phone: input.phone || '',
        class: input.class,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/students');
    revalidatePath('/dashboard/events');

    return { 
      success: true, 
      student: {
        id: student.id,
        name: student.name,
        rollNumber: student.rollNo,
      }
    };
  } catch (error) {
    console.error('Error updating student:', error);
    return { success: false, error: 'Failed to update student' };
  }
}

export async function getStudents() {
  try {
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    const workspaceId = getWorkspaceId(session.user);
    const whereClause: any = {
        createdById: workspaceId
    };

    const students = await prisma.student.findMany({
      where: whereClause,
      orderBy: {
        rollNo: 'asc',
      },
    });

    return { 
      success: true, 
      students: students.map(s => ({
        id: s.id,
        name: s.name,
        rollNo: s.rollNo,
        email: s.email,
        class: s.class,
        createdAt: s.createdAt.toISOString(),
      }))
    };
  } catch (error) {
    console.error('Error fetching students:', error);
    return { success: false, error: 'Failed to fetch students' };
  }
}

export async function deleteStudent(id: string) {
  try {
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    const targetStudent = await prisma.student.findUnique({ where: { id } });
    if (!targetStudent) return { success: false, error: "Student not found" };

    if (session.user.role !== 'superadmin' && (targetStudent as any).createdById !== getWorkspaceId(session.user)) {
        return { success: false, error: "Unauthorized to delete this student" };
    }

    await prisma.student.delete({
      where: { id },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/students');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting student:', error);
    return { success: false, error: 'Failed to delete student' };
  }
}

export async function uploadStudentsCsv(studentsData: any[]) {
  try {
    const session = await getSession();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    let successCount = 0;
    let failCount = 0;

    const workspaceId = getWorkspaceId(session.user);

    for (const student of studentsData) {
      try {
        const whereClause: any = { 
            rollNo: student.rollNo,
            createdById: workspaceId
        };

        const existing = await prisma.student.findFirst({
          where: whereClause
        });

        if (!existing) {
          await prisma.student.create({
            data: {
              name: student.name,
              rollNo: student.rollNo,
              email: student.email || '',
              class: student.class || '',
              createdById: workspaceId,
            } as any
          });
          successCount++;
        } else {
            failCount++;
        }
      } catch (e) {
        console.error(`Failed to upload student ${student.rollNo}:`, e);
        failCount++;
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/students');

    return { 
      success: true, 
      count: successCount,
      failed: failCount
    };
  } catch (error) {
    console.error('Error uploading CSV:', error);
    return { success: false, error: 'Failed to process CSV upload' };
  }
}
