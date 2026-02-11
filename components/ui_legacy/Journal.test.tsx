import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import Journal from './Journal';
import { habitStore } from '@/lib/state/habitStore';

vi.mock('@/lib/state/habitStore', () => ({
    habitStore: {
        getJournalEntry: vi.fn(),
        saveJournalEntry: vi.fn(),
        getAllJournalEntries: vi.fn(),
    }
}));

describe('Journal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders empty state for new day', () => {
        (habitStore.getJournalEntry as any).mockReturnValue(null);
        render(<Journal />);
        expect(screen.getByPlaceholderText("What's on your mind today...")).toBeInTheDocument();
        expect(screen.getByText('Save Entry')).toBeInTheDocument();
    });

    it('loads existing entry on mount', async () => {
        (habitStore.getJournalEntry as any).mockReturnValue({
            date: '2026-02-11',
            content: 'Existing journal text',
            mood: 'good',
        });

        render(<Journal />);

        await waitFor(() => {
            const textarea = screen.getByPlaceholderText("What's on your mind today...") as HTMLTextAreaElement;
            expect(textarea.value).toBe('Existing journal text');
        });
    });

    it('saves entry via state bridge', async () => {
        (habitStore.getJournalEntry as any).mockReturnValue(null);
        render(<Journal />);

        const textarea = screen.getByPlaceholderText("What's on your mind today...");
        fireEvent.change(textarea, { target: { value: 'New journal entry' } });

        const saveBtn = screen.getByText('Save Entry');
        fireEvent.click(saveBtn);

        expect(habitStore.saveJournalEntry).toHaveBeenCalledWith(
            expect.any(Date),
            'New journal entry',
            undefined
        );
    });

    it('saves entry with mood', async () => {
        (habitStore.getJournalEntry as any).mockReturnValue(null);
        render(<Journal />);

        const textarea = screen.getByPlaceholderText("What's on your mind today...");
        fireEvent.change(textarea, { target: { value: 'Feeling great!' } });

        const moodBtn = screen.getByLabelText('Mood: Great');
        fireEvent.click(moodBtn);

        const saveBtn = screen.getByText('Save Entry');
        fireEvent.click(saveBtn);

        expect(habitStore.saveJournalEntry).toHaveBeenCalledWith(
            expect.any(Date),
            'Feeling great!',
            'great'
        );
    });
});
