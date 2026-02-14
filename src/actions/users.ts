'use server'

import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

import { getSession } from '@/lib/auth';
import { getUserRole } from '@/actions/auth';

export async function getUsers() {
    try {
        const session = await getSession();
        if (!session || !session.user) return { success: false, error: "Unauthorized" };

        if (session.user.role === 'superuser') {
            const users = await prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, email: true, role: true, image: true, createdAt: true }
            });
            return { success: true, data: users };
        } else {
            // For normal admins, currently only show themselves to prevent data leakage.
            // Future improvement: Show "Team" if we implement shared workspaces.
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { id: true, name: true, email: true, role: true, image: true, createdAt: true }
            });
            return { success: true, data: user ? [user] : [] };
        }
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return { success: false, error: "Failed to fetch users" };
    }
}

export async function getAdmins() {
    try {
        const admins = await prisma.user.findMany({
            where: { role: 'admin' },
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, email: true, image: true, createdAt: true, role: true }
        });
        return { success: true, data: admins };
    } catch (error) {
        console.error("Failed to fetch admins:", error);
        return { success: false, error: "Failed to fetch admins" };
    }
}

export async function getCurrentAdmin() {
    try {
        const session = await getSession();
        if (!session || !session.user || !session.user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, name: true, email: true, role: true, image: true }
        });

        if (!user) {
             return { success: false, error: "User not found" };
        }

        return { success: true, data: user };
    } catch (error) {
        console.error("Failed to get current admin:", error);
        return { success: false, error: "Failed to get current admin" };
    }
}

export async function createUser(data: { name: string; email: string; password: string; image?: string; role?: string }) {
    try {
        const role = await getUserRole();
        
        if (role !== 'superuser') {
             return { success: false, error: "Only Superusers can create new Admins." };
        }

        // Check if email exists
        const existing = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existing) {
            return { success: false, error: "Email already exists" };
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const newUser = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                image: data.image,
                role: data.role || 'admin' 
            }
        });

        revalidatePath('/dashboard/super');
        return { success: true, data: newUser };

    } catch (error) {
        console.error("Failed to create user:", error);
        return { success: false, error: "Failed to create user" };
    }
}


export async function deleteUser(userId: string) {
    try {
        const role = await getUserRole();
        if (role !== 'superuser') {
            return { success: false, error: "Unauthorized" };
        }
        
        await prisma.user.delete({
            where: { id: userId }
        });
        revalidatePath('/dashboard/super');
        return { success: true };
    } catch (error) {
         console.error("Failed to delete user:", error);
         return { success: false, error: "Failed to delete user" };
    }
}

export async function updateUser(data: { id: string; name: string; email: string; password?: string; image?: string }) {
    try {
        const session = await getSession();
        if (!session || !session.user) return { success: false, error: "Unauthorized" };

        // Allow update if user is editing themselves OR if user is superuser
        if (session.user.id !== data.id && session.user.role !== 'superuser') {
             return { success: false, error: "Unauthorized" };
        }

        // Check if email exists for *other* users
        const existing = await prisma.user.findFirst({
            where: { 
                email: data.email,
                NOT: { id: data.id }
            }
        });

        if (existing) {
            return { success: false, error: "Email already taken by another user" };
        }

        const updateData: any = {
            name: data.name,
            email: data.email,
            image: data.image === '' ? null : data.image
        };

        if (data.password && data.password.trim() !== '') {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: data.id },
            data: updateData
        });

        revalidatePath('/dashboard/settings');
        revalidatePath('/dashboard/super');
        return { success: true, data: updatedUser };

    } catch (error) {
        console.error("Failed to update user:", error);
        return { success: false, error: "Failed to update user" };
    }
}

