import Link from 'next/link';
import { Shield, Lock, Database, Eye, Trash2, ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Privacy Policy — FundEd',
    description: 'Learn how FundEd collects, uses, and protects your data.',
};

const sections = [
    {
        icon: <Database className="w-5 h-5" />,
        title: 'Data We Collect',
        content: [
            'Student information: full name, roll number, department, and year of study.',
            'Contact details: email addresses used for payment receipts and notifications.',
            'Payment data: payment screenshots, amounts, event names, and timestamps.',
            'Admin account data: name, email, hashed password, and role designation.',
            'Usage data: login timestamps and action logs for security auditing.',
        ],
    },
    {
        icon: <Eye className="w-5 h-5" />,
        title: 'How We Use Your Data',
        content: [
            'To facilitate and verify student payments within your institution.',
            'To send automated email receipts and payment confirmation notifications.',
            'To generate financial reports accessible only to the managing admin.',
            'To power the student payment status check portal.',
            'To detect fraudulent activity using AI-powered screenshot analysis.',
        ],
    },
    {
        icon: <Lock className="w-5 h-5" />,
        title: 'Data Access & Scoping',
        content: [
            'Each admin can only access data they have created — student records, events, and payments are scoped to the creating admin.',
            'Superadmins may access aggregate analytics but not individual payment screenshots.',
            'Student status pages are protected by unique event-scoped links.',
            'No cross-admin data leakage — strict database-level access control is enforced.',
        ],
    },
    {
        icon: <Shield className="w-5 h-5" />,
        title: 'Data Security',
        content: [
            'All data is stored in an encrypted PostgreSQL database hosted on a secure cloud infrastructure.',
            'Passwords are hashed using bcrypt and are never stored in plaintext.',
            'All connections are encrypted in transit via HTTPS/TLS.',
            'Payment screenshots are stored as base64-encoded data with no third-party hosting.',
        ],
    },
    {
        icon: <Trash2 className="w-5 h-5" />,
        title: 'Data Retention & Deletion',
        content: [
            'Admins can delete individual student records, events, or payment entries at any time.',
            'Deleted data is permanently removed from the database — there is no recycle bin.',
            'Admin accounts can be deleted by a superadmin, removing all associated data.',
            'We do not retain backups of deleted records beyond our database\u0027s automated 7-day snapshot window.',
        ],
    },
    {
        icon: <Eye className="w-5 h-5" />,
        title: 'Third Parties',
        content: [
            'FundEd does not sell, rent, or share your data with any third-party advertising networks.',
            'Email delivery is handled via a transactional email service (e.g., Nodemailer/SMTP). Email content is not stored by the provider.',
            'No external analytics or tracking scripts are used on the dashboard.',
        ],
    },
];

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black text-stone-200 font-sans">
            {/* Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-15%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-emerald-600/20 via-emerald-800/15 to-transparent blur-[140px] opacity-60" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-teal-600/15 to-transparent blur-[120px] opacity-50" />
            </div>

            {/* Nav */}
            <nav className="fixed top-0 w-full z-[60] bg-black/40 backdrop-blur-xl py-6 md:py-8 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 md:px-16 flex items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-4 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-500/30 transition-all"></div>
                            <span className="relative text-xs md:text-sm font-bold tracking-[0.25em] text-white group-hover:text-emerald-200 transition-colors uppercase whitespace-nowrap">
                                FundEd <span className="text-emerald-500/50 mx-2 md:mx-3">●</span> Privacy
                            </span>
                        </div>
                    </Link>
                    <span className="hidden sm:inline text-[10px] font-mono text-stone-600 tracking-[0.3em] uppercase">DATA_PROTECTION</span>
                </div>
            </nav>

            <main className="relative z-10 max-w-5xl mx-auto px-6 md:px-16 py-20">
                {/* Header */}
                <div className="mb-16 pt-10 md:pt-0">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-8">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300/90 font-mono text-[10px] tracking-[0.2em]">PRIVACY POLICY</span>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
                        Your data,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 italic font-light">protected.</span>
                    </h1>
                    <p className="text-stone-400 text-base md:text-lg max-w-2xl leading-relaxed">
                        FundEd is built for educational institutions. We take data privacy seriously — your student and payment data belongs to your institution alone.
                    </p>
                    <p className="text-stone-600 text-sm mt-4 font-mono">Last updated: February 2026</p>
                </div>

                {/* Sections */}
                <div className="grid gap-6">
                    {sections.map((section, i) => (
                        <div key={i} className="group rounded-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 p-8 hover:border-emerald-500/30 transition-all duration-300">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    {section.icon}
                                </div>
                                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                            </div>
                            <ul className="space-y-3">
                                {section.content.map((item, j) => (
                                    <li key={j} className="flex items-start gap-3 text-stone-400 leading-relaxed">
                                        <span className="text-emerald-500/60 mt-1.5 shrink-0">◆</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Contact */}
                <div className="mt-12 p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-md">
                    <h3 className="text-xl font-semibold text-white mb-2">Questions about your data?</h3>
                    <p className="text-stone-400">
                        Contact your institution&apos;s FundEd administrator or reach out to us at{' '}
                        <Link href="/support" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium border-b border-emerald-500/30">
                            support@funded.com
                        </Link>
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 px-6 md:px-16 py-8 mt-12">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-600">
                    <p>© {new Date().getFullYear()} FundEd · A sub-product of <span className="text-emerald-500/80">SKS DM</span></p>
                    <div className="flex gap-6">
                        <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms</Link>
                        <Link href="/support" className="hover:text-emerald-400 transition-colors">Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
