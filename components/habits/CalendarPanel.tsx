"use client";

import React from "react";

export interface CalendarTaskItem {
  id: string;
  title: string;
  completed: boolean;
  date: string;
}

interface CalendarCell {
  dateKey: string;
  dayNumber: number;
}

interface CalendarPanelProps {
  monthLabel: string;
  weekDays: string[];
  calendarCells: Array<CalendarCell | null>;
  selectedDateKey: string;
  todayDateKey: string;
  onSelectDate: (dateKey: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  selectedDayLabel: string;
  selectedDayProgress: string;
  tasksForSelectedDay: CalendarTaskItem[];
}

export default function CalendarPanel({
  monthLabel,
  weekDays,
  calendarCells,
  selectedDateKey,
  todayDateKey,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  selectedDayLabel,
  selectedDayProgress,
  tasksForSelectedDay,
}: CalendarPanelProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{monthLabel}</h2>
        <div className="flex gap-2">
          <button
            onClick={onPrevMonth}
            className="rounded-lg border border-white/15 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10"
            aria-label="Previous month"
          >
            Prev
          </button>
          <button
            onClick={onNextMonth}
            className="rounded-lg border border-white/15 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10"
            aria-label="Next month"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => (
          <div
            key={`${day}-${index}`}
            className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarCells.map((cell, index) => {
          if (!cell) {
            return <div key={`blank-${index}`} className="h-9" />;
          }

          const isSelected = selectedDateKey === cell.dateKey;
          const isToday = todayDateKey === cell.dateKey;
          return (
            <button
              key={cell.dateKey}
              onClick={() => onSelectDate(cell.dateKey)}
              className={`h-9 rounded-full text-sm transition-colors ${
                isSelected
                  ? "bg-blue-500 text-white ring-2 ring-blue-200/50"
                  : isToday
                  ? "bg-slate-100/15 text-white ring-1 ring-amber-300/60 hover:bg-white/20"
                  : "bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              {cell.dayNumber}
            </button>
          );
        })}
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{selectedDayLabel}</h3>
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-300">
            {selectedDayProgress}
          </span>
        </div>

        <div className="space-y-2">
          {tasksForSelectedDay.length === 0 && (
            <p className="text-sm text-slate-400">No tasks for this day.</p>
          )}
          {tasksForSelectedDay.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  task.completed ? "bg-emerald-400" : "bg-slate-500"
                }`}
              />
              <span
                className={`text-sm ${
                  task.completed ? "text-slate-300 line-through" : "text-slate-100"
                }`}
              >
                {task.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
