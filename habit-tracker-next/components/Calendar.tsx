"use client";

import { useState, useEffect } from "react";
import { useHabitData } from "@/lib/storage";
import { holidays2026 } from "@/lib/holidays";
import DayCell from "./DayCell";
import TaskPanel from "./TaskPanel";
import Celebration from "./Celebration";
import BackgroundManager from "./BackgroundManager";
import { ChevronLeft, ChevronRight } from "lucide-react"; // Only if using lucide, otherwise text
import { motion } from "framer-motion";

export default function Calendar() {
    const [isMounted, setIsMounted] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        setIsMounted(true);
    }, []);
    const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);

    const { data, getDayData, updateDayData } = useHabitData();

    // Navigation
    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };
    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Calendar Logic
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleString("default", { month: "long" });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayIndex = firstDay.getDay();

    // Generate grid
    const days = [];
    // Empty slots
    for (let i = 0; i < startDayIndex; i++) {
        days.push(<DayCell key={`empty-${i}`} day={0} isEmpty />);
    }
    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dayData = getDayData(dateKey);

        // Holiday
        const is2026 = year === 2026;
        const holKey = `${month + 1}-${d}`;
        const holiday = is2026 ? holidays2026[holKey] : undefined;

        days.push(
            <DayCell
                key={dateKey}
                day={d}
                data={dayData}
                holiday={holiday}
                onClick={() => setSelectedDateKey(dateKey)}
            />
        );
    }

    // Handle Celebration trigger
    // We need to listen to task updates. But the update happens in TaskPanel.
    // We can wrap the update function passed to TaskPanel.
    const handleUpdate = (updates: any) => {
        if (!selectedDateKey) return;
        updateDayData(selectedDateKey, updates);

        // Check for celebration
        if (updates.tasks) {
            const allCompleted = updates.tasks.length > 0 && updates.tasks.every((t: any) => t.completed);
            // We need to know previous state to trigger "just completed"? 
            // Simplified: if all completed, trigger. But strictly "just" completed is better contextually.
            // For now, just trigger if all completed and we are interacting.
            // A better check would be in the toggle logic inside TaskPanel or here comparing prev vs new.
            // Let's rely on the user interacting with the checkbox component in TaskPanel.
            // Actually, TaskPanel should maybe callback "onAllCompleted"?
            // Let's iterate tasks here.
            if (allCompleted) {
                // Simple debounce or check if it was already showing?
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 2000);
            }
        }
    };

    if (!isMounted) return null; // Avoid hydration mismatch on initial render

    return (
        <>
            <BackgroundManager monthIndex={month} />

            <div className="relative z-10 w-[95%] max-w-[800px] bg-[#1e1e1e] p-10 rounded-[20px] shadow-2xl animate-fadeIn transition-transform duration-300">
                <header className="flex justify-between items-center mb-8">
                    <button onClick={prevMonth} className="text-[#a0a0a0] hover:text-[#e0e0e0] text-2xl p-2">&lt;</button>
                    <h1 className="text-2xl font-semibold tracking-wide">{monthName} {year}</h1>
                    <button onClick={nextMonth} className="text-[#a0a0a0] hover:text-[#e0e0e0] text-2xl p-2">&gt;</button>
                </header>

                <div className="grid grid-cols-7 gap-[15px]">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                        <div key={d} className="text-center text-[#a0a0a0] text-sm font-medium pb-2">
                            {d}
                        </div>
                    ))}
                    {days}
                </div>
            </div>

            <TaskPanel
                isOpen={!!selectedDateKey}
                onClose={() => setSelectedDateKey(null)}
                dateTitle={selectedDateKey ? new Date(selectedDateKey).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : ""}
                data={selectedDateKey ? getDayData(selectedDateKey) : { color: "green", note: "", tasks: [] }}
                onUpdate={handleUpdate}
            />

            <Celebration show={showCelebration} />
        </>
    );
}
