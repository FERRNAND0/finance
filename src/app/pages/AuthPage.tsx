import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useT } from "../i18n/translations";
import { toast } from "sonner";
import logo from "../../imports/lxvbrowser.png";
import { TopographyBackground } from "../components/TopographyBackground";

// 1. Исправляем TypeScript: заменяем 'any' на строгий интерфейс
interface InputGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
}

export function AuthPage() {
  const { language } = useApp();
  const t = useT(language);
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (mode === "register") {
      if (!firstName.trim()) errs.firstName = t("firstNameRequired");
      if (!lastName.trim()) errs.lastName = t("lastNameRequired");
    }
    if (!email.trim()) errs.email = t("emailRequired");
    if (!password) errs.password = t("passwordRequired");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const endpoint =
      mode === "login" ? "/api/auth/login/" : "/api/auth/register/";
    const body =
      mode === "login"
        ? { email, password }
        : { email, password, first_name: firstName, last_name: lastName };

    try {
        const response = await fetch(`http://75.119.144.200:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // 2. Безопасный парсинг ответа (защита от краша, если сервер вернет HTML-ошибку 500)
      let data;
      try {
        data = await response.json();
      } catch (err) {
        data = { error: "Неверный формат ответа от сервера" };
      }

      if (response.ok) {
 if (mode === "login") {
          localStorage.setItem("access", data.access);
          localStorage.setItem("refresh", data.refresh);
          
          // Сохраняем данные пользователя
          const mappedUser = {
            ...data.user,
            firstName: data.user?.first_name || '',
            lastName: data.user?.last_name || '',
          };
          localStorage.setItem("sf_user", JSON.stringify(mappedUser));

          toast.success(t("loginSuccess") || "Успешный вход!");
          // Используем window.location.href для жесткой перезагрузки,
          // чтобы AppContext гарантированно подхватил новые данные
          window.location.href = "/dashboard";
        }else {
          toast.success(
            t("registerSuccess") || "Код отправлен в терминал Django!",
          );
          navigate("/auth/verify", { state: { email } });
        }
      } else {
        // 3. Более подробный и точный вывод ошибок
        console.error("Django Error:", data);
        if (data.email)
          toast.error("Этот Email уже зарегистрирован или введен неверно");
        else if (data.password)
          toast.error("Пароль не соответствует требованиям безопасности");
        else
          toast.error(
            data.detail || data.error || "Ошибка при заполнении формы",
          );
      }
    } catch (error) {
      console.error("Network Error:", error);
      toast.error("Нет связи с сервером. Проверь, запущен ли Django.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setErrors({});
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden bg-[#0b000b]">
      <TopographyBackground />

      <div className="relative z-10 w-full flex flex-col items-center px-4 py-8 sm:py-12">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl liquid-glass flex items-center justify-center shadow-xl bg-white/10 backdrop-blur-md border border-white/20">
              <img src={logo} alt="S&F" className="w-12 h-12 object-contain" />
            </div>
          </div>
          <h1 className="text-white text-3xl font-extrabold tracking-tight">
            {t("appName")}
          </h1>
          <p className="text-gray-400 mt-1 text-sm tracking-widest uppercase">
            {t("appSubtitle")}
          </p>
        </div>

        <div className="w-full max-w-sm sm:max-w-md liquid-glass rounded-3xl shadow-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-2xl">
          <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500" />

          <div className="flex border-b border-white/10">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-4 text-center transition-all duration-300 ${
                  mode === m
                    ? "text-purple-400 border-b-2 border-purple-500 bg-white/5"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {m === "login" ? t("login") : t("register")}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <InputGroup
                  label={t("firstName")}
                  value={firstName}
                  onChange={setFirstName}
                  error={errors.firstName}
                  placeholder="John"
                />
                <InputGroup
                  label={t("lastName")}
                  value={lastName}
                  onChange={setLastName}
                  error={errors.lastName}
                  placeholder="Doe"
                />
              </div>
            )}

            <InputGroup
              label={t("email")}
              type="email"
              value={email}
              onChange={setEmail}
              error={errors.email}
              placeholder="you@example.com"
            />

            <div className="space-y-1.5">
              <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1">
                {t("password")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-purple-600 text-white font-bold hover:bg-purple-500 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : mode === "login" ? (
                t("loginBtn")
              ) : (
                t("registerBtn")
              )}
            </button>
          </form>

          <div className="p-6 pt-0 text-center">
            <button
              onClick={switchMode}
              className="text-xs text-gray-500 hover:text-purple-400 transition-colors"
            >
              {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
              <span className="font-bold text-purple-500">
                {mode === "login" ? t("signUpLink") : t("signInLink")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. Применяем интерфейс к компоненту
function InputGroup({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
}: InputGroupProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-2xl bg-white/5 border ${
          error ? "border-red-500/50" : "border-white/10"
        } text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all`}
      />
      {error && <p className="text-[10px] text-red-500 ml-1">{error}</p>}
    </div>
  );
}
