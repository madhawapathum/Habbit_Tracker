import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import Settings from './Settings';
import { habitStore } from '@/lib/state/habitStore';

vi.mock('@/lib/state/habitStore', () => ({
    habitStore: {
        getSettings: vi.fn(),
        saveSettings: vi.fn(),
        deleteAllData: vi.fn(),
        exportData: vi.fn(),
        importData: vi.fn(),
    }
}));

describe('Settings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (habitStore.getSettings as any).mockReturnValue({});
        (habitStore.deleteAllData as any).mockResolvedValue(undefined);
        (habitStore.exportData as any).mockResolvedValue('{"habits":[],"entries":[],"journal":[],"settings":{}}');
        (habitStore.importData as any).mockResolvedValue(true);
    });

    it('renders all settings options', () => {
        render(<Settings />);
        expect(screen.getByText('Theme')).toBeInTheDocument();
        expect(screen.getByText('Export Data')).toBeInTheDocument();
        expect(screen.getByText('Import Data')).toBeInTheDocument();
        expect(screen.getByText('Clear All Data')).toBeInTheDocument();
    });

    it('calls deleteAllData on confirm', async () => {
        render(<Settings />);

        fireEvent.click(screen.getByText('Clear All Data'));
        await waitFor(() => expect(screen.getByText('Yes, Delete Everything')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Yes, Delete Everything'));

        expect(habitStore.deleteAllData).toHaveBeenCalled();
    });

    it('exports data as JSON', async () => {
        // Save original createElement and mock only the anchor
        const origCreateElement = document.createElement.bind(document);
        const clickMock = vi.fn();
        const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
            if (tag === 'a') {
                return { href: '', download: '', click: clickMock } as any;
            }
            return origCreateElement(tag);
        });

        const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
        const mockRevokeObjectURL = vi.fn();
        global.URL.createObjectURL = mockCreateObjectURL;
        global.URL.revokeObjectURL = mockRevokeObjectURL;

        render(<Settings />);
        fireEvent.click(screen.getByText('Export Data'));

        await waitFor(() => {
            expect(habitStore.exportData).toHaveBeenCalled();
            expect(clickMock).toHaveBeenCalled();
        });

        // Restore to prevent pollution
        createElementSpy.mockRestore();
    });

    it('toggles theme setting', () => {
        (habitStore.getSettings as any).mockReturnValue({ theme: 'light' });
        render(<Settings />);

        fireEvent.click(screen.getByLabelText('Toggle theme'));

        expect(habitStore.saveSettings).toHaveBeenCalledWith(
            expect.objectContaining({ theme: 'dark' })
        );
    });

    it('imports data from file', async () => {
        render(<Settings />);

        const jsonData = '{"habits":[],"entries":[]}';
        const file = new File([jsonData], 'backup.json', { type: 'application/json' });

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(habitStore.importData).toHaveBeenCalled();
        });
    });
});
