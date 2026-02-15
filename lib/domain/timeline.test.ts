import { describe, expect, it } from "vitest";
import { buildThirtyDayTimeline, resolveTimelineDayStatus } from "./timeline";

describe("timeline helper", () => {
  it("returns Completed when tasks exist and all are completed", () => {
    const status = resolveTimelineDayStatus([
      { completed: true },
      { completed: true },
    ]);

    expect(status).toBe("Completed");
  });

  it("returns In Progress when tasks exist and only some are completed", () => {
    const status = resolveTimelineDayStatus([
      { completed: true },
      { completed: false },
    ]);

    expect(status).toBe("In Progress");
  });

  it("returns Empty when no tasks exist", () => {
    const status = resolveTimelineDayStatus([]);

    expect(status).toBe("Empty");
  });

  it("builds timeline day statuses from day views", () => {
    const timeline = buildThirtyDayTimeline([
      {
        selectedDate: "2024-05-01",
        tasksForSelectedDay: [{ completed: true }, { completed: true }],
      },
      {
        selectedDate: "2024-05-02",
        tasksForSelectedDay: [{ completed: true }, { completed: false }],
      },
      {
        selectedDate: "2024-05-03",
        tasksForSelectedDay: [],
      },
    ]);

    expect(timeline).toEqual([
      { dayNumber: 1, status: "Completed" },
      { dayNumber: 2, status: "In Progress" },
      { dayNumber: 3, status: "Empty" },
    ]);
  });
});
