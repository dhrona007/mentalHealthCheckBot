/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "./lib/firebase";
import { Navbar } from "./components/layout/Navbar";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { ChatView } from "./components/views/ChatView";
import { MoodView } from "./components/views/MoodView";
import { AssessmentView } from "./components/views/AssessmentView";

export type ThemeMode = "light" | "dark" | "system";

const getStoredTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";

  const saved = localStorage.getItem("theme");
  return saved === "light" || saved === "dark" || saved === "system"
    ? saved
    : "light";
};

const systemPrefersDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

export default function App() {
  const [user] = useAuthState(auth);
  const [currentView, setCurrentView] = useState("home");
  const [themeMode, setThemeMode] = useState<ThemeMode>(getStoredTheme);
  const [isDarkMode, setIsDarkMode] = useState(
    () => themeMode === "dark" || (themeMode === "system" && systemPrefersDark()),
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const shouldUseDark =
        themeMode === "dark" || (themeMode === "system" && media.matches);

      setIsDarkMode(shouldUseDark);
      document.documentElement.classList.toggle("dark", shouldUseDark);
      document.documentElement.dataset.theme = shouldUseDark ? "dark" : "light";
      localStorage.setItem("theme", themeMode);
    };

    applyTheme();

    if (themeMode !== "system") return;

    media.addEventListener("change", applyTheme);
    return () => {
      media.removeEventListener("change", applyTheme);
    };
  }, [themeMode]);

  useEffect(() => {
    const syncUser = async () => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
          });
        }
      }
    };
    syncUser();
  }, [user]);

  const toggleDarkMode = () =>
    setThemeMode((mode) => (mode === "dark" ? "light" : "dark"));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1220] transition-colors duration-300">
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        themeMode={themeMode}
        isDarkMode={isDarkMode}
        onThemeChange={setThemeMode}
        toggleDarkMode={toggleDarkMode}
      />

      <main className="pt-24 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {currentView === "home" && (
          <HomeView
            onStartChat={() => setCurrentView("chat")}
            onStartAssessment={() => setCurrentView("assessment")}
          />
        )}
        {currentView === "chat" && <ChatView />}
        {currentView === "assessment" && <AssessmentView />}
        {currentView === "mood" && <MoodView />}
      </main>

      <footer className="py-8 text-center text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <p className="mb-2 font-medium">
            Made with ❤️ for better mental health
          </p>
          <p className="text-sm opacity-60">
            © 2026 Mentalyze AI Companion. Always seek professional help for
            persistent mental health issues.
          </p>
        </div>
      </footer>
    </div>
  );
}

// HomeView component
const HomeView = ({
  onStartChat,
  onStartAssessment,
}: {
  onStartChat: () => void;
  onStartAssessment: () => void;
}) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="relative overflow-hidden rounded-3xl sm:rounded-[2rem] lg:rounded-[2.5rem] bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-600 px-5 sm:px-8 py-14 sm:py-20 text-white text-center shadow-2xl mb-10 sm:mb-16 border border-white/10">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div className="relative z-10 max-w-4xl mx-auto">
        <span className="inline-block px-4 py-1 rounded-full bg-white/10 backdrop-blur-md text-sm font-bold mb-6 border border-white/20">
          {/* <--Powered by Gemini 1.5 Flash--> */}
        </span>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold font-['Sora'] mb-6 tracking-tight leading-tight">
          Mental Wellness That{" "}
          <span className="text-cyan-300">Feels Human</span>
        </h2>
        <p className="text-lg sm:text-xl md:text-2xl mb-10 sm:mb-12 opacity-90 leading-relaxed font-light">
          Experience AI-powered emotional support, personalized assessments, and
          intuitive mood tracking in one polished application.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
          <button
            onClick={onStartChat}
            className="w-full sm:w-auto justify-center bg-white text-teal-800 px-6 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold shadow-2xl hover:scale-105 transition-transform flex items-center gap-2 group"
          >
            Start Support Chat
            <span className="group-hover:translate-x-1 transition-transform">
              →
            </span>
          </button>
          <button
            onClick={onStartAssessment}
            className="w-full sm:w-auto bg-white/10 backdrop-blur-md text-white border border-white/30 px-6 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold shadow-xl hover:bg-white/20 transition-all"
          >
            Quick Check-in
          </button>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
      <FeatureCard
        icon="🧠"
        title="AI Chat"
        description="Compassionate, safe conversations with an AI that understands context and provides real support."
      />
      <FeatureCard
        icon="📝"
        title="Assessments"
        description="Deeply personal check-ins that generate actionable reports and self-care plans."
      />
      <FeatureCard
        icon="📉"
        title="Mood Timeline"
        description="Beautiful data visualization of your emotional journey so you can spot trends early."
      />
      <FeatureCard
        icon="🛡️"
        title="Safety First"
        description="Built-in emergency response pathways and crisis-aware logic to keep you safe."
      />
    </div>
  </div>
);

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) => (
  <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 lg:p-10 rounded-3xl lg:rounded-[2rem] shadow-lg hover:-translate-y-2 transition-all border border-teal-700/5 dark:border-cyan-400/10 relative overflow-hidden group">
    <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-700 opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="text-4xl sm:text-5xl mb-5 sm:mb-8 group-hover:scale-110 transition-transform inline-block">
      {icon}
    </div>
    <h3 className="text-xl sm:text-2xl font-bold mb-4 font-['Sora'] text-slate-800 dark:text-white">
      {title}
    </h3>
    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base sm:text-lg">
      {description}
    </p>
  </div>
);
