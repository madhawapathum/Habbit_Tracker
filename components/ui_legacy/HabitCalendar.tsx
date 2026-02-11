"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Trophy, Flame, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateCurrentStreak } from '@/lib/domain/streak';
import { habitStore } from '@/lib/state/habitStore';
import { HabitEntry } from '@/lib/domain/types';
import Celebration from './Celebration';

interface HabitCalendarProps {
    habitId: string;
    habitName?: string;
    targetDays?: number[]; // Default to all days if not provided
}

const HabitCalendar: React.FC<HabitCalendarProps> = ({
    habitId,
    habitName = "Daily Habit",
    targetDays = [0, 1, 2, 3, 4, 5, 6]
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [entries, setEntries] = useState<HabitEntry[]>([]);
    const [showCelebration, setShowCelebration] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Load data
    const loadData = useCallback(() => {
        const fetchedEntries = habitStore.getEntries(habitId);
        setEntries(fetchedEntries);
    }, [habitId]);

    useEffect(() => {
        setIsMounted(true);
        loadData();

        // Listen for storage events to sync across tabs/components
        const handleStorageChange = () => loadData();
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [loadData]);

    // Derived state
    const streak = useMemo(() => {
        return calculateCurrentStreak(entries, targetDays);
    }, [entries, targetDays]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const getDayStatus = (date: Date) => {
        const isCompleted = entries.some(e => {
            const d = new Date(e.completedAt);
            return d.getFullYear() === date.getFullYear() &&
                d.getMonth() === date.getMonth() &&
                d.getDate() === date.getDate();
        });
        return isCompleted;
    };

    const toggleDate = (date: Date) => {
        const isCompleted = getDayStatus(date);
        if (isCompleted) {
            habitStore.removeEntry(habitId, date);
        } else {
            habitStore.addEntry(habitId, date);
            // Trigger celebration if toggling today or recently
            const today = new Date();
            if (date.toDateString() === today.toDateString()) {
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 2000);
            }
        }
        loadData(); // Reload immediately
    };

    const pages = useMemo(() => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const p = [];
        for (let day = 1; day <= daysInMonth; day++) {
            p.push(new Date(year, month, day));
        }
        return p;
    }, [year, month]);

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    if (!isMounted) return null;

    return (
        <div className="w-full p-6">
            <Celebration show={showCelebration} />

            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#181611]">{habitName}</h2>
                    <div className="flex items-center gap-4 text-sm text-[#8a8060] mt-2 font-medium bg-[#f5f5f0] px-4 py-2 rounded-full border border-[#e0e0d8]">
                        <div className="flex items-center gap-1.5">
                            <Flame className={`w-4 h-4 ${streak.status === 'CLEAN' ? 'text-orange-500 fill-orange-500' : 'text-gray-400'}`} />
                            <span>{streak.displayCount} Day Streak</span>
                        </div>
                        <div className="w-px h-4 bg-[#e0e0d8]"></div>
                        <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${streak.status === 'CLEAN' ? 'bg-green-100 text-green-700' :
                                streak.status === 'FRACTURED' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-500'
                                }`}>
                                {streak.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="font-serif text-xl italic text-[#181611]">{monthName} {year}</span>
                    <div className="flex gap-1 border border-[#e0e0d8] rounded-lg p-1 bg-white">
                        <button onClick={handlePrevMonth} aria-label="Previous Month" className="p-1 hover:bg-gray-100 rounded text-[#8a8060]"><ChevronLeft size={20} /></button>
                        <button onClick={handleNextMonth} aria-label="Next Month" className="p-1 hover:bg-gray-100 rounded text-[#8a8060]"><ChevronRight size={20} /></button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e0e0d8] p-6">
                <div className="grid grid-cols-7 gap-4 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                        <div key={d} className="text-center text-[11px] font-bold uppercase tracking-widest text-[#8a8060]">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-4">
                    {Array.from({ length: new Date(year, month, 1).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                    ))}

                    {pages.map((date) => {
                        const dayNum = date.getDate();
                        const isCompleted = getDayStatus(date);
                        const isToday = new Date().toDateString() === date.toDateString();

                        return (
                            <button
                                key={date.toISOString()}
                                onClick={() => toggleDate(date)}
                                className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all duration-200 group
                            ${isCompleted
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-transparent border-transparent hover:bg-gray-50 hover:border-gray-200 text-[#8a8060]'
                                    }
                            ${isToday ? 'ring-2 ring-offset-2 ring-primary/30' : ''}
                        `}
                            >
                                <span className={`text-sm font-medium ${isCompleted ? 'font-bold' : ''}`}>{dayNum}</span>
                                {isCompleted && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-primary/20 w-8 h-8 rounded-full flex items-center justify-center">
                                            <Trophy className="w-4 h-4 text-primary fill-primary/20" />
                                        </motion.div>
                                    </div>
                                )}
                                {!isCompleted && isToday && (
                                    <div className="absolute bottom-2 w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse"></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Quick Action for Today */}
            <div className="mt-8 flex justify-center">
                <button
                    onClick={() => toggleDate(new Date())}
                    className="flex items-center gap-3 px-8 py-4 bg-primary text-[#181611] rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all active:translate-y-0"
                >
                    <CheckCircle className="w-5 h-5" />
                    {getDayStatus(new Date()) ? 'Completed Today' : 'Mark Today Complete'}
                </button>
            </div>
        </div>
    );
};



export default HabitCalendar;
