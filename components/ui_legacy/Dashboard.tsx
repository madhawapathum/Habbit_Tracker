"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { analyzeBehavioralPatterns } from '@/lib/domain/history';
import { habitStore } from '@/lib/state/habitStore';
import { Habit, HabitEntry, HabitHistorySummary } from '@/lib/domain/types';
import { Activity, BarChart3, Clock, AlertTriangle } from 'lucide-react';

interface DashboardProps {
    habitId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ habitId }) => {
    const [summary, setSummary] = useState<HabitHistorySummary | null>(null);
    const [habit, setHabit] = useState<Habit | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    const loadData = useCallback(() => {
        const habits = habitStore.getHabits();
        const currentHabit = habits.find(h => h.id === habitId);
        const entries = habitStore.getEntries(habitId);

        if (currentHabit) {
            setHabit(currentHabit);
            const stats = analyzeBehavioralPatterns(currentHabit, entries);
            setSummary(stats);
        }
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

    if (!isMounted || !summary || !habit) return null;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const skipDays = summary.dominantSkipDays.map(d => dayNames[d]).join(', ');

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#e0e0d8] p-6 w-full">
            <h3 className="text-lg font-bold text-[#181611] mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Behavioral Insights
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Consistency Score */}
                <div className="bg-[#fcfcfb] p-4 rounded-xl border border-[#ebebe8] flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#8a8060] flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" /> Consistency
                    </span>
                    <span className="text-2xl font-serif font-bold text-[#181611]">
                        {Math.round(summary.consistencyScore * 100)}%
                    </span>
                </div>

                {/* Fragility Score */}
                <div className="bg-[#fcfcfb] p-4 rounded-xl border border-[#ebebe8] flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#8a8060] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Fragility
                    </span>
                    <span className="text-2xl font-serif font-bold text-[#181611]">
                        {summary.fragilityScore}
                    </span>
                    <span className="text-[10px] text-[#8a8060] leading-none">
                        (Lower is better)
                    </span>
                </div>

                {/* Skip Days */}
                <div className="bg-[#fcfcfb] p-4 rounded-xl border border-[#ebebe8] flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#8a8060] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Skip Patterns
                    </span>
                    <span className="text-xl font-serif font-bold text-[#181611] truncate" title={skipDays || 'None'}>
                        {skipDays || 'None'}
                    </span>
                </div>

                {/* Recovery Speed */}
                <div className="bg-[#fcfcfb] p-4 rounded-xl border border-[#ebebe8] flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#8a8060] flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Avg. Recovery
                    </span>
                    <span className="text-2xl font-serif font-bold text-[#181611]">
                        {summary.averageRecoveryTime} <span className="text-sm font-sans font-normal text-[#8a8060]">days</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
