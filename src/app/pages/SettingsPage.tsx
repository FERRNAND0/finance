import { useState } from "react";
import {
  Moon,
  Sun,
  Globe,
  User as UserIcon,
  Check,
  Trash2,
  Edit2,
  X,
  Save,
  Lock,
  ChevronDown, // <-- Добавили иконку стрелочки
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useT } from "../i18n/translations";
import { toast } from "sonner";

export function SettingsPage() {
  const {
    currentUser,
    theme,
    language,
    toggleTheme,
    setLanguage,
    updateUser,
    deleteAllTransactions,
  } = useApp();
  const t = useT(language);

  // Стейт для выпадающего списка языков
  const [isLangOpen, setIsLangOpen] = useState(false);

  // Стейты для Опасной зоны
  const [showDanger, setShowDanger] = useState(false);
  const [dangerPassword, setDangerPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Стейты для редактирования профиля
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
      } else {
        toast.error(data.error || "Ошибка при обновлении профиля");
      }
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

  // Массив доступных языков
  const LANGS = [
    { code: "en", label: t("lang_en") || "English" },
    { code: "ru", label: t("lang_ru") || "Русский" },
    { code: "uzb", label: t("lang_uzb") || "O'zbek" },
    { code: "kk", label: t("lang_kk") || "Қазақша" },
    { code: "ky", label: t("lang_ky") || "Кыргызча" },
    { code: "de", label: t("lang_de") || "Deutsch" },
    { code: "lb", label: t("lang_lb") || "Lëtzebuergesch" },
  ];

  // Ищем лейбл для текущего выбранного языка
  const currentLangLabel =
    LANGS.find((l) => l.code === language)?.label || "Language";

  return (
    <div className="p-4 lg:p-6 2xl:p-10 max-w-xl 2xl:max-w-2xl space-y-5">
      <h1
        className="text-foreground"
        style={{ fontSize: "1.4rem", fontWeight: 700 }}
      >
        {t("settingsTitle") || "Настройки"}
      </h1>

      {/* ── Language ──────────────────────────────── */}
      {/* Убрали overflow-hidden и добавили relative z-20, чтобы меню падало поверх Опасной зоны */}
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
          {/* Кастомный Select */}
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

            {/* Выпадающее меню */}
            {isLangOpen && (
              <>
                {/* Невидимая подложка для закрытия по клику вне меню */}
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
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        language === lang.code
                          ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                          : "text-gray-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
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
      {/* ── Appearance ──────────────────────────────── */}
      <section className={cardCls}>
        <div className={sectionHead}>
          <div className="flex items-center gap-2">
            {theme === "dark" ? (
              <Moon size={15} className="text-primary" />
            ) : (
              <Sun size={15} className="text-primary" />
            )}
            <h2
              className="text-foreground"
              style={{ fontSize: "0.9rem", fontWeight: 600 }}
            >
              {t("appearanceSection") || "Внешний вид"}
            </h2>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                key: "dark",
                color: "#0b000b",
                label: t("darkMode") || "Dark Mode",
              },
              {
                key: "light",
                color: "#dfe3f2",
                label: t("lightMode") || "Light Mode",
              },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => item.key !== theme && toggleTheme()}
                className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all ${theme === item.key ? "border-primary bg-primary/10" : "border-white/30 dark:border-border hover:border-primary/40"}`}
              >
                <div
                  className="w-5 h-5 rounded border border-border flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span
                  className="text-foreground flex-1 text-left"
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: theme === item.key ? 600 : 400,
                  }}
                >
                  {item.label}
                </span>
                {theme === item.key && (
                  <Check size={13} className="text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Language ──────────────────────────────── */}
      <section className={cardCls}>
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
        <div className="p-5 relative z-20">
          {" "}
          {/* z-20 важно, чтобы меню не уходило под Опасную зону */}
          {/* Кастомный Select */}
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

            {/* Выпадающее меню */}
            {isLangOpen && (
              <>
                {/* Невидимая подложка для закрытия по клику вне меню */}
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
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        language === lang.code
                          ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                          : "text-gray-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
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
              {t("resetData") || "Сброс всех финансовых данных"}
            </p>
          </div>
        </div>

        <p className="text-gray-300 text-sm mb-6">
          {t("resetWarning") ||
            "Это действие навсегда удалит все ваши доходы и расходы. Восстановить их будет невозможно."}
        </p>

        {!showDanger ? (
          <button
            onClick={() => setShowDanger(true)}
            className="px-6 py-3 rounded-xl bg-red-500/10 text-red-500 font-bold border border-red-500/30 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
          >
            {t("resetBtn") || "Сбросить все транзакции"}
          </button>
        ) : (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-1.5">
              <label className="text-red-400 text-[10px] uppercase tracking-widest ml-1">
                {t("enterPassword") || "Введите пароль для подтверждения"}
              </label>
              <input
                type="password"
                value={dangerPassword}
                onChange={(e) => setDangerPassword(e.target.value)}
                placeholder={t("yourPassword") || "Ваш текущий пароль"}
                className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-red-500/30 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!dangerPassword) {
                    toast.error(t("passwordRequired") || "Введите пароль");
                    return;
                  }
                  setIsDeleting(true);
                  const res = await deleteAllTransactions(dangerPassword);
                  if (res.success) {
                    toast.success(
                      t("transactionDeleted") || "Все данные успешно удалены",
                    );
                    setShowDanger(false);
                    setDangerPassword("");
                  } else {
                    toast.error(res.error);
                  }
                  setIsDeleting(false);
                }}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {isDeleting
                  ? t("deleting") || "Удаление..."
                  : t("confirmDelete") || "Подтвердить удаление"}
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
