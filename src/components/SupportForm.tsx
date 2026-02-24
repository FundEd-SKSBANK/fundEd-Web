'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { sendSupportEmail } from '@/actions/support';

const supportSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    subject: z.string().min(5, "Subject must be at least 5 characters"),
    message: z.string().min(10, "Message must be at least 10 characters"),
});

type SupportFormValues = z.infer<typeof supportSchema>;

export default function SupportForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<SupportFormValues>({
        resolver: zodResolver(supportSchema),
    });

    const onSubmit = async (data: SupportFormValues) => {
        setIsSubmitting(true);
        setStatus(null);
        try {
            const result = await sendSupportEmail(data);
            if (result.success) {
                setStatus({ type: 'success', message: result.message || 'Thank you! We have received your message.' });
                reset();
            } else {
                setStatus({ type: 'error', message: result.error || 'Something went wrong. Please try again.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'An unexpected error occurred. Please try again later.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status?.type === 'success') {
        return (
            <div className="rounded-3xl bg-emerald-500/5 border border-emerald-500/20 p-8 md:p-12 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Message Sent!</h3>
                <p className="text-stone-400 mb-8 max-w-sm mx-auto">{status.message}</p>
                <button
                    onClick={() => setStatus(null)}
                    className="px-8 py-3 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-all hover:scale-105"
                >
                    Send Another Message
                </button>
            </div>
        );
    }

    return (
        <div id="report-form" className="rounded-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-2.5 md:p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Send className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">Report an Issue</h2>
                    <p className="text-stone-500 text-xs md:text-sm">Fill out the form below and we&apos;ll get back to you.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-stone-500 uppercase tracking-widest ml-1">Your Name</label>
                        <input
                            {...register('name')}
                            placeholder="John Doe"
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-stone-700 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                        />
                        {errors.name && <p className="text-rose-500 text-[10px] mt-1 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name.message}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-stone-500 uppercase tracking-widest ml-1">Your Email</label>
                        <input
                            {...register('email')}
                            placeholder="john@example.com"
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-stone-700 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                        />
                        {errors.email && <p className="text-rose-500 text-[10px] mt-1 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.email.message}</p>}
                    </div>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-stone-500 uppercase tracking-widest ml-1">Subject</label>
                    <input
                        {...register('subject')}
                        placeholder="Issue with payment verification"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-stone-700 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                    {errors.subject && <p className="text-rose-500 text-[10px] mt-1 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.subject.message}</p>}
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-stone-500 uppercase tracking-widest ml-1">Your Message</label>
                    <textarea
                        {...register('message')}
                        rows={3}
                        placeholder="Please describe the issue in detail..."
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-stone-700 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none"
                    />
                    {errors.message && <p className="text-rose-500 text-[10px] mt-1 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.message.message}</p>}
                </div>

                {status?.type === 'error' && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3 animate-in slide-in-from-top-2">
                        <AlertCircle className="w-4 h-4" />
                        {status.message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full group relative flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99] overflow-hidden"
                >
                    {isSubmitting ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <>
                            Send Message
                            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                </button>
            </form>
        </div>
    );
}
