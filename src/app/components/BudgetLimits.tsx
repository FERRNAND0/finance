import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "../contexts/AppContext";
import { useT } from "../i18n/translations";
import { Settings2, Plus, Trash2, Check, X } from "lucide-react";

// Дефолтные лимиты сохраняются в базовой валюте (USD)
const DEFAULT_BUDGETS: Record<string, number> = {
  Продукты: 500,
  Транспорт: 150,
  Жилье: 1000,
  Развлечения: 200,
  Здоровье: 300,
  Другое: 100,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  RUB: "₽",
  KZT: "₸",
  KGS: "сом",
  UZS: "so'm",
};

export function BudgetLimits() {
  const { transactions, language } = useApp();
  const t = useT(language);
  const [animate, setAnimate] = useState(false);

  // --- Состояние для сохранения бюджетов (в USD) ---
  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("userBudgets");
    return saved ? JSON.parse(saved) : DEFAULT_BUDGETS;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<Record<string, number>>({});
  const [newCatName, setNewCatName] = useState("");
  const [newCatLimit, setNewCatLimit] = useState("");

  // ==========================================
  // МУЛЬТИВАЛЮТНОСТЬ В ЛИМИТАХ
  // ==========================================
  const [currency, setCurrency] = useState(
    () => localStorage.getItem("app_currency") || "USD",
  );
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });

  // Слушаем изменения валюты из шапки дашборда
  useEffect(() => {
    const handleCurrencyChange = () => {
      setCurrency(localStorage.getItem("app_currency") || "USD");
    };
    window.addEventListener("currencyChanged", handleCurrencyChange);
    return () =>
      window.removeEventListener("currencyChanged", handleCurrencyChange);
  }, []);

  // Получаем свежий курс
  useEffect(() => {
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then((res) => res.json())
      .then((data) => setRates(data.rates))
      .catch((err) => console.error("Ошибка загрузки курсов", err));
  }, []);

  const rate = rates[currency] || 1;

  // Динамическая функция форматирования для карточек лимитов
  const formatCurrency = useCallback(
    (n: number) => {
      const locales: Record<string, string> = {
        USD: "en-US",
        EUR: "de-DE",
        RUB: "ru-RU",
        KZT: "kk-KZ",
        KGS: "ky-KG",
        UZS: "uz-UZ",
      };
      const convertedAmount = n * rate;

      return new Intl.NumberFormat(locales[currency] || "en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: ["UZS", "KZT", "KGS"].includes(currency) ? 0 : 2,
      }).format(convertedAmount);
    },
    [currency, rates, rate],
  );

  // Сохраняем в память при каждом изменении
  useEffect(() => {
    localStorage.setItem("userBudgets", JSON.stringify(budgets));
  }, [budgets]);

  // Перезапуск анимации прогресс-баров
  useEffect(() => {
    if (!isEditing) {
      setAnimate(false);
      const timer = setTimeout(() => setAnimate(true), 150);
      return () => clearTimeout(timer);
    }
  }, [isEditing, budgets, currency]); // Добавили currency в зависимости

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const spendingsThisMonth = transactions.filter((tx: any) => {
    if (tx.type !== "spending") return false;
    const txDate = new Date(tx.date);
    return (
      txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear
    );
  });

  const spentByCategory = spendingsThisMonth.reduce(
    (acc: Record<string, number>, tx: any) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount; // Суммы tx.amount уже лежат в базе в USD
      return acc;
    },
    {},
  );

  // ==========================================
  // ВЬЮХА: РЕЖИМ РЕДАКТИРОВАНИЯ
  // ==========================================
  if (isEditing) {
    const handleSave = () => {
      // Конвертируем введенные суммы обратно в USD для хранения в БД
      const savedBudgetsInUSD = Object.entries(editState).reduce(
        (acc, [cat, val]) => {
          acc[cat] = val / rate;
          return acc;
        },
        {} as Record<string, number>,
      );

      setBudgets(savedBudgetsInUSD);
      setIsEditing(false);
    };

    const handleAdd = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCatName.trim() || !newCatLimit) return;
      setEditState((prev) => ({
        ...prev,
        [newCatName.trim()]: parseFloat(newCatLimit),
      }));
      setNewCatName("");
      setNewCatLimit("");
    };

    const handleRemove = (cat: string) => {
      const updated = { ...editState };
      delete updated[cat];
      setEditState(updated);
    };

    return (
      <div className="liquid-glass p-5 rounded-3xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/20 shadow-xl w-full transition-all duration-300">
        <div className="flex items-center justify-between mb-5">
          <h3
            className="text-gray-900 dark:text-white"
            style={{ fontSize: "0.95rem", fontWeight: 600 }}
          >
            Настройка лимитов
          </h3>
          <button
            onClick={() => setIsEditing(false)}
            className="p-1.5 text-gray-500 hover:text-rose-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {Object.entries(editState).map(([cat, limit]) => (
            <div
              key={cat}
              className="flex items-center gap-3 bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-gray-200 dark:border-white/5"
            >
              <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">
                {cat}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm font-bold">
                  {CURRENCY_SYMBOLS[currency] || "$"}
                </span>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) =>
                    setEditState((prev) => ({
                      ...prev,
                      [cat]: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-24 bg-transparent border-b border-gray-300 dark:border-white/20 text-gray-900 dark:text-white text-right outline-none focus:border-purple-500 text-sm font-semibold transition-colors"
                />
                <button
                  onClick={() => handleRemove(cat)}
                  className="text-gray-400 hover:text-rose-500 p-1 ml-1 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleAdd}
          className="mt-4 flex items-center gap-2 bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-dashed border-gray-300 dark:border-white/20 focus-within:border-purple-500/50 transition-colors"
        >
          <input
            type="text"
            placeholder="Новая категория"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 w-1/2"
          />
          <span className="text-gray-400 text-sm font-bold flex-shrink-0">
            {CURRENCY_SYMBOLS[currency] || "$"}
          </span>
          <input
            type="number"
            placeholder="Сумма"
            value={newCatLimit}
            onChange={(e) => setNewCatLimit(e.target.value)}
            className="w-20 bg-transparent border-b border-gray-300 dark:border-white/20 text-gray-900 dark:text-white text-right outline-none focus:border-purple-500 text-sm font-semibold transition-colors flex-shrink-0"
          />
          <button
            type="submit"
            disabled={!newCatName.trim() || !newCatLimit}
            className="p-2 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl disabled:opacity-40 hover:bg-purple-500/30 transition-colors flex-shrink-0"
          >
            <Plus size={16} strokeWidth={3} />
          </button>
        </form>

        <button
          onClick={handleSave}
          className="w-full mt-6 py-4 bg-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 hover:bg-purple-500 active:scale-95 transition-all"
        >
          <Check size={18} strokeWidth={3} /> Сохранить изменения
        </button>
      </div>
    );
  }

  // ==========================================
  // ВЬЮХА: РЕЖИМ ПРОСМОТРА
  // ==========================================
  const budgetData = Object.keys(budgets)
    .map((category) => {
      const limit = budgets[category];
      const spent = spentByCategory[category] || 0;
      const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

      let colorClass = "bg-emerald-500 shadow-emerald-500/50";
      if (percentage > 85) colorClass = "bg-rose-500 shadow-rose-500/50";
      else if (percentage > 60) colorClass = "bg-amber-500 shadow-amber-500/50";

      return { category, limit, spent, percentage, colorClass };
    })
    .sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="liquid-glass p-5 rounded-3xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/20 shadow-xl w-full">
      <div className="flex items-center justify-between mb-6">
        <h3
          className="text-gray-900 dark:text-white"
          style={{ fontSize: "0.95rem", fontWeight: 600 }}
        >
          {t("monthlyBudgets") || "Лимиты на месяц"}
        </h3>
        <button
          onClick={() => {
            // Переводим лимиты из базового USD в текущую валюту для режима редактирования
            const currentCurrencyState = Object.entries(budgets).reduce(
              (acc, [cat, val]) => {
                acc[cat] = parseFloat((val * rate).toFixed(2));
                return acc;
              },
              {} as Record<string, number>,
            );
            setEditState(currentCurrencyState);
            setIsEditing(true);
          }}
          className="p-2 bg-white/50 dark:bg-white/5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-white transition-colors border border-gray-200 dark:border-white/5"
        >
          <Settings2 size={18} />
        </button>
      </div>

      {budgetData.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">
          Нет активных лимитов. Нажмите шестеренку, чтобы добавить.
        </p>
      ) : (
        <div className="space-y-5">
          {budgetData.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-end">
                <span
                  className="text-gray-900 dark:text-white"
                  style={{ fontSize: "0.85rem", fontWeight: 500 }}
                >
                  {item.category}
                </span>

                {/* ИСПОЛЬЗУЕМ formatCurrency ВМЕСТО ЖЕСТКОГО "$" */}
                <span style={{ fontSize: "0.75rem" }} className="text-gray-500">
                  <span
                    className={
                      item.percentage > 85
                        ? "text-rose-500 font-bold"
                        : "text-gray-900 dark:text-white font-semibold"
                    }
                  >
                    {formatCurrency(item.spent)}
                  </span>{" "}
                  / {formatCurrency(item.limit)}
                </span>
              </div>
              <div className="h-2.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden backdrop-blur-md border border-gray-200 dark:border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-lg ${item.colorClass}`}
                  style={{ width: animate ? `${item.percentage}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
