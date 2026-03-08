'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, ArrowRight } from 'lucide-react';

export function PortalReturn() {
    const [portalInfo, setPortalInfo] = useState<{ slug: string; adminName: string | null } | null>(null);

    useEffect(() => {
        const slug = localStorage.getItem('lastStatusSlug');
        const adminName = localStorage.getItem('lastStatusAdminName');
        if (slug) {
            setPortalInfo({ slug, adminName });
        }
    }, []);

    if (!portalInfo) return null;

    return (
        <div className="mt-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <Link href={`/check-status/${portalInfo.slug}`}>
                <Button className="group relative px-10 py-7 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-md border-2 border-emerald-400/40 text-white text-sm md:text-base font-bold tracking-[0.15em] uppercase hover:border-emerald-300/60 transition-all flex items-center gap-4 rounded-full overflow-hidden shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)]">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <Search className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform text-emerald-400" />
                    <span className="relative z-10">
                        {portalInfo.adminName ? `Portal: ${portalInfo.adminName}` : 'Check Status'}
                    </span>
                    <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-2 text-emerald-400" />
                </Button>
            </Link>
        </div>
    );
}
