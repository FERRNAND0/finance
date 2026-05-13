import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { useT } from "../i18n/translations";
import { Settings2, Plus, Trash2, Check, X } from "lucide-react";

// Дефолтные лимиты (загрузятся, если пользователь зашел впервые)
const DEFAULT_BUDGETS: Record<string, number> = {
  Продукты: 500,
  Транспорт: 150,
  Жилье: 1000,
  Развлечения: 200,
  Здоровье: 300,
  Другое: 100,
};

export function BudgetLimits() {
  const { transactions, language } = useApp();
  const t = useT(language);
  const [animate, setAnimate] = useState(false);

  // --- Состояние для сохранения бюджетов ---
  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("userBudgets");
    return saved ? JSON.parse(saved) : DEFAULT_BUDGETS;
  });

  // --- Состояния режима редактирования ---
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<Record<string, number>>({});
  const [newCatName, setNewCatName] = useState("");
  const [newCatLimit, setNewCatLimit] = useState("");

  // Сохраняем в память при каждом изменении
  useEffect(() => {
    localStorage.setItem("userBudgets", JSON.stringify(budgets));
  }, [budgets]);

  // Перезапуск анимации при загрузке или выходе из режима редактирования
  useEffect(() => {
    if (!isEditing) {
      setAnimate(false);
      const timer = setTimeout(() => setAnimate(true), 150);
      return () => clearTimeout(timer);
    }
  }, [isEditing, budgets]);

  // Фильтруем транзакции только за текущий месяц
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const spendingsThisMonth = transactions.filter((tx: any) => {
    if (tx.type !== "spending") return false;
    const txDate = new Date(tx.date);
    return (
      txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear
    );
  });

  // Считаем сумму трат по каждой категории
  const spentByCategory = spendingsThisMonth.reduce(
    (acc: Record<string, number>, tx: any) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    },
    {},
  );

  // ==========================================
  // ВЬЮХА: РЕЖИМ РЕДАКТИРОВАНИЯ
  // ==========================================
  if (isEditing) {
    const handleSave = () => {
      setBudgets(editState);
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

        {/* Список текущих категорий для изменения */}
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
                <span className="text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) =>
                    setEditState((prev) => ({
                      ...prev,
                      [cat]: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-20 bg-transparent border-b border-gray-300 dark:border-white/20 text-gray-900 dark:text-white text-right outline-none focus:border-purple-500 text-sm font-semibold transition-colors"
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

        {/* Форма добавления новой категории */}
        <form
          onSubmit={handleAdd}
          className="mt-4 flex items-center gap-2 bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-dashed border-gray-300 dark:border-white/20 focus-within:border-purple-500/50 transition-colors"
        >
          <input
            type="text"
            placeholder="Новая категория"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500"
          />
          <input
            type="number"
            placeholder="Сумма"
            value={newCatLimit}
            onChange={(e) => setNewCatLimit(e.target.value)}
            className="w-16 bg-transparent border-b border-gray-300 dark:border-white/20 text-gray-900 dark:text-white text-right outline-none focus:border-purple-500 text-sm font-semibold transition-colors"
          />
          <button
            type="submit"
            disabled={!newCatName.trim() || !newCatLimit}
            className="p-2 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl disabled:opacity-40 hover:bg-purple-500/30 transition-colors"
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
      const percentage = Math.min((spent / limit) * 100, 100);

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
            setEditState(budgets);
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
                <span style={{ fontSize: "0.75rem" }} className="text-gray-500">
                  <span
                    className={
                      item.percentage > 85
                        ? "text-rose-500 font-bold"
                        : "text-gray-900 dark:text-white font-semibold"
                    }
                  >
                    ${item.spent.toFixed(2)}
                  </span>{" "}
                  / ${item.limit}
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
