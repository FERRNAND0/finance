import { useState } from "react";
import {
  Globe,
  User as UserIcon,
  Check,
  Trash2,
  Edit2,
  X,
  Save,
  Lock,
  ChevronDown,
  Palette, // <-- Добавили иконку палитры
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useT } from "../i18n/translations";
import { toast } from "sonner";

export function SettingsPage() {
  const {
    currentUser,
    theme,
    setTheme, // <-- Используем setTheme вместо toggleTheme
    language,
    setLanguage,
    updateUser,
    deleteAllTransactions,
  } = useApp();
  const t = useT(language);

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const [dangerPassword, setDangerPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState(
    currentUser?.firstName || "",
  );
  const [editLastName, setEditLastName] = useState(currentUser?.lastName || "");
  const [editEmail, setEditEmail] = useState(currentUser?.email || "");
  const [editPassword, setEditPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateProfile = async () => {
    if (!editFirstName.trim() || !editLastName.trim() || !editEmail.trim()) {
      toast.error(t("fillAllFields") || "Имя, Фамилия и Email обязательны");
      return;
    }
    setIsSaving(true);
    try {
      const token = localStorage.getItem("access");
      const res = await fetch("https://finance.lxv.uz/api/auth/update/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: editFirstName,
          last_name: editLastName,
          email: editEmail,
          password: editPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        updateUser({
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
        });
        toast.success(t("settingsSaved") || "Профиль успешно обновлен!");
        setIsEditingProfile(false);
        setEditPassword("");
      } else toast.error(data.error || "Ошибка при обновлении профиля");
    } catch (e) {
      toast.error("Нет связи с сервером");
    } finally {
      setIsSaving(false);
    }
  };

  const fInit = currentUser?.firstName?.[0] || "";
  const lInit = currentUser?.lastName?.[0] || "";
  const initials = (fInit + lInit).toUpperCase() || "SF";
  const cardCls = "liquid-glass rounded-2xl overflow-hidden";
  const sectionHead =
    "px-5 py-3.5 border-b border-white/20 dark:border-border flex items-center justify-between";

  const LANGS = [
    { code: "en", label: t("lang_en") || "English" },
    { code: "ru", label: t("lang_ru") || "Русский" },
    { code: "uzb", label: t("lang_uzb") || "O'zbek" },
    { code: "kk", label: t("lang_kk") || "Қазақша" },
    { code: "ky", label: t("lang_ky") || "Кыргызча" },
    { code: "de", label: t("lang_de") || "Deutsch" },
    { code: "lb", label: t("lang_lb") || "Lëtzebuergesch" },
  ];
  const currentLangLabel =
    LANGS.find((l) => l.code === language)?.label || "Language";

  // Массив наших новых тем
  const THEMES = [
    {
      key: "default",
      color: "linear-gradient(135deg, #8b5cf6, #0b000b)",
      label: t("theme_default") || "Фирменный",
    },
    {
      key: "bw",
      color: "linear-gradient(135deg, #4b5563, #000000)",
      label: t("theme_bw") || "Черно-белый",
    },
    {
      key: "white",
      color: "linear-gradient(135deg, #e5e7eb, #ffffff)",
      label: t("theme_white") || "Чисто белый",
    },
    {
      key: "gray",
      color: "linear-gradient(135deg, #9ca3af, #1f2937)",
      label: t("theme_gray") || "Серый графит",
    },
    {
      key: "sea-green",
      color: "linear-gradient(135deg, #10b981, #064e3b)",
      label: t("theme_sea_green") || "Морской зеленый",
    },
    {
      key: "sea-blue",
      color: "linear-gradient(135deg, #0ea5e9, #0c4a6e)",
      label: t("theme_sea_blue") || "Морской синий",
    },
  ];

  return (
    <div className="p-4 lg:p-6 2xl:p-10 max-w-xl 2xl:max-w-2xl space-y-5">
      <h1
        className="text-foreground"
        style={{ fontSize: "1.4rem", fontWeight: 700 }}
      >
        {t("settingsTitle") || "Настройки"}
      </h1>

      {/* ── Profile ─────────────────────────────────── */}

      {/* ── Appearance (Множественные темы) ──────────────────────────────── */}
      <section className={cardCls}>
        <div className={sectionHead}>
          <div className="flex items-center gap-2">
            <Palette size={15} className="text-primary" />
            <h2
              className="text-foreground"
              style={{ fontSize: "0.9rem", fontWeight: 600 }}
            >
              {t("appearanceSection") || "Внешний вид"}
            </h2>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((item) => (
              <button
                key={item.key}
                onClick={() => setTheme && setTheme(item.key)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${theme === item.key ? "border-primary bg-primary/10" : "border-transparent bg-black/5 dark:bg-white/5 hover:border-primary/40"}`}
              >
                <div
                  className="w-6 h-6 rounded-full border border-gray-200 dark:border-white/20 shadow-sm flex-shrink-0"
                  style={{ background: item.color }}
                />
                <span
                  className="text-foreground flex-1 text-left truncate"
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: theme === item.key ? 700 : 500,
                  }}
                >
                  {item.label}
                </span>
                {theme === item.key && (
                  <Check size={14} className="text-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Language ──────────────────────────────── */}
      <section className="liquid-glass rounded-2xl relative z-20">
        <div className={sectionHead}>
          <div className="flex items-center gap-2">
            <Globe size={15} className="text-primary" />
            <h2
              className="text-foreground"
              style={{ fontSize: "0.9rem", fontWeight: 600 }}
            >
              {t("languageSection") || "Язык"}
            </h2>
          </div>
        </div>
        <div className="p-5">
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="w-full px-4 py-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white flex items-center justify-between hover:bg-black/10 dark:hover:bg-white/10 transition-all font-semibold focus:ring-2 focus:ring-purple-500/50 outline-none"
            >
              <span>{currentLangLabel}</span>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform duration-200 ${isLangOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isLangOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsLangOpen(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-40 max-h-60 overflow-y-auto custom-scrollbar p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  {LANGS.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLangOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${language === lang.code ? "bg-primary/15 text-primary" : "text-gray-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/5"}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Danger Zone ──────────────────────────── */}
      <div className="mt-8 liquid-glass rounded-3xl p-6 sm:p-8 border border-red-500/20 bg-red-500/5 relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Trash2 className="text-red-500" size={20} />
          </div>
          <div>
            <h3 className="text-red-500 font-bold text-lg">
              {t("dangerZone") || "Опасная зона"}
            </h3>
            <p className="text-gray-400 text-sm">
              {t("resetData") || "Сброс всех данных"}
            </p>
          </div>
        </div>
        <p className="text-gray-300 text-sm mb-6">
          {t("resetWarning") ||
            "Это действие навсегда удалит все доходы и расходы."}
        </p>
        {!showDanger ? (
          <button
            onClick={() => setShowDanger(true)}
            className="px-6 py-3 rounded-xl bg-red-500/10 text-red-500 font-bold border border-red-500/30 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
          >
            {t("resetBtn") || "Сбросить все"}
          </button>
        ) : (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-1.5">
              <label className="text-red-400 text-[10px] uppercase tracking-widest ml-1">
                {t("enterPassword") || "Введите пароль"}
              </label>
              <input
                type="password"
                value={dangerPassword}
                onChange={(e) => setDangerPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-red-500/30 text-white focus:ring-2 focus:ring-red-500/50 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!dangerPassword) {
                    toast.error("Введите пароль");
                    return;
                  }
                  setIsDeleting(true);
                  const res = await deleteAllTransactions(dangerPassword);
                  if (res.success) {
                    toast.success("Данные удалены");
                    setShowDanger(false);
                    setDangerPassword("");
                  } else {
                    toast.error(res.error);
                  }
                  setIsDeleting(false);
                }}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 disabled:opacity-50 transition-all"
              >
                {isDeleting ? "Удаление..." : "Подтвердить"}
              </button>
              <button
                onClick={() => {
                  setShowDanger(false);
                  setDangerPassword("");
                }}
                className="flex-1 py-3 rounded-xl bg-white/5 text-gray-300 font-bold hover:bg-white/10 transition-all"
              >
                {t("cancel") || "Отмена"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
