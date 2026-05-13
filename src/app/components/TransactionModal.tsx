import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
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

// Дефолтный список (если пользователь еще не настраивал лимиты)
const DEFAULT_SPENDING_CATEGORIES = [
  "Продукты",
  "Транспорт",
  "Жилье",
  "Развлечения",
  "Здоровье",
  "Одежда",
  "Другое",
];

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

  // Динамические категории расходов (синхронизируются с лимитами)
  const [spendingCategories, setSpendingCategories] = useState<string[]>(
    DEFAULT_SPENDING_CATEGORIES,
  );
  const [category, setCategory] = useState("");

  // Состояния для добавления кастомной категории прямо из модалки
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setAmount("");
      setReason("");
      setDate(new Date().toISOString().split("T")[0]);
      setIsCustomCategory(false);
      setCustomCategoryName("");

      // Читаем категории расходов из настроек бюджетов (localStorage)
      const savedBudgets = localStorage.getItem("userBudgets");
      let currentSpendingCats = DEFAULT_SPENDING_CATEGORIES;
      if (savedBudgets) {
        try {
          const parsed = JSON.parse(savedBudgets);
          const keys = Object.keys(parsed);
          if (keys.length > 0) {
            currentSpendingCats = keys;
          }
        } catch (e) {
          console.error("Ошибка парсинга бюджетов", e);
        }
      }
      setSpendingCategories(currentSpendingCats);

      // Устанавливаем категорию по умолчанию
      if (defaultType === "income") {
        setCategory(INCOME_CATEGORIES[0]);
      } else {
        setCategory(currentSpendingCats[0]);
      }
    }
  }, [isOpen, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Определяем финальную категорию
    const finalCategory = isCustomCategory
      ? customCategoryName.trim()
      : category;

    if (!amount || !finalCategory || !reason || !date) {
      toast.error(t("fillAllFields") || "Заполните все поля");
      return;
    }

    setLoading(true);
    try {
      await addTransaction({
        type,
        amount: parseFloat(amount),
        category: finalCategory,
        reason,
        date,
      });

      // МАГИЯ: Если это новая кастомная категория расхода, добавляем её в карточку лимитов
      if (type === "spending" && isCustomCategory) {
        const saved = localStorage.getItem("userBudgets");
        const budgets = saved ? JSON.parse(saved) : {};
        if (!budgets[finalCategory]) {
          budgets[finalCategory] = 0; // Сохраняем с лимитом $0, чтобы она появилась в настройках
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
    if (newType === "income") {
      setCategory(INCOME_CATEGORIES[0]);
    } else {
      setCategory(spendingCategories[0]);
    }
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
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {type === "income" ? t("addIncome") : t("addSpending")}
          </h2>

          {/* Переключатель Доход / Расход */}
          <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => handleTypeChange("income")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                type === "income"
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              {t("incomeTab") || "Доход"}
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("spending")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                type === "spending"
                  ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              {t("spendingTab") || "Расход"}
            </button>
          </div>

          {/* Поле: Сумма */}
          <div className="space-y-1.5">
            <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1">
              {t("amount") || "Сумма"}
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all text-lg font-semibold"
            />
          </div>

          {/* Поле: Категория */}
          <div className="space-y-1.5">
            <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1">
              Категория
            </label>

            {!isCustomCategory ? (
              <select
                value={category}
                onChange={(e) => {
                  if (e.target.value === "ADD_CUSTOM") {
                    setIsCustomCategory(true);
                  } else {
                    setCategory(e.target.value);
                  }
                }}
                className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all appearance-none"
              >
                {(type === "income"
                  ? INCOME_CATEGORIES
                  : spendingCategories
                ).map((cat) => (
                  <option
                    key={cat}
                    value={cat}
                    className="bg-white dark:bg-[#0b000b] text-gray-900 dark:text-white"
                  >
                    {cat}
                  </option>
                ))}
                {/* Динамическая опция добавления своей категории */}
                {type === "spending" && (
                  <option
                    value="ADD_CUSTOM"
                    className="bg-white dark:bg-[#0b000b] text-purple-600 dark:text-purple-400 font-bold"
                  >
                    ➕ Добавить свою категорию...
                  </option>
                )}
              </select>
            ) : (
              // Поле ввода для новой кастомной категории
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  placeholder="Введите название..."
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

          {/* Поле: Название / Описание */}
          <div className="space-y-1.5">
            <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1">
              Название / Детали
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                type === "spending"
                  ? "Например: Кофе в Старбакс"
                  : "Например: Аванс за проект"
              }
              className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
            />
          </div>

          {/* Поле: Дата */}
          <div className="space-y-1.5">
            <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1">
              {t("date") || "Дата"}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all dark:[color-scheme:dark]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl text-white font-bold disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2 ${
              type === "income"
                ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                : "bg-rose-600 hover:bg-rose-500 shadow-rose-500/20"
            }`}
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
