// =============================================================
// shift-scheduler-demo デモデータ
// - 営業デモ用の架空データ。実在の事業者・人物とは無関係
// - 日付は index.html 側で「今日」を基準に動的生成する
//   (requests の day は「来月の日にち」を表す)
// - file:// で動作させるため fetch は使わず <script src> で読み込む
// =============================================================

const DEMO_DATA = {
  tenant: { name: "株式会社あおばフーズ&ビューティー" },

  stores: [
    { id: 1, name: "本店（サロン）", mode: "free",    color: "#7A6FF0" },
    { id: 2, name: "駅前店",         mode: "pattern", color: "#E8833A" },
    { id: 3, name: "モール店",       mode: "pattern", color: "#2FA36B" }
  ],

  patterns: [
    { id: 1, storeId: 2, name: "早番", start: "09:00", end: "17:00", color: "#F2B441" },
    { id: 2, storeId: 2, name: "遅番", start: "13:00", end: "21:00", color: "#4A90D9" },
    { id: 3, storeId: 3, name: "早番", start: "10:00", end: "18:00", color: "#F2B441" },
    { id: 4, storeId: 3, name: "遅番", start: "14:00", end: "22:00", color: "#4A90D9" }
  ],

  // オーナー1名 + 各店5名（店長1・社員1・パート/学生3）= 計16名
  // weeklyMaxDays: 週の最大勤務日数（月〜日で数える）
  // availableDays: 出勤可能曜日（未指定は全曜日可）
  users: [
    { id: 1,  name: "高橋 誠",   role: "owner",   type: "オーナー" },

    { id: 2,  name: "佐藤 美咲", role: "manager", storeId: 1, type: "店長" },
    { id: 3,  name: "田中 優奈", role: "staff",   storeId: 1, type: "社員" },
    { id: 4,  name: "鈴木 恵子", role: "staff",   storeId: 1, type: "パート", weeklyMaxDays: 3 },
    { id: 5,  name: "山本 典子", role: "staff",   storeId: 1, type: "パート", weeklyMaxDays: 4 },
    { id: 6,  name: "中村 莉子", role: "staff",   storeId: 1, type: "学生",   availableDays: ["wed", "fri", "sat", "sun"] },

    { id: 7,  name: "伊藤 大輔", role: "manager", storeId: 2, type: "店長" },
    { id: 8,  name: "渡辺 健太", role: "staff",   storeId: 2, type: "社員" },
    { id: 9,  name: "小林 幸子", role: "staff",   storeId: 2, type: "パート", weeklyMaxDays: 3 },
    { id: 10, name: "加藤 翔太", role: "staff",   storeId: 2, type: "学生",   availableDays: ["mon", "thu", "sat", "sun"] },
    { id: 11, name: "吉田 美月", role: "staff",   storeId: 2, type: "学生",   availableDays: ["tue", "fri", "sat", "sun"] },

    { id: 12, name: "松本 香織", role: "manager", storeId: 3, type: "店長" },
    { id: 13, name: "井上 拓海", role: "staff",   storeId: 3, type: "社員" },
    { id: 14, name: "木村 由美", role: "staff",   storeId: 3, type: "パート", weeklyMaxDays: 3 },
    { id: 15, name: "林 さゆり", role: "staff",   storeId: 3, type: "パート", weeklyMaxDays: 4 },
    { id: 16, name: "清水 陽太", role: "staff",   storeId: 3, type: "学生",   availableDays: ["wed", "sat", "sun"] }
  ],

  // 店舗ごとのシフト条件（自動生成・人員不足判定に使用）
  conditions: {
    1: {
      monthlyDaysOff: 8, maxConsecutive: 5,
      weekdayHeadcount: 2, weekendHeadcount: 3,
      hourlyHeadcount: [
        { from: "10:00", to: "13:00", count: 1 },
        { from: "13:00", to: "19:00", count: 2 }
      ]
    },
    2: {
      monthlyDaysOff: 8, maxConsecutive: 5,
      weekdayHeadcount: 2, weekendHeadcount: 3,
      patternRatio: { "早番": 50, "遅番": 50 }
    },
    3: {
      monthlyDaysOff: 9, maxConsecutive: 4,
      weekdayHeadcount: 2, weekendHeadcount: 3,
      patternRatio: { "早番": 60, "遅番": 40 }
    }
  },

  // 来月分の希望（day = 来月の日にち）。提出済み(submitted)状態で投入する
  // 店舗のモードに合わせる: 自由時間制→ day_off / time / any、パターン制→ day_off / pattern
  requests: [
    { storeId: 1, userId: 3,  day: 5,  type: "day_off" },
    { storeId: 1, userId: 4,  day: 12, type: "time", start: "10:00", end: "15:00" },
    { storeId: 1, userId: 5,  day: 8,  type: "any" },
    { storeId: 1, userId: 6,  day: 20, type: "day_off" },

    { storeId: 2, userId: 8,  day: 3,  type: "day_off" },
    { storeId: 2, userId: 9,  day: 15, type: "pattern", patternId: 1 },
    { storeId: 2, userId: 10, day: 22, type: "day_off" },
    { storeId: 2, userId: 11, day: 10, type: "pattern", patternId: 2 },

    { storeId: 3, userId: 13, day: 7,  type: "day_off" },
    { storeId: 3, userId: 14, day: 14, type: "pattern", patternId: 3 },
    { storeId: 3, userId: 15, day: 25, type: "pattern", patternId: 4 },
    { storeId: 3, userId: 16, day: 21, type: "day_off" }
  ]
};
