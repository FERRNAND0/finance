import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
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
    { to: "/management", icon: BarChart3, label: t("management") },
    { to: "/settings", icon: Settings, label: t("settings") },
  ];
  const fName = currentUser?.firstName || currentUser?.first_name || "U";
  const lName = currentUser?.lastName || currentUser?.last_name || "S";
  const initials = `${fName[0] || ""}${lName[0] || ""}`.toUpperCase() || "SF";

  return (
    <div className="min-h-screen flex bg-background relative">
      {/* Global topography background */}
      <TopographyBackground />

      {/* ── Desktop Sidebar ──────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 2xl:w-72 glass-sidebar fixed top-0 left-0 h-full z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/20 dark:border-sidebar-border">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
            <img src={logo} alt="S&F" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <p
              className="text-sidebar-foreground font-semibold tracking-wider"
              style={{ fontSize: "0.95rem" }}
            >
              {t("appName")}
            </p>
            <p
              className="text-muted-foreground"
              style={{
                fontSize: "0.62rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
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
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/25 shadow-sm"
                    : "text-sidebar-foreground/65 hover:bg-white/20 dark:hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={17}
                    className={
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-sidebar-foreground transition-colors"
                    }
                  />
                  <span style={{ fontSize: "0.88rem" }}>{label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User card + logout */}
        <div className="px-3 pb-5 space-y-2 border-t border-white/20 dark:border-sidebar-border pt-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/20 dark:bg-sidebar-accent/50 border border-white/30 dark:border-sidebar-border">
            {currentUser?.profilePhoto ? (
              <img
                src={currentUser.profilePhoto}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-primary/30 flex-shrink-0"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full bg-primary/20 border border-primary/35 flex items-center justify-center flex-shrink-0 text-primary"
                style={{ fontSize: "0.72rem", fontWeight: 700 }}
              >
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p
                className="text-sidebar-foreground truncate"
                style={{ fontSize: "0.82rem", fontWeight: 500 }}
              >
                {currentUser?.firstName} {currentUser?.lastName}
              </p>
              <p
                className="text-muted-foreground truncate"
                style={{ fontSize: "0.68rem" }}
              >
                {currentUser?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
          >
            <LogOut size={15} />
            <span style={{ fontSize: "0.82rem" }}>{t("logout")}</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-header px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="S&F" className="w-6 h-6 object-contain" />
          <span
            className="text-sidebar-foreground font-semibold"
            style={{ fontSize: "0.95rem" }}
          >
            {t("appName")}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-sidebar-foreground p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-sidebar-accent transition-colors"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* ── Mobile Dropdown Menu ─────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute top-[52px] left-0 right-0 glass-header border-t border-white/20 dark:border-sidebar-border p-3 space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/25"
                      : "text-sidebar-foreground/70 hover:bg-white/20 dark:hover:bg-sidebar-accent"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={17}
                      className={
                        isActive ? "text-primary" : "text-muted-foreground"
                      }
                    />
                    <span style={{ fontSize: "0.9rem" }}>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut size={17} />
              <span style={{ fontSize: "0.9rem" }}>{t("logout")}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Nav ────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-header border-t border-white/20 dark:border-sidebar-border flex justify-around py-1.5 safe-area-pb">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} />
                <span
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Main Content ─────────────────────────────── */}
      <main className="flex-1 lg:ml-60 2xl:ml-72 pt-[52px] lg:pt-0 pb-16 lg:pb-0 min-h-screen overflow-x-hidden relative z-10">
        <div className="max-w-screen-2xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
