"use client";

import { useState, useEffect, useCallback } from "react";

type Schedule = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
};

type Reservation = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  name: string;
  lineName: string;
  nickname: string;
  memo: string;
};

type FormData = {
  name: string;
  lineName: string;
  nickname: string;
  memo: string;
  lineUserId: string;
};

// "YYYY-MM-DD" → "○月○日（曜日）"
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const w = weekdays[date.getDay()];
  return `${m}月${d}日（${w}）`;
}

export default function ReservationPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    lineName: "",
    nickname: "",
    memo: "",
    lineUserId: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedulesRes, reservationsRes] = await Promise.all([
        fetch("/api/schedules"),
        fetch("/api/reservations"),
      ]);
      const [schedulesData, reservationsData] = await Promise.all([
        schedulesRes.json(),
        reservationsRes.json(),
      ]);
      setSchedules(schedulesData);
      setReservations(reservationsData);
    } catch {
      setError("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // スロットが予約済みかチェック
  const isBooked = (slot: Schedule): boolean => {
    return reservations.some(
      (r) => r.date === slot.date && r.startTime === slot.startTime
    );
  };

  // 日付ごとにグループ化
  const groupedSchedules = schedules.reduce<Record<string, Schedule[]>>(
    (acc, slot) => {
      if (!acc[slot.date]) acc[slot.date] = [];
      acc[slot.date].push(slot);
      return acc;
    },
    {}
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedSlot.date,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          ...formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "予約に失敗しました");
        return;
      }

      setSuccess(true);
      setSelectedSlot(null);
      setFormData({ name: "", lineName: "", nickname: "", memo: "", lineUserId: "" });
      fetchData();
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSlotSelect = (slot: Schedule) => {
    if (isBooked(slot)) return;
    setSelectedSlot(slot);
    setSuccess(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-sky-100">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <h1 className="text-2xl font-bold text-sky-700">📅 面談予約</h1>
          <p className="text-sm text-gray-500 mt-1">
            ご希望の日時を選択して予約してください
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* 予約完了メッセージ */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-green-800">
            <p className="font-bold text-lg">✅ 予約が完了しました！</p>
            <p className="text-sm mt-1">
              ご予約ありがとうございます。LINEユーザーIDをご入力いただいた方には、確認メッセージとリマインドをLINEでお送りします。
            </p>
          </div>
        )}

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* LINE友達追加セクション */}
        <section className="bg-green-50 border border-green-200 rounded-xl p-5">
          <h2 className="text-base font-bold text-green-800 mb-1">
            📱 LINEで予約確認・リマインドを受け取る
          </h2>
          <p className="text-xs text-green-700 mb-4">
            予約前にLINEボットを友達追加してください。予約後に確認メッセージと面談1時間前のリマインドが届きます。
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* QRコード */}
            <div className="flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://qr-official.line.me/sid/L/614mxhmw.png"
                alt="LINE友達追加QRコード"
                width={120}
                height={120}
                className="rounded-lg border border-green-200"
              />
              <p className="text-xs text-gray-500 mt-1">QRコードで追加</p>
            </div>
            {/* 説明と友達追加ボタン */}
            <div className="flex-1 space-y-3">
              <a
                href="https://line.me/R/ti/p/@614mxhmw"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#06C755] hover:bg-[#05b34c] text-white font-bold py-3 px-4 rounded-xl transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M12 2C6.48 2 2 6.02 2 11c0 4.17 2.76 7.7 6.6 9.12.46.08.63-.2.63-.44v-1.55c-2.56.56-3.1-1.23-3.1-1.23-.42-1.07-1.03-1.35-1.03-1.35-.84-.57.06-.56.06-.56.93.07 1.42.96 1.42.96.83 1.41 2.17 1 2.7.77.08-.6.32-1 .59-1.23-2.05-.23-4.2-1.02-4.2-4.56 0-1.01.36-1.83.96-2.48-.1-.23-.42-1.17.09-2.44 0 0 .78-.25 2.55.95A8.84 8.84 0 0 1 12 6.8c.79 0 1.58.1 2.32.3 1.77-1.2 2.55-.95 2.55-.95.51 1.27.19 2.21.09 2.44.6.65.96 1.47.96 2.48 0 3.55-2.16 4.33-4.22 4.56.33.29.63.85.63 1.71v2.54c0 .25.17.53.64.44C19.24 18.7 22 15.17 22 11c0-4.98-4.48-9-10-9z"/>
                </svg>
                LINEで友達追加
              </a>
              <div className="bg-white border border-green-100 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-green-700">友達追加後の手順</p>
                <p>① 上のボタン or QRコードで友達追加</p>
                <p>② ボットに「こんにちは」などメッセージを送る</p>
                <p>③ ボットがあなたの<strong>ユーザーID</strong>を返信</p>
                <p>④ そのIDを下の予約フォームに貼り付け</p>
              </div>
            </div>
          </div>
        </section>

        {/* スロット選択 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            ① 日時を選択
          </h2>

          {Object.keys(groupedSchedules).length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              現在、予約可能な日程はありません
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSchedules)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, slots]) => (
                  <div
                    key={date}
                    className="bg-white rounded-xl border border-gray-200 p-4"
                  >
                    <h3 className="font-semibold text-gray-700 mb-3 text-sm">
                      {formatDate(date)}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((slot) => {
                        const booked = isBooked(slot);
                        const selected = selectedSlot?.id === slot.id;
                        return (
                          <button
                            key={slot.id}
                            onClick={() => handleSlotSelect(slot)}
                            disabled={booked}
                            className={`
                              px-4 py-2 rounded-lg text-sm font-medium transition-all border
                              ${
                                booked
                                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through"
                                  : selected
                                  ? "bg-sky-600 text-white border-sky-600 shadow-md scale-105"
                                  : "bg-white text-sky-700 border-sky-300 hover:bg-sky-50 hover:border-sky-500"
                              }
                            `}
                          >
                            {slot.startTime}〜{slot.endTime}
                            {booked && (
                              <span className="ml-1 text-xs">済</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* 予約フォーム */}
        {selectedSlot && (
          <section className="bg-white rounded-xl border border-sky-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-700 mb-1">
              ② 情報を入力
            </h2>
            <p className="text-sm text-sky-600 mb-5 font-medium">
              選択中:{" "}
              <span className="font-bold">
                {formatDate(selectedSlot.date)}{" "}
                {selectedSlot.startTime}〜{selectedSlot.endTime}
              </span>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="山田 太郎"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LINE名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lineName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lineName: e.target.value,
                    }))
                  }
                  placeholder="yamada_taro"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  オープンチャットのニックネーム{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nickname}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      nickname: e.target.value,
                    }))
                  }
                  placeholder="たろう"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                />
              </div>

              {/* LINE ユーザーID */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📱 LINE ユーザーID{" "}
                  <span className="text-gray-400 text-xs font-normal">
                    （任意）
                  </span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  入力すると、予約確認と面談1時間前のリマインドをLINEでお届けします。
                </p>
                <input
                  type="text"
                  value={formData.lineUserId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lineUserId: e.target.value,
                    }))
                  }
                  placeholder="U1234567890abcdef..."
                  className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-green-600">
                ※ ページ上部のLINEボットに友達追加後、メッセージを送るとIDが届きます
              </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メモ{" "}
                  <span className="text-gray-400 text-xs font-normal">
                    （任意）
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={formData.memo}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, memo: e.target.value }))
                  }
                  placeholder="相談内容や質問など、自由にご記入ください"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "送信中..." : "予約する"}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
