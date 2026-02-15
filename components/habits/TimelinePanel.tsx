"use client";

import React from "react";
import { TimelineDayStatus } from "@/lib/domain/timeline";

export interface TimelineDayItem {
  dayNumber: number;
  status: TimelineDayStatus;
}

interface TimelinePanelProps {
  items: TimelineDayItem[];
}

export default function TimelinePanel({ items }: TimelinePanelProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <h2 className="mb-6 text-xl font-semibold text-white">30-Day Challenge Timeline</h2>

      <div className="relative space-y-4">
        <div className="absolute left-[15px] top-4 h-[calc(100%-2rem)] w-px bg-white/15" />
        {items.map((item) => {
          const completed = item.status === "Completed";
          const inProgress = item.status === "In Progress";
          return (
            <div key={item.dayNumber} className="relative flex items-center gap-4">
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                  completed
                    ? "border-emerald-300 bg-emerald-500/30 text-emerald-100"
                    : inProgress
                    ? "border-blue-300 bg-blue-500/30 text-blue-100"
                    : "border-slate-400/60 bg-slate-500/20 text-slate-200"
                }`}
              >
                {item.dayNumber}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-100">Day {item.dayNumber}</span>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    completed
                      ? "bg-emerald-500/20 text-emerald-200"
                      : inProgress
                      ? "bg-amber-500/20 text-amber-200"
                      : "bg-slate-500/20 text-slate-200"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
