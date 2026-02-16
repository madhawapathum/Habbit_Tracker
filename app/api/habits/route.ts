import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createHabit,
  deleteAllHabitsForUser,
  deleteHabit,
  getHabits,
  updateHabit,
} from "@/lib/server/habitRepository";

async function getSessionUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const habits = await getHabits(userId);
    return NextResponse.json(habits);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load habits", detail: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id : undefined;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const schedule = body?.schedule;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    if (schedule === undefined) {
      return NextResponse.json({ error: "schedule is required" }, { status: 400 });
    }

    let habit;
    if (id) {
      try {
        habit = await updateHabit(userId, id, { name, schedule });
      } catch {
        habit = await createHabit(userId, { id, name, schedule });
      }
    } else {
      habit = await createHabit(userId, { name, schedule });
    }

    return NextResponse.json(habit, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create habit", detail: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");

    if (id) {
      await deleteHabit(userId, id);
      return NextResponse.json({ ok: true });
    }

    await deleteAllHabitsForUser(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete habits", detail: (error as Error).message },
      { status: 500 }
    );
  }
}
