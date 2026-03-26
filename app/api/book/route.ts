import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLineNotification, buildReservationMessage } from "@/lib/line";

// POST /api/book
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, startTime, endTime, name, lineName, nickname, memo = "" } = body;

    // バリデーション
    if (!date || !startTime || !endTime || !name || !lineName || !nickname) {
      return NextResponse.json(
        { error: "必須項目が不足しています（date, startTime, endTime, name, lineName, nickname）" },
        { status: 400 }
      );
    }

    // スロット存在チェック
    const schedule = await prisma.schedule.findFirst({
      where: { date, startTime },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "指定のスロットは存在しないか、受付対象外です" },
        { status: 404 }
      );
    }

    // 重複予約チェック
    const existing = await prisma.reservation.findFirst({
      where: { date, startTime },
    });

    if (existing) {
      return NextResponse.json(
        { error: "このスロットはすでに予約済みです" },
        { status: 409 }
      );
    }

    // 予約作成
    const reservation = await prisma.reservation.create({
      data: {
        date,
        startTime,
        endTime,
        name,
        lineName,
        nickname,
        memo,
      },
    });

    // LINE Push通知（失敗しても予約は成功扱い）
    const message = buildReservationMessage({
      date,
      startTime,
      endTime,
      name,
      lineName,
      nickname,
      memo,
    });
    await sendLineNotification(message);

    return NextResponse.json({ success: true, reservation }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/book]", error);
    return NextResponse.json(
      { error: "予約の登録中にサーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
