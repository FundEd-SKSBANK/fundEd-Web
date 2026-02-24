import Link from 'next/link';
import { FileText, Users, CreditCard, AlertTriangle, XCircle, ArrowLeft, Sparkles } from 'lucide-react';

export const metadata = {
    title: 'Terms & Conditions — FundEd',
    description: 'Read the terms of use for the FundEd education finance platform.',
};

const sections = [
    {
        icon: <Users className="w-5 h-5" />,
        title: 'Eligibility & Use',
        content: [
            'FundEd is intended exclusively for use by educational institutions, class representatives, and their students.',
            'Only authorised admins provisioned by a FundEd superadmin may create accounts and manage data.',
            'By using FundEd, you confirm that you represent a legitimate educational body.',
            'Use of FundEd for commercial, non-educational, or personal purposes is strictly prohibited.',
        ],
    },
    {
        icon: <CreditCard className="w-5 h-5" />,
        title: 'Payments & QR Codes',
        content: [
            'Admins are solely responsible for the accuracy and legitimacy of their payment QR codes.',
            'Only valid UPI payment QR codes (GPay, PhonePe, Paytm, etc.) may be uploaded to the platform.',
            'FundEd does not process or hold payments — all transactions occur directly between students and admin accounts via UPI.',
            'FundEd is not liable for any failed, incorrect, or disputed payments.',
            'Payment screenshots uploaded by students are used solely for admin verification purposes.',
        ],
    },
    {
        icon: <FileText className="w-5 h-5" />,
        title: 'Admin Responsibilities',
        content: [
            'Admins are responsible for maintaining accurate student records, event data, and payment statuses.',
            'Admins must not create duplicate student records or falsify payment verification.',
            'Admins are responsible for securely managing their login credentials.',
            'Any data entered by an admin — including student PII — is the responsibility of that admin and their institution.',
        ],
    },
    {
        icon: <AlertTriangle className="w-5 h-5" />,
        title: 'Limitation of Liability',
        content: [
            'FundEd and its developers (SKS DM) are not liable for financial losses resulting from incorrect payment data.',
            'FundEd provides the platform "as is" and makes no guarantees of uninterrupted availability.',
            'We are not responsible for any disputes between students and admins regarding payments.',
            'In no event shall FundEd\'s total liability exceed the fees paid (if any) for the use of the platform.',
        ],
    },
    {
        icon: <XCircle className="w-5 h-5" />,
        title: 'Prohibited Conduct',
        content: [
            'Uploading fraudulent, fake, or misleading payment QR codes.',
            'Submitting falsified payment screenshots for undeserved verification.',
            'Attempting to access another admin\'s data, events, or student records without authorisation.',
            'Reverse-engineering, scraping, or otherwise tampering with the FundEd platform.',
            'Using the platform for money laundering, fraud, or any unlawful activity.',
        ],
    },
    {
        icon: <FileText className="w-5 h-5" />,
        title: 'Account Termination',
        content: [
            'Superadmins may suspend or delete any admin account at any time for policy violations.',
            'Upon account termination, all data created by that admin may be permanently deleted.',
            'FundEd reserves the right to disable access without prior notice in cases of suspected fraud.',
        ],
    },
    {
        icon: <Sparkles className="w-5 h-5" />,
        title: 'Changes to These Terms',
        content: [
            'FundEd may update these Terms & Conditions at any time.',
            'Continued use of the platform following any update constitutes acceptance of the revised terms.',
            'Significant changes will be communicated to admins via their registered email address.',
        ],
    },
];

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-black text-stone-200 font-sans">
            {/* Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-15%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-lime-600/15 via-emerald-800/10 to-transparent blur-[140px] opacity-50" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-emerald-600/15 to-transparent blur-[120px] opacity-50" />
            </div>

            {/* Nav */}
            <nav className="fixed top-0 w-full z-[60] bg-black/40 backdrop-blur-xl py-6 md:py-8 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 md:px-16 flex items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-4 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full group-hover:bg-emerald-500/30 transition-all"></div>
                            <span className="relative text-xs md:text-sm font-bold tracking-[0.25em] text-white group-hover:text-emerald-200 transition-colors uppercase whitespace-nowrap">
                                FundEd <span className="text-emerald-500/50 mx-2 md:mx-3">●</span> Terms
                            </span>
                        </div>
                    </Link>
                    <span className="hidden sm:inline text-[10px] font-mono text-stone-600 tracking-[0.3em] uppercase">LEGAL_TERMS</span>
                </div>
            </nav>

            <main className="relative z-10 max-w-5xl mx-auto px-6 md:px-16 py-20">
                {/* Header */}
                <div className="mb-16 pt-10 md:pt-0">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-8">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300/90 font-mono text-[10px] tracking-[0.2em]">TERMS & CONDITIONS</span>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
                        Use it right,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 italic font-light">use it well.</span>
                    </h1>
                    <p className="text-stone-400 text-base md:text-lg max-w-2xl leading-relaxed">
                        By accessing or using FundEd, you agree to these terms. Please read them carefully before proceeding.
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

                {/* Governing Law */}
                <div className="mt-12 p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-md">
                    <h3 className="text-xl font-semibold text-white mb-2">Questions or concerns?</h3>
                    <p className="text-stone-400">
                        If you have any questions about these Terms, please contact us at{' '}
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
                        <Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy</Link>
                        <Link href="/support" className="hover:text-emerald-400 transition-colors">Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
