import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addEntry, getEntries, removeEntryForDay } from "@/lib/server/habitRepository";

async function getSessionUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const habitId = request.nextUrl.searchParams.get("habitId");

    if (!habitId) {
      return NextResponse.json({ error: "habitId is required" }, { status: 400 });
    }

    const entries = await getEntries(userId, habitId);
    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load entries", detail: (error as Error).message },
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
    const habitId = typeof body?.habitId === "string" ? body.habitId : "";
    const completed = Boolean(body?.completed);
    const date = new Date(body?.date);

    if (!habitId) {
      return NextResponse.json({ error: "habitId is required" }, { status: 400 });
    }

    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "valid date is required" }, { status: 400 });
    }

    const entry = await addEntry(userId, habitId, date, completed);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create entry", detail: (error as Error).message },
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

    const body = await request.json();
    const habitId = typeof body?.habitId === "string" ? body.habitId : "";
    const date = new Date(body?.date);

    if (!habitId) {
      return NextResponse.json({ error: "habitId is required" }, { status: 400 });
    }

    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "valid date is required" }, { status: 400 });
    }

    await removeEntryForDay(userId, habitId, date);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to remove entry", detail: (error as Error).message },
      { status: 500 }
    );
  }
}
