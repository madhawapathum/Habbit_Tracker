"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { buildDashboardSummary } from '@/lib/domain/dashboard';
import { habitStore } from '@/lib/state/habitStore';
import { DashboardSummary } from '@/lib/domain/types';
import { Activity, AlertTriangle, BarChart3, Clock, Flame, Target, Trophy } from 'lucide-react';

interface DashboardProps {
    habitId?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ habitId }) => {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    const loadData = useCallback(() => {
        const habits = habitStore.getHabits();
        const scopedHabits = habitId
            ? habits.filter((habit) => habit.id === habitId)
            : habits;
        const entries = scopedHabits.flatMap((habit) => habitStore.getEntries(habit.id));
        setSummary(buildDashboardSummary(scopedHabits, entries));
    }, [habitId]);

    useEffect(() => {
        setIsMounted(true);
        loadData();

        const handleStorageChange = () => loadData();
        window.addEventListener('storage', handleStorageChange);
        // Custom event dispatch for local updates if needed, though 'storage' only works across tabs usually.
        // We might need a custom event or a subscription if we want instant updates in same tab without refresh.
        // For now, relies on parent or self triggering updates, or we can add a listener for a custom event.
        window.addEventListener('habit-store-update', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('habit-store-update', handleStorageChange);
        };
    }, [loadData]);

    if (!isMounted || !summary) return null;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const skipDays = summary.dominantSkipDay === null ? '' : dayNames[summary.dominantSkipDay];
    const weeklyDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dominantWeeklyIndex =
        summary.dominantSkipDay === null ? -1 : (summary.dominantSkipDay + 6) % 7;
    const weeklyBase = Math.max(12, Math.round(summary.weeklyPerformance.completionRate));
    const weeklyHeights = weeklyDays.map((_, index) =>
        index === dominantWeeklyIndex ? Math.max(18, weeklyBase - 25) : weeklyBase
    );
    const focusRows = [
        {
            label: 'Completion Rate',
            value: `${Math.round(summary.completionRate)}%`,
            progress: Math.max(0, Math.min(100, Math.round(summary.completionRate)))
        },
        {
            label: 'Consistency',
            value: `${Math.round(summary.consistency * 100)}%`,
            progress: Math.max(0, Math.min(100, Math.round(summary.consistency * 100)))
        },
        {
            label: 'Current Streak',
            value: `${summary.currentStreak} days`,
            progress: Math.max(0, Math.min(100, summary.currentStreak * 8))
        },
        {
            label: 'Longest Streak',
            value: `${summary.longestStreak} days`,
            progress: Math.max(0, Math.min(100, summary.longestStreak * 4))
        }
    ];

    return (
        <div className="w-full text-white">
            <h3 className="mb-5 flex items-center gap-2 text-xl font-bold">
                <Activity className="h-5 w-5 text-[#fbbf24]" />
                Behavioral Insights
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-colors hover:border-white/20" data-testid="summary-consistency-card">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <BarChart3 className="h-3.5 w-3.5" /> Consistency
                    </div>
                    <div className="text-4xl font-bold leading-none">{Math.round(summary.consistency * 100)}%</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-colors hover:border-white/20" data-testid="summary-fragility-card">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <AlertTriangle className="h-3.5 w-3.5" /> Fragility
                    </div>
                    <div className="text-4xl font-bold leading-none">{summary.fragility}</div>
                    <div className="mt-2 text-xs text-amber-300">(Lower is better)</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-colors hover:border-white/20" data-testid="summary-skip-card">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <Clock className="h-3.5 w-3.5" /> Skip Patterns
                    </div>
                    <div className="truncate text-4xl font-bold leading-none" title={skipDays || 'None'}>
                        {skipDays || 'None'}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">Most missed day</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-colors hover:border-white/20" data-testid="summary-recovery-card">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <Activity className="h-3.5 w-3.5" /> Avg. Recovery
                    </div>
                    <div className="text-4xl font-bold leading-none">{summary.recoverySpeed}</div>
                    <div className="mt-2 text-sm text-slate-400">days</div>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-blue-300/30 bg-gradient-to-br from-blue-500/20 to-blue-700/10 p-5 backdrop-blur-md">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                        <Flame className="h-3.5 w-3.5 text-orange-300" /> Current Streak
                    </div>
                    <div className="text-4xl font-bold leading-none">{summary.currentStreak} days</div>
                </div>

                <div className="rounded-2xl border border-violet-300/30 bg-gradient-to-br from-violet-500/20 to-purple-700/10 p-5 backdrop-blur-md">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                        <Trophy className="h-3.5 w-3.5 text-yellow-300" /> Longest Streak
                    </div>
                    <div className="text-4xl font-bold leading-none">{summary.longestStreak} days</div>
                </div>

                <div className="rounded-2xl border border-emerald-300/30 bg-gradient-to-br from-emerald-500/20 to-emerald-700/10 p-5 backdrop-blur-md">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                        <Target className="h-3.5 w-3.5 text-emerald-300" /> Total Habits
                    </div>
                    <div className="text-4xl font-bold leading-none">{summary.totalHabits}</div>
                </div>

                <div className="rounded-2xl border border-pink-300/30 bg-gradient-to-br from-pink-500/20 to-rose-700/10 p-5 backdrop-blur-md">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                        <BarChart3 className="h-3.5 w-3.5 text-pink-300" /> Completion Rate
                    </div>
                    <div className="text-4xl font-bold leading-none">{Math.round(summary.completionRate)}%</div>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                    <h4 className="mb-4 text-2xl font-semibold">This Week&apos;s Habits</h4>
                    <div className="space-y-4">
                        {focusRows.map((row) => (
                            <div key={row.label}>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="text-slate-300">{row.label}</span>
                                    <span className="text-slate-400">{row.value}</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#3b82f6] to-[#a855f7]"
                                        style={{ width: `${row.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                    <h4 className="mb-4 text-2xl font-semibold">Weekly Performance</h4>
                    <div className="flex h-48 items-end gap-2">
                        {weeklyDays.map((day, index) => (
                            <div key={day} className="flex flex-1 flex-col items-center gap-2">
                                <div className="flex h-40 w-full items-end rounded-md bg-white/10 p-1">
                                    <div
                                        className={`w-full rounded-md ${index === dominantWeeklyIndex
                                            ? 'bg-gradient-to-b from-[#ef4444] to-[#dc2626]'
                                            : 'bg-gradient-to-b from-[#a855f7] to-[#3b82f6]'
                                            }`}
                                        style={{ height: `${weeklyHeights[index]}%` }}
                                    />
                                </div>
                                <span className="text-xs text-slate-400">{day}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 text-sm text-slate-400">
                        {summary.weeklyPerformance.completed}/{summary.weeklyPerformance.opportunities} completed this week
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
