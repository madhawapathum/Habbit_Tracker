"use client";

import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

// Dynamic imports for Monthly Backgrounds
// We can assume we have named exports or default exports from specific files
// For now, let's just create a generic one or simple placeholders
const DefaultBackground = dynamic(() => import("./backgrounds/DefaultBackground"));

// Example of how we would map months
const JanuaryBackground = dynamic(() => import("./backgrounds/JanuaryBackground"), {
    loading: () => <div className="absolute inset-0 bg-[#121212]" />,
});

// Map 0-11 to components
const BACKGROUNDS: Record<number, any> = {
    0: JanuaryBackground,
    // Others fallback to Default
};

interface BackgroundManagerProps {
    monthIndex: number; // 0 = Jan, 1 = Feb...
}

export default function BackgroundManager({ monthIndex }: BackgroundManagerProps) {
    const Component = BACKGROUNDS[monthIndex] || DefaultBackground;

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <AnimatePresence mode="wait">
                <motion.div
                    key={monthIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                >
                    <Component />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
