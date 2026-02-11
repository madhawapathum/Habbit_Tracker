"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { habitStore } from '@/lib/state/habitStore';
import { Habit, HabitEntry, StreakResult } from '@/lib/domain/types';
import { calculateCurrentStreak } from '@/lib/domain/streak';
import { Plus, Check, Trash2, Flame, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Habits: React.FC = () => {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [entries, setEntries] = useState<Record<string, HabitEntry[]>>({});
    const [newHabitTitle, setNewHabitTitle] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    const loadData = useCallback(() => {
        const loadedHabits = habitStore.getHabits();
        setHabits(loadedHabits);

        const loadedEntries: Record<string, HabitEntry[]> = {};
        loadedHabits.forEach(h => {
            loadedEntries[h.id] = habitStore.getEntries(h.id);
        });
        setEntries(loadedEntries);
    }, []);

    useEffect(() => {
        setIsMounted(true);
        loadData();

        const handleStorageChange = () => loadData();
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('habit-store-update', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('habit-store-update', handleStorageChange);
        };
    }, [loadData]);

    const handleAddHabit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHabitTitle.trim()) return;

        const newHabit: Habit = {
            id: crypto.randomUUID ? crypto.randomUUID() : `habit-${Date.now()}`,
            title: newHabitTitle,
            targetDays: [0, 1, 2, 3, 4, 5, 6], // Default to daily
            createdAt: new Date(),
        };

        habitStore.updateHabit(newHabit);
        setNewHabitTitle('');
        // loadData triggered by event listener
    };

    const toggleToday = (habitId: string) => {
        const today = new Date();
        const habitEntries = entries[habitId] || [];
        const isCompleted = habitEntries.some(e => {
            const d = new Date(e.completedAt);
            return d.toDateString() === today.toDateString();
        });

        if (isCompleted) {
            habitStore.removeEntry(habitId, today);
        } else {
            habitStore.addEntry(habitId, today);
        }
        // loadData triggered by event listener
    };

    const isTodayComplete = (habitId: string) => {
        const today = new Date();
        const habitEntries = entries[habitId] || [];
        return habitEntries.some(e => new Date(e.completedAt).toDateString() === today.toDateString());
    };

    const getStreak = (habitId: string, targetDays: number[]) => {
        const habitEntries = entries[habitId] || [];
        return calculateCurrentStreak(habitEntries, targetDays);
    };

    if (!isMounted) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#e0e0d8] p-6 w-full">
            <h3 className="text-lg font-bold text-[#181611] mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Your Habits
            </h3>

            {/* List */}
            <div className="space-y-4 mb-8">
                <AnimatePresence>
                    {habits.map((habit) => {
                        const streak = getStreak(habit.id, habit.targetDays);
                        const completed = isTodayComplete(habit.id);

                        return (
                            <motion.div
                                key={habit.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center justify-between p-4 bg-[#fcfcfb] rounded-xl border border-[#ebebe8]"
                            >
                                <div className="flex flex-col gap-1">
                                    <span className="font-semibold text-[#181611]">{habit.title}</span>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className={`px-2 py-0.5 rounded font-bold ${streak.status === 'CLEAN' ? 'bg-green-100 text-green-700' :
                                                streak.status === 'FRACTURED' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-500'
                                            }`}>
                                            {streak.status}
                                        </span>
                                        <span className="text-[#8a8060] flex items-center gap-1">
                                            <Flame className="w-3 h-3" /> {streak.displayCount} day streak
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleToday(habit.id)}
                                    // Removed 'group' from parent div to avoid conflict if any, kept styling simple
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${completed
                                            ? 'bg-primary text-[#181611] shadow-lg shadow-primary/20 scale-110'
                                            : 'bg-white border border-[#e0e0d8] text-[#e0e0d8] hover:border-primary hover:text-primary'
                                        }`}
                                    title={completed ? "Completed today" : "Mark complete"}
                                    aria-label={`Mark ${habit.title} complete`}
                                >
                                    <Check className="w-5 h-5" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {habits.length === 0 && (
                    <div className="text-center py-8 text-[#8a8060] italic">
                        No habits yet. Add one below!
                    </div>
                )}
            </div>

            {/* Add Habit Form */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newHabitTitle}
                    onChange={(e) => setNewHabitTitle(e.target.value)}
                    placeholder="New habit name..."
                    className="flex-1 px-4 py-2 rounded-xl border border-[#e0e0d8] focus:outline-none focus:ring-2 focus:ring-primary/50 bg-[#fcfcfb]"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddHabit(e as any);
                    }}
                />
                <button
                    onClick={handleAddHabit as any}
                    disabled={!newHabitTitle.trim()}
                    className="p-2 bg-[#181611] text-white rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Add Habit"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default Habits;
