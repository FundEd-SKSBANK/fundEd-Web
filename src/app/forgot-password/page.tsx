'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, Loader2, Mail, ArrowLeft, Send } from 'lucide-react';
import { forgotPassword } from '@/actions/auth';
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
                <Send className="w-5 h-5" />
                {pending ? 'Sending...' : 'Send Reset Link'}
            </span>
        </Button>
    );
}

export default function ForgotPasswordPage() {
    const [state, formAction] = useActionState(forgotPassword, initialState);

    return (
        <div className="min-h-screen bg-black text-stone-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-100 overflow-x-hidden relative cursor-none">

            {/* Custom Cursor */}
            <CustomCursor />

            {/* Noise Texture Overlay */}
            <div className="fixed inset-0 z-[50] opacity-[0.07] pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            {/* Background Orbs */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
                <div className="absolute top-[-15%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-emerald-600/40 via-emerald-800/30 to-transparent blur-[140px] mix-blend-screen opacity-70 animate-float" />
                <div className="absolute top-[25%] right-[-15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-lime-500/30 via-lime-700/20 to-transparent blur-[120px] mix-blend-screen opacity-60 animate-float-delayed" />
                <MouseFollower />
            </div>

            <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-20">
                <div className="w-full max-w-md">

                    <Link href="/login" className="flex items-center justify-center gap-4 mb-12 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-500/30 transition-all"></div>
                            <GraduationCap className="w-10 h-10 text-emerald-400 relative z-10" />
                        </div>
                        <div className="relative">
                            <span className="text-3xl font-bold tracking-tight text-white group-hover:text-emerald-200 transition-colors">
                                FundEd
                            </span>
                        </div>
                    </Link>

                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-10 border border-white/10 backdrop-blur-xl shadow-2xl">
                        <div className="relative z-10">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
                                <p className="text-stone-400">Enter your email to receive a password reset link</p>
                            </div>

                            {state?.success ? (
                                <div className="space-y-6">
                                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <p className="text-sm text-emerald-400 text-center">{state.success}</p>
                                    </div>
                                    <Link href="/login">
                                        <Button className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white border-0 transition-all">
                                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <form action={formAction} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium text-stone-300">
                                            Email Address
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-500" />
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="your@email.com"
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

                                    <div className="text-center">
                                        <Link href="/login" className="text-sm text-stone-400 hover:text-white transition-colors flex items-center justify-center gap-2">
                                            <ArrowLeft className="h-4 w-4" /> Back to Login
                                        </Link>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
