import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import Dashboard from './Dashboard';
import { habitStore } from '@/lib/state/habitStore';
import * as historyDomain from '@/lib/domain/history';

// Mock habitStore
vi.mock('@/lib/state/habitStore', () => ({
    habitStore: {
        getHabits: vi.fn(),
        getEntries: vi.fn(),
    }
}));

// Mock domain logic
vi.mock('@/lib/domain/history', () => ({
    analyzeBehavioralPatterns: vi.fn(),
}));

describe('Dashboard', () => {
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
    });

    it('renders behavioral metrics correctly', async () => {
        // Mock domain output
        (historyDomain.analyzeBehavioralPatterns as any).mockReturnValue({
            habitId: 'test-habit',
            consistencyScore: 0.85,
            fragilityScore: 0.12,
            dominantSkipDays: [1, 5], // Monday, Friday
            averageRecoveryTime: 2.4,
        });

        render(<Dashboard habitId="test-habit" />);

        await waitFor(() => {
            expect(screen.getByText('85%')).toBeInTheDocument(); // Consistency
            expect(screen.getByText('0.12')).toBeInTheDocument(); // Fragility
            expect(screen.getByText('Mon, Fri')).toBeInTheDocument(); // Skip Days
            expect(screen.getByText(/2.4/)).toBeInTheDocument(); // Recovery
        });
    });

    it('updates when storage changes', async () => {
        // Initial state
        (historyDomain.analyzeBehavioralPatterns as any).mockReturnValue({
            habitId: 'test-habit',
            consistencyScore: 0.5,
            fragilityScore: 0.5,
            dominantSkipDays: [],
            averageRecoveryTime: 0,
        });

        const { rerender } = render(<Dashboard habitId="test-habit" />);
        await waitFor(() => expect(screen.getByText('50%')).toBeInTheDocument());

        // Update state
        (historyDomain.analyzeBehavioralPatterns as any).mockReturnValue({
            habitId: 'test-habit',
            consistencyScore: 0.9, // Changed
            fragilityScore: 0.5,
            dominantSkipDays: [],
            averageRecoveryTime: 0,
        });

        // Trigger event
        act(() => {
            window.dispatchEvent(new Event('habit-store-update'));
        });

        await waitFor(() => {
            expect(screen.getByText('90%')).toBeInTheDocument();
        });
    });

    it('handles missing habit gracefully', () => {
        (habitStore.getHabits as any).mockReturnValue([]); // No habits
        const { container } = render(<Dashboard habitId="missing-habit" />);
        expect(container).toBeEmptyDOMElement();
    });
});
