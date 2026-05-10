import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { Shield, ArrowLeft, Mail, Loader2 } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useT } from "../i18n/translations";
import { toast } from "sonner";
import logo from "../../imports/lxvbrowser.png";
import { TopographyBackground } from "../components/TopographyBackground";

export function TwoFactorPage() {
  const { verifyCode, language } = useApp();
  const t = useT(language);
  const navigate = useNavigate();
  const location = useLocation();

  // Получаем email, который мы передали со страницы AuthPage
  const email = location.state?.email;

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Если вдруг кто-то зашел сюда напрямую без email, отправим его обратно на логин
  React.useEffect(() => {
    if (!email) {
      navigate("/auth");
    }
  }, [email, navigate]);

  const handleInput = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") handleVerify();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newCode = Array(6).fill("");
    pasted.split("").forEach((char, i) => {
      newCode[i] = char;
    });
    setCode(newCode);
    if (pasted.length > 0)
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 6) {
      setError(t("invalidCode"));
      return;
    }

    setLoading(true);

    // Вызываем обновленную функцию из AppContext, передаем email и код
    const success = await verifyCode(email, fullCode);

    if (success) {
      toast.success("Успешная верификация!");
      navigate("/dashboard");
    } else {
      setError(t("invalidCode") || "Неверный код или время истекло");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }

    setLoading(false);
  };

  const filled = code.filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#0b000b] flex items-center justify-center relative overflow-hidden">
      <TopographyBackground />

      <div className="relative z-10 w-full flex flex-col items-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-sm sm:max-w-md mb-4">
          <button
            onClick={() => navigate("/auth")}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={15} />
            <span>
              {language === "ru"
                ? "Назад"
                : language === "uzb"
                  ? "Orqaga"
                  : "Back"}
            </span>
          </button>
        </div>

        <div className="w-full max-w-sm sm:max-w-md liquid-glass rounded-3xl shadow-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-2xl">
          <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500" />

          <div className="p-6 sm:p-8 space-y-6 sm:space-y-7">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl liquid-glass flex items-center justify-center shadow-lg bg-white/10 border border-white/20">
                  <img
                    src={logo}
                    alt="S&F"
                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-600 shadow-lg flex items-center justify-center">
                  <Shield size={12} className="text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-white text-xl font-bold">
                  {t("twoFactorTitle")}
                </h1>
                <p className="text-gray-400 mt-1 text-sm">
                  {t("twoFactorSubtitle")}
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <Mail size={13} className="text-purple-400" />
                  <p className="text-purple-400 text-sm font-medium">{email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div
                className="flex justify-center gap-1.5 sm:gap-2.5"
                onPaste={handlePaste}
              >
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInput(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={`text-center rounded-xl border-2 bg-white/5 text-white focus:outline-none transition-all duration-200 w-10 h-12 sm:w-12 sm:h-14 text-xl font-bold ${
                      digit
                        ? "border-purple-500 bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                        : error
                          ? "border-red-500/70"
                          : "border-white/10 focus:border-purple-500/50"
                    }`}
                  />
                ))}
              </div>
            </div>

            {error && (
              <p className="text-center text-red-400 text-sm">{error}</p>
            )}

            <button
              onClick={handleVerify}
              disabled={loading || filled < 6}
              className="w-full py-4 rounded-2xl bg-purple-600 text-white font-bold hover:bg-purple-500 disabled:opacity-50 transition-all flex items-center justify-center shadow-lg shadow-purple-500/20"
            >
              {loading ? <Loader2 className="animate-spin" /> : t("verifyBtn")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
