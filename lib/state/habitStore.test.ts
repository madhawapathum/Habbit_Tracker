import { describe, it, expect, beforeEach, vi } from 'vitest';
import { habitStore } from './habitStore';
import { Habit } from '../domain/types';
import { buildDashboardSummary } from '../domain/dashboard';

// Mock localStorage
const localStorageMock = (function () {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

// Assign to global for Node environment simulation
Object.defineProperty(global, 'localStorage', { value: localStorageMock });
// Also mock window for safeParse check
Object.defineProperty(global, 'window', { value: { localStorage: localStorageMock, dispatchEvent: vi.fn() } });

// Need to mock crypto for randomUUID if running in environment where it's not available by default?
// Node 19+ has globalThis.crypto. If it's missing, we mock it.
if (!global.crypto) {
    Object.defineProperty(global, 'crypto', {
        value: {
            randomUUID: () => 'test-uuid-' + Math.random()
        }
    });
}

describe('habitStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should be empty initially', () => {
        expect(habitStore.getHabits()).toEqual([]);
    });

    it('should add and retrieve entries', () => {
        const habitId = 'habit-1';
        const date = new Date('2023-01-01T10:00:00Z');
        habitStore.addEntry(habitId, date);

        const entries = habitStore.getEntries(habitId);
        expect(entries).toHaveLength(1);
        expect(entries[0].habitId).toBe(habitId);
        expect(entries[0].completedAt).toBeInstanceOf(Date);
        expect(entries[0].completedAt.toISOString()).toBe(date.toISOString());
    });

    it('should persist data to localStorage', () => {
        const habitId = 'habit-2';
        const date = new Date('2023-01-02T10:00:00Z');
        habitStore.addEntry(habitId, date);

        const stored = localStorage.getItem('entries');
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].habitId).toBe(habitId);
    });

    it('should remove an entry by date (ignoring time)', () => {
        const habitId = 'habit-3';
        const date1 = new Date(2023, 0, 3, 10, 0, 0); // Local time Jan 3, 10:00
        const date1DifferentTime = new Date(2023, 0, 3, 20, 0, 0); // Local time Jan 3, 20:00

        habitStore.addEntry(habitId, date1);
        expect(habitStore.getEntries(habitId)).toHaveLength(1);

        habitStore.removeEntry(habitId, date1DifferentTime);
        expect(habitStore.getEntries(habitId)).toHaveLength(0);
    });

    it('should update and retrieve habits', () => {
        const habit: Habit = {
            id: 'h1',
            title: 'Test Habit',
            targetDays: [0, 1, 2, 3, 4, 5, 6],
            createdAt: new Date()
        };

        habitStore.updateHabit(habit);
        const retrieved = habitStore.getHabits();
        expect(retrieved).toHaveLength(1);
        expect(retrieved[0].id).toBe('h1');
        expect(retrieved[0].createdAt).toBeInstanceOf(Date);
    });

    it('should clear all data', () => {
        habitStore.addEntry('h1', new Date());
        habitStore.updateHabit({ id: 'h1', title: 'test', targetDays: [], createdAt: new Date() });
        habitStore.saveJournalEntry(new Date(), 'test journal');
        habitStore.saveSettings({ theme: 'dark' });

        habitStore.deleteAllData();

        expect(habitStore.getEntries('h1')).toHaveLength(0);
        expect(habitStore.getHabits()).toHaveLength(0);
        expect(habitStore.getAllJournalEntries()).toHaveLength(0);
        expect(habitStore.getSettings()).toEqual({});
    });

    // ─── Journal Tests ───
    it('should save and retrieve a journal entry', () => {
        const date = new Date(2023, 5, 15);
        habitStore.saveJournalEntry(date, 'Hello world', 'good');

        const entry = habitStore.getJournalEntry(date);
        expect(entry).not.toBeNull();
        expect(entry!.content).toBe('Hello world');
        expect(entry!.mood).toBe('good');
        expect(entry!.date).toBe('2023-06-15');
    });

    it('should upsert journal entry for the same date', () => {
        const date = new Date(2023, 5, 15);
        habitStore.saveJournalEntry(date, 'First version');
        habitStore.saveJournalEntry(date, 'Updated version', 'great');

        const all = habitStore.getAllJournalEntries();
        expect(all).toHaveLength(1);
        expect(all[0].content).toBe('Updated version');
        expect(all[0].mood).toBe('great');
    });

    it('should return null for missing journal entry', () => {
        const entry = habitStore.getJournalEntry(new Date(2099, 0, 1));
        expect(entry).toBeNull();
    });

    // ─── Settings Tests ───
    it('should save and retrieve settings', () => {
        habitStore.saveSettings({ theme: 'dark' });
        const settings = habitStore.getSettings();
        expect(settings.theme).toBe('dark');
    });

    it('should return empty settings initially', () => {
        expect(habitStore.getSettings()).toEqual({});
    });

    // ─── Export / Import Tests ───
    it('should export all data as JSON', () => {
        habitStore.updateHabit({ id: 'exp-h', title: 'Export Test', targetDays: [1], createdAt: new Date() });
        habitStore.addEntry('exp-h', new Date());
        habitStore.saveJournalEntry(new Date(), 'export journal');
        habitStore.saveSettings({ theme: 'dark' });

        const json = habitStore.exportData();
        const parsed = JSON.parse(json);

        expect(parsed.habits).toHaveLength(1);
        expect(parsed.entries).toHaveLength(1);
        expect(parsed.journal).toHaveLength(1);
        expect(parsed.settings.theme).toBe('dark');
    });

    it('should import data and restore state', () => {
        const importPayload = JSON.stringify({
            habits: [{ id: 'imp-h', title: 'Imported', targetDays: [0, 6], createdAt: new Date().toISOString() }],
            entries: [{ id: 'imp-e', habitId: 'imp-h', completedAt: new Date().toISOString() }],
            journal: [{ date: '2023-01-01', content: 'Imported journal', mood: 'okay' }],
            settings: { theme: 'light' },
        });

        const result = habitStore.importData(importPayload);
        expect(result).toBe(true);

        expect(habitStore.getHabits()).toHaveLength(1);
        expect(habitStore.getHabits()[0].title).toBe('Imported');
        expect(habitStore.getEntries('imp-h')).toHaveLength(1);
        expect(habitStore.getAllJournalEntries()).toHaveLength(1);
        expect(habitStore.getSettings().theme).toBe('light');
    });

    it('should fail gracefully on invalid import', () => {
        const result = habitStore.importData('not-valid-json{{{');
        expect(result).toBe(false);
    });

    it('seeds realistic dev test data and produces non-trivial dashboard metrics', () => {
        const referenceDate = new Date('2026-02-15T12:00:00.000Z');

        const seeded = habitStore.seedRealisticTestData(referenceDate);
        expect(seeded).toBe(true);

        const habits = habitStore.getHabits();
        const entries = habits.flatMap((habit) => habitStore.getEntries(habit.id));

        expect(habits).toHaveLength(3);
        expect(entries.length).toBeGreaterThanOrEqual(10);
        expect(entries.length).toBeLessThanOrEqual(14);

        const summary = buildDashboardSummary(habits, entries, referenceDate);

        expect(summary.consistency).toBeGreaterThan(0);
        expect(summary.fragility).toBeGreaterThan(0);

        const skipCounts = [0, 0, 0, 0, 0, 0, 0];
        const start = new Date(referenceDate);
        start.setDate(start.getDate() - 13);
        start.setHours(0, 0, 0, 0);
        const end = new Date(referenceDate);
        end.setHours(0, 0, 0, 0);

        habits.forEach((habit) => {
            const completionSet = new Set(
                habitStore.getEntries(habit.id).map((entry) => {
                    const day = new Date(entry.completedAt);
                    day.setHours(0, 0, 0, 0);
                    return day.getTime();
                })
            );

            const cursor = new Date(start);
            while (cursor <= end) {
                if (habit.targetDays.includes(cursor.getDay()) && !completionSet.has(cursor.getTime())) {
                    skipCounts[cursor.getDay()]++;
                }
                cursor.setDate(cursor.getDate() + 1);
            }
        });

        const maxSkips = Math.max(...skipCounts);
        const expectedDominantSkipDay = maxSkips > 0 ? skipCounts.findIndex((count) => count === maxSkips) : null;
        expect(summary.dominantSkipDay).toBe(expectedDominantSkipDay);

        expect(summary.weeklyPerformance.completed).toBeGreaterThan(0);
        expect(summary.weeklyPerformance.opportunities).toBeGreaterThan(0);
    });

    it('does not overwrite existing live data when seeding unless forced', () => {
        const existingHabit: Habit = {
            id: 'existing-habit',
            title: 'Keep Me',
            targetDays: [1],
            createdAt: new Date('2026-02-15T12:00:00.000Z'),
        };
        habitStore.updateHabit(existingHabit);

        const seeded = habitStore.seedRealisticTestData(new Date('2026-02-15T12:00:00.000Z'));
        expect(seeded).toBe(false);

        const habits = habitStore.getHabits();
        expect(habits.some((habit) => habit.id === 'existing-habit')).toBe(true);
    });

    it('maps DayTask creation into habits/entries so dashboard completion metrics change', () => {
        const referenceDate = new Date('2026-02-16T12:00:00.000Z');

        habitStore.updateHabit({
            id: 'baseline-habit',
            title: 'Baseline',
            targetDays: [referenceDate.getDay()],
            createdAt: new Date(referenceDate),
            startDate: new Date(referenceDate),
            endDate: new Date(referenceDate),
        });
        habitStore.addEntry('baseline-habit', referenceDate);

        const baselineHabits = habitStore.getHabits();
        const baselineEntries = baselineHabits.flatMap((habit) => habitStore.getEntries(habit.id));
        const baselineSummary = buildDashboardSummary(baselineHabits, baselineEntries, referenceDate);

        habitStore.createDayTask(referenceDate, 'Task mapped to habit');

        const afterCreateHabits = habitStore.getHabits();
        const afterCreateEntries = afterCreateHabits.flatMap((habit) => habitStore.getEntries(habit.id));
        const afterCreateSummary = buildDashboardSummary(afterCreateHabits, afterCreateEntries, referenceDate);

        expect(afterCreateSummary.weeklyPerformance.opportunities).toBeGreaterThan(
            baselineSummary.weeklyPerformance.opportunities
        );
        expect(afterCreateSummary.completionRate).toBeLessThan(baselineSummary.completionRate);
    });

    it('increases dashboard streak when a DayTask is completed', () => {
        const referenceDate = new Date('2026-02-16T12:00:00.000Z');
        const task = habitStore.createDayTask(referenceDate, 'Complete me');

        const beforeHabits = habitStore.getHabits();
        const beforeEntries = beforeHabits.flatMap((habit) => habitStore.getEntries(habit.id));
        const beforeSummary = buildDashboardSummary(beforeHabits, beforeEntries, referenceDate);

        habitStore.updateDayTask(referenceDate, task.id, { completed: true });

        const afterHabits = habitStore.getHabits();
        const afterEntries = afterHabits.flatMap((habit) => habitStore.getEntries(habit.id));
        const afterSummary = buildDashboardSummary(afterHabits, afterEntries, referenceDate);

        expect(afterSummary.currentStreak).toBeGreaterThan(beforeSummary.currentStreak);
    });

    it('dispatches updates and reflects summary changes for DayTask create/complete/edit', () => {
        const referenceDate = new Date('2026-02-16T12:00:00.000Z');
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        const beforeHabits = habitStore.getHabits();
        const beforeEntries = beforeHabits.flatMap((habit) => habitStore.getEntries(habit.id));
        const beforeSummary = buildDashboardSummary(beforeHabits, beforeEntries, referenceDate);

        const task = habitStore.createDayTask(referenceDate, 'Initial Task');
        const afterCreateHabits = habitStore.getHabits();
        const afterCreateEntries = afterCreateHabits.flatMap((habit) => habitStore.getEntries(habit.id));
        const afterCreateSummary = buildDashboardSummary(afterCreateHabits, afterCreateEntries, referenceDate);

        expect(dispatchSpy).toHaveBeenCalled();
        expect(afterCreateSummary.weeklyPerformance.opportunities).toBeGreaterThan(
            beforeSummary.weeklyPerformance.opportunities
        );

        habitStore.updateDayTask(referenceDate, task.id, { completed: true });
        const afterCompleteHabits = habitStore.getHabits();
        const afterCompleteEntries = afterCompleteHabits.flatMap((habit) => habitStore.getEntries(habit.id));
        const afterCompleteSummary = buildDashboardSummary(afterCompleteHabits, afterCompleteEntries, referenceDate);

        expect(dispatchSpy).toHaveBeenCalledTimes(2);
        expect(afterCompleteSummary.weeklyPerformance.completed).toBeGreaterThan(
            afterCreateSummary.weeklyPerformance.completed
        );
        expect(afterCompleteSummary.currentStreak).toBeGreaterThan(afterCreateSummary.currentStreak);

        habitStore.updateDayTask(referenceDate, task.id, { title: 'Edited Task' });
        const editedTask = habitStore.getDayTasks(referenceDate).find((item) => item.id === task.id);

        expect(dispatchSpy).toHaveBeenCalledTimes(3);
        expect(editedTask?.title).toBe('Edited Task');
    });
});
