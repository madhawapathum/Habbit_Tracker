import { Habit, HabitEntry } from '../domain/types';

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

interface HabitApiRecord {
    id: string;
    name: string;
    schedule: unknown;
    createdAt: string;
}

interface EntryApiRecord {
    id: string;
    habitId: string;
    date: string;
    completed: boolean;
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

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
        },
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `Request failed: ${response.status}`);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

function parseDateMaybe(value: unknown): Date | undefined {
    if (typeof value !== 'string') return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function mapHabitFromApi(record: HabitApiRecord): Habit {
    const schedule = (record.schedule && typeof record.schedule === 'object')
        ? (record.schedule as Record<string, unknown>)
        : {};

    const createdAt = parseDateMaybe(schedule.createdAt) ?? new Date(record.createdAt);
    const targetDaysRaw = schedule.targetDays;
    const targetDays = Array.isArray(targetDaysRaw)
        ? targetDaysRaw.filter((value): value is number => typeof value === 'number')
        : [];

    return {
        id: record.id,
        title: record.name,
        description: typeof schedule.description === 'string' ? schedule.description : undefined,
        targetDays,
        createdAt,
        startDate: parseDateMaybe(schedule.startDate),
        endDate: parseDateMaybe(schedule.endDate),
    };
}

function mapHabitToApi(habit: Habit): { id: string; name: string; schedule: Record<string, unknown> } {
    return {
        id: habit.id,
        name: habit.title,
        schedule: {
            description: habit.description,
            targetDays: habit.targetDays,
            createdAt: habit.createdAt.toISOString(),
            startDate: habit.startDate?.toISOString(),
            endDate: habit.endDate?.toISOString(),
        },
    };
}

function mapEntryFromApi(record: EntryApiRecord): HabitEntry {
    return {
        id: record.id,
        habitId: record.habitId,
        completedAt: new Date(record.date),
    };
}

export const habitStore = {
    // Habits
    async getHabits(): Promise<Habit[]> {
        const habits = await requestJson<HabitApiRecord[]>('/api/habits');
        return habits.map(mapHabitFromApi);
    },

    async getEntries(habitId: string): Promise<HabitEntry[]> {
        const allEntries = await requestJson<EntryApiRecord[]>(`/api/entries?habitId=${encodeURIComponent(habitId)}`);
        return allEntries
            .filter((entry) => entry.completed)
            .map(mapEntryFromApi);
    },

    async addEntry(habitId: string, completedAt: Date): Promise<void> {
        await requestJson('/api/entries', {
            method: 'POST',
            body: JSON.stringify({
                habitId,
                date: completedAt.toISOString(),
                completed: true,
            }),
        });
        notifyUpdate();
    },

    async removeEntry(habitId: string, date: Date): Promise<void> {
        await requestJson('/api/entries', {
            method: 'DELETE',
            body: JSON.stringify({
                habitId,
                date: date.toISOString(),
            }),
        });
        notifyUpdate();
    },

    async updateHabit(habit: Habit): Promise<void> {
        const payload = mapHabitToApi(habit);
        await requestJson('/api/habits', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        notifyUpdate();
    },

    // Journal
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

    async getDayTasks(date: Date): Promise<DayTask[]> {
        const key = toDateKey(date);
        const habits = (await this.getHabits()).filter((habit) => parseDayTaskDate(habit.description) === key);

        const tasks = await Promise.all(habits.map(async (habit) => {
            const completed = (await this.getEntries(habit.id)).some((entry) => startOfDay(entry.completedAt) === startOfDay(date));
            return {
                id: habit.id,
                title: habit.title,
                completed,
                date: key,
            };
        }));

        return tasks;
    },

    async createDayTask(date: Date, title: string): Promise<DayTask> {
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
            endDate: normalizedDate,
        };

        await this.updateHabit(mappedHabit);

        return {
            id,
            title: mappedHabit.title,
            completed: false,
            date: dateKey,
        };
    },

    async updateDayTask(
        date: Date,
        taskId: string,
        updates: Pick<Partial<DayTask>, 'title' | 'completed'>
    ): Promise<DayTask | null> {
        const key = toDateKey(date);
        const habits = await this.getHabits();
        const taskHabit = habits.find((habit) => habit.id === taskId && parseDayTaskDate(habit.description) === key);
        if (!taskHabit) {
            return null;
        }

        if (updates.title !== undefined) {
            await this.updateHabit({
                ...taskHabit,
                title: updates.title.trim(),
            });
        }

        const isCompleted = (await this.getEntries(taskId)).some((entry) => startOfDay(entry.completedAt) === startOfDay(date));
        if (updates.completed === true && !isCompleted) {
            await this.addEntry(taskId, date);
        }
        if (updates.completed === false && isCompleted) {
            await this.removeEntry(taskId, date);
        }

        const refreshedHabit = (await this.getHabits()).find((habit) => habit.id === taskId);
        const completed = (await this.getEntries(taskId)).some((entry) => startOfDay(entry.completedAt) === startOfDay(date));
        return {
            id: taskId,
            title: refreshedHabit?.title ?? taskHabit.title,
            completed,
            date: key,
        };
    },

    // Settings
    getSettings(): AppSettings {
        return safeParse<AppSettings>(SETTINGS_KEY, {});
    },

    saveSettings(settings: AppSettings): void {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        notifyUpdate();
    },

    // Data Management
    async deleteAllData(): Promise<void> {
        await requestJson('/api/habits', {
            method: 'DELETE',
        });

        localStorage.removeItem(JOURNAL_KEY);
        localStorage.removeItem(SETTINGS_KEY);
        notifyUpdate();
    },

    async exportData(): Promise<string> {
        const habits = await this.getHabits();
        const entries = (await Promise.all(habits.map((habit) => this.getEntries(habit.id)))).flat();

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
                    date,
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

    async importData(json: string): Promise<boolean> {
        try {
            const data = JSON.parse(json);
            const habits: Habit[] = Array.isArray(data.habits) ? data.habits.map((habit: Habit) => ({
                ...habit,
                createdAt: new Date(habit.createdAt),
                startDate: habit.startDate ? new Date(habit.startDate) : undefined,
                endDate: habit.endDate ? new Date(habit.endDate) : undefined,
            })) : [];
            const entries: HabitEntry[] = Array.isArray(data.entries) ? data.entries.map((entry: HabitEntry) => ({
                ...entry,
                completedAt: new Date(entry.completedAt),
            })) : [];

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
                            endDate: dateObj,
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
                                completedAt: dateObj,
                            });
                        }
                    }
                });
            }

            await this.deleteAllData();
            for (const habit of habits) {
                await this.updateHabit(habit);
            }
            for (const entry of entries) {
                await this.addEntry(entry.habitId, new Date(entry.completedAt));
            }

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
    async seedRealisticTestData(referenceDate: Date = new Date(), force = false): Promise<boolean> {
        if (process.env.NODE_ENV === 'production') {
            return false;
        }

        const hasExistingData =
            (await this.getHabits()).length > 0 ||
            this.getAllJournalEntries().length > 0 ||
            Object.keys(this.getSettings()).length > 0;
        if (hasExistingData && !force) {
            return false;
        }

        await this.deleteAllData();

        const today = new Date(referenceDate);
        today.setHours(12, 0, 0, 0);
        const createdAt = daysAgo(today, 13);

        const habits: Habit[] = [
            {
                id: 'seed-weekdays',
                title: 'Morning Walk',
                targetDays: [1, 2, 3, 4, 5],
                createdAt,
            },
            {
                id: 'seed-mwf',
                title: 'Strength Training',
                targetDays: [1, 3, 5],
                createdAt,
            },
            {
                id: 'seed-weekend',
                title: 'Long Read',
                targetDays: [0, 6],
                createdAt,
            },
        ];

        for (const habit of habits) {
            await this.updateHabit(habit);
        }

        const completionsByHabit: Record<string, number[]> = {
            'seed-weekdays': [13, 12, 11, 9, 5, 4, 2],
            'seed-mwf': [13, 11, 6, 2],
            'seed-weekend': [7, 1],
        };

        for (const habit of habits) {
            const completionOffsets = completionsByHabit[habit.id] ?? [];
            for (const offset of completionOffsets) {
                await this.addEntry(habit.id, daysAgo(today, offset));
            }
        }

        return true;
    },
};
