import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "../contexts/AppContext";
import { useT } from "../i18n/translations";
import { Target, Plus, Minus, Settings2, Check, X, Coins } from "lucide-react";

export function PiggyBank() {
  const { language } = useApp();
  const t = useT(language);

  // Состояние копилки (сохраняем в localStorage)
  const [goalName, setGoalName] = useState(() => localStorage.getItem("piggy_name") || "MacBook Pro 16");
  const [targetAmount, setTargetAmount] = useState(() => parseFloat(localStorage.getItem("piggy_target") || "2500"));
  const [savedAmount, setSavedAmount] = useState(() => parseFloat(localStorage.getItem("piggy_saved") || "500"));

  // Режимы интерфейса
  const [mode, setMode] = useState<"idle" | "add" | "subtract" | "edit">("idle");
  const [inputValue, setInputValue] = useState("");
  const [editName, setEditName] = useState(goalName);
  const [editTarget, setEditTarget] = useState(targetAmount.toString());

  // Мультивалютность
  const [currency, setCurrency] = useState(() => localStorage.getItem("app_currency") || "USD");
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const handleCurrencyChange = () => setCurrency(localStorage.getItem("app_currency") || "USD");
    window.addEventListener("currencyChanged", handleCurrencyChange);
    return () => window.removeEventListener("currencyChanged", handleCurrencyChange);
  }, []);

  useEffect(() => {
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then((res) => res.json())
      .then((data) => setRates(data.rates))
      .catch((err) => console.error("Ошибка загрузки курсов", err));
  }, []);

  // Сохранение при изменениях
  useEffect(() => {
    localStorage.setItem("piggy_name", goalName);
    localStorage.setItem("piggy_target", targetAmount.toString());
    localStorage.setItem("piggy_saved", savedAmount.toString());
    
    // Перезапуск анимации
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, [goalName, targetAmount, savedAmount]);

  const rate = rates[currency] || 1;

  const formatCurrency = useCallback((n: number) => {
    const locales: Record<string, string> = { USD: "en-US", EUR: "de-DE", RUB: "ru-RU", KZT: "kk-KZ", KGS: "ky-KG", UZS: "uz-UZ" };
    return new Intl.NumberFormat(locales[currency] || "en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: ["UZS", "KZT", "KGS"].includes(currency) ? 0 : 2,
    }).format(n * rate);
  }, [currency, rate]);

  const percentage = targetAmount > 0 ? Math.min((savedAmount / targetAmount) * 100, 100) : 0;

  // Обработчики кнопок
  const handleAction = () => {
    const val = parseFloat(inputValue) / rate; // Переводим введенное значение в базовые USD
    if (isNaN(val) || val <= 0) return;

    if (mode === "add") {
      setSavedAmount((prev) => Math.min(prev + val, targetAmount));
    } else if (mode === "subtract") {
      setSavedAmount((prev) => Math.max(prev - val, 0));
    }
    setMode("idle");
    setInputValue("");
  };

  const handleSaveSettings = () => {
    setGoalName(editName);
    const newTarget = parseFloat(editTarget) / rate; // Сохраняем в USD
    if (!isNaN(newTarget) && newTarget > 0) {
      setTargetAmount(newTarget);
    }
    setMode("idle");
  };

  return (
    <div className="liquid-glass p-5 sm:p-6 rounded-3xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-white/50 to-transparent dark:from-black/20 dark:to-transparent shadow-xl w-full relative overflow-hidden">
      {/* Декоративный фон */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/10 dark:bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />

      {/* Шапка */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center">
            <Target size={16} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-gray-900 dark:text-white font-semibold text-lg">
            Копилка
          </h3>
        </div>
        
        {mode === "idle" && (
          <button onClick={() => {
             setEditName(goalName);
             setEditTarget((targetAmount * rate).toFixed(2));
             setMode("edit");
          }} className="p-2 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors bg-black/5 dark:bg-white/5 rounded-xl">
            <Settings2 size={16} />
          </button>
        )}
      </div>

      {/* Контент: Режим просмотра */}
      {mode === "idle" && (
        <div className="space-y-5 relative z-10">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1 uppercase tracking-wider font-semibold">{goalName}</p>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                {formatCurrency(savedAmount)}
              </span>
              <span className="text-sm text-gray-500 font-medium mb-1">
                из {formatCurrency(targetAmount)}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="h-3 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden backdrop-blur-md">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-1000 ease-out shadow-lg"
                style={{ width: animate ? `${percentage}%` : "0%" }}
              />
            </div>
            <p className="text-right text-[10px] text-gray-400 font-bold">{percentage.toFixed(1)}%</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={() => setMode("add")} className="flex items-center justify-center gap-2 py-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-xl font-bold transition-all border border-emerald-500/20">
              <Plus size={18} /> Пополнить
            </button>
            <button onClick={() => setMode("subtract")} className="flex items-center justify-center gap-2 py-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-xl font-bold transition-all border border-rose-500/20">
              <Minus size={18} /> Снять
            </button>
          </div>
        </div>
      )}

      {/* Контент: Режим пополнения / снятия */}
      {(mode === "add" || mode === "subtract") && (
        <div className="space-y-4 relative z-10 animate-in fade-in zoom-in-95 duration-200">
          <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {mode === "add" ? <Plus size={16} className="text-emerald-500"/> : <Minus size={16} className="text-rose-500"/>}
            {mode === "add" ? "Внести деньги в копилку" : "Забрать деньги из копилки"}
          </p>
          <div className="flex items-center bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 focus-within:border-purple-500 transition-all">
            <span className="text-gray-400 font-bold mr-2">{currency}</span>
            <input
              type="number"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Сумма..."
              className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white font-semibold text-lg"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAction} disabled={!inputValue} className={`flex-1 py-3 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${mode === "add" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600"}`}>
              <Check size={18} /> Подтвердить
            </button>
            <button onClick={() => { setMode("idle"); setInputValue(""); }} className="p-3 bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/20 rounded-xl transition-all">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Контент: Режим настроек (Изменение цели) */}
      {mode === "edit" && (
        <div className="space-y-4 relative z-10 animate-in fade-in zoom-in-95 duration-200">
          <div className="space-y-1.5">
            <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1">На что копим?</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 outline-none text-gray-900 dark:text-white focus:border-purple-500 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1">Сумма цели ({currency})</label>
            <input type="number" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} className="w-full bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 outline-none text-gray-900 dark:text-white focus:border-purple-500 transition-all" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSaveSettings} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
              <Check size={18} /> Сохранить
            </button>
            <button onClick={() => setMode("idle")} className="p-3 bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/20 rounded-xl transition-all">
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}