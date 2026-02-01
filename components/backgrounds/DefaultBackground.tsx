"use client";

export default function DefaultBackground() {
    return (
        <div className="w-full h-full bg-[#121212] flex items-center justify-center">
            {/* Subtle global gradient */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#1e1e1e] to-transparent opacity-50" />
        </div>
    );
}
