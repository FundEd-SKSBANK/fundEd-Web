'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function InitialLoader() {
    const [mounted, setMounted] = useState(false);
    const [show, setShow] = useState(true);
    const [text1, setText1] = useState('');
    const [text2, setText2] = useState('');
    const [startSecondLine, setStartSecondLine] = useState(false);

    const fullText1 = "FundEd";
    const fullText2 = "CLASSROOM OS";

    useEffect(() => {
        setMounted(true);

        const typeSpeed = 100;
        const startDelay = 500;

        // Start typing Line 1
        const t1 = setTimeout(() => {
            let i = 0;
            const interval1 = setInterval(() => {
                setText1(fullText1.substring(0, i + 1));
                i++;
                if (i === fullText1.length) {
                    clearInterval(interval1);
                    setStartSecondLine(true);
                }
            }, typeSpeed);
        }, startDelay);

        return () => clearTimeout(t1);
    }, []);

    useEffect(() => {
        if (startSecondLine) {
            let j = 0;
            const interval2 = setInterval(() => {
                setText2(fullText2.substring(0, j + 1));
                j++;
                if (j === fullText2.length) {
                    clearInterval(interval2);
                    // Dismiss after completion
                    setTimeout(() => setShow(false), 400);
                }
            }, 100);
            return () => clearInterval(interval2);
        }
    }, [startSecondLine]);

    if (!mounted) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 transition-opacity duration-700 ease-in-out font-mono",
                show ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
        >
            <div className="flex flex-col items-start min-w-[280px]">
                {/* Line 1 */}
                <div className="flex items-center text-5xl md:text-7xl font-bold tracking-tighter text-white mb-4">
                    <span className="text-emerald-500 mr-4 opacity-70">{'>'}</span>
                    {text1}
                    {/* Cursor for Line 1 */}
                    {!startSecondLine && (
                        <span className="w-3 h-10 md:h-16 bg-emerald-500 ml-2 animate-pulse" />
                    )}
                </div>

                {/* Line 2 */}
                {startSecondLine && (
                    <div className="flex items-center text-xl md:text-3xl font-medium tracking-[0.2em] text-emerald-500 ml-12">
                        <span className="drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">
                            {text2}
                        </span>
                        {/* Cursor for Line 2 */}
                        <span className="w-3 h-6 md:h-8 bg-emerald-500 ml-2 animate-pulse" />
                    </div>
                )}
            </div>
        </div>
    );
}
