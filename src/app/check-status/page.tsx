import Link from 'next/link';
import { MapPin } from 'lucide-react';

export default function CheckStatusIndexPage() {
    return (
        <div className="min-h-screen bg-black text-stone-200 font-sans selection:bg-emerald-500/30 overflow-x-hidden relative cursor-default flex items-center justify-center px-4">

            {/* Orbs Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
                <div className="absolute top-[-15%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-emerald-600/40 via-emerald-800/30 to-transparent blur-[140px] mix-blend-screen opacity-70 animate-float" />
                <div className="absolute bottom-[-25%] right-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-teal-600/35 via-teal-800/25 to-transparent blur-[130px] mix-blend-screen opacity-65 animate-float-slow" />
            </div>

            <div className="relative z-10 text-center max-w-lg mx-auto">
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-8">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300/90 font-mono text-xs tracking-wider">STUDENT PORTAL</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                    Use your institution&apos;s{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">unique link</span>
                </h1>

                <p className="text-stone-400 text-lg font-light leading-relaxed mb-10">
                    Your institution&apos;s admin has shared a unique check-status link with you. Please use that link to check your payment status.
                </p>

                <p className="text-stone-500 text-sm font-mono bg-white/5 border border-white/10 rounded-2xl px-6 py-4">
                    yourapp.com/check-status/<span className="text-emerald-400">your-institution-slug</span>
                </p>

                <div className="mt-10">
                    <Link href="/" className="text-xs tracking-[0.15em] uppercase text-stone-500 hover:text-emerald-400 transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
