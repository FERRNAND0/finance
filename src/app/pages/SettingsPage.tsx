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
  Palette,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useT } from "../i18n/translations";
import { toast } from "sonner";

export function SettingsPage() {
  const {
    currentUser,
    theme,
    setTheme,
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

  const THEMES = [
    {
      key: "default",
      color: "linear-gradient(135deg, #8b5cf6, #0b000b)",
      label: t("theme_default") || "Our Signature",
    },
    {
      key: "bw",
      color: "linear-gradient(135deg, #4b5563, #000000)",
      label: t("theme_bw") || "Black & White",
    },
    {
      key: "white",
      color: "linear-gradient(135deg, #e5e7eb, #ffffff)",
      label: t("theme_white") || "Pure White",
    },
    {
      key: "gray",
      color: "linear-gradient(135deg, #9ca3af, #1f2937)",
      label: t("theme_gray") || "Graphite Gray",
    },
    {
      key: "sea-green",
      color: "linear-gradient(135deg, #10b981, #064e3b)",
      label: t("theme_sea_green") || "Sea Green",
    },
    {
      key: "sea-blue",
      color: "linear-gradient(135deg, #0ea5e9, #0c4a6e)",
      label: t("theme_sea_blue") || "Sea Blue",
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
      <section className={cardCls}>
        <div className={sectionHead}>
          <div className="flex items-center gap-2">
            <UserIcon size={15} className="text-primary" />
            <h2
              className="text-foreground"
              style={{ fontSize: "0.9rem", fontWeight: 600 }}
            >
              {t("profileSection") || "Профиль"}
            </h2>
          </div>
          {!isEditingProfile ? (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              style={{ fontSize: "0.75rem", fontWeight: 600 }}
            >
              <Edit2 size={12} /> {t("edit") || "Изменить"}
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditingProfile(false);
                setEditFirstName(currentUser?.firstName || "");
                setEditLastName(currentUser?.lastName || "");
                setEditEmail(currentUser?.email || "");
                setEditPassword("");
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="p-5">
          {!isEditingProfile ? (
            <div className="flex items-center gap-4">
              <div
                className="w-[72px] h-[72px] rounded-2xl bg-primary/15 border-2 border-primary/25 flex items-center justify-center shadow-lg flex-shrink-0"
                style={{ fontSize: "1.4rem", fontWeight: 700 }}
              >
                <span className="text-primary">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-foreground truncate"
                  style={{ fontSize: "1.2rem", fontWeight: 700 }}
                >
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p
                  className="text-muted-foreground truncate mt-0.5"
                  style={{ fontSize: "0.85rem" }}
                >
                  {currentUser?.email}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1">
                    {t("firstName") || "Имя"}
                  </label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1">
                    {t("lastName") || "Фамилия"}
                  </label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1">
                  {t("emailLabel") || "Email"}
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm"
                />
              </div>
              <div className="space-y-1 pt-2 border-t border-white/10">
                <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Lock size={10} />{" "}
                  {t("newPassword") || "Новый пароль (оставьте пустым)"}
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm"
                />
              </div>
              <button
                onClick={handleUpdateProfile}
                disabled={isSaving}
                className="w-full py-2.5 mt-2 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/20"
              >
                {isSaving ? (
                  t("saving") || "Сохранение..."
                ) : (
                  <>
                    <Save size={16} />{" "}
                    {t("saveSettings") || "Сохранить изменения"}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Appearance (Темы) ──────────────────────────────── */}
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
          {/* Скрываем нативный скроллбар через Tailwind-хитрости */}
          <div className="flex overflow-x-auto gap-3 pb-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {THEMES.map((item) => (
              <button
                key={item.key}
                onClick={() => setTheme && setTheme(item.key)}
                className={`flex-shrink-0 snap-start flex items-center gap-3 p-3 rounded-xl border-2 transition-all w-[160px] sm:w-[180px] ${
                  theme === item.key
                    ? "border-primary bg-primary/10"
                    : "border-transparent bg-black/5 dark:bg-white/5 hover:border-primary/40"
                }`}
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
