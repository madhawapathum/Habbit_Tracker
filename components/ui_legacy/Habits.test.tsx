import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import Habits from './Habits';
import { habitStore } from '@/lib/state/habitStore';
import * as streakDomain from '@/lib/domain/streak';

// Mock habitStore
vi.mock('@/lib/state/habitStore', () => ({
    habitStore: {
        getHabits: vi.fn(),
        getEntries: vi.fn(),
        addEntry: vi.fn(),
        removeEntry: vi.fn(),
        updateHabit: vi.fn(),
    }
}));

// Mock domain logic
vi.mock('@/lib/domain/streak', () => ({
    calculateCurrentStreak: vi.fn(),
}));

describe('Habits', () => {
    const mockHabit = {
        id: 'test-habit',
        title: 'Test Habit',
        targetDays: [0, 1, 2, 3, 4, 5, 6],
        createdAt: new Date(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (habitStore.getHabits as any).mockReturnValue([mockHabit]);
        (habitStore.getEntries as any).mockReturnValue([]);
        (streakDomain.calculateCurrentStreak as any).mockReturnValue({
            value: 0,
            displayCount: 0,
            status: 'RESET'
        });
    });

    it('renders list of habits', async () => {
        render(<Habits />);
        await waitFor(() => {
            expect(screen.getByText('Test Habit')).toBeInTheDocument();
        });
    });

    it('adds a new habit', async () => {
        render(<Habits />);

        const input = screen.getByPlaceholderText('New habit name...');
        fireEvent.change(input, { target: { value: 'New Habit' } });

        const button = screen.getByLabelText('Add Habit');
        fireEvent.click(button);

        expect(habitStore.updateHabit).toHaveBeenCalledWith(expect.objectContaining({
            title: 'New Habit'
        }));
    });

    it('toggles today completion', async () => {
        render(<Habits />);

        await waitFor(() => expect(screen.getByText('Test Habit')).toBeInTheDocument());

        const toggleButton = screen.getByLabelText('Mark Test Habit complete');
        fireEvent.click(toggleButton);

        expect(habitStore.addEntry).toHaveBeenCalledWith('test-habit', expect.any(Date));
    });

    it('removing completion if already done', async () => {
        const today = new Date();
        (habitStore.getEntries as any).mockReturnValue([
            { id: 'entry-1', habitId: 'test-habit', completedAt: today }
        ]);

        render(<Habits />);

        await waitFor(() => expect(screen.getByText('Test Habit')).toBeInTheDocument());

        const toggleButton = screen.getByLabelText('Mark Test Habit complete');
        fireEvent.click(toggleButton);

        expect(habitStore.removeEntry).toHaveBeenCalledWith('test-habit', expect.any(Date));
    });
});
