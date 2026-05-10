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
  Lock
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useT } from "../i18n/translations";
import { toast } from "sonner";

const LANGS = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "uzb", label: "O'zbek", flag: "🇺🇿" },
];

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

  // Стейты для Опасной зоны
  const [showDanger, setShowDanger] = useState(false);
  const [dangerPassword, setDangerPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Стейты для редактирования профиля
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState(currentUser?.firstName || "");
  const [editLastName, setEditLastName] = useState(currentUser?.lastName || "");
  const [editEmail, setEditEmail] = useState(currentUser?.email || "");
  const [editPassword, setEditPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateProfile = async () => {
    if (!editFirstName.trim() || !editLastName.trim() || !editEmail.trim()) {
      toast.error("Имя, Фамилия и Email обязательны");
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("access");
        const res = await fetch("http://75.119.144.200:8000/api/auth/update/", {
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
        // Синхронизируем React с новыми данными от Django
        updateUser({
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
        });
        toast.success("Профиль успешно обновлен!");
        setIsEditingProfile(false);
        setEditPassword(""); // Очищаем поле пароля после сохранения
      } else {
        toast.error(data.error || "Ошибка при обновлении профиля");
      }
    } catch (e) {
      toast.error("Нет связи с сервером");
    } finally {
      setIsSaving(false);
    }
  };

  const initials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : "SF";

  const cardCls = "liquid-glass rounded-2xl overflow-hidden";
  const sectionHead = "px-5 py-3.5 border-b border-white/20 dark:border-border flex items-center justify-between";

  return (
    <div className="p-4 lg:p-6 2xl:p-10 max-w-xl 2xl:max-w-2xl space-y-5">
      <h1 className="text-foreground" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
        {t("settingsTitle") || "Настройки"}
      </h1>

      {/* ── Profile (С возможностью редактирования) ─────────────────────────────────── */}
      <section className={cardCls}>
        <div className={sectionHead}>
          <div className="flex items-center gap-2">
            <UserIcon size={15} className="text-primary" />
            <h2 className="text-foreground" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              {t("profileSection") || "Профиль"}
            </h2>
          </div>
          {!isEditingProfile ? (
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              style={{ fontSize: "0.75rem", fontWeight: 600 }}
            >
              <Edit2 size={12} /> Изменить
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
            // Режим просмотра
            <div className="flex items-center gap-4">
              <div
                className="w-[72px] h-[72px] rounded-2xl bg-primary/15 border-2 border-primary/25 flex items-center justify-center shadow-lg flex-shrink-0"
                style={{ fontSize: "1.4rem", fontWeight: 700 }}
              >
                <span className="text-primary">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground truncate" style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p className="text-muted-foreground truncate mt-0.5" style={{ fontSize: "0.85rem" }}>
                  {currentUser?.email}
                </p>
              </div>
            </div>
          ) : (
            // Режим редактирования
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1">Имя</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1">Фамилия</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1">Email (Почта)</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm"
                />
              </div>

              <div className="space-y-1 pt-2 border-t border-white/10">
                <label className="text-gray-500 text-[10px] uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Lock size={10}/> Новый пароль (оставьте пустым, если не хотите менять)
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
                {isSaving ? "Сохранение..." : <><Save size={16}/> Сохранить изменения</>}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Appearance ──────────────────────────────── */}
      <section className={cardCls}>
        <div className={sectionHead}>
          <div className="flex items-center gap-2">
            {theme === "dark" ? <Moon size={15} className="text-primary" /> : <Sun size={15} className="text-primary" />}
            <h2 className="text-foreground" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              {t("appearanceSection")}
            </h2>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "dark", color: "#0b000b", label: "Dark" },
              { key: "light", color: "#dfe3f2", label: "Light" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => item.key !== theme && toggleTheme()}
                className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all ${theme === item.key ? "border-primary bg-primary/10" : "border-white/30 dark:border-border hover:border-primary/40"}`}
              >
                <div className="w-5 h-5 rounded border border-border flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-foreground flex-1 text-left" style={{ fontSize: "0.82rem", fontWeight: theme === item.key ? 600 : 400 }}>
                  {item.label}
                </span>
                {theme === item.key && <Check size={13} className="text-primary" />}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Language ────────────────────────────────── */}
      <section className={cardCls}>
        <div className={sectionHead}>
          <div className="flex items-center gap-2">
            <Globe size={15} className="text-primary" />
            <h2 className="text-foreground" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              {t("languageSection")}
            </h2>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3">
            {LANGS.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code as any)}
                className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border-2 transition-all ${language === lang.code ? "border-primary bg-primary/10" : "border-white/30 dark:border-border hover:border-primary/40 hover:bg-white/15 dark:hover:bg-muted/40"}`}
              >
                <span style={{ fontSize: "1.6rem" }}>{lang.flag}</span>
                <span className="text-foreground" style={{ fontSize: "0.78rem", fontWeight: language === lang.code ? 600 : 400 }}>
                  {lang.label}
                </span>
                {language === lang.code && <Check size={12} className="text-primary" />}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Danger Zone ──────────────────────────── */}
      <div className="mt-8 liquid-glass rounded-3xl p-6 sm:p-8 border border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Trash2 className="text-red-500" size={20} />
          </div>
          <div>
            <h3 className="text-red-500 font-bold text-lg">Опасная зона</h3>
            <p className="text-gray-400 text-sm">Сброс всех финансовых данных</p>
          </div>
        </div>

        <p className="text-gray-300 text-sm mb-6">
          Это действие навсегда удалит все ваши доходы и расходы. Восстановить их будет невозможно.
        </p>

        {!showDanger ? (
          <button
            onClick={() => setShowDanger(true)}
            className="px-6 py-3 rounded-xl bg-red-500/10 text-red-500 font-bold border border-red-500/30 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
          >
            Сбросить все транзакции
          </button>
        ) : (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-1.5">
              <label className="text-red-400 text-[10px] uppercase tracking-widest ml-1">
                Введите пароль для подтверждения
              </label>
              <input
                type="password"
                value={dangerPassword}
                onChange={(e) => setDangerPassword(e.target.value)}
                placeholder="Ваш текущий пароль"
                className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-red-500/30 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
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
                    toast.success("Все данные успешно удалены");
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
                {isDeleting ? "Удаление..." : "Подтвердить удаление"}
              </button>
              <button
                onClick={() => {
                  setShowDanger(false);
                  setDangerPassword("");
                }}
                className="flex-1 py-3 rounded-xl bg-white/5 text-gray-300 font-bold hover:bg-white/10 transition-all"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}