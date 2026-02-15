import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import Dashboard from './Dashboard';
import { habitStore } from '@/lib/state/habitStore';
import { buildDashboardSummary } from '@/lib/domain/dashboard';
import { Habit, HabitEntry } from '@/lib/domain/types';

// Mock habitStore
vi.mock('@/lib/state/habitStore', () => ({
    habitStore: {
        getHabits: vi.fn(),
        getEntries: vi.fn(),
    }
}));

describe('Dashboard', () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysAgo = (days: number): Date => {
        const date = new Date();
        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() - days);
        return date;
    };

    const habits: Habit[] = [
        {
            id: 'h1',
            title: 'Workout',
            targetDays: [0, 1, 2, 3, 4, 5, 6],
            createdAt: daysAgo(6),
        },
        {
            id: 'h2',
            title: 'Read',
            targetDays: [0, 1, 2, 3, 4, 5, 6],
            createdAt: daysAgo(6),
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(habitStore.getHabits).mockReturnValue(habits);
        vi.mocked(habitStore.getEntries).mockImplementation((habitId: string): HabitEntry[] => {
            if (habitId === 'h1') {
                return Array.from({ length: 7 }, (_, index) => ({
                    id: `h1-e${index}`,
                    habitId: 'h1',
                    completedAt: daysAgo(index),
                }));
            }

            return [];
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders dashboard summary values from seeded habits and entries', async () => {
        const seededEntries = habits.flatMap((habit) => habitStore.getEntries(habit.id));
        const expected = buildDashboardSummary(habits, seededEntries);
        const expectedSkipDay = expected.dominantSkipDay === null ? 'None' : dayNames[expected.dominantSkipDay];

        render(<Dashboard />);

        await waitFor(() => {
            const consistencyCard = screen.getByTestId('summary-consistency-card');
            const skipCard = screen.getByTestId('summary-skip-card');

            expect(consistencyCard).toHaveTextContent(`${Math.round(expected.consistency * 100)}%`);
            expect(skipCard).toHaveTextContent(expectedSkipDay);

            const fragilityCard = screen.getByTestId('summary-fragility-card');
            const recoveryCard = screen.getByTestId('summary-recovery-card');
            expect(fragilityCard).toHaveTextContent(expected.fragility.toString());
            expect(recoveryCard).toHaveTextContent(expected.recoverySpeed.toString());
            expect(recoveryCard).toHaveTextContent(/days/i);
        });
    });

    it('re-renders when entries change via state bridge update event', async () => {
        render(<Dashboard />);
        await waitFor(() => {
            const consistencyCard = screen.getByTestId('summary-consistency-card');
            expect(consistencyCard).toHaveTextContent('50%');
        });

        vi.mocked(habitStore.getEntries).mockImplementation((habitId: string): HabitEntry[] => {
            if (habitId === 'h1') {
                return [
                    { id: 'e1', habitId: 'h1', completedAt: daysAgo(0) },
                    { id: 'e2', habitId: 'h1', completedAt: daysAgo(1) },
                    { id: 'e3', habitId: 'h1', completedAt: daysAgo(2) },
                    { id: 'e4', habitId: 'h1', completedAt: daysAgo(3) },
                    { id: 'e5', habitId: 'h1', completedAt: daysAgo(4) },
                    { id: 'e6', habitId: 'h1', completedAt: daysAgo(5) },
                    { id: 'e7', habitId: 'h1', completedAt: daysAgo(6) },
                ];
            }

            if (habitId === 'h2') {
                return [
                    { id: 'e8', habitId: 'h2', completedAt: daysAgo(0) },
                    { id: 'e9', habitId: 'h2', completedAt: daysAgo(1) },
                    { id: 'e10', habitId: 'h2', completedAt: daysAgo(2) },
                    { id: 'e11', habitId: 'h2', completedAt: daysAgo(3) },
                    { id: 'e12', habitId: 'h2', completedAt: daysAgo(4) },
                    { id: 'e13', habitId: 'h2', completedAt: daysAgo(5) },
                    { id: 'e14', habitId: 'h2', completedAt: daysAgo(6) },
                ];
            }

            return [];
        });

        act(() => {
            window.dispatchEvent(new Event('habit-store-update'));
        });

        await waitFor(() => {
            const consistencyCard = screen.getByTestId('summary-consistency-card');
            const skipCard = screen.getByTestId('summary-skip-card');
            const fragilityCard = screen.getByTestId('summary-fragility-card');
            expect(consistencyCard).toHaveTextContent('100%');
            expect(skipCard).toHaveTextContent('None');
            expect(fragilityCard).toHaveTextContent('0');
        });
    });

    it('aggregates multiple habits when no habitId is provided', async () => {
        const seededEntries = habits.flatMap((habit) => habitStore.getEntries(habit.id));
        const expected = buildDashboardSummary(habits, seededEntries);

        render(<Dashboard />);

        await waitFor(() => {
            const consistencyCard = screen.getByTestId('summary-consistency-card');
            const fragilityCard = screen.getByTestId('summary-fragility-card');

            expect(consistencyCard).toHaveTextContent(`${Math.round(expected.consistency * 100)}%`);
            expect(fragilityCard).toHaveTextContent(expected.fragility.toString());
        });
    });
});
