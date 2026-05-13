import { useState, useEffect, useCallback, useRef } from "react";
import { ExpenseChart } from "../components/ExpenseChart";
import { BudgetLimits } from "../components/BudgetLimits";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Trash2,
  Download,
  ChevronDown,
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
import { toast } from "sonner";
import { PiggyBank } from "../components/PiggyBank";

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

const CURRENCIES = ["USD", "EUR", "RUB", "KZT", "KGS", "UZS"] as const;
type CurrencyType = (typeof CURRENCIES)[number];

const SwipeableTransaction = ({
  tx,
  onDelete,
  formatCurrency,
  translateCat, // <-- Добавили пропс для перевода категории
}: {
  tx: any;
  onDelete: (id: string) => void;
  formatCurrency: (n: number) => string;
  translateCat: (cat: string) => string;
}) => {
  const [translateX, setTranslateX] = useState(0);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.touches[0].clientX - startXRef.current;
    if (deltaX < 0) setTranslateX(Math.max(deltaX, -80));
    else if (translateX < 0 && deltaX > 0)
      setTranslateX(Math.min(translateX + deltaX, 0));
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    if (translateX < -40) setTranslateX(-80);
    else setTranslateX(0);
  };

  return (
    <div className="overflow-hidden rounded-xl mb-1 touch-pan-y">
      <div
        className="relative flex items-center transition-transform ease-out w-full"
        style={{
          transform: `translateX(${translateX}px)`,
          transitionDuration: isDraggingRef.current ? "0s" : "0.3s",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-full flex-shrink-0 flex items-center gap-3 p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-muted/40 transition-colors">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === "income" ? "bg-emerald-500/15" : "bg-rose-500/15"}`}
          >
            {tx.type === "income" ? (
              <TrendingUp size={13} className="text-emerald-500" />
            ) : (
              <TrendingDown size={13} className="text-rose-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-foreground truncate"
              style={{ fontSize: "0.85rem", fontWeight: 500 }}
            >
              {tx.reason || translateCat(tx.category)}
            </p>
            <p
              className="text-muted-foreground flex gap-2"
              style={{ fontSize: "0.72rem" }}
            >
              <span className="text-purple-500 dark:text-purple-400">
                {translateCat(tx.category)}
              </span>
              <span>•</span>
              <span>{new Date(tx.date).toLocaleDateString()}</span>
            </p>
          </div>
          <span
            className={`flex-shrink-0 ${tx.type === "income" ? "text-emerald-500" : "text-rose-500"}`}
            style={{ fontSize: "0.88rem", fontWeight: 700 }}
          >
            {tx.type === "income" ? "+" : "-"}
            {formatCurrency(tx.amount)}
          </span>
        </div>

        <div className="absolute left-full top-0 bottom-0 w-[80px] flex items-center justify-center">
          <button
            onClick={() => onDelete(tx.id)}
            className="w-11 h-11 bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export function DashboardPage() {
  const {
    currentUser,
    getUserTransactions,
    getBalance,
    language,
    deleteTransaction,
  } = useApp();
  const t = useT(language);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"income" | "spending">("income");
  const [period, setPeriod] = useState<"week" | "month" | "all">("month");
  const [currency, setCurrency] = useState<CurrencyType>(
    () => (localStorage.getItem("app_currency") as CurrencyType) || "USD",
  );
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("app_currency", currency);
    window.dispatchEvent(new Event("currencyChanged"));
  }, [currency]);

  useEffect(() => {
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then((res) => res.json())
      .then((data) => setRates(data.rates))
      .catch((err) => console.error("Ошибка загрузки курсов валют", err));
  }, []);

  const formatCurrency = useCallback(
    (n: number) => {
      const locales: Record<CurrencyType, string> = {
        USD: "en-US",
        EUR: "de-DE",
        RUB: "ru-RU",
        KZT: "kk-KZ",
        KGS: "ky-KG",
        UZS: "uz-UZ",
      };
      const rate = rates[currency] || 1;
      return new Intl.NumberFormat(locales[currency], {
        style: "currency",
        currency: currency,
        minimumFractionDigits: ["UZS", "KZT", "KGS"].includes(currency) ? 0 : 2,
      }).format(n * rate);
    },
    [currency, rates],
  );

  const translateCat = (cat: string) => {
    const map: Record<string, string> = {
      Зарплата: t("cat_salary"),
      Фриланс: t("cat_freelance"),
      Инвестиции: t("cat_investments"),
      Подарки: t("cat_gifts"),
      Перевод: t("cat_transfers"),
      Другое: t("cat_other"),
      Продукты: t("cat_food"),
      Транспорт: t("cat_transport"),
      Жилье: t("cat_housing"),
      Развлечения: t("cat_entertainment"),
      Здоровье: t("cat_health"),
      Одежда: t("cat_clothing"),
    };
    return map[cat] || cat;
  };

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
            {formatCurrency(e.value)}
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
        <p style={{ color: payload[0].payload.fill }}>
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  };

  const [searchQuery, setSearchQuery] = useState("");
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

  const timeline = Array.from({ length: 14 }, (_, i) => {
    const day = subDays(new Date(), 13 - i);
    const bal = all
      .filter((t) => !isAfter(new Date(t.date), startOfDay(day)))
      .reduce((s, t) => (t.type === "income" ? s + t.amount : s - t.amount), 0);
    return { date: format(day, "MMM d"), balance: Math.max(0, bal) };
  });

  const spendMap: Record<string, number> = {};
  filtered
    .filter((t) => t.type === "spending")
    .forEach((tx) => {
      const catName = translateCat(tx.category);
      spendMap[catName] = (spendMap[catName] || 0) + tx.amount;
    });
  const spendData = Object.entries(spendMap)
    .map(([n, v]) => ({ name: n, value: v }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const incMap: Record<string, number> = {};
  filtered
    .filter((t) => t.type === "income")
    .forEach((tx) => {
      const catName = translateCat(tx.category);
      incMap[catName] = (incMap[catName] || 0) + tx.amount;
    });
  const incData = Object.entries(incMap)
    .map(([n, v]) => ({ name: n, value: v }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const displayTransactions = [...all]
    .filter((tx) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        (tx.reason || "").toLowerCase().includes(query) ||
        translateCat(tx.category).toLowerCase().includes(query)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const recent = searchQuery.trim()
    ? displayTransactions.slice(0, 20)
    : displayTransactions.slice(0, 6);

  const fetchAI = useCallback(async () => {
    if (all.length === 0) return;
    setAiLoading(true);
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(
        `https://finance.lxv.uz/api/ai-tips/?lang=${language}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "Accept-Language": language,
          },
        },
      );
      const data = await res.json();
      if (res.ok && data.tip) setAiText(data.tip);
      else setAiText(data.error || "Ошибка получения совета.");
    } catch {
      setAiText("Нет связи с сервером AI.");
    }
    setAiLoading(false);
  }, [all.length, language]);

  useEffect(() => {
    if (all.length > 0) fetchAI();
  }, [fetchAI, all.length]);

  const openModal = (type: "income" | "spending") => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleDeleteTx = async (id: string) => {
    try {
      if (deleteTransaction) {
        await deleteTransaction(id);
        toast.success(t("transactionDeleted"));
      } else toast.error("Функция удаления еще не подключена к бэкенду");
    } catch (e) {
      toast.error("Ошибка при удалении");
    }
  };

  const handleExportExcel = () => {
    if (all.length === 0) {
      toast.error(t("noData"));
      return;
    }
    const headers = [
      "Тип",
      "Категория",
      "Описание",
      "Сумма (Оригинал)",
      "Валюта отображения",
      "Дата",
    ];
    const rows = all.map((tx) => [
      tx.type === "income" ? "Доход" : "Расход",
      `"${translateCat(tx.category)}"`,
      `"${tx.reason || ""}"`,
      tx.amount,
      currency,
      new Date(tx.date).toLocaleDateString(),
    ]);
    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Отчет_Финансы_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Отчет успешно скачан!");
  };

  const cardCls = "liquid-glass rounded-2xl";

  return (
    <div className="p-4 lg:p-6 2xl:p-10 space-y-5 2xl:space-y-7 overflow-x-hidden">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1
            className="text-foreground"
            style={{ fontSize: "1.4rem", fontWeight: 700 }}
          >
            {language === "ru"
              ? "Добрый день"
              : language === "uzb"
                ? "Xayrli kun"
                : language === "de"
                  ? "Guten Tag"
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
                : language === "de"
                  ? "de-DE"
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

        <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
          <div className="flex bg-white/30 dark:bg-muted rounded-xl p-1 gap-1 backdrop-blur-sm border border-white/40 dark:border-border">
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

          <button
            onClick={handleExportExcel}
            className="p-2 h-[34px] w-[34px] bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-600/20 transition-all border border-purple-500/20 flex items-center justify-center shadow-sm active:scale-95"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 2xl:gap-5">
        <div
          className={`lg:col-span-2 ${cardCls} p-5 sm:p-6 2xl:p-8 relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-primary/8 blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1 relative">
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
              <div className="relative">
                <button
                  onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors p-1.5 bg-black/5 dark:bg-white/5 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-white/10 active:scale-95"
                >
                  <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                    {currency}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${isCurrencyMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isCurrencyMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsCurrencyMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-24 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden overflow-y-auto max-h-48 custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                      {CURRENCIES.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setCurrency(c);
                            setIsCurrencyMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-all ${currency === c ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold" : "text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10"}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
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
              {formatCurrency(balance)}
            </div>
            <div
              className={`flex items-center gap-1 mt-2.5 ${totalIncome >= totalSpending ? "text-emerald-500" : "text-rose-500"}`}
              style={{ fontSize: "0.82rem" }}
            >
              {totalIncome >= totalSpending ? (
                <ArrowUpRight size={15} />
              ) : (
                <ArrowDownRight size={15} />
              )}
              <span>
                {formatCurrency(Math.abs(totalIncome - totalSpending))}{" "}
                {period === "week" ? t("thisWeek") : t("thisMonth")}
              </span>
            </div>
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

        <div className="flex flex-col gap-4">
          <div className={`${cardCls} p-4 flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/12 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={18} className="text-emerald-500" />
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
                className="text-emerald-500"
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {formatCurrency(totalIncome)}
              </p>
            </div>
          </div>
          <div className={`${cardCls} p-4 flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-xl bg-rose-500/12 flex items-center justify-center flex-shrink-0">
              <TrendingDown size={18} className="text-rose-500" />
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
                className="text-rose-500"
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {formatCurrency(totalSpending)}
              </p>
            </div>
          </div>
          <div className="mt-6">
            <ExpenseChart />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => openModal("income")}
              className={`${cardCls} flex flex-col items-center justify-center gap-2 p-4 border-emerald-500/20 hover:border-emerald-500/40 group transition-all duration-200`}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus size={18} className="text-emerald-500" />
              </div>
              <span
                className="text-emerald-500"
                style={{ fontSize: "0.72rem", fontWeight: 600 }}
              >
                {t("quickIncome")}
              </span>
            </button>
            <button
              onClick={() => openModal("spending")}
              className={`${cardCls} flex flex-col items-center justify-center gap-2 p-4 border-rose-500/20 hover:border-rose-500/40 group transition-all duration-200`}
            >
              <div className="w-10 h-10 rounded-full bg-rose-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Minus size={18} className="text-rose-500" />
              </div>
              <span
                className="text-rose-500"
                style={{ fontSize: "0.72rem", fontWeight: 600 }}
              >
                {t("quickSpending")}
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="mt-4 2xl:mt-5 grid grid-cols-1 xl:grid-cols-2 gap-4 2xl:gap-5">
        <BudgetLimits />
        <PiggyBank />
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultType={modalType}
      />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 2xl:gap-5">
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
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 2xl:gap-5">
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

        <div className={`${cardCls} p-5 flex flex-col h-full`}>
          <div className="flex items-center justify-between mb-4 gap-3">
            <h3
              className="text-foreground whitespace-nowrap"
              style={{ fontSize: "0.95rem", fontWeight: 600 }}
            >
              {t("recentTransactions")}
            </h3>
            <div className="relative flex-1 max-w-[200px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={14}
              />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-1.5 pl-9 pr-3 text-sm text-foreground outline-none focus:border-purple-500/50 transition-all placeholder:text-muted-foreground focus:bg-black/10 dark:focus:bg-black/20"
              />
            </div>
          </div>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-muted flex items-center justify-center">
                <Search size={17} className="text-muted-foreground" />
              </div>
              <p
                className="text-muted-foreground"
                style={{ fontSize: "0.85rem" }}
              >
                {searchQuery ? "Ничего не найдено" : t("noTransactions")}
              </p>
            </div>
          ) : (
            <div className="space-y-1 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar overflow-x-hidden">
              {recent.map((tx) => (
                <SwipeableTransaction
                  key={tx.id}
                  tx={tx}
                  onDelete={handleDeleteTx}
                  formatCurrency={formatCurrency}
                  translateCat={translateCat}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() =>
          modalOpen ? setModalOpen(false) : openModal("spending")
        }
        className={`md:hidden fixed bottom-24 right-6 w-14 h-14 rounded-full flex items-center justify-center z-[60] active:scale-90 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] backdrop-blur-xl border shadow-xl ${modalOpen ? "bg-rose-500/30 border-rose-500/30 shadow-rose-500/20 text-rose-100 rotate-[135deg]" : "bg-purple-500/30 border-purple-400/30 shadow-purple-500/20 text-white rotate-0 hover:bg-purple-500/40"}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
}
