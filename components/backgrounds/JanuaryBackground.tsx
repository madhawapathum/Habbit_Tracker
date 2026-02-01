"use client";

import { motion } from "framer-motion";

export default function JanuaryBackground() {
    return (
        <div className="w-full h-full bg-[#121212] relative overflow-hidden">
            {/* Winter/New Year Vibes - animated subtle snowflakes or sparkles */}
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute bg-white rounded-full opacity-20"
                    style={{
                        width: Math.random() * 4 + 1 + "px",
                        height: Math.random() * 4 + 1 + "px",
                        left: Math.random() * 100 + "%",
                        top: -10,
                    }}
                    animate={{
                        y: ["0vh", "100vh"],
                        x: [0, (Math.random() - 0.5) * 50],
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        ease: "linear",
                        delay: Math.random() * 10,
                    }}
                />
            ))}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#0f172a] to-[#121212] opacity-80" />
        </div>
    );
}
