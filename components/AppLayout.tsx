"use client";

import React from 'react';

interface AppLayoutProps {
    children: React.ReactNode;
}

/**
 * AppLayout
 * A clean, full-screen shell ready for a new UI direction.
 */
const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    return (
        <div className="w-screen h-screen bg-background-light dark:bg-background-dark overflow-hidden flex flex-col">
            {/* Redesign placeholder or future navigation can go here */}
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    );
};

export default AppLayout;
