"use client";

import { useState, useEffect } from "react";

// ==========================================
// TYPES
// ==========================================

export interface Task {
    id: number;
    text: string;
    completed: boolean;
}

export interface DayData {
    color: string; // "green" | "red" | "blue" | "yellow" | "purple"
    note: string;
    tasks: Task[];
}

export interface HabitData {
    [dateKey: string]: DayData;
}

// ==========================================
// STORAGE KEY
// ==========================================
const STORAGE_KEY = "habitData";

// ==========================================
// MIGRATION HELPER
// ==========================================
function migrateData(data: any): HabitData {
    let changed = false;
    const newData: HabitData = { ...data };

    for (const date in newData) {
        const dayData = newData[date] as any;

        // Check for old "marked" property
        if (Object.prototype.hasOwnProperty.call(dayData, "marked")) {
            if (!dayData.tasks) {
                dayData.tasks = [];
                if (dayData.marked) {
                    dayData.tasks.push({
                        id: Date.now() + Math.random(),
                        text: "Daily Goal",
                        completed: true,
                    });
                }
            }
            if (!dayData.color) dayData.color = "green";
            delete dayData.marked;
            changed = true;
        }

        // Ensure structure exists
        if (!dayData.tasks) dayData.tasks = [];
        if (!dayData.note) dayData.note = "";
        if (!dayData.color) dayData.color = "green";
    }

    // We return the modified object, but true persistence happens in the hook
    return newData;
}

// ==========================================
// HOOK: useHabitData
// ==========================================
export function useHabitData() {
    const [data, setData] = useState<HabitData>({});
    const [isMounted, setIsMounted] = useState(false);

    // Load from LocalStorage on mount (Client-side only)
    useEffect(() => {
        setIsMounted(true);
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Run migration safely
                const migrated = migrateData(parsed);
                setData(migrated);

                // If migration changed something, update LS immediately
                // (Comparison is simplified here, but safe to just save back normalized data)
                if (JSON.stringify(parsed) !== JSON.stringify(migrated)) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
                }
            }
        } catch (e) {
            console.error("Failed to load habit data", e);
        }
    }, []);

    const saveData = (newData: HabitData) => {
        setData(newData);
        if (isMounted) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        }
    };

    const getDayData = (dateStr: string): DayData => {
        return data[dateStr] || { color: "green", note: "", tasks: [] };
    };

    const updateDayData = (dateStr: string, updates: Partial<DayData>) => {
        const current = getDayData(dateStr);
        const updatedDay = { ...current, ...updates };
        const newData = { ...data, [dateStr]: updatedDay };
        saveData(newData);
    };

    return {
        data,
        getDayData,
        updateDayData,
        isMounted, // Use this to prevent hydration mismatch
    };
}
