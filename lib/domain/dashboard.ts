import { analyzeBehavioralPatterns } from './history';
import { calculateCurrentStreak, calculateLongestStreak } from './streak';
import { DashboardSummary, Habit, HabitEntry } from './types';

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function buildCompletionSet(entries: HabitEntry[]): Set<number> {
  const set = new Set<number>();
  for (const entry of entries) {
    set.add(startOfDay(entry.completedAt).getTime());
  }
  return set;
}

function countOpportunities(
  habit: Habit,
  completedDays: Set<number>,
  from: Date,
  to: Date,
  skipDayCounts?: number[]
): { opportunities: number; completed: number } {
  const start = startOfDay(from);
  const end = startOfDay(to);

  if (start > end) {
    return { opportunities: 0, completed: 0 };
  }

  let opportunities = 0;
  let completed = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    if (habit.targetDays.includes(cursor.getDay())) {
      opportunities++;
      const isCompleted = completedDays.has(cursor.getTime());
      if (isCompleted) {
        completed++;
      } else if (skipDayCounts) {
        skipDayCounts[cursor.getDay()]++;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return { opportunities, completed };
}

export function buildDashboardSummary(
  habits: Habit[],
  entries: HabitEntry[],
  referenceDate: Date = new Date()
): DashboardSummary {
  const today = startOfDay(referenceDate);
  const skipDayCounts = [0, 0, 0, 0, 0, 0, 0];

  let opportunitiesTotal = 0;
  let completedTotal = 0;
  let currentStreak = 0;
  let longestStreak = 0;

  const fragilityScores: number[] = [];
  const recoverySpeeds: number[] = [];

  for (const habit of habits) {
    const habitStart = startOfDay(habit.startDate ?? habit.createdAt);
    if (habitStart > today) {
      continue;
    }

    const habitEntries = entries.filter(
      (entry) => entry.habitId === habit.id && startOfDay(entry.completedAt) <= today
    );
    const completionSet = buildCompletionSet(habitEntries);

    const totals = countOpportunities(habit, completionSet, habitStart, today, skipDayCounts);
    opportunitiesTotal += totals.opportunities;
    completedTotal += totals.completed;

    const streak = calculateCurrentStreak(habitEntries, habit.targetDays, today);
    currentStreak += streak.displayCount;
    longestStreak = Math.max(longestStreak, calculateLongestStreak(habitEntries));

    const behavior = analyzeBehavioralPatterns(habit, habitEntries, today);
    fragilityScores.push(behavior.fragilityScore);
    if (behavior.averageRecoveryTime > 0) {
      recoverySpeeds.push(behavior.averageRecoveryTime);
    }
  }

  const weeklyStart = new Date(today);
  weeklyStart.setDate(weeklyStart.getDate() - 6);

  let weeklyOpportunities = 0;
  let weeklyCompleted = 0;
  for (const habit of habits) {
    const habitStart = startOfDay(habit.startDate ?? habit.createdAt);
    const windowStart = habitStart > weeklyStart ? habitStart : weeklyStart;
    if (windowStart > today) {
      continue;
    }

    const habitEntries = entries.filter(
      (entry) => entry.habitId === habit.id && startOfDay(entry.completedAt) <= today
    );
    const completionSet = buildCompletionSet(habitEntries);
    const weekly = countOpportunities(habit, completionSet, windowStart, today);
    weeklyOpportunities += weekly.opportunities;
    weeklyCompleted += weekly.completed;
  }

  const maxSkips = Math.max(...skipDayCounts);
  const dominantSkipDay =
    maxSkips > 0 ? skipDayCounts.findIndex((count) => count === maxSkips) : null;

  const consistency = opportunitiesTotal > 0 ? completedTotal / opportunitiesTotal : 0;
  const completionRate = opportunitiesTotal > 0 ? (completedTotal / opportunitiesTotal) * 100 : 0;

  const weeklyCompletionRate =
    weeklyOpportunities > 0 ? (weeklyCompleted / weeklyOpportunities) * 100 : 0;

  const fragility =
    fragilityScores.length > 0
      ? fragilityScores.reduce((sum, value) => sum + value, 0) / fragilityScores.length
      : 0;

  const recoverySpeed =
    recoverySpeeds.length > 0
      ? recoverySpeeds.reduce((sum, value) => sum + value, 0) / recoverySpeeds.length
      : 0;

  return {
    consistency: round(consistency, 2),
    fragility: round(fragility, 2),
    dominantSkipDay,
    recoverySpeed: round(recoverySpeed, 1),
    currentStreak,
    longestStreak,
    totalHabits: habits.length,
    completionRate: round(completionRate, 1),
    weeklyPerformance: {
      completed: weeklyCompleted,
      opportunities: weeklyOpportunities,
      completionRate: round(weeklyCompletionRate, 1)
    }
  };
}
