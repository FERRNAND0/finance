import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useApp } from "../contexts/AppContext";

// Цветовая палитра для категорий расходов
const COLORS = [
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#14b8a6",
];

export function ExpenseChart() {
  const { transactions } = useApp();

  const spendings =
    transactions?.filter((t: any) => t.type === "spending") || [];

  const dataMap = spendings.reduce((acc: Record<string, number>, curr: any) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const data = Object.keys(dataMap)
    .map((key) => ({ name: key, value: dataMap[key] }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="h-[320px] w-full flex flex-col items-center justify-center text-gray-500 border border-gray-200 dark:border-white/10 rounded-3xl bg-black/5 dark:bg-black/20 liquid-glass">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-3 opacity-50"
        >
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
          <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
        </svg>
        <p className="text-sm">Пока нет данных о расходах</p>
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full p-5 liquid-glass rounded-3xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/20">
      <h3 className="text-gray-900 dark:text-white font-bold mb-2 ml-2">
        Структура расходов
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `$${value.toFixed(2)}`}
            contentStyle={{
              backgroundColor: "rgba(0, 0, 0, 0.85)",
              borderColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              color: "#fff",
            }}
            itemStyle={{ color: "#fff", fontWeight: "bold" }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: "12px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
