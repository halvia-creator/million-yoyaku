const LINE_API_ENDPOINT = "https://api.line.me/v2/bot/message/push";

export async function sendLineNotification(message: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_USER_ID;

  if (!token || !userId) {
    console.warn(
      "[LINE] 環境変数が未設定のため通知をスキップします (LINE_CHANNEL_ACCESS_TOKEN / LINE_USER_ID)"
    );
    return;
  }

  try {
    const res = await fetch(LINE_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: "text", text: message }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[LINE] Push通知に失敗しました: ${res.status}`, body);
    } else {
      console.log("[LINE] Push通知を送信しました");
    }
  } catch (error) {
    console.error("[LINE] Push通知中にエラーが発生しました:", error);
  }
  // 通知失敗でも予約は継続するためthrowしない
}

/**
 * 予約完了通知メッセージを生成する
 */
export function buildReservationMessage(params: {
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
日時: ${dateLabel} ${params.startTime}〜${params.endTime}
名前: ${params.name}
LINE名: ${params.lineName}
ニックネーム: ${params.nickname}
メモ: ${params.memo || "なし"}`;
}
