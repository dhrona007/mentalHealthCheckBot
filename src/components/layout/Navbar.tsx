import React, { useState } from "react";
import { Bell, Brain, Check, Menu, Monitor, Moon, Sun, X } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, googleProvider } from "../../lib/firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { cn } from "../../lib/utils";
import type { ThemeMode } from "../../App";

interface NavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  themeMode: ThemeMode;
  isDarkMode: boolean;
  onThemeChange: (mode: ThemeMode) => void;
  toggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  themeMode,
  isDarkMode,
  onThemeChange,
  toggleDarkMode,
}) => {
  const [user] = useAuthState(auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === "auth/popup-blocked") {
        alert(
          "The login popup was blocked by your browser. Please allow popups for this site and try again.",
        );
      } else if (error.code === "auth/cancelled-popup-request") {
        // This often happens if the user clicks login multiple times or stays on the popup too long
        console.log("Login request was cancelled or superseded.");
      } else {
        alert(
          "Login failed. Please try again or check your internet connection.",
        );
      }
    }
  };

  const menuItems = [
    { id: "home", label: "Home" },
    { id: "assessment", label: "Assessment" },
    { id: "chat", label: "Chat" },
    { id: "mood", label: "Mood Tracker" },
  ];

  const handleEmergency = () => {
    alert(
      "Emergency alert system triggered. Connecting to global mental health resources... In a real emergency, please call your local emergency services (e.g., 911) immediately.",
    );
  };

  const handleViewChange = (view: string) => {
    onViewChange(view);
    setIsMenuOpen(false);
  };

  const themeOptions: { id: ThemeMode; label: string; icon: React.ReactNode }[] =
    [
      { id: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
      { id: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
      { id: "system", label: "System", icon: <Monitor className="w-4 h-4" /> },
    ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-teal-700/20 dark:border-cyan-400/20 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div
          className="flex min-w-0 items-center gap-2 cursor-pointer"
          onClick={() => handleViewChange("home")}
        >
          <Brain className="w-8 h-8 flex-shrink-0 text-teal-700 dark:text-cyan-400" />
          <h1 className="truncate text-xl sm:text-2xl font-bold bg-gradient-to-r from-teal-700 to-cyan-400 bg-clip-text text-transparent font-['Sora']">
            Mentalyze
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              className={cn(
                "px-4 py-2 rounded-full font-medium transition-all",
                currentView === item.id
                  ? "bg-gradient-to-r from-teal-700 to-cyan-400 text-white shadow-lg"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <button
              onClick={() => setIsThemeOpen((open) => !open)}
              onDoubleClick={toggleDarkMode}
              aria-label={`Theme: ${themeMode}`}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {themeMode === "system" ? (
                <Monitor className="w-5 h-5" />
              ) : isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {isThemeOpen && (
              <div className="absolute right-0 mt-3 w-40 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-xl">
                {themeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      onThemeChange(option.id);
                      setIsThemeOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      themeMode === option.id
                        ? "bg-teal-50 text-teal-700 dark:bg-cyan-400/10 dark:text-cyan-300"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </span>
                    {themeMode === option.id && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <img
                src={user.photoURL || ""}
                alt={user.displayName || ""}
                className="w-8 h-8 rounded-full border border-teal-700/20"
              />
              <button
                onClick={() => signOut(auth)}
                className="hidden sm:block text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-cyan-400"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-gradient-to-r from-teal-700 to-cyan-400 text-white px-4 sm:px-5 py-2 rounded-xl font-bold shadow-md hover:translate-y-[-2px] transition-all"
            >
              Login
            </button>
          )}

          <button
            onClick={handleEmergency}
            className="bg-rose-500 text-white p-2 rounded-xl hover:bg-rose-600 transition-colors hidden sm:flex items-center gap-2"
          >
            <Bell className="w-5 h-5" />
            <span className="text-sm font-bold">Emergency</span>
          </button>

          <button
            onClick={() => setIsMenuOpen((open) => !open)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden max-w-7xl mx-auto pt-3">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 p-2 border border-slate-200 dark:border-slate-700">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                className={cn(
                  "px-3 py-3 rounded-xl font-medium text-sm transition-all",
                  currentView === item.id
                    ? "bg-gradient-to-r from-teal-700 to-cyan-400 text-white shadow-lg"
                    : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900",
                )}
              >
                {item.label}
              </button>
            ))}
            {user && (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  signOut(auth);
                }}
                className="col-span-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-3 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-bold"
              >
                Logout
              </button>
            )}
            <button
              onClick={handleEmergency}
              className="col-span-2 bg-rose-500 text-white px-3 py-3 rounded-xl hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
            >
              <Bell className="w-5 h-5" />
              <span className="text-sm font-bold">Emergency</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
