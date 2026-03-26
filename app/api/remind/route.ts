import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLineToUser, buildReminderMessage } from "@/lib/line";

/**
 * GET /api/remind
 * 1時間後に始まる面談の予約者にLINEリマインドを送る。
 * cron-job.org などから5分ごとに呼び出す。
 *
 * セキュリティ: ?secret=YOUR_REMIND_SECRET または
 * Authorization: Bearer YOUR_REMIND_SECRET ヘッダーで保護。
 */
export async function GET(request: NextRequest) {
  // シークレット検証
  const secret = process.env.REMIND_SECRET;
  if (secret) {
    const querySecret = request.nextUrl.searchParams.get("secret");
    const authHeader = request.headers.get("authorization");
    const bearerSecret = authHeader?.replace("Bearer ", "");
    if (querySecret !== secret && bearerSecret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // 現在のJST時刻を取得（UTCに+9時間）
    const utcNow = new Date();
    const jstNow = new Date(utcNow.getTime() + 9 * 60 * 60 * 1000);

    // 50〜70分後の時間帯（±10分の余裕を持って1時間前を検知）
    const windowStart = new Date(jstNow.getTime() + 50 * 60 * 1000);
    const windowEnd = new Date(jstNow.getTime() + 70 * 60 * 1000);

    // 対象日付（日付をまたぐ場合も考慮）
    const targetDates = Array.from(
      new Set(
        [windowStart, windowEnd].map((d) => {
          const y = d.getUTCFullYear();
          const m = String(d.getUTCMonth() + 1).padStart(2, "0");
          const day = String(d.getUTCDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        })
      )
    );

    // 未送信・lineUserIdあり・対象日付の予約を取得
    const candidates = await prisma.reservation.findMany({
      where: {
        date: { in: targetDates },
        reminded: false,
        lineUserId: { not: "" },
      },
    });

    // 時間帯でフィルタリング
    const toRemind = candidates.filter((r) => {
      const [h, m] = r.startTime.split(":").map(Number);
      const [year, month, dayNum] = r.date.split("-").map(Number);
      // JST時刻として扱い、UTCのDate objectを作る
      const reservationJst = new Date(
        Date.UTC(year, month - 1, dayNum, h, m, 0)
      );
      return reservationJst >= windowStart && reservationJst <= windowEnd;
    });

    if (toRemind.length === 0) {
      return NextResponse.json({
        sent: 0,
        message: "リマインド対象の予約はありません",
      });
    }

    // リマインド送信 & reminded フラグ更新
    const results = await Promise.allSettled(
      toRemind.map(async (r) => {
        const msg = buildReminderMessage({
          date: r.date,
          startTime: r.startTime,
          endTime: r.endTime,
          name: r.name,
          nickname: r.nickname,
        });
        await sendLineToUser(r.lineUserId, msg);
        await prisma.reservation.update({
          where: { id: r.id },
          data: { reminded: true },
        });
        return r.id;
      })
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    console.log(`[remind] ${succeeded}/${toRemind.length} 件のリマインドを送信`);

    return NextResponse.json({
      sent: succeeded,
      total: toRemind.length,
      message: `${succeeded}件のリマインドを送信しました`,
    });
  } catch (error) {
    console.error("[GET /api/remind]", error);
    return NextResponse.json(
      { error: "リマインド処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
