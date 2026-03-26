const LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";
const LINE_REPLY_ENDPOINT = "https://api.line.me/v2/bot/message/reply";

const ZOOM_INFO = `━━━━━━━━━━━━━
📹 Zoom ミーティングに参加する
https://zoom.us/j/98532737495?pwd=aQdiI4nylzFNbyndieSkuhixqJaz8k.1

ミーティング ID: 985 3273 7495
パスコード: 654916
━━━━━━━━━━━━━`;

/** 任意のユーザーIDへLINEを送る共通関数 */
async function pushLine(to: string, text: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || !to) return;

  try {
    const res = await fetch(LINE_PUSH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to,
        messages: [{ type: "text", text }],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[LINE] Push失敗 to=${to}: ${res.status}`, body);
    } else {
      console.log(`[LINE] Push送信完了 to=${to}`);
    }
  } catch (error) {
    console.error("[LINE] Pushエラー:", error);
  }
}

/** Webhookへの返信 */
export async function replyLine(replyToken: string, text: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || !replyToken) return;

  try {
    const res = await fetch(LINE_REPLY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: "text", text }],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[LINE] Reply失敗: ${res.status}`, body);
    }
  } catch (error) {
    console.error("[LINE] Replyエラー:", error);
  }
}

/** 管理者（自分）へ予約通知を送る */
export async function sendLineNotification(message: string): Promise<void> {
  const userId = process.env.LINE_USER_ID;
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !userId) {
    console.warn("[LINE] 環境変数が未設定のため管理者通知をスキップ");
    return;
  }
  await pushLine(userId, message);
}

/** 予約者へ確認メッセージを送る */
export async function sendLineToUser(
  lineUserId: string,
  message: string
): Promise<void> {
  if (!lineUserId) return;
  await pushLine(lineUserId, message);
}

// ─── メッセージ生成 ───────────────────────────────────────────

/** 管理者向け：予約が入った通知 */
export function buildAdminNotificationMessage(params: {
  date: string;
  startTime: string;
  endTime: string;
  name: string;
  lineName: string;
  nickname: string;
  memo: string;
}): string {
  const [, month, day] = params.date.split("-");
  const dateLabel = `${Number(month)}月${Number(day)}日`;

  return `【面談予約が入りました】
📅 ${dateLabel} ${params.startTime}〜${params.endTime}
👤 名前: ${params.name}
📱 LINE名: ${params.lineName}
🏷️ ニックネーム: ${params.nickname}
📝 メモ: ${params.memo || "なし"}`;
}

/** 予約者向け：予約確認メッセージ（Zoom情報付き） */
export function buildUserConfirmationMessage(params: {
  date: string;
  startTime: string;
  endTime: string;
  name: string;
  nickname: string;
}): string {
  const [, month, day] = params.date.split("-");
  const dateLabel = `${Number(month)}月${Number(day)}日`;

  return `【面談予約確認】
${params.name}様、ご予約ありがとうございます！

📅 日時: ${dateLabel} ${params.startTime}〜${params.endTime}
👤 名前: ${params.name}
🏷️ ニックネーム: ${params.nickname}

${ZOOM_INFO}

お時間になりましたらZoomにご参加ください。
面談の1時間前にリマインドをお送りします。`;
}

/** 予約者向け：リマインドメッセージ */
export function buildReminderMessage(params: {
  date: string;
  startTime: string;
  endTime: string;
  name: string;
  nickname: string;
}): string {
  const [, month, day] = params.date.split("-");
  const dateLabel = `${Number(month)}月${Number(day)}日`;

  return `【面談リマインド】
${params.name}様、本日の面談まであと1時間です！

📅 ${dateLabel} ${params.startTime}〜${params.endTime}

${ZOOM_INFO}

準備ができましたらZoomにご参加ください！`;
}

// 後方互換のためのエイリアス
export const buildReservationMessage = buildAdminNotificationMessage;
