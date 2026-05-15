import { useState } from "react";
import { TrendingUp, TrendingDown, Plus, Trash2, Search } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useT } from "../i18n/translations";
import { TransactionModal } from "../components/TransactionModal";
import { toast } from "sonner";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

export function ManagementPage() {
  const { getUserTransactions, getBalance, deleteTransaction, language } =
    useApp();
  const t = useT(language);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"income" | "spending">("income");
  const [filter, setFilter] = useState<"all" | "income" | "spending">("all");
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const all = getUserTransactions();
  const balance = getBalance();
  const totalIncome = all
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalSpending = all
    .filter((t) => t.type === "spending")
    .reduce((s, t) => s + t.amount, 0);

  const visible = all
    .filter((tx) => filter === "all" || tx.type === filter)
    .filter(
      (tx) => !search || tx.reason.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteTransaction(id);
      toast.success(t("transactionDeleted"));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const openModal = (type: "income" | "spending") => {
    setModalType(type);
    setModalOpen(true);
  };

  // Добавили правильные фоны и рамки для поддержки светлых и темных тем
  const cardCls =
    "liquid-glass bg-white/60 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-3xl backdrop-blur-xl shadow-xl";

  return (
    <div className="p-4 lg:p-6 2xl:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">
          {t("managementTitle")}
        </h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => openModal("income")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-sm font-semibold text-sm"
          >
            <Plus size={16} /> {t("addIncome")}
          </button>
          <button
            onClick={() => openModal("spending")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all shadow-sm font-semibold text-sm"
          >
            <Plus size={16} /> {t("addSpending")}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 2xl:gap-6">
        {[
          {
            label: t("balance"),
            value: balance,
            color:
              balance >= 0
                ? "text-foreground"
                : "text-rose-600 dark:text-rose-400",
            grad: "from-purple-500/10",
          },
          {
            label: t("income"),
            value: totalIncome,
            color: "text-emerald-600 dark:text-emerald-400",
            grad: "from-emerald-500/10",
            icon: <TrendingUp size={14} className="text-emerald-500" />,
          },
          {
            label: t("spending"),
            value: totalSpending,
            color: "text-rose-600 dark:text-rose-400",
            grad: "from-rose-500/10",
            icon: <TrendingDown size={14} className="text-rose-500" />,
          },
        ].map((item, i) => (
          <div
            key={i}
            className={`${cardCls} p-5 text-center relative overflow-hidden`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${item.grad} to-transparent opacity-50`}
            />
            <div className="relative flex items-center justify-center gap-1.5 mb-2">
              {item.icon}
              <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                {item.label}
              </p>
            </div>
            <p
              className={`relative ${item.color} text-2xl sm:text-3xl font-extrabold tracking-tight`}
            >
              {fmt(item.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className={`${cardCls} overflow-hidden flex flex-col`}>
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row gap-3 bg-white/40 dark:bg-black/10">
          <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1 gap-1 border border-gray-200 dark:border-white/10">
            {(["all", "income", "spending"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg transition-all text-sm font-bold ${filter === f ? "bg-white dark:bg-[#1a1a1a] text-foreground shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-foreground"}`}
              >
                {f === "all"
                  ? t("allTransactions")
                  : f === "income"
                    ? t("incomeTab")
                    : t("spendingTab")}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("reason")}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all font-medium text-sm shadow-sm"
            />
          </div>
        </div>

        {/* Table Content */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white/20 dark:bg-black/5">
            <div className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-sm">
              <TrendingUp size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
              {t("noTransactions")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-white/10">
            {visible.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border ${tx.type === "income" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"}`}
                >
                  {tx.type === "income" ? (
                    <TrendingUp size={20} className="text-emerald-500" />
                  ) : (
                    <TrendingDown size={20} className="text-rose-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground truncate font-bold text-[0.95rem]">
                    {tx.reason}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[0.65rem] font-bold uppercase tracking-wider ${tx.type === "income" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}
                    >
                      {tx.type === "income"
                        ? t("incomeLabel")
                        : t("spendingLabel")}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 font-medium text-xs">
                      {new Date(tx.date).toLocaleDateString(
                        language === "ru"
                          ? "ru-RU"
                          : language === "uzb"
                            ? "uz-UZ"
                            : "en-US",
                        { year: "numeric", month: "short", day: "numeric" },
                      )}
                    </span>
                  </div>
                </div>
                <span
                  className={`flex-shrink-0 text-base sm:text-lg font-black ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {fmt(tx.amount)}
                </span>
                <button
                  onClick={() => handleDelete(tx.id)}
                  className={`flex-shrink-0 p-2.5 rounded-xl transition-all sm:opacity-0 sm:group-hover:opacity-100 ml-2 ${deleteConfirm === tx.id ? "bg-rose-500 text-white !opacity-100 shadow-lg shadow-rose-500/30" : "text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20"}`}
                  title={
                    deleteConfirm === tx.id ? "Нажмите еще раз" : "Удалить"
                  }
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultType={modalType}
      />
    </div>
  );
}
