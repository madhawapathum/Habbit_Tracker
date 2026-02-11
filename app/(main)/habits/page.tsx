"use client";

import React, { useEffect, useState } from 'react';
import HabitCalendar from "@/components/ui_legacy/HabitCalendar";
import Habits from "@/components/ui_legacy/Habits";
import { habitStore } from '@/lib/state/habitStore';

export default function HabitsPage() {
    const [activeHabitId, setActiveHabitId] = useState<string>('default-habit');

    useEffect(() => {
        const habits = habitStore.getHabits();
        if (habits.length === 0) {
            habitStore.updateHabit({
                id: 'default-habit',
                title: 'Daily Journal',
                targetDays: [0, 1, 2, 3, 4, 5, 6],
                createdAt: new Date()
            });
        } else {
            if (!habits.find(h => h.id === 'default-habit')) {
                setActiveHabitId(habits[0].id);
            }
        }
    }, []);

    return (
        <div className="space-y-8">
            <HabitCalendar habitId={activeHabitId} habitName="Daily Journal" />
            <Habits />
        </div>
    );
}
