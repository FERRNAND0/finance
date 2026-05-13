import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// --- Типы данных ---
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  reason: string;
  date: string;
  type: "income" | "spending";
  createdAt: string;
}

interface AppContextType {
  currentUser: User | null;
  theme: string;
  language: string;
  transactions: Transaction[];
  openAIKey: string;
  setOpenAIKey: (key: string) => void;
  verifyCode: (email: string, code: string) => Promise<boolean>;
  logout: () => void;
  addTransaction: (tx: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteAllTransactions: (
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  getBalance: () => number;
  getUserTransactions: () => Transaction[];
  setTheme: (theme: string) => void;
  setLanguage: (lang: string) => void;
  updateUser: (data: Partial<User>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

const API_URL = "https://finance.lxv.uz/api";

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // ИСПРАВЛЕНИЕ 1: Меняем название функции на setThemeState
  const [theme, setThemeState] = useState(
    localStorage.getItem("app_theme") || "default",
  );

  const [language, setLang] = useState(
    localStorage.getItem("sf_language") || "ru",
  );
  const [openAIKey, setOpenAIKey] = useState(
    localStorage.getItem("sf_openai") || "",
  );

  const updateUser = (data: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    localStorage.setItem("sf_user", JSON.stringify(updated));
  };

  const authFetch = async (url: string, options: any = {}) => {
    const token = localStorage.getItem("access");
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return fetch(`${API_URL}${url}`, { ...options, headers });
  };

  const fetchTransactions = async () => {
    const res = await authFetch("/transactions/");
    if (res.ok) {
      const data = await res.json();
      const parsedTransactions = data.map((tx: any) => ({
        ...tx,
        amount: parseFloat(tx.amount),
      }));
      setTransactions(parsedTransactions);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("access");
      if (token) {
        const savedUser = localStorage.getItem("sf_user");
        if (savedUser) setCurrentUser(JSON.parse(savedUser));
        await fetchTransactions();
      }
      setLoading(false);

      // Устанавливаем тему при первой загрузке приложения
      const savedTheme = localStorage.getItem("app_theme") || "default";
      setTheme(savedTheme);
    };
    init();
  }, []);

  const verifyCode = async (email: string, code: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("access", data.access);
        localStorage.setItem("sf_user", JSON.stringify(data.user));
        setCurrentUser(data.user);
        await fetchTransactions();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const addTransaction = async (tx: any) => {
    const res = await authFetch("/transactions/", {
      method: "POST",
      body: JSON.stringify(tx),
    });
    if (res.ok) await fetchTransactions();
  };

  const deleteTransaction = async (id: string) => {
    const res = await authFetch(`/transactions/${id}/`, { method: "DELETE" });
    if (res.ok) await fetchTransactions();
  };

  const deleteAllTransactions = async (password: string) => {
    try {
      const res = await authFetch("/transactions/delete-all/", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok) {
        await fetchTransactions();
        return { success: true };
      } else {
        return { success: false, error: data.error || "Ошибка при удалении" };
      }
    } catch (e) {
      return { success: false, error: "Ошибка сети" };
    }
  };

  const logout = () => {
    localStorage.clear();
    setCurrentUser(null);
    setTransactions([]);
  };

  // ИСПРАВЛЕНИЕ 2: Правильная функция setTheme без бесконечного цикла
  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem("app_theme", newTheme);

    const root = document.documentElement;
    root.className = "";
    root.classList.add(`theme-${newTheme}`);

    // Для темных тем оставляем класс dark для белого текста Tailwind
    if (newTheme !== "white" && newTheme !== "light") {
      root.classList.add("dark");
    }
  };

  const setLanguage = (l: string) => {
    setLang(l);
    localStorage.setItem("sf_language", l);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        theme,
        language,
        transactions,
        openAIKey,
        setOpenAIKey,
        updateUser,
        verifyCode,
        logout,
        addTransaction,
        deleteTransaction,
        deleteAllTransactions,
        getBalance: () =>
          transactions.reduce(
            (s, t) =>
              t.type === "income" ? s + Number(t.amount) : s - Number(t.amount),
            0,
          ),
        getUserTransactions: () => transactions,
        setLanguage,
        setTheme, // ИСПРАВЛЕНИЕ 3: Передаем setTheme в провайдер, чтобы кнопки работали!
      }}
    >
      {!loading && children}
    </AppContext.Provider>
  );
}
