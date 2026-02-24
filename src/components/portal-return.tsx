'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, Sparkles } from 'lucide-react';

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
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Link href={`/check-status/${portalInfo.slug}`}>
                <Button className="group relative px-8 py-5 bg-white/5 backdrop-blur-md border border-white/10 text-stone-200 text-sm font-medium tracking-[0.1em] uppercase hover:border-emerald-500/40 hover:text-emerald-400 transition-all flex items-center gap-3 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <Search className="w-4 h-4 text-emerald-500" />
                    <span>
                        Check Status {portalInfo.adminName ? `at ${portalInfo.adminName}` : ''}
                    </span>
                    <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400 animate-pulse" />
                </Button>
            </Link>
        </div>
    );
}
