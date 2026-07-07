'use client';

import Link from 'next/link';
import { useActionState, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, Loader2, Lock, Mail, User, Eye, EyeOff, UserPlus, ArrowRight, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { signup, sendSignupOTP, verifySignupOTP } from '@/actions/auth';
import { Label } from '@/components/ui/label';
import { useFormStatus } from 'react-dom';
import { CustomCursor } from '@/components/custom-cursor';
import { MouseFollower } from '@/components/mouse-follower';

const initialState: { error?: string } = {
    error: '',
};

function SubmitButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            className="w-full relative text-base font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0 px-10 py-6 rounded-full shadow-xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all hover:scale-105 group"
            disabled={pending || disabled}
        >
            {pending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            <span className="flex items-center gap-2 justify-center">
                <UserPlus className="w-5 h-5" />
                {pending ? 'Creating Account...' : 'Create Account'}
            </span>
        </Button>
    );
}

export default function SignupPage() {
    const [state, formAction] = useActionState(signup, initialState);
    const [step, setStep] = useState(1); // 1: Info, 2: OTP, 3: Password
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [defaultClass, setDefaultClass] = useState('');
    const [otp, setOtp] = useState('');
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState('');
    const [isPending, setIsPending] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (resendTimer > 0) {
            timerRef.current = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [resendTimer]);

    const handleSendOTP = async () => {
        if (!name || !email) {
            setLocalError('Please fill in your name and email');
            return;
        }
        
        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setLocalError('Please enter a valid email address');
            return;
        }

        setIsPending(true);
        setLocalError('');
        
        const formData = new FormData();
        formData.append('email', email);
        formData.append('name', name);
        
        const result = await sendSignupOTP(null, formData);
        setIsPending(false);
        
        if (result.error) {
            setLocalError(result.error);
        } else {
            setStep(2);
            setResendTimer(30);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            setLocalError('Please enter the 6-digit code');
            return;
        }

        setIsPending(true);
        setLocalError('');
        
        const formData = new FormData();
        formData.append('email', email);
        formData.append('otp', otp);
        
        const result = await verifySignupOTP(null, formData);
        setIsPending(false);
        
        if (result.error) {
            setLocalError(result.error);
        } else {
            setIsEmailVerified(true);
            setStep(3);
        }
    };

    return (
        <div className="min-h-screen bg-black text-stone-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-100 overflow-x-hidden relative cursor-none">
            <CustomCursor />
            <div className="fixed inset-0 z-[50] opacity-[0.07] pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
                <div className="absolute top-[-15%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-emerald-600/40 via-emerald-800/30 to-transparent blur-[140px] mix-blend-screen opacity-70 animate-float" />
                <div className="absolute top-[25%] right-[-15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-lime-500/30 via-lime-700/20 to-transparent blur-[120px] mix-blend-screen opacity-60 animate-float-delayed" />
                <div className="absolute bottom-[-25%] left-[15%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-teal-600/35 via-teal-800/25 to-transparent blur-[130px] mix-blend-screen opacity-65 animate-float-slow" />
                <MouseFollower />
            </div>

            <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-10">
                <div className="w-full max-w-md">
                    <Link href="/" className="flex items-center justify-center gap-4 mb-8 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-500/30 transition-all"></div>
                            <GraduationCap className="w-10 h-10 text-emerald-400 relative z-10" />
                        </div>
                        <div className="relative">
                            <span className="text-3xl font-bold tracking-tight text-white group-hover:text-emerald-200 transition-colors">
                                FundEd
                            </span>
                            <span className="block text-xs text-emerald-400/70 tracking-wider">Classroom OS</span>
                        </div>
                    </Link>

                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-8 border border-white/10 backdrop-blur-xl shadow-2xl">
                        <div className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            <div className="text-center mb-6">
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    {step === 1 ? 'Create Account' : step === 2 ? 'Verify Email' : 'Set Password'}
                                </h1>
                                <p className="text-stone-400 text-sm">
                                    {step === 1 ? 'Join the FundEd community today' : step === 2 ? `Enter the code sent to ${email}` : 'Protect your new account'}
                                </p>
                            </div>

                            {/* Step Indicator */}
                            <div className="flex items-center mb-8">
                                {/* Step 1 */}
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shrink-0 ${
                                    step >= 1 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white/10 text-stone-500'
                                }`}>
                                    {isEmailVerified ? <CheckCircle2 className="w-5 h-5" /> : '1'}
                                </div>
                                {/* Line 1→2 */}
                                <div className={`flex-1 h-0.5 transition-all duration-500 ${step > 1 ? 'bg-emerald-500' : 'bg-white/10'}`} />
                                {/* Step 2 */}
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shrink-0 ${
                                    step >= 2 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white/10 text-stone-500'
                                }`}>
                                    {isEmailVerified ? <CheckCircle2 className="w-5 h-5" /> : '2'}
                                </div>
                                {/* Line 2→3 */}
                                <div className={`flex-1 h-0.5 transition-all duration-500 ${step > 2 ? 'bg-emerald-500' : 'bg-white/10'}`} />
                                {/* Step 3 */}
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shrink-0 ${
                                    step >= 3 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white/10 text-stone-500'
                                }`}>
                                    3
                                </div>
                            </div>


                            <div className="space-y-4">
                                {step === 1 && (
                                    <>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="name" className="text-sm font-medium text-stone-300">Full Name</Label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-500" />
                                                <Input
                                                    id="name"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="John Doe"
                                                    className="h-12 pl-12 bg-white/5 border-white/10 focus:border-emerald-500/50 text-white rounded-xl"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="email" className="text-sm font-medium text-stone-300">Email Address</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-500" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="john@example.com"
                                                    className="h-12 pl-12 bg-white/5 border-white/10 focus:border-emerald-500/50 text-white rounded-xl"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="defaultClass" className="text-sm font-medium text-stone-300">Class / Batch (Optional)</Label>
                                            <div className="relative">
                                                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-500" />
                                                <Input
                                                    id="defaultClass"
                                                    value={defaultClass}
                                                    onChange={(e) => setDefaultClass(e.target.value)}
                                                    placeholder="e.g. S6 CSA"
                                                    className="h-12 pl-12 bg-white/5 border-white/10 focus:border-emerald-500/50 text-white rounded-xl"
                                                />
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={handleSendOTP}
                                            disabled={isPending || !name || !email}
                                            className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold shadow-lg shadow-emerald-500/20"
                                        >
                                            {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
                                            Continue to Verify
                                        </Button>
                                    </>
                                )}

                                {step === 2 && (
                                    <>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="otp" className="text-sm font-medium text-stone-300">Verification Code</Label>
                                            <div className="relative">
                                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-500" />
                                                <Input
                                                    id="otp"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    placeholder="123456"
                                                    className="h-12 pl-12 bg-white/5 border-white/10 focus:border-emerald-500/50 text-white rounded-xl tracking-[0.5em] text-center font-mono text-xl"
                                                />
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={handleVerifyOTP}
                                            disabled={isPending || otp.length !== 6}
                                            className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold shadow-lg shadow-emerald-500/20"
                                        >
                                            {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                                            Verify Code
                                        </Button>
                                        <div className="text-center">
                                            <button
                                                onClick={handleSendOTP}
                                                disabled={resendTimer > 0 || isPending}
                                                className="text-xs text-stone-400 hover:text-emerald-400 transition-colors disabled:opacity-50 disabled:hover:text-stone-400 flex items-center justify-center gap-1.5 mx-auto"
                                            >
                                                <RefreshCw className={`w-3 h-3 ${isPending ? 'animate-spin' : ''}`} />
                                                {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Verification Code'}
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => setStep(1)} 
                                            className="w-full text-xs text-stone-500 hover:text-white transition-colors"
                                        >
                                            Change email or name
                                        </button>
                                    </>
                                )}

                                {step === 3 && (
                                    <form action={formAction} className="space-y-4">
                                        {/* Hidden fields for previous steps */}
                                        <input type="hidden" name="name" value={name} />
                                        <input type="hidden" name="email" value={email} />
                                        <input type="hidden" name="defaultClass" value={defaultClass} />
                                        
                                        <div className="space-y-1.5">
                                            <Label htmlFor="password" className="text-sm font-medium text-stone-300">Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-500" />
                                                <Input
                                                    id="password"
                                                    name="password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    required
                                                    minLength={6}
                                                    className="h-12 pl-12 pr-12 bg-white/5 border-white/10 focus:border-emerald-500/50 text-white rounded-xl"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="confirmPassword" className="text-sm font-medium text-stone-300">Confirm Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-500" />
                                                <Input
                                                    id="confirmPassword"
                                                    name="confirmPassword"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    required
                                                    className="h-12 pl-12 bg-white/5 border-white/10 focus:border-emerald-500/50 text-white rounded-xl"
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                            <SubmitButton />
                                        </div>
                                    </form>
                                )}

                                {(localError || state?.error) && (
                                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                        <p className="text-xs text-red-400 text-center">{localError || state?.error}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 text-center">
                                <p className="text-sm text-stone-400">
                                    Already have an account?{' '}
                                    <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">Sign In</Link>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center text-xs text-stone-500">
                        <p>
                            By signing up, you agree to our{' '}
                            <Link href="/terms" className="text-emerald-400/70 hover:text-emerald-400 transition-colors">Terms of Service</Link>
                            {' '}and{' '}
                            <Link href="/privacy" className="text-emerald-400/70 hover:text-emerald-400 transition-colors">Privacy Policy</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

