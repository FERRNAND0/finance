import { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { useT } from "../i18n/translations";

// Базовые лимиты для категорий (в долларах)
const DEFAULT_BUDGETS: Record<string, number> = {
  "Продукты": 500,
  "Транспорт": 150,
  "Жилье": 1000,
  "Развлечения": 200,
  "Здоровье": 300,
  "Одежда": 250,
  "Другое": 100,
};

export function BudgetLimits() {
  const { transactions, language } = useApp();
  const t = useT(language);
  
  // Состояние для запуска анимации прогресс-баров
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Даем небольшую задержку перед стартом анимации (выглядит эффектнее)
    const timer = setTimeout(() => setAnimate(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Фильтруем транзакции только за текущий месяц
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const spendingsThisMonth = transactions.filter((tx: any) => {
    if (tx.type !== "spending") return false;
    const txDate = new Date(tx.date);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  // Считаем сумму трат по каждой категории
  const spentByCategory = spendingsThisMonth.reduce((acc: Record<string, number>, tx: any) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {});

  // Формируем массив данных для рендера
  const budgetData = Object.keys(DEFAULT_BUDGETS).map(category => {
    const limit = DEFAULT_BUDGETS[category];
    const spent = spentByCategory[category] || 0;
    const percentage = Math.min((spent / limit) * 100, 100);

    // Динамический цвет в зависимости от расхода
    let colorClass = "bg-emerald-500 shadow-emerald-500/50"; 
    if (percentage > 85) colorClass = "bg-rose-500 shadow-rose-500/50"; // Почти превысили
    else if (percentage > 60) colorClass = "bg-amber-500 shadow-amber-500/50"; // Стоит притормозить

    return { category, limit, spent, percentage, colorClass };
  }).filter(b => b.spent > 0).sort((a, b) => b.percentage - a.percentage); // Показываем только те, где есть траты, сортируем по %

  if (budgetData.length === 0) return null;

  return (
    <div className="liquid-glass p-5 rounded-2xl border border-white/10 bg-white/5 dark:bg-black/20 shadow-xl w-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-foreground" style={{ fontSize: "0.95rem", fontWeight: 600 }}>
          {t("monthlyBudgets") || "Лимиты на месяц"}
        </h3>
      </div>

      <div className="space-y-5">
        {budgetData.map((item, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-foreground" style={{ fontSize: "0.85rem", fontWeight: 500 }}>
                {item.category}
              </span>
              <span style={{ fontSize: "0.75rem" }} className="text-muted-foreground">
                <span className={item.percentage > 85 ? "text-rose-500 font-bold" : "text-foreground font-semibold"}>
                  ${item.spent.toFixed(2)}
                </span>{" "}
                / ${item.limit}
              </span>
            </div>
            
            {/* Трек (фон) прогресс-бара */}
            <div className="h-2 w-full bg-black/10 dark:bg-white/5 rounded-full overflow-hidden backdrop-blur-md border border-white/5">
              {/* Сама заливка с пружинной анимацией ширины */}
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-lg ${item.colorClass}`}
                style={{ width: animate ? `${item.percentage}%` : "0%" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}