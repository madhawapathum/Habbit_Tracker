import { describe, it, expect, beforeEach, vi } from 'vitest';
import { habitStore } from './habitStore';
import { Habit } from '../domain/types';

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
});
