'use client';

import { HashLoader } from 'react-spinners';

interface PageLoaderProps {
    message?: string;
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
    return (
        <div className="min-h-[400px] flex flex-col items-center justify-center">
            <HashLoader color="#10B981" size={50} />
            <p className="mt-6 text-sm text-emerald-500/80 font-medium animate-pulse">
                {message}
            </p>
        </div>
    );
}

export function FullPageLoader({ message = 'Loading...' }: PageLoaderProps) {
    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <HashLoader color="#10B981" size={80} />

            <div className="mt-8 text-center">
                <p className="text-lg font-semibold text-white mb-2 tracking-wide">FundEd</p>
                <p className="text-sm text-emerald-500/80 animate-pulse">{message}</p>
            </div>
        </div>
    );
}

export function TableLoader({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3 animate-pulse">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="h-12 bg-muted/50 rounded-lg"></div>
            ))}
        </div>
    );
}

export function CardLoader() {
    return (
        <div className="animate-pulse">
            <div className="h-32 bg-muted/50 rounded-lg"></div>
        </div>
    );
}
