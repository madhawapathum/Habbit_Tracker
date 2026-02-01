"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DayData } from "@/lib/storage";
import type { Holiday } from "@/lib/holidays";

interface DayCellProps {
    day: number;
    data?: DayData;
    holiday?: Holiday;
    isEmpty?: boolean;
    onClick?: () => void;
}

export default function DayCell({ day, data, holiday, isEmpty, onClick }: DayCellProps) {
    if (isEmpty) {
        return <div className="aspect-square bg-transparent cursor-default pointer-events-none" />;
    }

    // Calculate Progress
    const tasks = data?.tasks || [];
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    let percent = 0;
    if (total > 0) {
        percent = (completed / total) * 100;
    }

    // Color Mapping
    const colorMap: Record<string, string> = {
        green: "#4ade80",
        red: "#ef4444",
        blue: "#3b82f6",
        yellow: "#eab308",
        purple: "#a855f7",
    };
    const fillColor = data?.color && colorMap[data.color] ? colorMap[data.color] : "#4ade80";

    const isFullReward = total > 0 && completed === total;

    return (
        <motion.div
            whileHover={{ scale: 1.05, zIndex: 10, boxShadow: "0 0 10px rgba(255, 255, 255, 0.1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
                "relative aspect-square flex flex-col items-center justify-start",
                "bg-[#2c2c2c] rounded-xl cursor-pointer select-none overflow-hidden",
                "p-[5px] min-h-[80px]",
                "transition-colors duration-300"
            )}
            style={{
                background: `linear-gradient(to top, ${fillColor} ${percent}%, #2c2c2c ${percent}%)`,
            }}
        >
            {/* Day Number */}
            <span className={cn(
                "font-bold z-10 text-sm md:text-base drop-shadow-md",
                isFullReward && "z-20 text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]"
            )}>
                {day}
            </span>

            {/* Holiday Emoji */}
            {holiday && (
                <span
                    title={holiday.name}
                    className="absolute top-[3px] right-[3px] text-xs z-[5] opacity-90 grayscale-[0.2] hover:scale-120 hover:grayscale-0 transition-all"
                >
                    {holiday.emoji}
                </span>
            )}

            {/* Note Preview */}
            {data?.note && !isFullReward && (
                <div className="mt-auto text-[10px] w-full text-center truncate px-1 opacity-90 z-10 drop-shadow-md">
                    {data.note}
                </div>
            )}

            {/* Reward Emoji */}
            {isFullReward && (
                <motion.div
                    initial={{ scale: 0, rotate: -45, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    whileHover={{
                        rotate: [0, -10, 10, -10, 10, 0],
                        transition: { duration: 0.5, repeat: Infinity }
                    }}
                    className="absolute inset-0 flex items-center justify-center text-4xl z-10 pointer-events-none drop-shadow-md"
                >
                    🏆
                </motion.div>
            )}
        </motion.div>
    );
}
