"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCompletionRate = calculateCompletionRate;
exports.generateHabitHistory = generateHabitHistory;
const streak_1 = require("./streak");
/**
 * Calculates the completion rate as a percentage.
 *
 * @param habit The habit definition (to check creation date and target days)
 * @param entries List of completion entries
 * @param referenceDate The date to calculate up to (usually "today")
 * @returns Percentage between 0 and 100
 */
function calculateCompletionRate(habit, entries, referenceDate = new Date()) {
    const startDate = habit.startDate || habit.createdAt;
    const endDate = referenceDate;
    // If start date is in the future, rate is 0
    if (startDate > endDate)
        return 0;
    let totalScheduledDays = 0;
    const current = new Date(startDate);
    // Normalize start time to beginning of day to avoid partial day issues
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    // Iterate from start to end date to count how many days were scheduled
    while (current <= end) {
        if (habit.targetDays.includes(current.getDay())) {
            totalScheduledDays++;
        }
        current.setDate(current.getDate() + 1);
    }
    if (totalScheduledDays === 0)
        return 0;
    // Count valid entries that fall on scheduled days
    // We need to filter entries that are:
    // 1. After start date
    // 2. Before or on reference date
    // 3. On a scheduled target day (though usually any completion counts, strictly speaking 
    //    stats might only care about scheduled ones, but let's count all unique valid days for now
    //    to be generous, OR stick to strictly scheduled days. Let's stick to unique completion days
    //    within the period.)
    const uniqueCompletionDays = new Set();
    for (const entry of entries) {
        const entryDate = new Date(entry.completedAt);
        if (entryDate >= startDate && entryDate <= endDate) {
            // Verify if it was actually a scheduled day? 
            // For a simple completion rate, usually Total Completions / Total Opportunities.
            // If I do a habit on a non-scheduled day, does it count? 
            // Let's assume yes for "Generic Completion Rate", effectively "Extra Credit".
            // But to keep it bound to 100%, maybe we should clamp it or only count scheduled days.
            // Let's follow a simple "Total Completions / Total Scheduled Days" logic.
            uniqueCompletionDays.add(entryDate.toDateString());
        }
    }
    const rate = (uniqueCompletionDays.size / totalScheduledDays) * 100;
    return Math.min(100, Math.round(rate * 10) / 10); // Round to 1 decimal place, cap at 100
}
/**
 * Generates a full history object for a habit.
 *
 * @param habit The habit definition
 * @param entries List of completion entries
 * @param referenceDate The date to generate stats for
 * @returns HabitHistory object
 */
function generateHabitHistory(habit, entries, referenceDate = new Date()) {
    // Filter entries for this specific habit just in case, though usually pre-filtered
    const habitEntries = entries.filter(e => e.habitId === habit.id);
    return {
        habitId: habit.id,
        currentStreak: (0, streak_1.calculateCurrentStreak)(habitEntries, referenceDate),
        longestStreak: (0, streak_1.calculateLongestStreak)(habitEntries),
        totalCompletions: habitEntries.length,
        completionRate: calculateCompletionRate(habit, habitEntries, referenceDate)
    };
}
