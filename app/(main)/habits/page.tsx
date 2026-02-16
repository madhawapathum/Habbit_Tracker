"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import CalendarPanel, { CalendarTaskItem } from "@/components/habits/CalendarPanel";
import TimelinePanel, { TimelineDayItem } from "@/components/habits/TimelinePanel";
import StatsPanel from "@/components/habits/StatsPanel";
import { deriveDayTaskView, StateBridgeSnapshot } from "@/lib/state/dayTaskAdapter";
import { habitStore } from "@/lib/state/habitStore";
import { buildThirtyDayTimeline } from "@/lib/domain/timeline";

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

export default function HabitsPage() {
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    return now;
  }, []);

  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0, 0)
  );
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [snapshot, setSnapshot] = useState<StateBridgeSnapshot>({ dayTasks: [] });

  const monthYear = currentMonth.getFullYear();
  const monthIndex = currentMonth.getMonth();
  const monthLabel = currentMonth.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = new Date(monthYear, monthIndex + 1, 0).getDate();
  const leadingBlanks = new Date(monthYear, monthIndex, 1).getDay();
  const selectedDateKey = toDateKey(selectedDate);
  const todayDateKey = toDateKey(today);

  const loadSnapshot = useCallback(async () => {
    const exported = JSON.parse(await habitStore.exportData()) as StateBridgeSnapshot;
    setSnapshot({ dayTasks: exported.dayTasks ?? [] });
  }, []);

  useEffect(() => {
    void loadSnapshot();
    const handleStoreUpdate = () => {
      void loadSnapshot();
    };
    window.addEventListener("habit-store-update", handleStoreUpdate);
    window.addEventListener("storage", handleStoreUpdate);
    return () => {
      window.removeEventListener("habit-store-update", handleStoreUpdate);
      window.removeEventListener("storage", handleStoreUpdate);
    };
  }, [loadSnapshot]);

  const calendarCells = useMemo(() => {
    const cells: Array<{ dateKey: string; dayNumber: number } | null> = [];
    for (let i = 0; i < leadingBlanks; i++) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = toDateKey(new Date(monthYear, monthIndex, day, 12, 0, 0, 0));
      cells.push({ dateKey, dayNumber: day });
    }
    return cells;
  }, [daysInMonth, leadingBlanks, monthYear, monthIndex]);

  const dayTaskView = useMemo(
    () => deriveDayTaskView(selectedDate, snapshot),
    [selectedDate, snapshot]
  );

  const timelineItems: TimelineDayItem[] = useMemo(() => {
    const dayViews = Array.from({ length: 30 }, (_, index) => {
      const dayDate = new Date(monthYear, monthIndex, index + 1, 12, 0, 0, 0);
      return deriveDayTaskView(dayDate, snapshot);
    });
    return buildThirtyDayTimeline(dayViews);
  }, [snapshot, monthYear, monthIndex]);

  const tasksForSelectedDay = dayTaskView.tasksForSelectedDay as CalendarTaskItem[];
  const completedCount = tasksForSelectedDay.filter((task) => task.completed).length;
  const selectedDayNumber = selectedDate.getDate();
  const selectedDayLabel = `Day ${selectedDayNumber}`;
  const selectedDayProgress = `${completedCount}/${tasksForSelectedDay.length}`;

  const handleAddTask = async (title: string) => {
    await habitStore.createDayTask(selectedDate, title);
    await loadSnapshot();
  };

  const handleUpdateTask = async (taskId: string, updates: { title?: string; completed?: boolean }) => {
    await habitStore.updateDayTask(selectedDate, taskId, updates);
    await loadSnapshot();
  };

  const handleSelectDate = (dateKey: string) => {
    setSelectedDate(fromDateKey(dateKey));
  };

  const shiftMonth = (delta: number) => {
    const targetMonth = new Date(monthYear, monthIndex + delta, 1, 12, 0, 0, 0);
    const targetDays = new Date(
      targetMonth.getFullYear(),
      targetMonth.getMonth() + 1,
      0
    ).getDate();
    const targetDay = Math.min(selectedDate.getDate(), targetDays);
    const nextSelected = new Date(
      targetMonth.getFullYear(),
      targetMonth.getMonth(),
      targetDay,
      12,
      0,
      0,
      0
    );

    setCurrentMonth(targetMonth);
    setSelectedDate(nextSelected);
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
      <CalendarPanel
        monthLabel={monthLabel}
        weekDays={weekDays}
        calendarCells={calendarCells}
        selectedDateKey={selectedDateKey}
        todayDateKey={todayDateKey}
        onSelectDate={handleSelectDate}
        onPrevMonth={() => shiftMonth(-1)}
        onNextMonth={() => shiftMonth(1)}
        selectedDayLabel={selectedDayLabel}
        selectedDayProgress={selectedDayProgress}
        tasksForSelectedDay={tasksForSelectedDay}
      />

      <TimelinePanel items={timelineItems} />

      <StatsPanel
        selectedDateLabel={selectedDayLabel}
        tasksForSelectedDay={tasksForSelectedDay}
        onAddTask={handleAddTask}
        onUpdateTask={handleUpdateTask}
      />
    </div>
  );
}
