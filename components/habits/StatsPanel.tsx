"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface StatsTaskItem {
  id: string;
  title: string;
  completed: boolean;
}

interface StatsPanelProps {
  selectedDateLabel: string;
  tasksForSelectedDay: StatsTaskItem[];
  onAddTask: (title: string) => void;
  onUpdateTask: (taskId: string, updates: { title?: string; completed?: boolean }) => void;
}

export default function StatsPanel({
  selectedDateLabel,
  tasksForSelectedDay,
  onAddTask,
  onUpdateTask,
}: StatsPanelProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleCreateTask = () => {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    onAddTask(trimmed);
    setNewTaskTitle("");
    setIsCreateModalOpen(false);
  };

  return (
    <section className="relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="mb-4 w-full rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-400"
      >
        + Create Tasks
      </button>

      <h3 className="mb-3 text-sm font-semibold text-white">{selectedDateLabel} Tasks</h3>
      <div className="space-y-3">
        {tasksForSelectedDay.length === 0 && (
          <p className="text-sm text-slate-400">Create tasks to begin tracking this day.</p>
        )}
        {tasksForSelectedDay.map((task) => (
          <div key={task.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="mb-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={(e) => onUpdateTask(task.id, { completed: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-transparent text-blue-500 focus:ring-blue-400"
              />
              <span className="text-xs text-slate-300">Completed</span>
            </div>
            <input
              value={task.title}
              onChange={(e) => onUpdateTask(task.id, { title: e.target.value })}
              className="w-full rounded-lg border border-white/15 bg-transparent px-2 py-1.5 text-sm text-white focus:border-blue-300 focus:outline-none"
            />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-[#0b1220]/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCreateModalOpen(false)}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a2540] p-4 shadow-xl"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="mb-1 text-sm font-semibold text-white">Create Task</h4>
              <p className="mb-3 text-xs text-slate-400">For {selectedDateLabel}</p>

              <input
                autoFocus
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter task title"
                className="mb-3 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-blue-300 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTask();
                }}
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-400"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
