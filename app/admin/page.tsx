"use client";

import { useState, useEffect, useCallback } from "react";

type Reservation = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  name: string;
  lineName: string;
  nickname: string;
  memo: string;
  createdAt: string;
};

type Schedule = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
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

type Tab = "reservations" | "schedules";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("reservations");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loadingRes, setLoadingRes] = useState(true);
  const [loadingSch, setLoadingSch] = useState(true);

  // スケジュール追加フォーム
  const [newDate, setNewDate] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [addingSchedule, setAddingSchedule] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ログアウト
  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.href = "/admin/login";
  };

  const fetchReservations = useCallback(async () => {
    setLoadingRes(true);
    try {
      const res = await fetch("/api/reservations");
      setReservations(await res.json());
    } finally {
      setLoadingRes(false);
    }
  }, []);

  const fetchSchedules = useCallback(async () => {
    setLoadingSch(true);
    try {
      const res = await fetch("/api/schedules");
      setSchedules(await res.json());
    } finally {
      setLoadingSch(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
    fetchSchedules();
  }, [fetchReservations, fetchSchedules]);

  // 予約キャンセル
  const handleCancelReservation = async (id: number, info: string) => {
    if (!confirm(`以下の予約をキャンセルしますか？\n${info}`)) return;
    try {
      const res = await fetch("/api/reservations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchReservations();
      } else {
        alert("キャンセルに失敗しました");
      }
    } catch {
      alert("エラーが発生しました");
    }
  };

  // スケジュール追加
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newStart || !newEnd) return;
    setAddingSchedule(true);
    setScheduleMsg(null);
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newDate,
          startTime: newStart,
          endTime: newEnd,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setScheduleMsg({ type: "success", text: data.message });
        setNewDate("");
        setNewStart("");
        setNewEnd("");
        fetchSchedules();
      } else {
        setScheduleMsg({ type: "error", text: data.error });
      }
    } catch {
      setScheduleMsg({ type: "error", text: "エラーが発生しました" });
    } finally {
      setAddingSchedule(false);
    }
  };

  // スロット削除
  const handleDeleteSlot = async (id: number, label: string) => {
    if (!confirm(`スロット「${label}」を削除しますか？`)) return;
    try {
      const res = await fetch("/api/schedules", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchSchedules();
      } else {
        alert("削除に失敗しました");
      }
    } catch {
      alert("エラーが発生しました");
    }
  };

  // 日付ごとにグループ化
  const groupedSchedules = schedules.reduce<Record<string, Schedule[]>>(
    (acc, s) => {
      if (!acc[s.date]) acc[s.date] = [];
      acc[s.date].push(s);
      return acc;
    },
    {}
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">⚙️ 管理画面</h1>
            <p className="text-xs text-gray-400 mt-0.5">Narrow 面談予約システム</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 border border-gray-300 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            ログアウト
          </button>
        </div>
      </header>

      {/* タブ */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("reservations")}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "reservations"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            予約一覧{" "}
            <span className="ml-1 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
              {reservations.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("schedules")}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "schedules"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            スケジュール管理{" "}
            <span className="ml-1 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
              {schedules.length}
            </span>
          </button>
        </div>

        {/* 予約一覧タブ */}
        {activeTab === "reservations" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-700">
                予約一覧
              </h2>
              <button
                onClick={fetchReservations}
                className="text-xs text-indigo-600 hover:underline"
              >
                更新
              </button>
            </div>

            {loadingRes ? (
              <div className="text-gray-400 py-8 text-center">読み込み中...</div>
            ) : reservations.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                予約はありません
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                          日時
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                          名前
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                          LINE名
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                          ニックネーム
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                          メモ
                        </th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reservations.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-medium">
                            <div>{formatDate(r.date)}</div>
                            <div className="text-xs text-gray-400">
                              {r.startTime}〜{r.endTime}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                            {r.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                            {r.lineName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                            {r.nickname}
                          </td>
                          <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                            {r.memo || (
                              <span className="text-gray-300">なし</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() =>
                                handleCancelReservation(
                                  r.id,
                                  `${formatDate(r.date)} ${r.startTime}〜${r.endTime} / ${r.name}`
                                )
                              }
                              className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2.5 py-1 rounded-md transition-colors"
                            >
                              キャンセル
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* スケジュール管理タブ */}
        {activeTab === "schedules" && (
          <section className="space-y-6">
            {/* 追加フォーム */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-700 mb-4">
                スロットを追加
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                日付と時間帯を設定すると、30分単位のスロットが自動生成されます
                <br />
                例: 12:00〜16:00 → 12:00, 12:30, 13:00 ... 15:30 の8スロット
              </p>

              {scheduleMsg && (
                <div
                  className={`mb-4 rounded-lg px-4 py-3 text-sm border ${
                    scheduleMsg.type === "success"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {scheduleMsg.type === "success" ? "✅ " : "⚠️ "}
                  {scheduleMsg.text}
                </div>
              )}

              <form
                onSubmit={handleAddSchedule}
                className="flex flex-wrap gap-3 items-end"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    日付 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    開始時刻 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    終了時刻 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingSchedule}
                  className="py-2 px-5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {addingSchedule ? "追加中..." : "スロット追加"}
                </button>
              </form>
            </div>

            {/* 設定済みスケジュール */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-700">
                  設定済みスロット
                </h2>
                <button
                  onClick={fetchSchedules}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  更新
                </button>
              </div>

              {loadingSch ? (
                <div className="text-gray-400 py-8 text-center">読み込み中...</div>
              ) : Object.keys(groupedSchedules).length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                  スロットがありません。上のフォームから追加してください。
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedSchedules)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, slots]) => (
                      <div
                        key={date}
                        className="bg-white rounded-xl border border-gray-200 p-4"
                      >
                        <h3 className="font-semibold text-gray-700 text-sm mb-3">
                          {formatDate(date)}
                          <span className="ml-2 text-xs text-gray-400 font-normal">
                            {slots.length}スロット
                          </span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {slots.map((slot) => (
                            <div
                              key={slot.id}
                              className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5"
                            >
                              <span className="text-sm text-indigo-700 font-medium">
                                {slot.startTime}〜{slot.endTime}
                              </span>
                              <button
                                onClick={() =>
                                  handleDeleteSlot(
                                    slot.id,
                                    `${formatDate(slot.date)} ${slot.startTime}〜${slot.endTime}`
                                  )
                                }
                                className="text-indigo-300 hover:text-red-500 transition-colors ml-1 text-xs font-bold"
                                title="削除"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </section>
        )}

        <div className="h-12" />
      </div>
    </div>
  );
}
