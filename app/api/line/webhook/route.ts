import { NextRequest, NextResponse } from "next/server";
import { replyLine } from "@/lib/line";

/**
 * POST /api/line/webhook
 * LINEからのWebhookを受け取る。
 * ユーザーがボットにメッセージを送ると、そのユーザーIDを返信する。
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const events = body.events ?? [];

    for (const event of events) {
      // メッセージイベントのみ処理
      if (event.type !== "message") continue;

      const userId: string = event.source?.userId ?? "";
      const replyToken: string = event.replyToken ?? "";

      if (!userId || !replyToken) continue;

      // ユーザーIDを返信
      const replyText = `あなたのLINEユーザーIDは：

${userId}

このIDをコピーして、予約フォームの「LINE ユーザーID」欄に貼り付けてください。予約するとLINEで確認メッセージと面談前のリマインドが届きます📅`;

      await replyLine(replyToken, replyText);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/line/webhook]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
