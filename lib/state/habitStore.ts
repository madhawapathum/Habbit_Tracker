import { Habit, HabitEntry } from '../domain/types';

const HABITS_KEY = 'habits';
const ENTRIES_KEY = 'entries';
const JOURNAL_KEY = 'journal';
const SETTINGS_KEY = 'settings';

export interface JournalEntry {
    date: string; // ISO date string (YYYY-MM-DD)
    content: string;
    mood?: string;
}

export interface AppSettings {
    theme?: 'light' | 'dark';
}

function safeParse<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console.error(`Error parsing ${key} from localStorage`, e);
        return fallback;
    }
}

function startOfDay(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

function toDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function notifyUpdate() {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('habit-store-update'));
}

export const habitStore = {
    // ─── Habits ───
    getHabits(): Habit[] {
        const habits = safeParse<Habit[]>(HABITS_KEY, []);
        return habits.map(h => ({
            ...h,
            createdAt: new Date(h.createdAt),
            startDate: h.startDate ? new Date(h.startDate) : undefined,
            endDate: h.endDate ? new Date(h.endDate) : undefined,
        }));
    },

    getEntries(habitId: string): HabitEntry[] {
        const allEntries = safeParse<HabitEntry[]>(ENTRIES_KEY, []);
        return allEntries
            .filter(e => e.habitId === habitId)
            .map(e => ({
                ...e,
                completedAt: new Date(e.completedAt)
            }));
    },

    addEntry(habitId: string, completedAt: Date): void {
        const allEntries = safeParse<HabitEntry[]>(ENTRIES_KEY, []);
        const newEntry: HabitEntry = {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
            habitId,
            completedAt: completedAt,
        };
        const updated = [...allEntries, newEntry];
        localStorage.setItem(ENTRIES_KEY, JSON.stringify(updated));
        notifyUpdate();
    },

    removeEntry(habitId: string, date: Date): void {
        const allEntries = safeParse<HabitEntry[]>(ENTRIES_KEY, []);
        const targetTime = startOfDay(date);

        const updated = allEntries.filter(e => {
            if (e.habitId !== habitId) return true;
            const entryTime = startOfDay(new Date(e.completedAt));
            return entryTime !== targetTime;
        });

        localStorage.setItem(ENTRIES_KEY, JSON.stringify(updated));
        notifyUpdate();
    },

    updateHabit(habit: Habit): void {
        const habits = safeParse<Habit[]>(HABITS_KEY, []);
        const index = habits.findIndex(h => h.id === habit.id);
        if (index >= 0) {
            habits[index] = habit;
        } else {
            habits.push(habit);
        }
        localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
        notifyUpdate();
    },

    // ─── Journal ───
    saveJournalEntry(date: Date, content: string, mood?: string): void {
        const entries = safeParse<JournalEntry[]>(JOURNAL_KEY, []);
        const key = toDateKey(date);
        const idx = entries.findIndex(e => e.date === key);
        const entry: JournalEntry = { date: key, content, mood };
        if (idx >= 0) {
            entries[idx] = entry;
        } else {
            entries.push(entry);
        }
        localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
        notifyUpdate();
    },

    getJournalEntry(date: Date): JournalEntry | null {
        const entries = safeParse<JournalEntry[]>(JOURNAL_KEY, []);
        const key = toDateKey(date);
        return entries.find(e => e.date === key) || null;
    },

    getAllJournalEntries(): JournalEntry[] {
        return safeParse<JournalEntry[]>(JOURNAL_KEY, []);
    },

    // ─── Settings ───
    getSettings(): AppSettings {
        return safeParse<AppSettings>(SETTINGS_KEY, {});
    },

    saveSettings(settings: AppSettings): void {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        notifyUpdate();
    },

    // ─── Data Management ───
    deleteAllData(): void {
        localStorage.removeItem(HABITS_KEY);
        localStorage.removeItem(ENTRIES_KEY);
        localStorage.removeItem(JOURNAL_KEY);
        localStorage.removeItem(SETTINGS_KEY);
        notifyUpdate();
    },

    exportData(): string {
        return JSON.stringify({
            habits: safeParse(HABITS_KEY, []),
            entries: safeParse(ENTRIES_KEY, []),
            journal: safeParse(JOURNAL_KEY, []),
            settings: safeParse(SETTINGS_KEY, {}),
        });
    },

    importData(json: string): boolean {
        try {
            const data = JSON.parse(json);
            if (data.habits) localStorage.setItem(HABITS_KEY, JSON.stringify(data.habits));
            if (data.entries) localStorage.setItem(ENTRIES_KEY, JSON.stringify(data.entries));
            if (data.journal) localStorage.setItem(JOURNAL_KEY, JSON.stringify(data.journal));
            if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
            notifyUpdate();
            return true;
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    },
};
