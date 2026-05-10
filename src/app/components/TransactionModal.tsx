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
const SPENDING_CATEGORIES = [
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
  const [category, setCategory] = useState(
    defaultType === "income" ? INCOME_CATEGORIES[0] : SPENDING_CATEGORIES[0],
  );
  const [reason, setReason] = useState(""); // Это наше точное название (куда ушли деньги)
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  // Сбрасываем форму при открытии
  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setCategory(
        defaultType === "income"
          ? INCOME_CATEGORIES[0]
          : SPENDING_CATEGORIES[0],
      );
      setAmount("");
      setReason("");
      setDate(new Date().toISOString().split("T")[0]);
    }
  }, [isOpen, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !reason || !date) {
      toast.error(t("fillAllFields") || "Заполните все поля");
      return;
    }

    setLoading(true);
    try {
      await addTransaction({
        type,
        amount: parseFloat(amount),
        category,
        reason,
        date,
      });
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
    setCategory(
      newType === "income" ? INCOME_CATEGORIES[0] : SPENDING_CATEGORIES[0],
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div
        className="liquid-glass w-full max-w-md rounded-3xl shadow-2xl border border-white/10 bg-[#0b000b]/80 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`h-1.5 w-full ${type === "income" ? "bg-emerald-500" : "bg-rose-500"} transition-colors duration-300`}
        />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <h2 className="text-xl font-bold text-white mb-2">
            {type === "income" ? t("addIncome") : t("addSpending")}
          </h2>

          {/* Переключатель Доход / Расход */}
          <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => handleTypeChange("income")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                type === "income"
                  ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {t("incomeTab") || "Доход"}
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("spending")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                type === "spending"
                  ? "bg-rose-500/20 text-rose-400 shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
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
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all text-lg font-semibold"
            />
          </div>

          {/* Поле: Категория (Выпадающий список для ИИ) */}
          <div className="space-y-1.5">
            <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1">
              Категория
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all appearance-none"
            >
              {(type === "income"
                ? INCOME_CATEGORIES
                : SPENDING_CATEGORIES
              ).map((cat) => (
                <option
                  key={cat}
                  value={cat}
                  className="bg-[#0b000b] text-white"
                >
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Поле: Название / Описание (Точно куда ушли деньги) */}
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
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
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
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all [color-scheme:dark]"
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
