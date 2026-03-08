'use client';

import Link from 'next/link';
import { useActionState, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, Loader2, Lock, Mail, Eye, EyeOff, User, UserPlus, ArrowLeft, Send } from 'lucide-react';
import { login, signup, forgotPassword } from '@/actions/auth';
import { Label } from '@/components/ui/label';
import { useFormStatus } from 'react-dom';
import { CustomCursor } from '@/components/custom-cursor';
import { MouseFollower } from '@/components/mouse-follower';
import { cn } from '@/lib/utils';

const initialState: any = {
  error: '',
  success: '',
};

type AuthView = 'login' | 'signup' | 'forgot-password';

function SubmitButton({ icon: Icon, text, pendingText }: { icon: any, text: string, pendingText: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full relative text-sm sm:text-base font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0 px-6 sm:px-10 py-5 sm:py-6 rounded-full shadow-xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all hover:scale-105 group"
      disabled={pending}
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />}
      <span className="flex items-center gap-2 justify-center">
        {!pending && <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
        {pending ? pendingText : text}
      </span>
    </Button>
  );
}

export default function UnifiedLoginPage() {
  const [view, setView] = useState<AuthView>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginState, loginAction] = useActionState(login, initialState);
  // Signup form state
  const [signupState, signupAction] = useActionState(signup, initialState);
  // Forgot password state
  const [forgotState, forgotAction] = useActionState(forgotPassword, initialState);

  // Reset errors when switching views
  useEffect(() => {
    loginState.error = '';
    signupState.error = '';
    forgotState.error = '';
    forgotState.success = '';
  }, [view]);

  const activeState = view === 'login' ? loginState : view === 'signup' ? signupState : forgotState;

  return (
    <div className="min-h-screen bg-black text-stone-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-100 overflow-x-hidden relative cursor-none flex flex-col items-center justify-center">

      {/* Custom Cursor */}
      <CustomCursor />

      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 z-[50] opacity-[0.07] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* Enhanced Floating Orbs Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
        <div className="absolute top-[-15%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-emerald-600/40 via-emerald-800/30 to-transparent blur-[140px] mix-blend-screen opacity-70 animate-float" />
        <div className="absolute top-[25%] right-[-15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-lime-500/30 via-lime-700/20 to-transparent blur-[120px] mix-blend-screen opacity-60 animate-float-delayed" />
        <div className="absolute bottom-[-25%] left-[15%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-teal-600/35 via-teal-800/25 to-transparent blur-[130px] mix-blend-screen opacity-65 animate-float-slow" />
        <MouseFollower />
      </div>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-md px-6 py-8 sm:py-12 flex flex-col items-center">

        {/* Logo/Brand */}
        <Link href="/" className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 group shrink-0">
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

        {/* Auth Card */}
        <div className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl transition-all duration-500">

          {/* Glow Effect */}
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

          <div className="p-5 sm:p-8 relative z-10">
            {/* Headers */}
            <div className="text-center mb-5 sm:mb-6 overflow-hidden">
              <div className={cn(
                "transition-all duration-300 transform",
                view === 'login' ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 hidden"
              )}>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome Back</h1>
                <p className="text-stone-400 text-sm sm:text-base">Sign in to access your dashboard</p>
              </div>
              <div className={cn(
                "transition-all duration-300 transform",
                view === 'signup' ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 hidden"
              )}>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Create Account</h1>
                <p className="text-stone-400 text-sm sm:text-base">Join the FundEd community today</p>
              </div>
              <div className={cn(
                "transition-all duration-300 transform",
                view === 'forgot-password' ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 hidden"
              )}>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Reset Password</h1>
                <p className="text-stone-400 text-sm sm:text-base">Recover access to your account</p>
              </div>
            </div>

            {/* Login View */}
            {view === 'login' && (
              <form action={loginAction} className="space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-bottom-4">
                <AuthInput icon={Mail} label="Email Address" id="email" name="email" type="email" placeholder="admin@funded.com" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-stone-300">Password</Label>
                    <button type="button" onClick={() => setView('forgot-password')} className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 transition-colors">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-500" />
                    <Input
                      id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" required
                      className="h-10 sm:h-11 pl-12 pr-12 bg-white/5 border-white/10 focus:border-emerald-500/50 text-white placeholder:text-stone-500 rounded-xl transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors focus:outline-none">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {loginState?.error && <AuthError error={loginState.error} />}
                <SubmitButton icon={Lock} text="Access Dashboard" pendingText="Signing in..." />
                <AuthFooter text="Don't have an account?" linkText="Sign Up" onClick={() => setView('signup')} />
              </form>
            )}

            {/* Signup View */}
            {view === 'signup' && (
              <form action={signupAction} className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <AuthInput icon={User} label="Full Name" id="name" name="name" type="text" placeholder="John Doe" />
                <AuthInput icon={Mail} label="Email Address" id="email" name="email" type="email" placeholder="john@example.com" />
                <AuthInput icon={Lock} label="Password" id="password" name="password" type="password" placeholder="••••••••" required minLength={6} />
                <AuthInput icon={Lock} label="Confirm Password" id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" required />
                {signupState?.error && <AuthError error={signupState.error} />}
                <div className="pt-2">
                  <SubmitButton icon={UserPlus} text="Create Account" pendingText="Creating..." />
                </div>
                <AuthFooter text="Already have an account?" linkText="Sign In" onClick={() => setView('login')} />
              </form>
            )}

            {/* Forgot Password View */}
            {view === 'forgot-password' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                {forgotState?.success ? (
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-sm text-emerald-400 text-center">{forgotState.success}</p>
                    </div>
                    <Button onClick={() => setView('login')} className="w-full h-11 sm:h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white border-0 transition-all">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                    </Button>
                  </div>
                ) : (
                  <form action={forgotAction} className="space-y-4 sm:space-y-6">
                    <AuthInput icon={Mail} label="Email Address" id="email" name="email" type="email" placeholder="your@email.com" />
                    {forgotState?.error && <AuthError error={forgotState.error} />}
                    <SubmitButton icon={Send} text="Send Reset Link" pendingText="Sending..." />
                    <div className="text-center">
                      <button type="button" onClick={() => setView('login')} className="text-sm text-stone-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto">
                        <ArrowLeft className="h-4 w-4" /> Back to Login
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Legal */}
        <div className="mt-6 text-center text-[10px] sm:text-xs text-stone-500 px-4">
          <p className="leading-relaxed">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-emerald-400/70 hover:text-emerald-400 transition-colors">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-emerald-400/70 hover:text-emerald-400 transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function AuthInput({ icon: Icon, label, ...props }: { icon: any, label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1 sm:space-y-1.5">
      <Label htmlFor={props.id} className="text-xs sm:text-sm font-medium text-stone-300 ml-1">{label}</Label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-stone-500" />
        <Input
          {...props}
          className="h-10 sm:h-11 pl-12 bg-white/5 border-white/10 focus:border-emerald-500/50 text-white placeholder:text-stone-500 rounded-xl transition-all"
        />
      </div>
    </div>
  );
}

function AuthError({ error }: { error: string }) {
  return (
    <div className="p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-shake">
      <p className="text-xs sm:text-sm text-red-400 text-center">{error}</p>
    </div>
  );
}

function AuthFooter({ text, linkText, onClick }: { text: string, linkText: string, onClick: () => void }) {
  return (
    <div className="mt-4 sm:mt-6 text-center">
      <p className="text-sm text-stone-400">
        {text}{' '}
        <button type="button" onClick={onClick} className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer">
          {linkText}
        </button>
      </p>
    </div>
  );
}
