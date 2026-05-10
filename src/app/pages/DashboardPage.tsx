import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useApp } from "../contexts/AppContext";
import { useT } from "../i18n/translations";
import { TransactionModal } from "../components/TransactionModal";
import { format, subDays, startOfDay, isAfter } from "date-fns";

const COLORS = [
  "#8b5cf6",
  "#10b981",
  "#f43f5e",
  "#f59e0b",
  "#60a5fa",
  "#a78bfa",
  "#34d399",
  "#fb7185",
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="liquid-glass dark:bg-popover px-3 py-2 rounded-xl shadow-xl border-0"
      style={{ fontSize: "0.8rem" }}
    >
      <p className="text-muted-foreground mb-0.5">{label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} style={{ color: e.color, fontWeight: 600 }}>
          {fmt(e.value)}
        </p>
      ))}
    </div>
  );
};

const PieTip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="liquid-glass dark:bg-popover px-3 py-2 rounded-xl shadow-xl border-0"
      style={{ fontSize: "0.8rem" }}
    >
      <p className="text-foreground font-semibold">{payload[0].name}</p>
      <p style={{ color: payload[0].payload.fill }}>{fmt(payload[0].value)}</p>
    </div>
  );
};

export function DashboardPage() {
  const { currentUser, getUserTransactions, getBalance, language } = useApp();
  const t = useT(language);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"income" | "spending">("income");
  const [showBalance, setShowBalance] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "all">("month");
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const all = getUserTransactions();
  const balance = getBalance();

  const filtered = all.filter((tx) => {
    if (period === "all") return true;
    return isAfter(
      new Date(tx.date),
      subDays(new Date(), period === "week" ? 7 : 30),
    );
  });

  const totalIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalSpending = filtered
    .filter((t) => t.type === "spending")
    .reduce((s, t) => s + t.amount, 0);

  /* balance timeline – last 14 days */
  const timeline = Array.from({ length: 14 }, (_, i) => {
    const day = subDays(new Date(), 13 - i);
    const bal = all
      .filter((t) => !isAfter(new Date(t.date), startOfDay(day)))
      .reduce((s, t) => (t.type === "income" ? s + t.amount : s - t.amount), 0);
    return { date: format(day, "MMM d"), balance: Math.max(0, bal) };
  });

  /* spending by reason */
  const spendMap: Record<string, number> = {};
  filtered
    .filter((t) => t.type === "spending")
    .forEach((t) => {
      spendMap[t.reason] = (spendMap[t.reason] || 0) + t.amount;
    });
  const spendData = Object.entries(spendMap)
    .map(([n, v]) => ({ name: n, value: v }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  /* income by reason */
  const incMap: Record<string, number> = {};
  filtered
    .filter((t) => t.type === "income")
    .forEach((t) => {
      incMap[t.reason] = (incMap[t.reason] || 0) + t.amount;
    });
  const incData = Object.entries(incMap)
    .map(([n, v]) => ({ name: n, value: v }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const recent = [...all]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 6);

  /* AI */
  /* AI Request to Django Backend */
  const fetchAI = useCallback(async () => {
    if (all.length === 0) return;

    setAiLoading(true);
    try {
      const token = localStorage.getItem("access");
      const res = await fetch("http://127.0.0.1:8000/api/ai-tips/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.tip) {
        setAiText(data.tip);
      } else {
        setAiText(data.error || "Ошибка получения совета.");
      }
    } catch {
      setAiText("Нет связи с сервером AI.");
    }
    setAiLoading(false);
  }, [all.length]); // Следим только за изменением количества транзакций

  // Единый и чистый useEffect для вызова AI
  useEffect(() => {
    if (all.length > 0) {
      fetchAI();
    }
  }, [fetchAI, all.length]);

  const openModal = (type: "income" | "spending") => {
    setModalType(type);
    setModalOpen(true);
  };

  const cardCls = "liquid-glass rounded-2xl";

  return (
    <div className="p-4 lg:p-6 2xl:p-10 space-y-5 2xl:space-y-7">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1
            className="text-foreground"
            style={{ fontSize: "1.4rem", fontWeight: 700 }}
          >
            {language === "ru"
              ? "Добрый день"
              : language === "uzb"
                ? "Xayrli kun"
                : "Good day"}
            , <span className="text-primary">{currentUser?.firstName}</span>
          </h1>
          <p
            className="text-muted-foreground mt-0.5"
            style={{ fontSize: "0.8rem" }}
          >
            {new Date().toLocaleDateString(
              language === "ru"
                ? "ru-RU"
                : language === "uzb"
                  ? "uz-UZ"
                  : "en-US",
              {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              },
            )}
          </p>
        </div>
        <div className="flex bg-white/30 dark:bg-muted rounded-xl p-1 gap-1 self-start sm:self-auto backdrop-blur-sm border border-white/40 dark:border-border">
          {(["week", "month", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg transition-all ${period === p ? "bg-white/70 dark:bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              style={{ fontSize: "0.78rem", fontWeight: 500 }}
            >
              {p === "week"
                ? t("thisWeek")
                : p === "month"
                  ? t("thisMonth")
                  : t("allTime")}
            </button>
          ))}
        </div>
      </div>

      {/* Balance + Stats + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 2xl:gap-5">
        {/* Balance card */}
        <div
          className={`lg:col-span-2 ${cardCls} p-5 sm:p-6 2xl:p-8 relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-primary/8 blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-muted-foreground"
                style={{
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {t("totalBalance")}
              </span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                {showBalance ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>
            <div
              className="text-foreground mt-1"
              style={{
                fontSize: "2.6rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {showBalance ? fmt(balance) : "••••••"}
            </div>
            <div
              className={`flex items-center gap-1 mt-2.5 ${totalIncome >= totalSpending ? "text-income" : "text-spending"}`}
              style={{ fontSize: "0.82rem" }}
            >
              {totalIncome >= totalSpending ? (
                <ArrowUpRight size={15} />
              ) : (
                <ArrowDownRight size={15} />
              )}
              <span>
                {fmt(Math.abs(totalIncome - totalSpending))}{" "}
                {period === "week" ? t("thisWeek") : t("thisMonth")}
              </span>
            </div>
            {/* Mini chart */}
            <div className="mt-5 h-24 sm:h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timeline}
                  margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#8b5cf6"
                        stopOpacity={0.28}
                      />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fill="url(#bg)"
                    dot={false}
                  />
                  <Tooltip content={<ChartTip />} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Income / Spending mini cards */}
          <div className={`${cardCls} p-4 flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-xl bg-income/12 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={18} className="text-income" />
            </div>
            <div>
              <p
                className="text-muted-foreground"
                style={{
                  fontSize: "0.68rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {t("income")}
              </p>
              <p
                className="text-income"
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {showBalance ? fmt(totalIncome) : "••••"}
              </p>
            </div>
          </div>
          <div className={`${cardCls} p-4 flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-xl bg-spending/12 flex items-center justify-center flex-shrink-0">
              <TrendingDown size={18} className="text-spending" />
            </div>
            <div>
              <p
                className="text-muted-foreground"
                style={{
                  fontSize: "0.68rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {t("spending")}
              </p>
              <p
                className="text-spending"
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {showBalance ? fmt(totalSpending) : "••••"}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => openModal("income")}
              className={`${cardCls} flex flex-col items-center justify-center gap-2 p-4 border-income/20 hover:border-income/40 group transition-all duration-200`}
            >
              <div className="w-10 h-10 rounded-full bg-income/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus size={18} className="text-income" />
              </div>
              <span
                className="text-income"
                style={{ fontSize: "0.72rem", fontWeight: 600 }}
              >
                {t("quickIncome")}
              </span>
            </button>
            <button
              onClick={() => openModal("spending")}
              className={`${cardCls} flex flex-col items-center justify-center gap-2 p-4 border-spending/20 hover:border-spending/40 group transition-all duration-200`}
            >
              <div className="w-10 h-10 rounded-full bg-spending/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Minus size={18} className="text-spending" />
              </div>
              <span
                className="text-spending"
                style={{ fontSize: "0.72rem", fontWeight: 600 }}
              >
                {t("quickSpending")}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 2xl:gap-5">
        {/* Spending pie */}
        <div className={`${cardCls} p-5`}>
          <h3
            className="text-foreground mb-4"
            style={{ fontSize: "0.95rem", fontWeight: 600 }}
          >
            {t("spendingByCategory")}
          </h3>
          {spendData.length === 0 ? (
            <div
              className="h-44 flex items-center justify-center text-muted-foreground"
              style={{ fontSize: "0.85rem" }}
            >
              {t("noChartData")}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-40 w-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendData}
                      innerRadius={44}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {spendData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5 w-full">
                {spendData.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span
                        className="text-muted-foreground truncate"
                        style={{ fontSize: "0.78rem" }}
                      >
                        {item.name}
                      </span>
                    </div>
                    <span
                      className="text-foreground flex-shrink-0"
                      style={{ fontSize: "0.78rem", fontWeight: 600 }}
                    >
                      {fmt(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Income bar */}
        <div className={`${cardCls} p-5`}>
          <h3
            className="text-foreground mb-4"
            style={{ fontSize: "0.95rem", fontWeight: 600 }}
          >
            {t("incomeBySource")}
          </h3>
          {incData.length === 0 ? (
            <div
              className="h-44 flex items-center justify-center text-muted-foreground"
              style={{ fontSize: "0.85rem" }}
            >
              {t("noChartData")}
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={incData}
                  margin={{ top: 0, right: 0, left: -22, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTip />} />
                  <Bar
                    dataKey="value"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={44}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* AI + Recent */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 2xl:gap-5">
        {/* AI card */}
        <div className={`${cardCls} p-5 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                <Sparkles size={14} className="text-primary" />
              </div>
              <h3
                className="text-foreground"
                style={{ fontSize: "0.95rem", fontWeight: 600 }}
              >
                {t("aiRecommendation")}
              </h3>
            </div>
            {/* Кнопка обновления появляется, если есть хоть 1 транзакция */}
            {all.length > 0 && (
              <button
                onClick={fetchAI}
                disabled={aiLoading}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/20 dark:hover:bg-muted transition-all"
              >
                <RefreshCw
                  size={13}
                  className={aiLoading ? "animate-spin" : ""}
                />
              </button>
            )}
          </div>

          <div className="relative z-10">
            {all.length === 0 ? (
              <p
                className="text-muted-foreground"
                style={{ fontSize: "0.85rem" }}
              >
                {t("aiNoData")}
              </p>
            ) : aiLoading ? (
              <div className="space-y-2">
                <div className="h-3.5 bg-white/30 dark:bg-muted rounded-lg animate-pulse" />
                <div className="h-3.5 bg-white/30 dark:bg-muted rounded-lg animate-pulse w-3/4" />
                <div className="h-3.5 bg-white/30 dark:bg-muted rounded-lg animate-pulse w-1/2" />
              </div>
            ) : aiText ? (
              <p
                className="text-foreground leading-relaxed"
                style={{ fontSize: "0.9rem" }}
              >
                {aiText}
              </p>
            ) : (
              <button
                onClick={fetchAI}
                className="w-full py-3 rounded-xl border border-primary/25 text-primary hover:bg-primary/10 transition-all"
                style={{ fontSize: "0.85rem" }}
              >
                Анализировать расходы
              </button>
            )}
          </div>
        </div>
        {/* Recent transactions */}
        <div className={`${cardCls} p-5`}>
          <h3
            className="text-foreground mb-4"
            style={{ fontSize: "0.95rem", fontWeight: 600 }}
          >
            {t("recentTransactions")}
          </h3>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="w-10 h-10 rounded-full bg-white/30 dark:bg-muted flex items-center justify-center">
                <TrendingUp size={17} className="text-muted-foreground" />
              </div>
              <p
                className="text-muted-foreground"
                style={{ fontSize: "0.85rem" }}
              >
                {t("noTransactions")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/20 dark:hover:bg-muted/40 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === "income" ? "bg-income/12" : "bg-spending/12"}`}
                  >
                    {tx.type === "income" ? (
                      <TrendingUp size={13} className="text-income" />
                    ) : (
                      <TrendingDown size={13} className="text-spending" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-foreground truncate"
                      style={{ fontSize: "0.85rem", fontWeight: 500 }}
                    >
                      {tx.reason || tx.category}
                    </p>
                    <p
                      className="text-muted-foreground flex gap-2"
                      style={{ fontSize: "0.72rem" }}
                    >
                      <span className="text-purple-400">{tx.category}</span>
                      <span>•</span>
                      <span>{new Date(tx.date).toLocaleDateString()}</span>
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 ${tx.type === "income" ? "text-income" : "text-spending"}`}
                    style={{ fontSize: "0.88rem", fontWeight: 700 }}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {fmt(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultType={modalType}
      />
    </div>
  );
}
