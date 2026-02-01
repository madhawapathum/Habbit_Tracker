"use client";

import { motion, AnimatePresence } from "framer-motion";

interface CelebrationProps {
    show: boolean;
}

export default function Celebration({ show }: CelebrationProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999] bg-black/40 flex justify-center items-center pointer-events-none"
                >
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 1 }}
                        exit={{ scale: 1, opacity: 0 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="text-6xl md:text-8xl font-extrabold text-[#eab308] drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]"
                    >
                        Excellent! 🎉
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
