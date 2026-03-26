import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 30分スロットを生成するユーティリティ
function generateSlots(
  date: string,
  startTime: string,
  endTime: string
): { date: string; startTime: string; endTime: string }[] {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;
  const slots: { date: string; startTime: string; endTime: string }[] = [];

  while (current + 30 <= end) {
    const slotStart = `${String(Math.floor(current / 60)).padStart(2, "0")}:${String(current % 60).padStart(2, "0")}`;
    const slotEnd = `${String(Math.floor((current + 30) / 60)).padStart(2, "0")}:${String((current + 30) % 60).padStart(2, "0")}`;
    slots.push({ date, startTime: slotStart, endTime: slotEnd });
    current += 30;
  }

  return slots;
}

// GET /api/schedules?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const schedules = await prisma.schedule.findMany({
    where: date ? { date } : undefined,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(schedules);
}

// POST /api/schedules  { date, startTime, endTime }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, startTime, endTime } = body;

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "date, startTime, endTime は必須です" },
        { status: 400 }
      );
    }

    // 時間の妥当性チェック
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes >= endMinutes) {
      return NextResponse.json(
        { error: "終了時刻は開始時刻より後にしてください" },
        { status: 400 }
      );
    }

    if (endMinutes - startMinutes < 30) {
      return NextResponse.json(
        { error: "30分以上の時間帯を指定してください" },
        { status: 400 }
      );
    }

    const slots = generateSlots(date, startTime, endTime);

    // 既存スロットと重複チェック
    const existing = await prisma.schedule.findMany({ where: { date } });
    const existingTimes = new Set(existing.map((s) => s.startTime));
    const newSlots = slots.filter((s) => !existingTimes.has(s.startTime));

    if (newSlots.length === 0) {
      return NextResponse.json(
        { error: "指定した時間帯のスロットはすでにすべて登録済みです" },
        { status: 409 }
      );
    }

    const created = await prisma.schedule.createMany({ data: newSlots });

    return NextResponse.json(
      {
        message: `${created.count}スロットを追加しました`,
        count: created.count,
        slots: newSlots,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/schedules]", error);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

// DELETE /api/schedules  { id }
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id は必須です" }, { status: 400 });
    }

    await prisma.schedule.delete({ where: { id: Number(id) } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/schedules]", error);
    return NextResponse.json({ error: "スロットの削除に失敗しました" }, { status: 500 });
  }
}
