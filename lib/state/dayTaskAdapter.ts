import { DayTask, DayTaskView } from './habitStore';

export interface StateBridgeSnapshot {
  dayTasks?: DayTask[];
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function deriveDayTaskView(selectedDate: Date, snapshot: StateBridgeSnapshot): DayTaskView {
  const selectedDateKey = toDateKey(selectedDate);
  const allTasks = snapshot.dayTasks ?? [];

  return {
    selectedDate: selectedDateKey,
    tasksForSelectedDay: allTasks.filter((task) => task.date === selectedDateKey),
  };
}
