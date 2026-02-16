"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { habitStore, AppSettings } from '@/lib/state/habitStore';
import { Settings2, Trash2, Download, Upload, Moon, Sun } from 'lucide-react';

const Settings: React.FC = () => {
    const [settings, setSettings] = useState<AppSettings>({});
    const [showConfirm, setShowConfirm] = useState(false);
    const [importStatus, setImportStatus] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadSettings = useCallback(() => {
        setSettings(habitStore.getSettings());
    }, []);

    useEffect(() => {
        setIsMounted(true);
        loadSettings();

        const handleUpdate = () => loadSettings();
        window.addEventListener('habit-store-update', handleUpdate);
        return () => window.removeEventListener('habit-store-update', handleUpdate);
    }, [loadSettings]);

    const handleClearAll = async () => {
        await habitStore.deleteAllData();
        setShowConfirm(false);
    };

    const handleThemeToggle = () => {
        const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
        const updated = { ...settings, theme: newTheme as 'light' | 'dark' };
        habitStore.saveSettings(updated);
        setSettings(updated);
    };

    const handleExport = async () => {
        const data = await habitStore.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const json = event.target?.result as string;
            const success = await habitStore.importData(json);
            setImportStatus(success ? 'Import successful!' : 'Import failed. Invalid file.');
            setTimeout(() => setImportStatus(null), 3000);
        };
        reader.readAsText(file);
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (!isMounted) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#e0e0d8] p-6 w-full">
            <h3 className="text-lg font-bold text-[#181611] mb-6 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                Settings
            </h3>

            <div className="space-y-4">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-4 bg-[#fcfcfb] rounded-xl border border-[#ebebe8]">
                    <div className="flex items-center gap-3">
                        {settings.theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
                        <span className="font-semibold text-[#181611]">Theme</span>
                    </div>
                    <button
                        onClick={handleThemeToggle}
                        className="px-4 py-1.5 rounded-lg border border-[#e0e0d8] text-sm font-medium hover:bg-gray-50 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {settings.theme === 'dark' ? 'Dark' : 'Light'}
                    </button>
                </div>

                {/* Export */}
                <button
                    onClick={handleExport}
                    className="w-full flex items-center gap-3 p-4 bg-[#fcfcfb] rounded-xl border border-[#ebebe8] hover:bg-gray-50 transition-colors"
                >
                    <Download className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold text-[#181611]">Export Data</span>
                </button>

                {/* Import */}
                <label className="w-full flex items-center gap-3 p-4 bg-[#fcfcfb] rounded-xl border border-[#ebebe8] hover:bg-gray-50 transition-colors cursor-pointer">
                    <Upload className="w-5 h-5 text-green-500" />
                    <span className="font-semibold text-[#181611]">Import Data</span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                    />
                </label>
                {importStatus && (
                    <p className={`text-sm font-medium px-4 ${importStatus.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>
                        {importStatus}
                    </p>
                )}

                {/* Danger Zone */}
                <div className="pt-4 border-t border-[#ebebe8]">
                    {!showConfirm ? (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="w-full flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200 hover:bg-red-100 transition-colors"
                        >
                            <Trash2 className="w-5 h-5 text-red-500" />
                            <span className="font-semibold text-red-700">Clear All Data</span>
                        </button>
                    ) : (
                        <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-3">
                            <p className="text-sm text-red-700 font-medium">This will permanently delete all habits, entries, journal, and settings. Are you sure?</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleClearAll}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                                >
                                    Yes, Delete Everything
                                </button>
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="px-4 py-2 bg-white border border-[#e0e0d8] rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
