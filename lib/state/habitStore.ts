import { Habit, HabitEntry } from '../domain/types';

const HABITS_KEY = 'habits';
const ENTRIES_KEY = 'entries';
const JOURNAL_KEY = 'journal';
const SETTINGS_KEY = 'settings';
const DAY_TASK_MARKER = 'day-task:';

export interface JournalEntry {
    date: string; // ISO date string (YYYY-MM-DD)
    content: string;
    mood?: string;
}

export interface AppSettings {
    theme?: 'light' | 'dark';
}

export interface DayTask {
    id: string;
    title: string;
    completed: boolean;
    date: string; // ISO date string (YYYY-MM-DD)
}

export interface DayTaskView {
    selectedDate: string; // ISO date string (YYYY-MM-DD)
    tasksForSelectedDay: DayTask[];
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

function fromDateKey(dateKey: string): Date | null {
    const [year, month, day] = dateKey.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function dayTaskDescription(dateKey: string): string {
    return `${DAY_TASK_MARKER}${dateKey}`;
}

function parseDayTaskDate(description?: string): string | null {
    if (!description || !description.startsWith(DAY_TASK_MARKER)) {
        return null;
    }
    return description.slice(DAY_TASK_MARKER.length);
}

function daysAgo(referenceDate: Date, days: number): Date {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() - days);
    date.setHours(12, 0, 0, 0);
    return date;
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

    getDayTasks(date: Date): DayTask[] {
        const key = toDateKey(date);
        const habits = this.getHabits().filter((habit) => parseDayTaskDate(habit.description) === key);

        return habits.map((habit) => {
            const completed = this.getEntries(habit.id).some((entry) => startOfDay(entry.completedAt) === startOfDay(date));
            return {
                id: habit.id,
                title: habit.title,
                completed,
                date: key
            };
        });
    },

    createDayTask(date: Date, title: string): DayTask {
        const normalizedDate = new Date(date);
        normalizedDate.setHours(12, 0, 0, 0);
        const dateKey = toDateKey(normalizedDate);
        const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);

        const mappedHabit: Habit = {
            id,
            title: title.trim(),
            description: dayTaskDescription(dateKey),
            targetDays: [normalizedDate.getDay()],
            createdAt: normalizedDate,
            startDate: normalizedDate,
            endDate: normalizedDate
        };

        this.updateHabit(mappedHabit);

        return {
            id,
            title: mappedHabit.title,
            completed: false,
            date: dateKey
        };
    },

    updateDayTask(
        date: Date,
        taskId: string,
        updates: Pick<Partial<DayTask>, 'title' | 'completed'>
    ): DayTask | null {
        const key = toDateKey(date);
        const habits = this.getHabits();
        const taskHabit = habits.find((habit) => habit.id === taskId && parseDayTaskDate(habit.description) === key);
        if (!taskHabit) {
            return null;
        }

        if (updates.title !== undefined) {
            this.updateHabit({
                ...taskHabit,
                title: updates.title.trim()
            });
        }

        const isCompleted = this.getEntries(taskId).some((entry) => startOfDay(entry.completedAt) === startOfDay(date));
        if (updates.completed === true && !isCompleted) {
            this.addEntry(taskId, date);
        }
        if (updates.completed === false && isCompleted) {
            this.removeEntry(taskId, date);
        }

        const refreshedHabit = this.getHabits().find((habit) => habit.id === taskId);
        const completed = this.getEntries(taskId).some((entry) => startOfDay(entry.completedAt) === startOfDay(date));
        return {
            id: taskId,
            title: refreshedHabit?.title ?? taskHabit.title,
            completed,
            date: key
        };
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
        const habits = safeParse<Habit[]>(HABITS_KEY, []);
        const entries = safeParse<HabitEntry[]>(ENTRIES_KEY, []);
        const dayTasks: DayTask[] = habits
            .filter((habit) => parseDayTaskDate(habit.description) !== null)
            .map((habit) => {
                const date = parseDayTaskDate(habit.description)!;
                const dateObj = fromDateKey(date);
                const completed = dateObj
                    ? entries.some(
                        (entry) =>
                            entry.habitId === habit.id &&
                            startOfDay(new Date(entry.completedAt)) === startOfDay(dateObj)
                    )
                    : false;

                return {
                    id: habit.id,
                    title: habit.title,
                    completed,
                    date
                };
            });

        return JSON.stringify({
            habits,
            entries,
            journal: safeParse(JOURNAL_KEY, []),
            settings: safeParse(SETTINGS_KEY, {}),
            dayTasks,
        });
    },

    importData(json: string): boolean {
        try {
            const data = JSON.parse(json);
            const habits: Habit[] = Array.isArray(data.habits) ? data.habits : [];
            const entries: HabitEntry[] = Array.isArray(data.entries) ? data.entries : [];

            if (Array.isArray(data.dayTasks)) {
                data.dayTasks.forEach((task: DayTask) => {
                    const dateObj = fromDateKey(task.date);
                    if (!dateObj) return;

                    if (!habits.some((habit) => habit.id === task.id)) {
                        habits.push({
                            id: task.id,
                            title: task.title,
                            description: dayTaskDescription(task.date),
                            targetDays: [dateObj.getDay()],
                            createdAt: dateObj,
                            startDate: dateObj,
                            endDate: dateObj
                        });
                    }

                    if (task.completed) {
                        const alreadyCompleted = entries.some(
                            (entry) =>
                                entry.habitId === task.id &&
                                startOfDay(new Date(entry.completedAt)) === startOfDay(dateObj)
                        );
                        if (!alreadyCompleted) {
                            entries.push({
                                id: `${task.id}-entry`,
                                habitId: task.id,
                                completedAt: dateObj
                            });
                        }
                    }
                });
            }

            localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
            localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
            if (data.journal) localStorage.setItem(JOURNAL_KEY, JSON.stringify(data.journal));
            if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
            notifyUpdate();
            return true;
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    },

    // Temporary development utility for realistic dashboard validation.
    seedRealisticTestData(referenceDate: Date = new Date(), force = false): boolean {
        if (process.env.NODE_ENV === 'production') {
            return false;
        }

        const hasExistingData =
            this.getHabits().length > 0 ||
            safeParse<HabitEntry[]>(ENTRIES_KEY, []).length > 0 ||
            this.getAllJournalEntries().length > 0 ||
            Object.keys(this.getSettings()).length > 0;
        if (hasExistingData && !force) {
            return false;
        }

        this.deleteAllData();

        const today = new Date(referenceDate);
        today.setHours(12, 0, 0, 0);
        const createdAt = daysAgo(today, 13);

        const habits: Habit[] = [
            {
                id: 'seed-weekdays',
                title: 'Morning Walk',
                targetDays: [1, 2, 3, 4, 5],
                createdAt
            },
            {
                id: 'seed-mwf',
                title: 'Strength Training',
                targetDays: [1, 3, 5],
                createdAt
            },
            {
                id: 'seed-weekend',
                title: 'Long Read',
                targetDays: [0, 6],
                createdAt
            }
        ];

        habits.forEach((habit) => this.updateHabit(habit));

        const completionsByHabit: Record<string, number[]> = {
            'seed-weekdays': [13, 12, 11, 9, 5, 4, 2],
            'seed-mwf': [13, 11, 6, 2],
            'seed-weekend': [7, 1]
        };

        habits.forEach((habit) => {
            const completionOffsets = completionsByHabit[habit.id] ?? [];
            completionOffsets.forEach((offset) => {
                this.addEntry(habit.id, daysAgo(today, offset));
            });
        });

        return true;
    },
};
