import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
  Bot,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useT } from "../i18n/translations";
import { TopographyBackground } from "./TopographyBackground";
import logo from "../../imports/lxvbrowser.png";

export function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout, language } = useApp();
  const t = useT(language);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { to: "/ai-chat", icon: Bot, label: t("aiChat") || "AI Чат" },
    { to: "/management", icon: BarChart3, label: t("management") },
    { to: "/settings", icon: Settings, label: t("settings") },
  ];
  const fName = currentUser?.firstName || currentUser?.first_name || "U";
  const lName = currentUser?.lastName || currentUser?.last_name || "S";
  const initials = `${fName[0] || ""}${lName[0] || ""}`.toUpperCase() || "SF";

  return (
    <div className="min-h-screen flex bg-transparent relative">
      <TopographyBackground />

      {/* ── Desktop Sidebar ──────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 2xl:w-72 fixed top-0 left-0 h-full z-40 bg-white/70 dark:bg-black/20 backdrop-blur-2xl border-r border-gray-200 dark:border-white/10 shadow-2xl">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-200 dark:border-white/10">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
            <img src={logo} alt="S&F" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <p className="text-gray-900 dark:text-white font-bold tracking-wider text-[0.95rem]">
              {t("appName")}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-[0.62rem] tracking-[0.06em] uppercase font-bold">
              {t("appSubtitle")}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group font-medium ${
                  isActive
                    ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={17}
                    className={
                      isActive
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
                    }
                  />
                  <span className="text-[0.88rem]">{label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User card + logout */}
        <div className="px-3 pb-5 space-y-2 border-t border-gray-200 dark:border-white/10 pt-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            {currentUser?.profilePhoto ? (
              <img
                src={currentUser.profilePhoto}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-purple-500/30 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-600 dark:text-purple-400 text-[0.72rem] font-bold">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 dark:text-white truncate text-[0.82rem] font-bold">
                {currentUser?.firstName} {currentUser?.lastName}
              </p>
              <p className="text-gray-500 dark:text-gray-400 truncate text-[0.68rem] font-medium">
                {currentUser?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-200 font-medium"
          >
            <LogOut size={15} />
            <span className="text-[0.82rem]">{t("logout")}</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/40 backdrop-blur-2xl border-b border-gray-200 dark:border-white/10 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <img src={logo} alt="S&F" className="w-6 h-6 object-contain" />
          <span className="text-gray-900 dark:text-white font-bold text-[0.95rem]">
            {t("appName")}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-gray-900 dark:text-white p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* ── Mobile Dropdown Menu (Плавная анимация) ── */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div
          className={`absolute top-[52px] left-0 right-0 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-2xl border-b border-gray-200 dark:border-white/10 p-3 space-y-1 shadow-2xl transform transition-transform duration-300 ease-out ${
            mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive
                    ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25"
                    : "text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={17}
                    className={
                      isActive
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-gray-500"
                    }
                  />
                  <span className="text-[0.9rem]">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          <div className="h-px bg-gray-200 dark:bg-white/10 my-2 mx-2" />

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all font-medium"
          >
            <LogOut size={17} />
            <span className="text-[0.9rem]">{t("logout")}</span>
          </button>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────── */}
      <main className="flex-1 lg:ml-60 2xl:ml-72 pt-[52px] lg:pt-0 pb-16 lg:pb-0 min-h-screen overflow-x-hidden relative z-10 bg-transparent">
        <div className="max-w-screen-2xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
