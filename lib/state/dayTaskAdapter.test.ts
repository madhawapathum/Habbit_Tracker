import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deriveDayTaskView } from './dayTaskAdapter';
import { habitStore } from './habitStore';

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
    },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'window', { value: { localStorage: localStorageMock, dispatchEvent: vi.fn() } });

if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => `test-uuid-${Math.random()}`,
    },
  });
}

describe('dayTaskAdapter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates tasks for a selected date', () => {
    const selectedDate = new Date('2026-02-15T12:00:00.000Z');
    habitStore.createDayTask(selectedDate, 'Review sprint board');
    habitStore.createDayTask(selectedDate, 'Write standup notes');

    const snapshot = JSON.parse(habitStore.exportData());
    const view = deriveDayTaskView(selectedDate, snapshot);

    expect(view.selectedDate).toBe('2026-02-15');
    expect(view.tasksForSelectedDay).toHaveLength(2);
    expect(view.tasksForSelectedDay.map((task) => task.title)).toEqual([
      'Review sprint board',
      'Write standup notes',
    ]);
    expect(view.tasksForSelectedDay.every((task) => task.completed === false)).toBe(true);
  });

  it('edits tasks for a selected date', () => {
    const selectedDate = new Date('2026-02-15T12:00:00.000Z');
    const created = habitStore.createDayTask(selectedDate, 'Draft weekly summary');

    const updated = habitStore.updateDayTask(selectedDate, created.id, {
      title: 'Draft and send weekly summary',
      completed: true,
    });

    expect(updated).not.toBeNull();

    const snapshot = JSON.parse(habitStore.exportData());
    const view = deriveDayTaskView(selectedDate, snapshot);
    expect(view.tasksForSelectedDay).toHaveLength(1);
    expect(view.tasksForSelectedDay[0].title).toBe('Draft and send weekly summary');
    expect(view.tasksForSelectedDay[0].completed).toBe(true);
  });

  it('does not include tasks from another date', () => {
    const firstDate = new Date('2026-02-15T12:00:00.000Z');
    const secondDate = new Date('2026-02-16T12:00:00.000Z');

    habitStore.createDayTask(firstDate, 'Task for first date');
    habitStore.createDayTask(secondDate, 'Task for second date');

    const snapshot = JSON.parse(habitStore.exportData());
    const firstView = deriveDayTaskView(firstDate, snapshot);
    const secondView = deriveDayTaskView(secondDate, snapshot);

    expect(firstView.tasksForSelectedDay).toHaveLength(1);
    expect(firstView.tasksForSelectedDay[0].title).toBe('Task for first date');
    expect(secondView.tasksForSelectedDay).toHaveLength(1);
    expect(secondView.tasksForSelectedDay[0].title).toBe('Task for second date');
  });
});
