import { HabitEntry, StreakResult, StreakStatus } from './types';

/**
 * Checks if two dates are on the same calendar day.
 * Ignores time components.
 */
export function isSameDay(d1: Date, d2: Date): boolean {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

/**
 * Normalizes a date to the start of the day (00:00:00).
 * Useful for consistent date comparisons.
 */
function startOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
}

/**
 * Sorts entries by completion date in ascending order (oldest first).
 * Ascending is easier for calculating progressive state.
 */
function sortEntriesAscending(entries: HabitEntry[]): HabitEntry[] {
    return [...entries].sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
}

/**
 * Calculates current streak with fracture and recovery logic.
 * 
 * @param entries List of habit entries
 * @param targetDays Scheduled days (0-6)
 * @param today Reference date
 */
/**
 * Calculates current streak with fracture and recovery logic.
 * 
 * @param entries List of habit entries
 * @param targetDays Scheduled days (0-6)
 * @param today Reference date
 */
export function calculateCurrentStreak(
    entries: HabitEntry[],
    targetDays: number[],
    today: Date = new Date()
): StreakResult {
    if (!entries.length || !targetDays.length) {
        return { value: 0, displayCount: 0, status: 'RESET' };
    }

    const normalizedToday = startOfDay(today);

    // Identify unique completion days
    const completedDays = new Set<number>();
    entries.forEach(e => completedDays.add(startOfDay(e.completedAt).getTime()));

    // Forward simulation from the first entry to YESTERDAY
    let streakValue = 0;
    let status: StreakStatus = 'RESET';
    let recoveryStep = 0;

    const sortedEntries = sortEntriesAscending(entries).filter(e => startOfDay(e.completedAt) <= normalizedToday);
    if (!sortedEntries.length) return { value: 0, displayCount: 0, status: 'RESET' };

    const firstDate = startOfDay(sortedEntries[0].completedAt);
    let simDate = new Date(firstDate);

    // Simulation loop up to YESTERDAY
    while (simDate < normalizedToday) {
        const isScheduled = targetDays.includes(simDate.getDay());
        const isCompleted = completedDays.has(simDate.getTime());

        if (isScheduled) {
            if (isCompleted) {
                if (status === 'CLEAN') {
                    streakValue += 1;
                } else if (status === 'FRACTURED') {
                    streakValue += 0.5;
                    recoveryStep += 1;
                    if (recoveryStep >= 2) {
                        status = 'CLEAN';
                        recoveryStep = 0;
                        streakValue = Math.round(streakValue);
                    }
                } else if (status === 'RESET') {
                    status = 'CLEAN';
                    streakValue = 1;
                    recoveryStep = 0;
                }
            } else {
                // Missed
                if (status === 'CLEAN') {
                    status = 'FRACTURED';
                    recoveryStep = 0;
                } else if (status === 'FRACTURED') {
                    status = 'RESET';
                    streakValue = 0;
                    recoveryStep = 0;
                }
            }
        }
        simDate.setDate(simDate.getDate() + 1);
    }

    // Handle TODAY (The grace period)
    const isCompletedToday = completedDays.has(normalizedToday.getTime());
    const isScheduledToday = targetDays.includes(normalizedToday.getDay());

    if (isScheduledToday) {
        if (isCompletedToday) {
            // Apply today's completion to yesterday's state
            if (status === 'CLEAN') {
                streakValue += 1;
            } else if (status === 'FRACTURED') {
                streakValue += 0.5;
                recoveryStep += 1;
                if (recoveryStep >= 2) {
                    status = 'CLEAN';
                    streakValue = Math.round(streakValue);
                }
            } else if (status === 'RESET') {
                status = 'CLEAN';
                streakValue = 1;
            }
        } else {
            // Grace period: today is not over, so we reveal yesterday's status.
            // If yesterday was already FRACTURED or CLEAN, keep it.
        }
    } else {
        // Not scheduled today, just maintain yesterday's state
    }

    return {
        value: streakValue,
        displayCount: Math.floor(streakValue),
        status
    };
}

/**
 * Calculates the longest streak ever achieved.
 * (Simplified for now, using legacy continuous logic or can be updated to use Phase 2 logic)
 */
export function calculateLongestStreak(entries: HabitEntry[]): number {
    if (!entries.length) return 0;
    // ... keep legacy for now or update ...
    // Let's use simplified logic: Max consecutive days without gaps.
    const sortedEntries = sortEntriesAscending(entries);
    let max = 0;
    let current = 0;
    let lastDate: number | null = null;

    const completed = Array.from(new Set(sortedEntries.map(e => startOfDay(e.completedAt).getTime()))).sort();

    for (const time of completed) {
        if (lastDate === null) {
            current = 1;
        } else {
            const diff = (time - lastDate) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
                current++;
            } else {
                max = Math.max(max, current);
                current = 1;
            }
        }
        lastDate = time;
    }
    return Math.max(max, current);
}
