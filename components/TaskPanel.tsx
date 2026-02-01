"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus } from "lucide-react"; // Assuming we install lucide-react or just use text
import { cn } from "@/lib/utils";
import type { DayData, Task } from "@/lib/storage";

interface TaskPanelProps {
    isOpen: boolean;
    onClose: () => void;
    dateTitle: string;
    data: DayData;
    onUpdate: (updates: Partial<DayData>) => void;
}

const COLORS = ["green", "red", "blue", "yellow", "purple"];
const COLOR_MAP: Record<string, string> = {
    green: "#4ade80",
    red: "#ef4444",
    blue: "#3b82f6",
    yellow: "#eab308",
    purple: "#a855f7",
};

export default function TaskPanel({ isOpen, onClose, dateTitle, data, onUpdate }: TaskPanelProps) {
    const [newTaskText, setNewTaskText] = useState("");
    const [noteText, setNoteText] = useState(data.note || "");

    useEffect(() => {
        setNoteText(data.note || "");
    }, [data.note, isOpen]);

    // Handle Note Save on Blur or Close (or Debounce)
    // For simplicity, we save on recursive update, but let's just save on blur or specific action
    // Actually, we should sync state.
    const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNoteText(e.target.value);
        onUpdate({ note: e.target.value });
    };

    const addTask = () => {
        if (!newTaskText.trim()) return;
        const newTask: Task = {
            id: Date.now(),
            text: newTaskText.trim(),
            completed: false,
        };
        onUpdate({ tasks: [...data.tasks, newTask] });
        setNewTaskText("");
    };

    const toggleTask = (id: number) => {
        const updatedTasks = data.tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
        );
        onUpdate({ tasks: updatedTasks });
    };

    const deleteTask = (id: number) => {
        const updatedTasks = data.tasks.filter((t) => t.id !== id);
        onUpdate({ tasks: updatedTasks });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#1e1e1e] shadow-[-10px_0_40px_rgba(0,0,0,0.5)] z-50 p-8 flex flex-col gap-6"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-semibold">{dateTitle}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[#333] rounded-full transition-colors"
                                aria-label="Close"
                            >
                                {/* Close Icon */}
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        {/* Color Picker */}
                        <div>
                            <div className="text-xs uppercase tracking-wider text-[#a0a0a0] font-semibold mb-3">Color Theme</div>
                            <div className="flex gap-3">
                                {COLORS.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => onUpdate({ color })}
                                        aria-label={`Select ${color} theme`}
                                        className={cn(
                                            "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                                            data.color === color ? "border-white shadow-[0_0_10px_currentColor]" : "border-transparent"
                                        )}
                                        style={{ backgroundColor: COLOR_MAP[color], color: COLOR_MAP[color] }} // Use color for shadow
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Note */}
                        <div>
                            <div className="text-xs uppercase tracking-wider text-[#a0a0a0] font-semibold mb-3">Daily Note</div>
                            <textarea
                                value={noteText}
                                onChange={handleNoteChange}
                                placeholder="How did you do today?"
                                className="w-full h-24 bg-[#2c2c2c] border border-[#333] rounded-lg p-3 text-white focus:outline-none focus:border-[#4ade80] resize-none"
                            />
                        </div>

                        {/* Tasks */}
                        <div className="flex flex-col flex-grow min-h-0">
                            <div className="text-xs uppercase tracking-wider text-[#a0a0a0] font-semibold mb-3">Tasks / Habits</div>

                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newTaskText}
                                    onChange={(e) => setNewTaskText(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                                    placeholder="Add a new task..."
                                    className="flex-grow bg-[#2c2c2c] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#4ade80]"
                                />
                                <button
                                    onClick={addTask}
                                    className="bg-[#4ade80] text-[#052e16] w-10 flex items-center justify-center rounded-lg hover:brightness-110 transition-all font-bold text-xl"
                                >
                                    +
                                </button>
                            </div>

                            <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                                {data.tasks.map((task) => (
                                    <div key={task.id} className={cn("flex items-center gap-3 bg-[#252525] p-3 rounded-md transition-all", task.completed && "opacity-60")}>
                                        <input
                                            type="checkbox"
                                            checked={task.completed}
                                            onChange={() => toggleTask(task.id)}
                                            className="w-5 h-5 accent-[#4ade80] cursor-pointer"
                                            aria-label={task.text}
                                        />
                                        <span className={cn("flex-grow text-sm", task.completed && "line-through text-[#a0a0a0]")}>
                                            {task.text}
                                        </span>
                                        <button
                                            onClick={() => deleteTask(task.id)}
                                            className="text-[#ef4444] opacity-70 hover:opacity-100 p-1"
                                        >
                                            ✖
                                        </button>
                                    </div>
                                ))}
                                {data.tasks.length === 0 && (
                                    <div className="text-[#555] text-center text-sm py-4 italic">No tasks yet.</div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-auto flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 border border-[#333] rounded-lg bg-[#2c2c2c] hover:bg-[#333] transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
