'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Bell,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    Printer,
    Settings,
    Users,
    Wallet,
    ArrowRight,
    GraduationCap,
    Receipt,
    ChevronDown,
    ChevronRight,
    Shield,
} from 'lucide-react';
import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Transaction } from '@/lib/types';
import { getPendingTransactions, getUserNotifications } from '@/actions/notifications';
import { getEvents } from '@/actions/events';
import { logout } from '@/actions/auth';
import { useEffect, useState } from 'react';
import { CustomCursor } from '@/components/custom-cursor';
import { MouseFollower } from '@/components/mouse-follower';

/** Generate up to 2-letter initials from an email address.
 *  e.g. superadmin@funded.com → SA
 *       john.doe@x.com        → JD
 *       alice@x.com           → AL
 */
function getInitials(email?: string | null, name?: string | null): string {
    if (name) {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return name.slice(0, 2).toUpperCase();
    }
    if (!email) return 'AD';
    const local = email.split('@')[0]; // e.g. "superadmin" or "john.doe"
    const segments = local.split(/[.\-_]/);
    if (segments.length >= 2) return (segments[0][0] + segments[1][0]).toUpperCase();
    return local.slice(0, 2).toUpperCase();
}

const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/events', icon: Wallet, label: 'Events' },
    { href: '/dashboard/prints', icon: Printer, label: 'Prints' },
    { href: '/dashboard/students', icon: Users, label: 'Students' },
    { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
];

function MainNav({ user, events }: { user?: any; events?: { id: string; name: string }[] }) {
    const pathname = usePathname();
    const isSuperUser = user?.role === 'superadmin';
    const [expensesOpen, setExpensesOpen] = useState(false);

    const items = isSuperUser
        ? [{ href: '/dashboard/super', icon: Shield, label: 'Super Dashboard' }]
        : [...navItems];

    return (
        <SidebarMenu>
            {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                        <SidebarMenuButton
                            isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                            tooltip={item.label}
                            className={item.href === '/dashboard/super' ? "text-amber-400 hover:text-amber-300" : ""}
                        >
                            <item.icon className={item.href === '/dashboard/super' ? "text-amber-400" : ""} />
                            <span>{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ))}

            {/* Expenses Quick Access */}
            {!isSuperUser && events && events.length > 0 && (
                <Collapsible open={expensesOpen} onOpenChange={setExpensesOpen}>
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                                tooltip="Expenses"
                                isActive={pathname.includes('/expenses')}
                                className="w-full"
                            >
                                <Receipt />
                                <span>Expenses</span>
                                {expensesOpen
                                    ? <ChevronDown className="ml-auto h-4 w-4 shrink-0" />
                                    : <ChevronRight className="ml-auto h-4 w-4 shrink-0" />}
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                    </SidebarMenuItem>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {events.slice(0, 6).map(event => (
                                <SidebarMenuSubItem key={event.id}>
                                    <SidebarMenuSubButton
                                        asChild
                                        isActive={pathname === `/dashboard/events/${event.id}/expenses`}
                                    >
                                        <Link href={`/dashboard/events/${event.id}/expenses`} className="truncate">
                                            <span className="truncate">{event.name}</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </Collapsible>
            )}
        </SidebarMenu>
    );
}

function MobileNav({ user, events }: { user?: any; events?: { id: string; name: string }[] }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-white/5 border-white/10 hover:bg-white/10">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 bg-black/95 border-white/10 backdrop-blur-xl">
                <SheetHeader className="p-4 border-b border-white/10">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <SheetDescription className="sr-only">
                        Access dashboard navigation links and settings.
                    </SheetDescription>
                    <Link href="/" className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <GraduationCap className="h-5 w-5 text-emerald-400" />
                        </div>
                        <span className="font-bold text-white">FundEd</span>
                    </Link>
                </SheetHeader>
                <nav className="flex-1 overflow-y-auto p-4">
                    <MainNav user={user} events={events} />
                </nav>
            </SheetContent>
        </Sheet>
    );
}

const NotificationItem = ({ transaction }: { transaction: Transaction }) => {
    return (
        <DropdownMenuItem asChild>
            <Link 
                href={`/dashboard/events/${transaction.eventId}/payments?status=Verification+Pending`}
                className="flex items-center gap-4 w-full cursor-pointer hover:bg-white/5 transition-colors p-3"
            >
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between w-full gap-3">
                        <p className="text-sm font-medium truncate flex-1">{transaction.studentName}</p>
                        <span className="text-[10px] text-stone-500 shrink-0">
                            {new Date(transaction.paymentDate).toLocaleString('en-GB', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: '2-digit',
                                hour: '2-digit', 
                                minute: '2-digit', 
                                hour12: true 
                            }).toUpperCase()}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{transaction.eventName} - ₹{transaction.amount}</p>
                </div>
                <ArrowRight className="shrink-0 h-4 w-4 text-muted-foreground" />
            </Link>
        </DropdownMenuItem>
    );
};

interface DashboardClientLayoutProps {
    children: React.ReactNode;
    user: any;
    initialEvents?: { id: string; name: string }[];
}

export default function DashboardClientLayout({
    children,
    user,
    initialEvents = []
}: DashboardClientLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
    const [userNotifications, setUserNotifications] = useState<any[]>([]);

    const isSuperUser = user?.role === 'superadmin';
    const adminUser = user;
    const [recentEvents, setRecentEvents] = useState<{ id: string; name: string }[]>(initialEvents);

    useEffect(() => {
        const initData = async () => {
            if (!isSuperUser) {
                const notifRes = await getPendingTransactions();
                if (notifRes.success && notifRes.data) {
                    setPendingTransactions(notifRes.data as unknown as Transaction[]);
                }
            } else {
                const userNotifRes = await getUserNotifications();
                if (userNotifRes.success && userNotifRes.data) {
                    setUserNotifications(userNotifRes.data as any[]);
                }
            }
            const eventsRes = await getEvents();
            if (eventsRes.success && eventsRes.data) {
                setRecentEvents((eventsRes.data as any[]).slice(0, 6).map((e: any) => ({ id: e.id, name: e.name })));
            }
        };

        initData();

        // Poll every minute
        const interval = setInterval(initData, 60000);
        return () => clearInterval(interval);
    }, [isSuperUser]);

    const handleLogout = async () => {
        await logout();
    }

    return (
        <div className="dark min-h-screen bg-black text-stone-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-100 overflow-x-hidden relative cursor-none">

            <CustomCursor />

            <div className="fixed inset-0 z-[50] opacity-[0.07] pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-emerald-600/30 via-emerald-800/20 to-transparent blur-[120px] mix-blend-screen opacity-60 animate-float will-change-transform" />
                <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-lime-500/20 via-lime-700/15 to-transparent blur-[100px] mix-blend-screen opacity-50 animate-float-delayed will-change-transform" />
                <div className="absolute bottom-[-15%] left-[15%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-teal-600/25 via-teal-800/20 to-transparent blur-[110px] mix-blend-screen opacity-55 animate-float-slow will-change-transform" />
                <MouseFollower />
            </div>

            <SidebarProvider>
                <div className="min-h-screen w-full flex relative z-10">
                    <Sidebar
                        collapsible="icon"
                        className="border-r border-white/5 bg-gradient-to-b from-black/40 to-black/60 backdrop-blur-xl hidden md:flex flex-col"
                    >
                        <SidebarHeader className="p-4 md:p-6 border-b border-white/5">
                            <Link href="/dashboard" className="flex items-center gap-3 group">
                                <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                                    <GraduationCap className="h-5 w-5 text-emerald-400" />
                                </div>
                                <span className={cn(
                                    "font-bold text-white whitespace-nowrap",
                                    "group-data-[collapsible=icon]:hidden",
                                )}>FundEd</span>
                            </Link>
                        </SidebarHeader>
                        <SidebarContent className="px-3 py-4 gap-2">
                            <MainNav user={adminUser} events={recentEvents} />
                        </SidebarContent>
                        {!isSuperUser && (
                            <SidebarFooter className="p-4 md:p-6 border-t border-white/5">
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <Link href="/dashboard/settings">
                                            <SidebarMenuButton tooltip="Settings" isActive={pathname === '/dashboard/settings'}>
                                                <Settings />
                                                <span>Settings</span>
                                            </SidebarMenuButton>
                                        </Link>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarFooter>
                        )}
                    </Sidebar>

                    <div className="flex flex-col flex-1 min-w-0">
                        <header className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b border-white/5 bg-black/40 backdrop-blur-xl px-2 sm:px-4 md:px-8 sticky top-0 z-30">
                            <MobileNav user={adminUser} events={recentEvents} />
                            <div className="flex-1">
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-white/10 h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                                        <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-stone-300" />
                                        {((!isSuperUser && pendingTransactions.length > 0) || (isSuperUser && userNotifications.length > 0)) && (
                                            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[10px] sm:text-xs bg-emerald-500">
                                                {!isSuperUser ? pendingTransactions.length : userNotifications.length}
                                            </Badge>
                                        )}
                                        <span className="sr-only">Toggle notifications</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-80 bg-black/95 border-white/10 backdrop-blur-xl">
                                    <DropdownMenuLabel className="text-white">
                                        {isSuperUser ? 'User Notifications' : 'Pending Verifications'}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    {!isSuperUser ? (
                                        pendingTransactions.length > 0 ? (
                                            <DropdownMenuGroup>
                                                {pendingTransactions.map(t => (
                                                    <NotificationItem key={t.id} transaction={t} />
                                                ))}
                                            </DropdownMenuGroup>
                                        ) : (
                                            <div className="p-4 text-center text-stone-500 text-sm italic">No pending verifications</div>
                                        )
                                    ) : (
                                        userNotifications.length > 0 ? (
                                            <DropdownMenuGroup>
                                                {userNotifications.map(n => (
                                                    <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-white/5 transition-colors">
                                                        <div className="flex items-center justify-between w-full">
                                                            <span className="text-sm font-semibold text-white">{n.title}</span>
                                                            <span className="text-[10px] text-stone-500">
                                                                {new Date(n.date).toLocaleString('en-GB', { 
                                                                    day: '2-digit', 
                                                                    month: '2-digit', 
                                                                    year: '2-digit',
                                                                    hour: '2-digit', 
                                                                    minute: '2-digit', 
                                                                    hour12: true 
                                                                }).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-stone-400 leading-relaxed">{n.description}</p>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuGroup>
                                        ) : (
                                            <div className="p-4 text-center text-stone-500 text-sm italic">No new notifications</div>
                                        )
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-white/10 shrink-0">
                                        <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-emerald-500/20">
                                            {adminUser?.image ? (
                                                <AvatarImage src={adminUser.image} alt={adminUser?.name || 'Admin'} className="object-cover" />
                                            ) : null}
                                            <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-semibold">
                                                {getInitials(adminUser?.email, adminUser?.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 bg-black/95 border-white/10 backdrop-blur-xl" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none text-white">{adminUser?.name || "Admin"}</p>
                                            <p className="text-xs leading-none text-stone-400">
                                                {adminUser?.email || "admin@funded.com"}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    {!isSuperUser && (
                                        <>
                                            <DropdownMenuSeparator className="bg-white/10" />
                                            <DropdownMenuItem asChild className="hover:bg-white/10">
                                                <Link href="/dashboard/settings">
                                                    <Settings className="mr-2 h-4 w-4" />
                                                    <span>Settings</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuItem onClick={handleLogout} className="hover:bg-white/10 text-red-400">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </header>
                        <main className="flex flex-1 flex-col gap-3 sm:gap-4 p-2 sm:p-4 md:gap-8 md:p-8 relative z-10 overflow-x-hidden w-full min-w-0">
                            {children}
                        </main>

                        <footer className="border-t border-white/5 bg-black/40 backdrop-blur-xl px-4 md:px-8 py-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
                                <p>© 2024 FundEd - Classroom OS. All rights reserved.</p>
                                <p className="flex items-center gap-1">
                                    A sub-product of <span className="text-emerald-400 font-semibold">SKS DM</span>
                                </p>
                            </div>
                        </footer>
                    </div>
                </div >
            </SidebarProvider >
        </div >
    );
}
