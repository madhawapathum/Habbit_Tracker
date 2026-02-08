"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeBehavioralPatterns = analyzeBehavioralPatterns;
/**
 * Normalizes a date to the start of the day.
 */
function startOfDay(date) {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
}
/**
 * Computes behavioral patterns based on habit history.
 *
 * @param habit Habit definition
 * @param entries Completion entries
 * @param today Reference date for analysis
 */
function analyzeBehavioralPatterns(habit, entries, today = new Date()) {
    const startDate = habit.startDate || habit.createdAt;
    const normalizedToday = startOfDay(today);
    // Identify completion days
    const completedDays = new Set();
    entries.forEach(e => completedDays.add(startOfDay(e.completedAt).getTime()));
    let totalScheduledDays = 0;
    let totalCompletions = 0;
    let streakInterruptions = 0;
    let currentStatus = 'RESET';
    let recoveryTotalTime = 0;
    let recoveryEventsCount = 0;
    let recoveryStartTime = null;
    let recoverySteps = 0;
    const skipDayCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    // Simulation loop from start to today
    let simDate = new Date(startOfDay(startDate));
    // We reuse the simulation logic similar to streak.ts but track more metrics
    // For simplicity, we'll re-implement the state machine here to capture historical transitions
    let previousStatus = 'RESET';
    while (simDate <= normalizedToday) {
        const isScheduled = habit.targetDays.includes(simDate.getDay());
        const isCompleted = completedDays.has(simDate.getTime());
        if (isScheduled) {
            totalScheduledDays++;
            if (isCompleted) {
                totalCompletions++;
                // Track recovery
                if (currentStatus !== 'CLEAN') {
                    recoverySteps++;
                    if (currentStatus === 'RESET' || (currentStatus === 'FRACTURED' && recoverySteps >= 2)) {
                        // Success! Back to clean
                        if (recoveryStartTime !== null) {
                            recoveryTotalTime += recoverySteps;
                            recoveryEventsCount++;
                            recoveryStartTime = null;
                        }
                        currentStatus = 'CLEAN';
                        recoverySteps = 0;
                    }
                    else if (currentStatus === 'FRACTURED') {
                        // Ongoing recovery (step 1 of 2)
                    }
                }
            }
            else {
                // Skips
                skipDayCounts[simDate.getDay()]++;
                if (currentStatus === 'CLEAN') {
                    streakInterruptions++; // Transition away from clean
                    currentStatus = 'FRACTURED';
                    recoveryStartTime = simDate.getTime();
                    recoverySteps = 0;
                }
                else if (currentStatus === 'FRACTURED') {
                    currentStatus = 'RESET';
                    recoverySteps = 0; // Reset recovery progress
                }
            }
        }
        simDate.setDate(simDate.getDate() + 1);
    }
    // ConsistencyScore
    const consistencyScore = totalScheduledDays > 0 ? totalCompletions / totalScheduledDays : 0;
    // FragilityScore
    // Fragility is ratio of breaks to completions
    // If I complete it 100 times but break it 10 times, fragility is 0.1
    const fragilityScore = totalCompletions > 0 ? Math.min(1, streakInterruptions / totalCompletions) : 0;
    // DominantSkipDays
    // Find days where skip count is > 20% of total skips? Or just the max days.
    const totalSkips = Object.values(skipDayCounts).reduce((a, b) => a + b, 0);
    const dominantSkipDays = [];
    if (totalSkips > 0) {
        const maxSkips = Math.max(...Object.values(skipDayCounts));
        if (maxSkips > 0) {
            Object.entries(skipDayCounts).forEach(([day, count]) => {
                if (count === maxSkips) {
                    dominantSkipDays.push(Number(day));
                }
            });
        }
    }
    // AverageRecoveryTime
    const averageRecoveryTime = recoveryEventsCount > 0 ? recoveryTotalTime / recoveryEventsCount : 0;
    return {
        habitId: habit.id,
        consistencyScore: Math.round(consistencyScore * 100) / 100,
        fragilityScore: Math.round(fragilityScore * 100) / 100,
        dominantSkipDays,
        averageRecoveryTime: Math.round(averageRecoveryTime * 10) / 10
    };
}
