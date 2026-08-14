// =============================================================
// shift-scheduler-demo デモデータ
// - 営業デモ用の架空データ。実在の事業者・人物とは無関係
// - 日付は index.html 側で「今日」を基準に動的生成する
//   (requests の day は「来月の日にち」を表す)
// - file:// で動作させるため fetch は使わず <script src> で読み込む
// =============================================================

const DEMO_DATA = {
  tenant: { name: "株式会社あおばフーズ&ビューティー" },

  // 全店舗に効く共通設定（オーナー画面の「共通設定」で編集する）
  //
  // 【休憩の決まり方は2層】
  //   1. パターンに休憩が設定されていれば、それを使う（パターン編集の「手動◯分」）
  //   2. 設定が無ければ（「自動」）、下の breakTiers（段階制ルール）で決まる
  //   ※雇用形態ごとの既定休憩は廃止。雇用形態が持つのは「実働時間」だけ
  //
  // employmentDefaults: 雇用形態ごとの既定「実働」時間（分）。自動生成の1コマの長さに使う
  //   拘束時間 = 実働 + 段階制ルールで決まる休憩（例: 実働8h → 休憩45分 → 拘束8時間45分）
  //
  // breakTiers: 休憩の段階制ルール（拘束時間 → 休憩分）。上から順に判定する
  //   労基法34条は「実働6時間超で45分以上／8時間超で60分以上」。
  //   実働8h＋休憩45分＝拘束8時間45分 が境目になるので、拘束時間で同じ判定ができる
  //   法令の数字はハードコードせず設定値として持つ（改正に追従できるようにするため）
  //
  // fuyou.limitYen: 扶養の上限額（年間）。基準額は改正が続いているため設定値にする
  settings: {
    employmentDefaults: {
      "店長":   { workMin: 480 },
      "社員":   { workMin: 480 },
      "パート": { workMin: 300 },
      "学生":   { workMin: 240 }
    },
    breakTiers: [
      { spanMaxMin: 360,  breakMin: 0  },   // 拘束6時間以下 → 休憩なし
      { spanMaxMin: 525,  breakMin: 45 },   // 拘束8時間45分以下 → 休憩45分
      { spanMaxMin: null, breakMin: 60 }    // それを超える → 休憩60分
    ],
    fuyou: { limitYen: 1230000 }
  },

  // ロール定義（権限の段）。level が大きいほど上位で、上位は下位の権限をすべて含む
  //   Lv1=スタッフ（自分のシフト・希望提出）／Lv2=シフト編集／Lv3=シフト公開／
  //   Lv4=時給・扶養の閲覧／Lv5=マスタ管理・他店舗閲覧
  // Lv2・Lv3 は空の段。クライアントが「副店長」などのロールをここに挿して使う
  // 既定3ロールの id は users[].role の文字列と同値（既存データをそのまま使うため）
  roles: [
    { id: "staff",   name: "スタッフ", level: 1 },
    { id: "manager", name: "店長",     level: 4 },
    { id: "owner",   name: "オーナー", level: 5 }
  ],

  // patternIds: この店舗で使うシフトパターン（共通設定で1セット定義し、店舗ごとに選ぶ）
  // 自由時間制（mode:"free"）の店舗でもパターンを使える（あてはめてから時刻を微調整できる）
  stores: [
    { id: 1, name: "本店（サロン）", mode: "free",    color: "#7A6FF0", patternIds: [3, 5] },
    { id: 2, name: "駅前店",         mode: "pattern", color: "#E8833A", patternIds: [1, 2] },
    { id: 3, name: "モール店",       mode: "pattern", color: "#2FA36B", patternIds: [3, 4] }
  ],

  // シフトパターンは全店共通の1セット。名前は自由入力（A/B/C や 早番/遅番 など）
  // start〜end は拘束時間。breakMin はその休憩（実働 = 拘束 − 休憩）
  // breakMin: 数値 = 手動指定（0分も明示できる）／ null = 自動（settings.breakTiers で決まる）
  patterns: [
    { id: 1, name: "早番", start: "09:00", end: "17:00", breakMin: 60,   color: "#F2B441" },
    { id: 2, name: "遅番", start: "13:00", end: "21:00", breakMin: 60,   color: "#4A90D9" },
    { id: 3, name: "中番", start: "10:00", end: "18:00", breakMin: 60,   color: "#58B368" },
    { id: 4, name: "夜番", start: "14:00", end: "22:00", breakMin: 60,   color: "#8A63C9" },
    // 「自動」の例（拘束8時間 → 段階制ルールで休憩45分）。商談で2層の説明に使える
    { id: 5, name: "遅め", start: "11:00", end: "19:00", breakMin: null, color: "#D96E9A" }
  ],

  // オーナー1名 + 各店5名（店長1・社員1・パート/学生3）= 計16名
  // weeklyMaxDays: 週の最大勤務日数（月〜日で数える）
  // availableDays: 出勤可能曜日（未指定は全曜日可）
  // --- 扶養計算用（個人設定で編集できる） ---
  // wage:       時給（円）。社員・店長は月給想定のため持たせない＝扶養計算の対象外
  // dependent:  true=扶養内（計算・警告の対象） / false=扶養外（対象外）
  //             未指定のときは 社員・店長・オーナー＝扶養外、それ以外＝扶養内 として扱う
  // ytdAvgYen:  年初からの1か月あたりの平均支給額（架空値）。
  //             「年初〜先月の累計額」は index.html 側で ytdAvgYen ×（今月の前月までの月数）で
  //             生成する。デモの日付が今日基準なので、累計もいつ開いても自然な額になる
  users: [
    { id: 1,  name: "高橋 誠",   role: "owner",   type: "オーナー" },

    { id: 2,  name: "佐藤 美咲", role: "manager", storeId: 1, type: "店長" },
    { id: 3,  name: "田中 優奈", role: "staff",   storeId: 1, type: "社員" },
    { id: 4,  name: "鈴木 恵子", role: "staff",   storeId: 1, type: "パート", weeklyMaxDays: 3,
      wage: 1180, dependent: true,  ytdAvgYen:  76000 },
    // 山本 典子: 1〜7月に人手不足で多めに入っていた想定＝このままだと扶養の上限を超える人
    { id: 5,  name: "山本 典子", role: "staff",   storeId: 1, type: "パート", weeklyMaxDays: 4,
      wage: 1250, dependent: true,  ytdAvgYen: 155000 },
    { id: 6,  name: "中村 莉子", role: "staff",   storeId: 1, type: "学生",   availableDays: ["wed", "fri", "sat", "sun"],
      wage: 1120, dependent: true,  ytdAvgYen:  74000 },

    { id: 7,  name: "伊藤 大輔", role: "manager", storeId: 2, type: "店長" },
    { id: 8,  name: "渡辺 健太", role: "staff",   storeId: 2, type: "社員" },
    { id: 9,  name: "小林 幸子", role: "staff",   storeId: 2, type: "パート", weeklyMaxDays: 3,
      wage: 1150, dependent: true,  ytdAvgYen:  84000 },
    { id: 10, name: "加藤 翔太", role: "staff",   storeId: 2, type: "学生",   availableDays: ["mon", "thu", "sat", "sun"],
      wage: 1100, dependent: true,  ytdAvgYen:  71000 },
    { id: 11, name: "吉田 美月", role: "staff",   storeId: 2, type: "学生",   availableDays: ["tue", "fri", "sat", "sun"],
      wage: 1100, dependent: true,  ytdAvgYen:  69000 },

    { id: 12, name: "松本 香織", role: "manager", storeId: 3, type: "店長" },
    { id: 13, name: "井上 拓海", role: "staff",   storeId: 3, type: "社員" },
    // 木村 由美: 上限に近づいている人（警告は出ないが残額が少ない）
    { id: 14, name: "木村 由美", role: "staff",   storeId: 3, type: "パート", weeklyMaxDays: 3,
      wage: 1300, dependent: true,  ytdAvgYen: 128000 },
    { id: 15, name: "林 さゆり", role: "staff",   storeId: 3, type: "パート", weeklyMaxDays: 4,
      wage: 1200, dependent: true,  ytdAvgYen: 104000 },
    { id: 16, name: "清水 陽太", role: "staff",   storeId: 3, type: "学生",   availableDays: ["wed", "sat", "sun"],
      wage: 1150, dependent: true,  ytdAvgYen:  63000 }
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
    // patternRatio はパターンID をキーにする（共通設定で名前を変えても崩れないため）
    2: {
      monthlyDaysOff: 8, maxConsecutive: 5,
      weekdayHeadcount: 2, weekendHeadcount: 3,
      patternRatio: { 1: 50, 2: 50 }        // 早番50% / 遅番50%
    },
    3: {
      monthlyDaysOff: 9, maxConsecutive: 4,
      weekdayHeadcount: 2, weekendHeadcount: 3,
      patternRatio: { 3: 60, 4: 40 }        // 中番60% / 夜番40%
    }
  },

  // 来月分の希望（day = 来月の日にち）。提出済み(submitted)状態で投入する
  // 店舗のモードに合わせる: 自由時間制→ day_off / time / any、パターン制→ day_off / pattern
  // day_off（希望休）は1人あたり月3日まで（index.html の MAX_DAY_OFF）。
  //   ここに4日以上入れると初期状態が上限違反になるので増やさないこと
  // paid_leave（有給）は上限の対象外・自動生成の対象外（別枠で扱う）
  requests: [
    { storeId: 1, userId: 3,  day: 5,  type: "day_off" },
    { storeId: 1, userId: 4,  day: 12, type: "time", start: "10:00", end: "15:00" },
    // 鈴木 恵子は希望休を上限いっぱい(3日)提出済み＝4日目が止まることをデモできる
    { storeId: 1, userId: 4,  day: 4,  type: "day_off" },
    { storeId: 1, userId: 4,  day: 13, type: "day_off" },
    { storeId: 1, userId: 4,  day: 22, type: "day_off" },
    { storeId: 1, userId: 5,  day: 8,  type: "any" },
    { storeId: 1, userId: 5,  day: 18, type: "paid_leave" },
    { storeId: 1, userId: 6,  day: 20, type: "day_off" },

    { storeId: 2, userId: 8,  day: 3,  type: "day_off" },
    { storeId: 2, userId: 8,  day: 19, type: "paid_leave" },
    { storeId: 2, userId: 9,  day: 15, type: "pattern", patternId: 1 },  // 早番
    { storeId: 2, userId: 10, day: 22, type: "day_off" },
    { storeId: 2, userId: 11, day: 10, type: "pattern", patternId: 2 },  // 遅番

    { storeId: 3, userId: 13, day: 7,  type: "day_off" },
    { storeId: 3, userId: 13, day: 12, type: "paid_leave" },
    { storeId: 3, userId: 14, day: 14, type: "pattern", patternId: 3 },  // 中番
    { storeId: 3, userId: 15, day: 25, type: "pattern", patternId: 4 },  // 夜番
    { storeId: 3, userId: 16, day: 21, type: "day_off" }
  ]
};
