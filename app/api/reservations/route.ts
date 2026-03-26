import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reservations
export async function GET() {
  const reservations = await prisma.reservation.findMany({
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(reservations);
}

// DELETE /api/reservations  { id }
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id は必須です" }, { status: 400 });
    }

    await prisma.reservation.delete({ where: { id: Number(id) } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/reservations]", error);
    return NextResponse.json(
      { error: "予約のキャンセルに失敗しました" },
      { status: 500 }
    );
  }
}
