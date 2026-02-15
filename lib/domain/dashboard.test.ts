import { describe, expect, it } from 'vitest';
import { buildDashboardSummary } from './dashboard';
import { Habit, HabitEntry } from './types';

const date = (ymd: string) => new Date(`${ymd}T12:00:00Z`);

describe('buildDashboardSummary', () => {
  it('derives dashboard contract values from habits and entries', () => {
    const habits: Habit[] = [
      {
        id: 'h1',
        title: 'Workout',
        targetDays: [1, 3, 5],
        createdAt: date('2026-01-05')
      },
      {
        id: 'h2',
        title: 'Read',
        targetDays: [2, 4, 6],
        createdAt: date('2026-01-05')
      }
    ];

    const entries: HabitEntry[] = [
      { id: 'e1', habitId: 'h1', completedAt: date('2026-01-05') },
      { id: 'e2', habitId: 'h1', completedAt: date('2026-01-09') },
      { id: 'e3', habitId: 'h2', completedAt: date('2026-01-06') }
    ];

    const summary = buildDashboardSummary(habits, entries, date('2026-01-11'));

    expect(summary.totalHabits).toBe(2);
    expect(summary.consistency).toBe(0.5);
    expect(summary.fragility).toBe(0.75);
    expect(summary.dominantSkipDay).toBe(3);
    expect(summary.recoverySpeed).toBe(0);
    expect(summary.currentStreak).toBe(1);
    expect(summary.longestStreak).toBe(1);
    expect(summary.completionRate).toBe(50);
    expect(summary.weeklyPerformance).toEqual({
      completed: 3,
      opportunities: 6,
      completionRate: 50
    });
  });

  it('captures non-zero recovery speed from a recovery event', () => {
    const habits: Habit[] = [
      {
        id: 'h1',
        title: 'Daily habit',
        targetDays: [0, 1, 2, 3, 4, 5, 6],
        createdAt: date('2026-01-01')
      }
    ];

    const entries: HabitEntry[] = [
      { id: 'e1', habitId: 'h1', completedAt: date('2026-01-01') },
      { id: 'e2', habitId: 'h1', completedAt: date('2026-01-03') },
      { id: 'e3', habitId: 'h1', completedAt: date('2026-01-04') }
    ];

    const summary = buildDashboardSummary(habits, entries, date('2026-01-04'));

    expect(summary.recoverySpeed).toBe(2);
  });
});
