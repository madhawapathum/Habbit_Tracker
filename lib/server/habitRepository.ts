import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";

export type CreateHabitData = {
  id?: string;
  name: string;
  schedule: Prisma.InputJsonValue;
};

export type UpdateHabitData = Partial<CreateHabitData>;

export async function getHabits(userId: string) {
  return prisma.habit.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getEntries(userId: string, habitId: string) {
  return prisma.entry.findMany({
    where: {
      habitId,
      habit: { userId },
    },
    orderBy: { date: "desc" },
  });
}

export async function createHabit(userId: string, data: CreateHabitData) {
  return prisma.habit.create({
    data: {
      ...(data.id ? { id: data.id } : {}),
      name: data.name,
      schedule: data.schedule,
      userId,
    },
  });
}

export async function addEntry(userId: string, habitId: string, date: Date, completed: boolean) {
  const habit = await prisma.habit.findFirst({
    where: {
      id: habitId,
      userId,
    },
    select: { id: true },
  });

  if (!habit) {
    throw new Error("Habit not found");
  }

  return prisma.entry.create({
    data: {
      habitId,
      date,
      completed,
    },
  });
}

export async function removeEntryForDay(userId: string, habitId: string, date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return prisma.entry.deleteMany({
    where: {
      habitId,
      habit: { userId },
      date: {
        gte: start,
        lt: end,
      },
    },
  });
}

export async function updateHabit(userId: string, habitId: string, data: UpdateHabitData) {
  const habit = await prisma.habit.findFirst({
    where: {
      id: habitId,
      userId,
    },
    select: { id: true },
  });

  if (!habit) {
    throw new Error("Habit not found");
  }

  return prisma.habit.update({
    where: { id: habitId },
    data,
  });
}

export async function deleteHabit(userId: string, habitId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.entry.deleteMany({
      where: {
        habitId,
        habit: { userId },
      },
    });

    return tx.habit.deleteMany({
      where: {
        id: habitId,
        userId,
      },
    });
  });
}

export async function deleteAllHabitsForUser(userId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.entry.deleteMany({
      where: {
        habit: {
          userId,
        },
      },
    });

    return tx.habit.deleteMany({
      where: { userId },
    });
  });
}
