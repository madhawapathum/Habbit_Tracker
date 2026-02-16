"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

interface AppLayoutProps {
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const navItems = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Habits', href: '/habits' },
        { label: 'Journal', href: '/journal' },
        { label: 'Settings', href: '/settings' },
    ];

    return (
        <div className="min-h-screen w-full app-shell text-white">
            <header className="app-header">
                <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-6 px-4 py-6 md:px-8">
                    <h1 className="text-2xl font-semibold tracking-tight">Habit Tracker</h1>
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="text-right">
                            <p className="text-xs text-slate-400">Session</p>
                            <p className="text-sm font-medium text-slate-200">
                                {status === 'authenticated' ? session.user?.name ?? 'Signed in' : 'Guest'}
                            </p>
                        </div>
                        {status === 'authenticated' ? (
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10 md:text-base"
                            >
                                Logout
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10 md:text-base"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                    <nav className="flex items-center gap-2 md:gap-4">
                        {navItems.map((item) => {
                            const active = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors md:text-base ${active
                                        ? 'bg-white/15 text-white'
                                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </header>
            <main className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-8">
                {children}
            </main>
            <div className="mx-auto w-full max-w-[1400px] px-4 pb-8 text-xs text-slate-400 md:px-8">
                Placeholder pages are intentionally minimal for upcoming features.
            </div>
        </div>
    );
};

export default AppLayout;
