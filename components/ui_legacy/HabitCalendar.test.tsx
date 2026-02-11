import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import HabitCalendar from './HabitCalendar';
import { habitStore } from '@/lib/state/habitStore';

// Mock habitStore
vi.mock('@/lib/state/habitStore', () => ({
    habitStore: {
        getEntries: vi.fn(),
        addEntry: vi.fn(),
        removeEntry: vi.fn(),
        updateHabit: vi.fn(),
        getHabits: vi.fn(),
    }
}));

describe('HabitCalendar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly with 0 streak', () => {
        (habitStore.getEntries as any).mockReturnValue([]);
        render(<HabitCalendar habitId="test-habit" />);
        expect(screen.getByText(/0 Day Streak/i)).toBeInTheDocument();
        // Since button text depends on state, and state is empty -> "Mark Today Complete"
        expect(screen.getByText('Mark Today Complete')).toBeInTheDocument();
    });

    it('renders streak based on stored entries', async () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Mock entries: yesterday and today (to test streak calculation logic indirectly via component display)
        // If only yesterday is done: Streak 1 (assuming CLEAN/FRACTURED logic)
        (habitStore.getEntries as any).mockReturnValue([
            { id: '1', habitId: 'test-habit', completedAt: yesterday }
        ]);

        render(<HabitCalendar habitId="test-habit" />);

        // Wait for entries to load/render
        await waitFor(() => {
            expect(habitStore.getEntries).toHaveBeenCalledWith('test-habit');
        });

        // Streak logic in domain/streak.ts:
        // If yesterday completed -> CLEAN, streak 1.
        expect(screen.getByText(/1 Day Streak/i)).toBeInTheDocument();
    });

    it('toggles today completion', async () => {
        (habitStore.getEntries as any).mockReturnValue([]);
        render(<HabitCalendar habitId="test-habit" />);

        const button = screen.getByText('Mark Today Complete');
        fireEvent.click(button);

        expect(habitStore.addEntry).toHaveBeenCalledWith('test-habit', expect.any(Date));
    });

    it('toggles off if already completed', async () => {
        const today = new Date();
        (habitStore.getEntries as any).mockReturnValue([
            { id: '1', habitId: 'test-habit', completedAt: today }
        ]);

        render(<HabitCalendar habitId="test-habit" />);

        await waitFor(() => {
            expect(screen.getByText('Completed Today')).toBeInTheDocument();
        });

        const button = screen.getByText('Completed Today');
        fireEvent.click(button);

        expect(habitStore.removeEntry).toHaveBeenCalledWith('test-habit', expect.any(Date));
    });
});
