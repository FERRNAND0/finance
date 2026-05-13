import React, { useState, useEffect } from "react";
import { X, Loader2, ChevronDown } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useT } from "../i18n/translations";
import { toast } from "sonner";

const INCOME_CATEGORIES = [
  "Зарплата",
  "Фриланс",
  "Инвестиции",
  "Подарки",
  "Перевод",
  "Другое",
];

const DEFAULT_SPENDING_CATEGORIES = [
  "Продукты",
  "Транспорт",
  "Жилье",
  "Развлечения",
  "Здоровье",
  "Одежда",
  "Другое",
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  RUB: "₽",
  KZT: "₸",
  KGS: "сом",
  UZS: "so'm",
};

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType: "income" | "spending";
}

export function TransactionModal({
  isOpen,
  onClose,
  defaultType,
}: TransactionModalProps) {
  const { addTransaction, language } = useApp();
  const t = useT(language);

  const [type, setType] = useState<"income" | "spending">(defaultType);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const [spendingCategories, setSpendingCategories] = useState<string[]>(
    DEFAULT_SPENDING_CATEGORIES,
  );
  const [category, setCategory] = useState("");

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [isCatOpen, setIsCatOpen] = useState(false); // Для кастомного дропдауна

  const [currency, setCurrency] = useState("USD");
  const [rate, setRate] = useState(1);

  // Функция для перевода категорий внутри модалки
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

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setAmount("");
      setReason("");
      setDate(new Date().toISOString().split("T")[0]);
      setIsCustomCategory(false);
      setCustomCategoryName("");
      setIsCatOpen(false);

      const savedCurrency = localStorage.getItem("app_currency") || "USD";
      setCurrency(savedCurrency);

      fetch("https://api.exchangerate-api.com/v4/latest/USD")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.rates && data.rates[savedCurrency]) {
            setRate(data.rates[savedCurrency]);
          }
        })
        .catch((err) => console.error("Ошибка загрузки курса в модалке:", err));

      const savedBudgets = localStorage.getItem("userBudgets");
      let currentSpendingCats = DEFAULT_SPENDING_CATEGORIES;
      if (savedBudgets) {
        try {
          const parsed = JSON.parse(savedBudgets);
          const keys = Object.keys(parsed);
          if (keys.length > 0) currentSpendingCats = keys;
        } catch (e) {}
      }
      setSpendingCategories(currentSpendingCats);

      if (defaultType === "income") setCategory(INCOME_CATEGORIES[0]);
      else setCategory(currentSpendingCats[0]);
    }
  }, [isOpen, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isCustomCategory
      ? customCategoryName.trim()
      : category;

    if (!amount || !finalCategory || !reason || !date) {
      toast.error(t("fillAllFields") || "Заполните все поля");
      return;
    }

    const amountNum = parseFloat(amount);
    const amountInUSD = amountNum / rate;

    setLoading(true);
    try {
      await addTransaction({
        type,
        amount: amountInUSD,
        category: finalCategory,
        reason,
        date,
      });

      if (type === "spending" && isCustomCategory) {
        const saved = localStorage.getItem("userBudgets");
        const budgets = saved ? JSON.parse(saved) : {};
        if (!budgets[finalCategory]) {
          budgets[finalCategory] = 0;
          localStorage.setItem("userBudgets", JSON.stringify(budgets));
        }
      }

      toast.success(t("transactionSaved") || "Транзакция сохранена!");
      onClose();
    } catch (error) {
      toast.error("Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (newType: "income" | "spending") => {
    setType(newType);
    setIsCustomCategory(false);
    if (newType === "income") setCategory(INCOME_CATEGORIES[0]);
    else setCategory(spendingCategories[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-background/80 backdrop-blur-sm">
      <div
        className="liquid-glass w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[#0b000b]/90 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`h-1.5 w-full ${type === "income" ? "bg-emerald-500" : "bg-rose-500"} transition-colors duration-300`}
        />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black dark:hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {type === "income" ? t("addIncome") : t("addSpending")}
          </h2>

          <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => handleTypeChange("income")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${type === "income" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"}`}
            >
              {t("incomeTab") || "Доходы"}
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("spending")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${type === "spending" ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"}`}
            >
              {t("spendingTab") || "Расходы"}
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1 flex items-center justify-between">
              <span>{t("amount") || "Сумма"}</span>
              <span className="text-purple-500 font-bold">в {currency}</span>
            </label>
            <div className="flex items-center w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/50 transition-all">
              <span className="text-gray-500 dark:text-gray-400 font-bold text-lg mr-2 select-none flex-shrink-0">
                {CURRENCY_SYMBOLS[currency] || "$"}
              </span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-lg font-semibold w-full"
              />
            </div>
          </div>

          <div className="space-y-1.5 relative">
            <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1">
              {t("category") || "Категория"}
            </label>

            {!isCustomCategory ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCatOpen(!isCatOpen)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white flex items-center justify-between focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                >
                  <span>{translateCat(category)}</span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${isCatOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isCatOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsCatOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar p-1">
                      {(type === "income"
                        ? INCOME_CATEGORIES
                        : spendingCategories
                      ).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setCategory(cat);
                            setIsCatOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${category === cat ? "bg-purple-500/15 text-purple-600 dark:text-purple-400" : "text-gray-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/5"}`}
                        >
                          {translateCat(cat)}
                        </button>
                      ))}
                      {type === "spending" && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomCategory(true);
                            setIsCatOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-purple-600 dark:text-purple-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          {t("customCategory") || "➕ Своя категория..."}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  placeholder={t("category") || "Название..."}
                  className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-purple-500/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(false)}
                  className="px-4 bg-black/5 dark:bg-white/5 rounded-2xl text-gray-500 hover:text-rose-500 transition-colors flex items-center justify-center border border-gray-200 dark:border-white/10"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1">
              {t("reason") || "Название / Детали"}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                type === "spending"
                  ? t("reasonPlaceholderSpending")
                  : t("reasonPlaceholderIncome")
              }
              className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1">
              {t("date") || "Дата"}
            </label>
            <div className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/50 transition-all flex items-center min-h-[50px]">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-gray-900 dark:text-white outline-none dark:[color-scheme:dark] appearance-none block"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl text-white font-bold disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2 ${type === "income" ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20" : "bg-rose-600 hover:bg-rose-500 shadow-rose-500/20"}`}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              t("save") || "Сохранить"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
