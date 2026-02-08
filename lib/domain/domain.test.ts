import { describe, it, expect } from 'vitest';
import { Habit, HabitEntry } from './types';
import { calculateCurrentStreak } from './streak';
import { analyzeBehavioralPatterns } from './history';

// Helper to create dates
const date = (str: string) => new Date(str + 'T12:00:00Z');

// Base habit configuration
const dailyHabit: Habit = {
    id: 'h1',
    title: 'Daily Habit',
    targetDays: [0, 1, 2, 3, 4, 5, 6], // Every day
    createdAt: date('2023-01-01'),
};

describe('Streak Logic: Fracture vs Reset', () => {
    it('Should fracture streak on a single missed day', () => {
        // Given: 2 days of completion, then 1 day miss
        const entries: HabitEntry[] = [
            { id: '1', habitId: 'h1', completedAt: date('2023-01-01') },
            { id: '2', habitId: 'h1', completedAt: date('2023-01-02') },
            // Missed Jan 3
        ];

        // When: Checking status on the DAY AFTER the miss (Jan 4) to ensure miss is finalized
        const result = calculateCurrentStreak(entries, dailyHabit.targetDays, date('2023-01-04'));

        // Then: Status is FRACTURED, Value preserved
        expect(result.status).toBe('FRACTURED');
        expect(result.value).toBe(2);
        expect(result.displayCount).toBe(2);
    });

    it('Should reset streak on two consecutive missed days', () => {
        // Given: 2 days completion, then 2 days miss
        const entries: HabitEntry[] = [
            { id: '1', habitId: 'h1', completedAt: date('2023-01-01') },
            { id: '2', habitId: 'h1', completedAt: date('2023-01-02') },
            // Missed Jan 3 & Jan 4
        ];

        // When: Checking status on the VALIDATION DATE (Jan 5)
        const result = calculateCurrentStreak(entries, dailyHabit.targetDays, date('2023-01-05'));

        // Then: Status is RESET, Value is 0
        expect(result.status).toBe('RESET');
        expect(result.value).toBe(0);
    });

    it('Should allow recovery with slower progress (0.5 increment)', () => {
        // Given: Fractured streak (missed Jan 3), then completed Jan 4
        const entries: HabitEntry[] = [
            { id: '1', habitId: 'h1', completedAt: date('2023-01-01') },
            { id: '2', habitId: 'h1', completedAt: date('2023-01-02') },
            // Missed Jan 3
            { id: '3', habitId: 'h1', completedAt: date('2023-01-04') }, // Recovery step 1
        ];

        // When: Checking status after 1 recovery day
        const result = calculateCurrentStreak(entries, dailyHabit.targetDays, date('2023-01-04'));

        // Then: Status still FRACTURED, Value increases by 0.5
        expect(result.status).toBe('FRACTURED');
        expect(result.value).toBe(2.5);
        expect(result.displayCount).toBe(2);
    });

    it('Should restore CLEAN status after 2 recovery days', () => {
        // Given: Fractured streak, then completed 2 days
        const entries: HabitEntry[] = [
            { id: '1', habitId: 'h1', completedAt: date('2023-01-01') },
            { id: '2', habitId: 'h1', completedAt: date('2023-01-02') },
            // Missed Jan 3
            { id: '3', habitId: 'h1', completedAt: date('2023-01-04') },
            { id: '4', habitId: 'h1', completedAt: date('2023-01-05') },
        ];

        // When: Checking status after 2 recovery days
        const result = calculateCurrentStreak(entries, dailyHabit.targetDays, date('2023-01-05'));

        // Then: Status is CLEAN, Value rounded up to integer (loss of 1 day due to miss)
        expect(result.status).toBe('CLEAN');
        expect(result.value).toBe(3);
        expect(result.displayCount).toBe(3);
    });
});

describe('Behavioral Analysis', () => {
    it('Should identify low consistency and high fragility', () => {
        // Given: 1 completed, 1 missed, alternately
        const entries: HabitEntry[] = [
            { id: '1', habitId: 'h1', completedAt: date('2023-01-01') }, // Sun
            // Mon miss
            { id: '2', habitId: 'h1', completedAt: date('2023-01-03') }, // Tue
            // Wed miss
            { id: '3', habitId: 'h1', completedAt: date('2023-01-05') }, // Thu
        ];

        // Analysis over Sun-Thu (5 days). 3 completions, 2 misses.
        // Consistency: 3/5 = 0.6
        // Fragility: Breaks / Completions. 
        // Breaks: Sun->Mon miss (Fracture). Tue->Wed miss (Fracture).
        // Let's trace fragility logic: 
        // "streakInterruptions / totalCompletions"
        // Interruptions: 
        // Sun (Clean) -> Mon (Miss -> Fractured). Interruption++
        // Tue (Fractured -> Recovery 1).
        // Wed (Miss -> Reset). Interruption++ (Fractured->Reset counts?)
        // Logic says: "if Clean -> Fracture: ++". "if Clean -> Reset: ++"?
        // Logic in history.ts: 
        // "if currentStatus === 'CLEAN' { streakInterruptions++; currentStatus = 'FRACTURED'; }"
        // So only Clean->Fractured counts.
        // Sun: Clean. Mon: Miss -> Fractured (Int=1).
        // Tue: Completion (Fractured).
        // Wed: Miss (Reset).
        // Thu: Completion (Reset->Clean).
        // So Int=1.
        // Fragility: 1 / 3 = 0.33.

        const summary = analyzeBehavioralPatterns(dailyHabit, entries, date('2023-01-05'));

        expect(summary.consistencyScore).toBe(0.6);
        expect(summary.fragilityScore).toBeCloseTo(0.33, 2);
    });

    it('Should detect dominant skip days', () => {
        // Given: Frequent skips on Mondays (Day 1)
        // Setup 3 weeks.
        // Week 1: Mon miss.
        // Week 2: Mon miss.
        // Week 3: Mon miss.
        const entries: HabitEntry[] = [];
        const start = date('2023-01-01'); // Sunday

        // Simulate 21 days
        for (let i = 0; i < 21; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            // Skip Mondays (Day 1)
            if (d.getDay() !== 1) {
                entries.push({ id: `e${i}`, habitId: 'h1', completedAt: d });
            }
        }

        const summary = analyzeBehavioralPatterns(dailyHabit, entries, date('2023-01-21'));

        expect(summary.dominantSkipDays).toContain(1);
        expect(summary.dominantSkipDays.length).toBe(1);
    });
});
