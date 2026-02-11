"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { habitStore, JournalEntry } from '@/lib/state/habitStore';
import { BookOpen, Smile, Meh, Frown, Sparkles } from 'lucide-react';

const MOODS = [
    { value: 'great', icon: Sparkles, label: 'Great', color: 'text-yellow-500' },
    { value: 'good', icon: Smile, label: 'Good', color: 'text-green-500' },
    { value: 'okay', icon: Meh, label: 'Okay', color: 'text-blue-500' },
    { value: 'low', icon: Frown, label: 'Low', color: 'text-gray-400' },
];

const Journal: React.FC = () => {
    const [content, setContent] = useState('');
    const [mood, setMood] = useState<string | undefined>(undefined);
    const [saved, setSaved] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const loadEntry = useCallback(() => {
        const entry = habitStore.getJournalEntry(new Date());
        if (entry) {
            setContent(entry.content);
            setMood(entry.mood);
        }
    }, []);

    useEffect(() => {
        setIsMounted(true);
        loadEntry();
    }, [loadEntry]);

    const handleSave = () => {
        habitStore.saveJournalEntry(new Date(), content, mood);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (!isMounted) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#e0e0d8] p-6 w-full">
            <h3 className="text-lg font-bold text-[#181611] mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Today's Journal
            </h3>

            {/* Mood Selector */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[#8a8060]">Mood</span>
                <div className="flex gap-1">
                    {MOODS.map(m => {
                        const Icon = m.icon;
                        const isActive = mood === m.value;
                        return (
                            <button
                                key={m.value}
                                onClick={() => setMood(mood === m.value ? undefined : m.value)}
                                className={`p-2 rounded-lg transition-all ${isActive
                                        ? 'bg-[#f5f5f0] border border-[#e0e0d8] scale-110 shadow-sm'
                                        : 'hover:bg-gray-50 border border-transparent'
                                    }`}
                                title={m.label}
                                aria-label={`Mood: ${m.label}`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? m.color : 'text-gray-300'}`} />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Text Area */}
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind today..."
                rows={5}
                className="w-full p-4 rounded-xl border border-[#e0e0d8] bg-[#fcfcfb] focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-[#181611] placeholder:text-[#c0b898]"
            />

            {/* Save Button */}
            <div className="flex justify-end mt-4">
                <button
                    onClick={handleSave}
                    disabled={!content.trim()}
                    className="px-6 py-2 bg-[#181611] text-white rounded-xl font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {saved ? '✓ Saved' : 'Save Entry'}
                </button>
            </div>
        </div>
    );
};

export default Journal;
