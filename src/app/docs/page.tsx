"use client";

import Link from 'next/link';
import { ArrowLeft, BookOpen, Settings, Users, Calendar, DollarSign, RefreshCw, BarChart2, Zap, Briefcase, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
    { id: 'introduction', label: 'Introduction', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'getting-started', label: 'Getting Started', icon: <Zap className="w-4 h-4" /> },
    { id: 'students', label: 'Student Management', icon: <Users className="w-4 h-4" /> },
    { id: 'events', label: 'Event Management', icon: <Calendar className="w-4 h-4" /> },
    { id: 'payments', label: 'Payment Processing', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'major-events', label: 'Major Events & Sync', icon: <RefreshCw className="w-4 h-4" /> },
    { id: 'finance', label: 'Finance Tracking', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings & Collab', icon: <Settings className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports & Analytics', icon: <BarChart2 className="w-4 h-4" /> },
];

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState('introduction');

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            {
                // Trigger when a section enters the top half of the screen
                rootMargin: "-10% 0px -70% 0px",
                threshold: 0
            }
        );

        navItems.forEach((item) => {
            const section = document.getElementById(item.id);
            if (section) observer.observe(section);
        });

        return () => observer.disconnect();
    }, []);

    // Sync horizontal scroll of mobile sidebar pills
    useEffect(() => {
        const activeElem = document.getElementById(`nav-${activeSection}`);
        const navContainer = document.getElementById('mobile-nav-container');
        
        // Only run logic if we are on a smaller screen (where it scrolls horizontally)
        if (activeElem && navContainer && window.innerWidth < 768) {
             const targetScroll = activeElem.offsetLeft - (navContainer.offsetWidth / 2) + (activeElem.offsetWidth / 2);
             
             navContainer.scrollTo({
                 left: targetScroll,
                 behavior: 'smooth'
             });
        }
    }, [activeSection]);

    return (
        <div className="min-h-screen bg-black text-stone-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 scroll-smooth">
            {/* Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-teal-600/10 via-emerald-800/10 to-transparent blur-[140px]" />
            </div>

            <nav className="sticky top-0 w-full z-[60] bg-black/60 backdrop-blur-xl py-4 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">
                    <Link href="/support" className="flex items-center gap-2 text-stone-400 hover:text-emerald-400 transition-colors text-sm group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Support
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-mono text-stone-600 tracking-[0.3em] uppercase">DOCUMENTATION</span>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col md:flex-row gap-8 md:gap-12">
                
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-64 shrink-0 sticky top-[70px] md:top-24 z-40 bg-black/90 md:bg-transparent pb-4 pt-2 md:py-0 mb-6 md:mb-0 h-max backdrop-blur-xl md:backdrop-blur-none border-b border-white/5 md:border-none">
                    <div className="md:bg-white/[0.02] md:border border-white/10 rounded-2xl md:p-5">
                        <h3 className="hidden md:block text-xs font-mono text-emerald-500/80 tracking-widest uppercase mb-4 px-3">Onboarding Guide</h3>
                        <nav id="mobile-nav-container" className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {navItems.map((item) => {
                                const isActive = activeSection === item.id;
                                return (
                                    <a
                                        id={`nav-${item.id}`}
                                        key={item.id}
                                        href={`#${item.id}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const element = document.getElementById(item.id);
                                            if (element) {
                                                // Adjust scroll calculation to account for mobile sticky header
                                                const yOffset = -120; 
                                                const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
                                                window.scrollTo({ top: y, behavior: 'smooth' });
                                                window.history.pushState(null, '', `#${item.id}`);
                                            }
                                        }}
                                        className={`flex-none snap-start flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                            isActive 
                                            ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                                            : 'text-stone-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-white/5 md:border-transparent bg-white/[0.02] md:bg-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <span className="hidden md:inline">{item.icon}</span>
                                            <span className="whitespace-nowrap">{item.label}</span>
                                        </div>
                                        {isActive && <ChevronRight className="hidden md:block w-3.5 h-3.5 text-emerald-400" />}
                                    </a>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Content Area */}
                <div className="flex-1 space-y-12 md:space-y-16 max-w-3xl pb-24">
                    
                    {/* Header */}
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300/90 font-mono text-[9px] tracking-[0.2em] uppercase">User Guide</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
                            FundEd Documentation
                        </h1>
                        <p className="text-stone-400 text-lg leading-relaxed mb-6">
                            Everything you need to set up, manage, and scale your institution's fund collection process safely and effectively. Read closely to understand permissions, workflows, and best practices.
                        </p>
                        <div className="w-20 h-1 rounded-full bg-gradient-to-r from-emerald-500 to-transparent"></div>
                    </div>

                    <Section id="introduction" title="1. Introduction">
                        <p className="text-stone-300 leading-relaxed mb-6">
                            Welcome to FundEd. FundEd is an isolated-tenant platform designed to help university and high school admins independently manage events, track student payments, and maintain crystal-clear financial transparency.
                        </p>
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-4">
                            <h4 className="text-white font-medium mb-2">Core Philosophy: Workspace Isolation</h4>
                            <p className="text-stone-400 leading-relaxed text-sm">
                                Every admin registered on FundEd acts as a siloed Workspace. Your students, your events, and your payment receipts are completely hidden from every other admin on the platform. The only user who can access an overarching view is the Superadmin.
                            </p>
                        </div>
                    </Section>

                    <Section id="getting-started" title="2. Getting Started">
                        <p className="text-stone-300 leading-relaxed mb-8">
                            If you have just registered a new account, you must configure a few vital details before you can begin collecting funds. Walk through these three steps exactly in order:
                        </p>
                        <div className="space-y-8">
                            <Step number="1" title="Set up your UPI QR Code">
                                In order to accept online payments, you must provide a valid UPI QR code. 
                                <br/><br/>
                                Navigate to the <strong>Settings</strong> page on the bottom left of your Dashboard. Find the "Payment QR Codes" section. Upload an image of your Google Pay, PhonePe, or Paytm QR. The system analyzes the image to verify it's a genuine payment route. If it contains a regular URL, it will be rejected. Once uploaded, make sure to set it as Active.
                            </Step>
                            <Step number="2" title="Claim your Public URL Slug">
                                Still in <strong>Settings</strong>, locate the "Student Portal Link" panel. Let's say you belong to Section A. Set your slug to something memorable like `section-a`. 
                                <br/><br/>
                                This creates a customized URL (`/check-status/section-a`) which you will share globally with your students. If a student tries to search their name on the general app login, they won't find it. They MUST use your specific slug link.
                            </Step>
                            <Step number="3" title="Add your Students">
                                Before you can request payments, students must exist in your database. Navigate to the <strong>Students</strong> tab. You can add them one by one, but for a whole class, we highly recommend the CSV Uploader. Ensure your CSV has headers named `name` and `rollNumber`.
                            </Step>
                        </div>
                    </Section>

                    <Section id="students" title="3. Student Management">
                        <p className="text-stone-300 leading-relaxed mb-6">
                            Your student database acts as the master record for all upcoming events. 
                        </p>
                        <ul className="space-y-4 text-stone-300 list-disc list-inside">
                            <li><strong>Searching & Filtering:</strong> Use the global search bar on the Students page to find specific roll numbers instantly.</li>
                            <li><strong>Updating Information:</strong> Did someone change their name or roll number? You can click the Edit icon on their row to adjust their details. Note that changing a roll number will not alter past payment trajectories.</li>
                            <li><strong>Deletions:</strong> You can permanently delete a student using the Trash icon. <strong>Warning:</strong> Deleting a student entirely obliterates their payment history across all your events. Instead of deleting, it's safer to just ignore them in future events unless they left the college entirely.</li>
                        </ul>
                    </Section>

                    <Section id="events" title="4. Event Management">
                        <h4 className="text-white font-semibold mb-3">Creating a Standard Event</h4>
                        <p className="text-stone-300 leading-relaxed mb-6">
                            When an excursion, t-shirt drive, or department party comes up, navigate to <strong>Events</strong> and click "Create Event". You'll specify a Name, Amount (e.g., 500), Deadline date, and importantly, an Event Description. The Description is visible to the student on their portal. Ensure you provide exact details on what the fund is for.
                        </p>
                        
                        <h4 className="text-white font-semibold mb-3">Event visibility & Status</h4>
                        <p className="text-stone-300 leading-relaxed">
                            Once created, an event is active indefinitely. You can view all payments linked specifically to an event by clicking into its detailed view. If an event finishes and the spreadsheet is cleared, you can't "archive" the event yet without deleting it, but you can simply ignore it or export the final report and then delete it if you want to declutter your dashboard. Note: Deleting an event deletes all associated payment screenshots.
                        </p>
                    </Section>

                    <Section id="payments" title="5. Payment Processing Workflows">
                        <p className="text-stone-300 leading-relaxed mb-6">
                            FundEd handles two distinct transaction routes: Online submissions and Manual cash hand-ins.
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/20">
                                <h5 className="text-emerald-400 font-semibold mb-2">Online (UPI) Processing</h5>
                                <p className="text-stone-400 text-sm leading-relaxed">
                                    Students scan your QR, pay on their app, visit your Student Portal, select their name, and upload the Success screenshot to your event. It lands in your dashboard under "Pending Verification". You must look at the screenshot, verify the UTR matches your bank app, and click "Approve" or "Reject". Rejecting will allow the student to try again.
                                </p>
                            </div>
                            <div className="bg-blue-500/5 p-5 rounded-2xl border border-blue-500/20">
                                <h5 className="text-blue-400 font-semibold mb-2">Manual Cash Processing</h5>
                                <p className="text-stone-400 text-sm leading-relaxed">
                                    If a student hands you a physical 500-rupee note, do not make them upload a blank screenshot. In your Admin Dashboard, click <strong>"Record Cash Payment"</strong>. Select the Event, then the Student. The system already hides students who paid online. Enter the receipt number and the actual handed date. The status bypasses Pending and immediately becomes "Paid".
                                </p>
                            </div>
                        </div>
                    </Section>

                    <Section id="major-events" title="6. Major Events & Sync Link">
                        <p className="text-stone-300 leading-relaxed mb-6">
                            A <strong>Major Event</strong> is purely an umbrella aggregator. It is used when a department (e.g., Computer Science) is organizing a massive fest, and they need Section A, Section B, and Section C's class reps to collect the money separately but sync the data upward to one central dashboard.
                        </p>
                        <div className="space-y-6">
                            <Step number="A" title="For Head Admins: Creating the Bridge">
                                Instead of creating a Standard Event, click to create a Major Event. Once created, you will see a button to <strong>"Manage Connections"</strong>. Inside, you can generate a new Sync Token. Optionally, you can just click the "Copy Quick Link" button. Share this link directly with the sub-admins (the class reps). They DO NOT need to be in your workspace.
                            </Step>
                            <Step number="B" title="For Sub-Admins: Supplying Data">
                                When a class rep opens your Quick Link (`/join/[token]`), they will see a beautiful page inviting them to connect. They select which of their local Standard Events represents the fund collection for this Major Event, and they hit "Request Connection".
                            </Step>
                            <Step number="C" title="Closing the Loop">
                                The Head Admin gets a "Pending" connection request. Upon clicking "Approve", the pipelines open. The Head Admin can now see real-time updates of how much money the Class Rep has secured, their expenses, and their net balance, without ever seeing the individual student names or screenshots.
                            </Step>
                        </div>
                    </Section>

                    <Section id="finance" title="7. Finance Tracking (Expenses & Extra Revenue)">
                        <p className="text-stone-300 leading-relaxed mb-6">
                            Collecting funds is only half the battle. You must track where the money goes to maintain a perfect ledger.
                        </p>
                        <ul className="space-y-6 text-stone-300">
                            <li>
                                <strong>Expense Tracking:</strong> Navigate to any specific event page and open the Expenses panel. Here you log outgoing cash: DJ arrangements, decoration tape, food catering. Add exact amounts, categorize the expense, and optionally upload an image of the physical receipt for auditing.
                            </li>
                            <li>
                                <strong>Additional Revenue:</strong> Sometimes funds enter an event that aren't tied to a specific student—like a HOD donating ₹5,000, or a corporate sponsor providing ₹10,000. Under the Additional Income tab on the event page, register these entries. 
                            </li>
                            <li>
                                <strong>Net Balance Computation:</strong> The system automatically calculates: <br/>
                                <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Net Balance = (Student Collections + Additional Revenue) - Expenses</span>. <br/>
                                This represents the exact cash you should hold in your hands.
                            </li>
                        </ul>
                    </Section>

                    <Section id="settings" title="8. Settings & Team Collaboration">
                        <p className="text-stone-300 leading-relaxed mb-6">
                            If you are overwhelmed with verifying hundreds of screenshots, hire a team.
                        </p>
                        <p className="text-stone-300 leading-relaxed mb-6">
                            In your <strong>Settings</strong> page, navigate to Team Members / Collab Users. You can generate a login (email and password) for an assistant. When they log in to your portal, they see YOUR students, YOUR events, and YOUR payments. 
                        </p>
                        <div className="bg-[#1f1515] border border-red-500/20 p-5 rounded-2xl">
                            <h5 className="text-red-400 font-medium mb-2">Role Restrictions & Security</h5>
                            <p className="text-stone-400 text-sm leading-relaxed">
                                To prevent sabotage, Collab users are heavily restricted. They can verify screenshots and add students, but they CANNOT:
                                Delete events, modify Major Event sync tokens, alter the public slug, change the QR code, edit their own team permissions, or mass-delete students. If a collab user forgets their password, you (the root admin) can edit their profile in Settings and type a new one.
                            </p>
                        </div>
                    </Section>
                    
                    <Section id="reports" title="9. Reports & Analytics">
                        <p className="text-stone-300 leading-relaxed mb-6">
                            At the end of an event, the university administration requires proof. Navigate to the <strong>Reports</strong> tab located on the side panel.
                        </p>
                        <ul className="space-y-4 text-stone-300 list-disc list-inside">
                            <li><strong>Raw Export (CSV):</strong> Download a raw spreadsheet containing every single student format. Great for transferring over to institutional ERPs.</li>
                            <li><strong>Beautiful PDF Manifest:</strong> This generates a stunning, stylized PDF report summarizing the Total Projected Collection, Total Actual Verified, all logged expenses with categories, and the final list of students who have paid up. It serves as your official hand-off document to the Head of Department.</li>
                        </ul>
                        <p className="text-stone-400 italic text-sm mt-6">
                            Note: If you encounter issues rendering PDFs with very large datasets, try exporting to CSV first, as the PDF relies on browser-memory to generate matrices on the fly.
                        </p>
                    </Section>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 bg-black/40 px-6 md:px-16 py-8 mt-auto">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-600">
                    <p>© {new Date().getFullYear()} FundEd · A sub-product of <span className="text-emerald-500/80">SKS DM</span></p>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function Section({ id, title, children }: { id: string, title: string, children: React.ReactNode }) {
    return (
        <section id={id} className="scroll-mt-40 relative">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full inline-block"></span>
                {title}
            </h2>
            <div className="text-base text-stone-300">
                {children}
            </div>
            <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent mt-10 md:mt-12"></div>
        </section>
    );
}

function Step({ number, title, children }: { number: string, title: string, children: React.ReactNode }) {
    return (
        <div className="flex gap-5 group">
            <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0)_inset] group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)_inset] transition-all">
                {number}
            </div>
            <div className="pt-2">
                <h4 className="text-white font-semibold mb-2 text-lg">{title}</h4>
                <p className="text-stone-400 text-sm leading-relaxed">{children}</p>
            </div>
        </div>
    );
}
