import Link from 'next/link';
import { LifeBuoy, Mail, HelpCircle, ArrowLeft, MessageSquare, BookOpen } from 'lucide-react';

export const metadata = {
    title: 'Support — FundEd',
    description: 'Get help with FundEd — FAQs, contact, and reporting issues.',
};

const faqs = [
    {
        q: 'How do I add students to the platform?',
        a: 'Log in to your admin dashboard → Students → Add Student. You can add students one by one or bulk-import via a CSV file.',
    },
    {
        q: 'How does payment verification work?',
        a: 'Students visit the payment link for your event, select their name, and upload a screenshot of their UPI payment. You (the admin) review it in the Payments section and mark it as verified or rejected.',
    },
    {
        q: 'Can students see each other\'s payment status?',
        a: 'No. The student status check page only shows whether a given student has paid — it does not reveal payment amounts, screenshots, or other students\' data.',
    },
    {
        q: 'How do I set up a payment QR code?',
        a: 'Go to Settings → Manage QR Codes → Add New QR. Upload your UPI payment QR (GPay, PhonePe, Paytm). The system will validate that it\'s a genuine payment QR before saving.',
    },
    {
        q: 'Why is my QR code being rejected?',
        a: 'Only UPI-standard QR codes are accepted. Regular QR codes (website links, Wi-Fi codes, app links) will be rejected. Generate a payment QR from your UPI app (e.g. GPay → Payment link → QR code).',
    },
    {
        q: 'Can I have multiple events at the same time?',
        a: 'Yes. You can create unlimited events. Each event has its own payment link, student list, and QR code assignment.',
    },
    {
        q: 'What happens if I delete a student?',
        a: 'Deleting a student permanently removes their record and all associated payment data. This action cannot be undone.',
    },
    {
        q: 'How do I download a payment report?',
        a: 'Go to Dashboard → Reports. You can export payment summaries as PDF or CSV for any event.',
    },
    {
        q: 'I forgot my password. How do I reset it?',
        a: 'Contact your FundEd superadmin. They can update your password from the admin management panel. Self-service password reset is coming soon.',
    },
    {
        q: 'Who can see my data?',
        a: 'Only you (the admin who created it) can see your students, events, and payments. Superadmins have access to aggregate analytics only, not individual payment records.',
    },
];

import SupportForm from '@/components/SupportForm';

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-black text-stone-200 font-sans">
            {/* Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-teal-600/20 via-emerald-800/15 to-transparent blur-[140px] opacity-55" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-cyan-600/15 to-transparent blur-[120px] opacity-45" />
            </div>

            <nav className="fixed top-0 w-full z-[60] bg-black/40 backdrop-blur-xl py-6 md:py-8 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 md:px-16 flex items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-4 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-500/30 transition-all"></div>
                            <span className="relative text-xs md:text-sm font-bold tracking-[0.25em] text-white group-hover:text-emerald-200 transition-colors uppercase whitespace-nowrap">
                                FundEd <span className="text-emerald-500/50 mx-2 md:mx-3">●</span> Support
                            </span>
                        </div>
                    </Link>
                    <span className="hidden sm:inline text-[10px] font-mono text-stone-600 tracking-[0.3em] uppercase">HELP_CENTER</span>
                </div>
            </nav>

            <main className="relative z-10 max-w-5xl mx-auto px-6 md:px-16 pt-16 pb-8 md:pt-24 md:pb-12">
                {/* Header */}
                <div className="mb-16 pt-10 md:pt-0">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-8">
                        <LifeBuoy className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300/90 font-mono text-[10px] tracking-[0.2em]">HELP & SUPPORT</span>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
                        We&apos;ve got<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 italic font-light">your back.</span>
                    </h1>
                    <p className="text-stone-400 text-base md:text-lg max-w-2xl leading-relaxed">
                        Find answers to common questions, or reach out to us directly. We&apos;re here to keep FundEd running smoothly for your institution.
                    </p>
                </div>

                {/* Contact Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-16">
                    {[
                        {
                            icon: <Mail className="w-6 h-6" />,
                            title: 'Email Support',
                            desc: 'Get a response within 24–48 hours.',
                            action: 'support@funded.com',
                            href: 'mailto:sksdmprod@gmail.com',
                        },
                        {
                            icon: <MessageSquare className="w-6 h-6" />,
                            title: 'Report an Issue',
                            desc: 'Found a bug or security concern?',
                            action: 'report@funded.com',
                            href: '#report-form',
                        },
                        {
                            icon: <BookOpen className="w-6 h-6" />,
                            title: 'Documentation',
                            desc: 'Admin guides and onboarding docs.',
                            action: 'Read Docs',
                            href: '/docs',
                        },
                    ].map((card, i) => (
                        <a
                            key={i}
                            href={card.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 p-7 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10"
                        >
                            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit mb-5 group-hover:scale-110 transition-transform">
                                {card.icon}
                            </div>
                            <h3 className="text-white font-semibold mb-1">{card.title}</h3>
                            <p className="text-stone-500 text-sm mb-3">{card.desc}</p>
                            <span className="text-emerald-400 text-sm font-mono group-hover:text-emerald-300 transition-colors">{card.action}</span>
                        </a>
                    ))}
                </div>

                {/* Support Form Section */}
                <div className="mb-24">
                    <SupportForm />
                </div>

                {/* FAQ */}
                <div className="mb-4 flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <HelpCircle className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
                </div>
                <p className="text-stone-500 text-sm mb-10 ml-12">Answers to the most common questions from admins and institutions.</p>

                <div className="grid gap-4">
                    {faqs.map((faq, i) => (
                        <div key={i} className="rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 p-6 hover:border-emerald-500/20 transition-all duration-300">
                            <h3 className="text-white font-semibold mb-3 flex items-start gap-3">
                                <span className="text-emerald-500/60 text-xs font-mono mt-1 shrink-0">Q{String(i + 1).padStart(2, '0')}</span>
                                {faq.q}
                            </h3>
                            <p className="text-stone-400 leading-relaxed pl-8">{faq.a}</p>
                        </div>
                    ))}
                </div>

                {/* Still stuck */}
                <div className="mt-20 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 p-12 text-center backdrop-blur-md">
                    <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6">
                        <LifeBuoy className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Still need help?</h2>
                    <p className="text-stone-400 max-w-xl mx-auto mb-8">
                        If your question isn&apos;t answered above, email us at{' '}
                        <a
                            href="#report-form"
                            className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium border-b border-emerald-500/30"
                        >
                            support@funded.com
                        </a>
                        {' '}and we&apos;ll get back to you within 24 hours.
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 px-6 md:px-16 py-8">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-600">
                    <p>© {new Date().getFullYear()} FundEd · A sub-product of <span className="text-emerald-500/80">SKS DM</span></p>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms</Link>
                    </div>
                </div>
            </footer >
        </div >
    );
}
