'use client';

import { Suspense, useActionState, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, Loader2, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { resetPassword } from '@/actions/auth';
import { Label } from '@/components/ui/label';
import { useFormStatus } from 'react-dom';
import { CustomCursor } from '@/components/custom-cursor';
import { MouseFollower } from '@/components/mouse-follower';

const initialState: { error?: string; success?: string } = {
    error: '',
    success: '',
};

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            className="w-full relative text-base font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0 px-10 py-6 rounded-full shadow-xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all hover:scale-105 group"
            disabled={pending}
        >
            {pending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            <span className="flex items-center gap-2 justify-center">
                <Lock className="w-5 h-5" />
                {pending ? 'Resetting...' : 'Reset Password'}
            </span>
        </Button>
    );
}

function ResetFormContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [state, formAction] = useActionState(resetPassword, initialState);
    const [showPassword, setShowPassword] = useState(false);

    if (!token) {
        return (
            <div className="text-center space-y-4">
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">Invalid or missing reset token.</p>
                </div>
                <Link href="/forgot-password">
                    <Button className="w-full bg-white/10 hover:bg-white/20">Request New Link</Button>
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">New Password</h1>
                <p className="text-stone-400">Enter your new secure password</p>
            </div>

            {state?.success ? (
                <div className="space-y-8 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full"></div>
                            <CheckCircle2 className="w-16 h-16 text-emerald-500 relative z-10" />
                        </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                        <p className="text-sm sm:text-base text-emerald-400 font-medium">{state.success}</p>
                    </div>
                    <Link href="/login" className="block pt-2">
                        <Button className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0 rounded-2xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] font-bold text-base">
                            Login with New Password
                        </Button>
                    </Link>
                </div>
            ) : (
                <form action={formAction} className="space-y-6">
                    <input type="hidden" name="token" value={token} />

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-stone-300">
                            New Password
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-500" />
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="h-12 pl-12 pr-12 bg-white/5 border-white/10 focus:border-emerald-500/50 text-white placeholder:text-stone-500 rounded-xl transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors focus:outline-none"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-stone-300">
                            Confirm New Password
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-500" />
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                className="h-12 pl-12 bg-white/5 border-white/10 focus:border-emerald-500/50 text-white placeholder:text-stone-500 rounded-xl transition-all"
                            />
                        </div>
                    </div>

                    {state?.error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                            <p className="text-sm text-red-400 text-center">{state.error}</p>
                        </div>
                    )}

                    <SubmitButton />
                </form>
            )}
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-black text-stone-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-100 overflow-x-hidden relative cursor-none">
            <CustomCursor />
            <div className="fixed inset-0 z-[50] opacity-[0.07] pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
                <div className="absolute top-[-15%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-emerald-600/40 via-emerald-800/30 to-transparent blur-[140px] mix-blend-screen opacity-70 animate-float" />
                <MouseFollower />
            </div>
            <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-20">
                <div className="w-full max-w-md">
                    {/* Logo/Brand */}
                    <Link href="/" className="flex items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 group shrink-0">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-500/30 transition-all"></div>
                            <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 relative z-10" />
                        </div>
                        <div className="relative">
                            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white group-hover:text-emerald-200 transition-colors">
                                FundEd
                            </span>
                            <span className="block text-xs text-emerald-400/70 tracking-wider">Classroom OS</span>
                        </div>
                    </Link>
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-10 border border-white/10 backdrop-blur-xl shadow-2xl">
                        <Suspense fallback={
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            </div>
                        }>
                            <ResetFormContent />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}
