export type TimelineDayStatus = "Completed" | "In Progress" | "Empty";

export interface DayTaskLike {
  completed: boolean;
}

export interface TimelineDayViewInput {
  selectedDate: string;
  tasksForSelectedDay: DayTaskLike[];
}

export interface TimelineDayItem {
  dayNumber: number;
  status: TimelineDayStatus;
}

export function resolveTimelineDayStatus(tasksForSelectedDay: DayTaskLike[]): TimelineDayStatus {
  if (tasksForSelectedDay.length === 0) {
    return "Empty";
  }

  const completedCount = tasksForSelectedDay.filter((task) => task.completed).length;
  if (completedCount === tasksForSelectedDay.length) {
    return "Completed";
  }

  return completedCount > 0 ? "In Progress" : "Empty";
}

export function buildThirtyDayTimeline(dayViews: TimelineDayViewInput[]): TimelineDayItem[] {
  return dayViews.map((dayView) => {
    const dayNumber = Number(dayView.selectedDate.split("-")[2]);
    return {
      dayNumber,
      status: resolveTimelineDayStatus(dayView.tasksForSelectedDay),
    };
  });
}
