'use server'

import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

import { getSession, getWorkspaceId } from '@/lib/auth';
import { getUserRole } from '@/actions/auth';

export async function getUsers() {
    try {
        const session = await getSession();
        if (!session || !session.user) return { success: false, error: "Unauthorized" };

        if (session.user.role === 'superadmin') {
            const users = await prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, email: true, role: true, image: true, createdAt: true, adminId: true }
            });
            return { success: true, data: users };
        } else if (session.user.role === 'admin') {
            // Admin sees themselves and their collab users
            const users = await prisma.user.findMany({
                where: {
                    OR: [
                        { id: session.user.id },
                        { adminId: session.user.id }
                    ]
                },
                select: { id: true, name: true, email: true, role: true, image: true, createdAt: true, adminId: true }
            });
            return { success: true, data: users };
        } else {
             // Collab user sees only themselves
             const user = await prisma.user.findUnique({
                 where: { id: session.user.id },
                 select: { id: true, name: true, email: true, role: true, image: true, createdAt: true, adminId: true }
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
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
                role: true,
                defaultClass: true,
                _count: { select: { createdStudents: true, createdEvents: true } }
            }
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

        // For collab users, return the parent admin's data so they see the admin's slug/settings
        const targetId = getWorkspaceId(session.user);

        const user = await prisma.user.findUnique({
            where: { id: targetId },
            select: { id: true, name: true, email: true, role: true, image: true, slug: true, defaultClass: true }
        });

        if (!user) {
             return { success: false, error: "User not found" };
        }

        // Attach the actual logged-in user's role so the UI can gate features correctly
        return { success: true, data: { ...user, role: session.user.role } };
    } catch (error) {
        console.error("Failed to get current admin:", error);
        return { success: false, error: "Failed to get current admin" };
    }
}

export async function createUser(data: { name: string; email: string; password: string; image?: string; role?: string }) {
    try {
        const role = await getUserRole();
        
        if (role !== 'superadmin') {
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

export async function createCollabUser(data: { name: string; email: string; password: string }) {
    try {
        const session = await getSession();
        if (!session || !session.user || session.user.role !== 'admin') {
            return { success: false, error: "Only Admins can create Collab users." };
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
                role: 'collab',
                adminId: session.user.id // Link to the admin running the action
            } as any
        });

        revalidatePath('/dashboard/settings');
        return { success: true, data: newUser };

    } catch (error) {
        console.error("Failed to create collab user:", error);
        return { success: false, error: "Failed to create collab user" };
    }
}


export async function deleteUser(userId: string) {
    try {
        const session = await getSession();
        if (!session || !session.user) return { success: false, error: "Unauthorized" };

        const role = session.user.role;
        
        if (role !== 'superadmin' && role !== 'admin') {
            return { success: false, error: "Unauthorized" };
        }

        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) return { success: false, error: "User not found" };

        // If admin, they can only delete their own collab users
        if (role === 'admin' && (targetUser as any).adminId !== session.user.id) {
            return { success: false, error: "Unauthorized to delete this user" };
        }
        
        await prisma.user.delete({
            where: { id: userId }
        });
        
        revalidatePath('/dashboard/settings');
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

        const targetUser = await prisma.user.findUnique({ where: { id: data.id } });
        if (!targetUser) return { success: false, error: "User not found" };

        // Allow update if user is editing themselves OR if user is superadmin
        // OR if user is admin and modifying their own collab user
        const isSelf = session.user.id === data.id;
        const isSuperAdmin = session.user.role === 'superadmin';
        const isAdminModifyingCollab = session.user.role === 'admin' && (targetUser as any).adminId === session.user.id;

        if (!isSelf && !isSuperAdmin && !isAdminModifyingCollab) {
             return { success: false, error: "Unauthorized to modify this user" };
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

export async function updateAdminSlug(slug: string) {
    try {
        const session = await getSession();
        if (!session || !session.user) return { success: false, error: 'Unauthorized' };

        const trimmed = slug.trim().toLowerCase();

        // Validate format: lowercase alphanumeric + hyphens only
        if (!/^[a-z0-9-]+$/.test(trimmed)) {
            return { success: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens.' };
        }
        if (trimmed.length < 3 || trimmed.length > 40) {
            return { success: false, error: 'Slug must be between 3 and 40 characters.' };
        }

        // Check uniqueness (exclude self)
        const existing = await prisma.user.findFirst({
            where: { slug: trimmed, NOT: { id: session.user.id } }
        });
        if (existing) {
            return { success: false, error: 'This slug is already taken. Please choose another.' };
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { slug: trimmed }
        });

        revalidatePath('/dashboard/settings');
        return { success: true, slug: trimmed };

    } catch (error) {
        console.error('Failed to update slug:', error);
        return { success: false, error: 'Failed to update slug.' };
    }
}

export async function checkSlugAvailability(slug: string) {
    try {
        const session = await getSession();
        if (!session || !session.user) return { available: null };

        const trimmed = slug.trim().toLowerCase();

        // Don't check until meaningful length
        if (trimmed.length < 3) return { available: null };
        if (!/^[a-z0-9-]+$/.test(trimmed)) return { available: false, error: 'Only lowercase letters, numbers, and hyphens.' };

        const existing = await prisma.user.findFirst({
            where: { slug: trimmed, NOT: { id: session.user.id } },
            select: { id: true }
        });

        return { available: !existing };
    } catch {
        return { available: null }; // silent fail — save button will still validate
    }
}

// ─── Collab Event Visibility ──────────────────────────────────────────────────

export async function getCollabVisibleEvents(collabId: string) {
    try {
        const session = await getSession();
        if (!session?.user) return { success: false, error: 'Unauthorized' };
        if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
            return { success: false, error: 'Unauthorized' };
        }

        const grants = await (prisma as any).collabEventVisibility.findMany({
            where: { collabId },
            select: { eventId: true, grantType: true, grantedAt: true },
        });

        return { success: true, data: grants };
    } catch (error) {
        console.error('Failed to get collab visible events:', error);
        return { success: false, error: 'Failed to fetch event access' };
    }
}

export async function updateCollabVisibleEvents(
    collabId: string,
    grants: { eventId: string; grantType: 'full' | 'view_only' }[]
) {
    try {
        const session = await getSession();
        if (!session?.user) return { success: false, error: 'Unauthorized' };

        const isAdmin = session.user.role === 'admin';
        const isSuperAdmin = session.user.role === 'superadmin';
        if (!isAdmin && !isSuperAdmin) return { success: false, error: 'Unauthorized' };

        // Verify the collab user belongs to this admin
        if (isAdmin) {
            const collab = await prisma.user.findUnique({
                where: { id: collabId },
                select: { adminId: true, role: true },
            });
            if (!collab || collab.role !== 'collab' || (collab as any).adminId !== session.user.id) {
                return { success: false, error: 'Collab user not found or not yours' };
            }
        }

        // Replace all grants for this collab user atomically
        await prisma.$transaction(async (tx: any) => {
            await tx.collabEventVisibility.deleteMany({ where: { collabId } });
            if (grants.length > 0) {
                await tx.collabEventVisibility.createMany({
                    data: grants.map(g => ({
                        collabId,
                        eventId: g.eventId,
                        grantType: g.grantType,
                    })),
                });
            }
        });

        revalidatePath('/dashboard/settings');
        return { success: true };
    } catch (error) {
        console.error('Failed to update collab visible events:', error);
        return { success: false, error: 'Failed to update event access' };
    }
}

// Called by collab users to get their own granted event IDs
export async function getMyVisibleEventIds(): Promise<{ eventIds: string[]; grantMap: Record<string, 'full' | 'view_only'> }> {
    try {
        const session = await getSession();
        if (!session?.user || session.user.role !== 'collab') return { eventIds: [], grantMap: {} };

        const grants = await (prisma as any).collabEventVisibility.findMany({
            where: { collabId: session.user.id },
            select: { eventId: true, grantType: true },
        });

        const eventIds = grants.map((g: any) => g.eventId);
        const grantMap: Record<string, 'full' | 'view_only'> = {};
        grants.forEach((g: any) => { grantMap[g.eventId] = g.grantType; });

        return { eventIds, grantMap };
    } catch {
        return { eventIds: [], grantMap: {} };
    }
}

