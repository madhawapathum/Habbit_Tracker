/**
 * Core domain types for the habit tracking system.
 * These types are pure data structures and contain no logic.
 */

/**
 * Represents a habit to be tracked.
 */
export interface Habit {
  /** Unique identifier for the habit */
  id: string;
  /** Name of the habit */
  title: string;
  /** Optional detailed description */
  description?: string;
  /** 
   * Days of the week this habit should be performed.
   * 0 = Sunday, 1 = Monday, ..., 6 = Saturday
   */
  targetDays: number[];
  /** Date the habit was created (ISO string or Timestamp) */
  createdAt: Date;
  /** Optional start date if different from creation date */
  startDate?: Date;
  /** Optional end date for temporary habits */
  endDate?: Date;
}

/**
 * Represents a single completion entry for a habit.
 */
export interface HabitEntry {
  /** Unique identifier for the entry */
  id: string;
  /** ID of the habit this entry belongs to */
  habitId: string;
  /** Date and time of completion */
  completedAt: Date;
  /** Optional notes or reflection for this entry */
  notes?: string;
}

/**
 * Status of a habit streak.
 */
export type StreakStatus = 'CLEAN' | 'FRACTURED' | 'RESET';

/**
 * Detailed streak information.
 */
export interface StreakResult {
  /** The value of the streak (can be fractional during recovery) */
  value: number;
  /** The integer representation of the streak for display */
  displayCount: number;
  /** Current status of the streak */
  status: StreakStatus;
}

/**
 * Derived statistics and history for a habit.
 * This is computed from Habit and HabitEntry data, not stored directly.
 */
export interface HabitHistory {
  /** Numerical value of current streak (includes fractional recovery) */
  streakValue: number;
  /** Current streak status (CLEAN, FRACTURED, RESET) */
  streakStatus: StreakStatus;
  /** The integer count for display */
  currentStreak: number;
  /** Longest streak ever achieved */
  longestStreak: number;
  /** Total number of times the habit was completed */
  totalCompletions: number;
  /** 
   * Completion rate as a percentage (0-100).
   * Calculated based on scheduled days since creation/start date.
   */
  completionRate: number;
  /** ID of the habit these stats belong to */
  habitId: string;
}

/**
 * Summary of behavioral patterns for a habit.
 */
export interface HabitHistorySummary {
  /** 
   * Ratio of completed scheduled days to total scheduled days in period (0-1).
   * High = very consistent, Low = many skips.
   */
  consistencyScore: number;
  /**
   * Frequency of streak interruptions relative to total segments (0-1).
   * High = breaks easily, Low = resilient and steady.
   */
  fragilityScore: number;
  /**
   * Days of the week (0-6) where the user skips most frequently.
   */
  dominantSkipDays: number[];
  /**
   * Average number of completions required to recover to CLEAN status.
   */
  averageRecoveryTime: number;
  /** ID of the habit this summary refers to */
  habitId: string;
}

/**
 * Aggregate weekly performance metrics for dashboard reporting.
 */
export interface WeeklyPerformance {
  /** Completed scheduled opportunities in the 7-day window */
  completed: number;
  /** Total scheduled opportunities in the 7-day window */
  opportunities: number;
  /** Weekly completion percentage (0-100) */
  completionRate: number;
}

/**
 * Data contract used by the dashboard UI layer.
 */
export interface DashboardSummary {
  /** Cross-habit consistency ratio (0-1) */
  consistency: number;
  /** Cross-habit fragility ratio (0-1) */
  fragility: number;
  /** Weekday index (0-6) with the most skips; null when no skips exist */
  dominantSkipDay: number | null;
  /** Average recovery steps needed to return to CLEAN state */
  recoverySpeed: number;
  /** Sum of current streak display counts across all habits */
  currentStreak: number;
  /** Best longest streak observed among all habits */
  longestStreak: number;
  /** Number of tracked habits included in the summary */
  totalHabits: number;
  /** Overall completion percentage (0-100) */
  completionRate: number;
  /** Last 7-day performance snapshot */
  weeklyPerformance: WeeklyPerformance;
}
