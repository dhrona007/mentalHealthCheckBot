import React from 'react';
import { Brain, Moon, Sun, Bell } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { cn } from '../../lib/utils';

interface NavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange, isDarkMode, toggleDarkMode }) => {
  const [user] = useAuthState(auth);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/popup-blocked') {
        alert('The login popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // This often happens if the user clicks login multiple times or stays on the popup too long
        console.log('Login request was cancelled or superseded.');
      } else {
        alert('Login failed. Please try again or check your internet connection.');
      }
    }
  };

  const menuItems = [
    { id: 'home', label: 'Home' },
    { id: 'assessment', label: 'Assessment' },
    { id: 'chat', label: 'Chat' },
    { id: 'mood', label: 'Mood Tracker' },
  ];

  const handleEmergency = () => {
    alert("Emergency alert system triggered. Connecting to global mental health resources... In a real emergency, please call your local emergency services (e.g., 911) immediately.");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/98 backdrop-blur-md border-b border-teal-700/20 dark:border-cyan-400/20 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange('home')}>
          <Brain className="w-8 h-8 text-teal-700 dark:text-cyan-400" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-700 to-cyan-400 bg-clip-text text-transparent font-['Sora']">
            Mentalyze
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "px-4 py-2 rounded-full font-medium transition-all",
                currentView === item.id
                  ? "bg-gradient-to-r from-teal-700 to-cyan-400 text-white shadow-lg"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:rotate-12 transition-transform"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-teal-700/20" />
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
              className="bg-gradient-to-r from-teal-700 to-cyan-400 text-white px-5 py-2 rounded-xl font-bold shadow-md hover:translate-y-[-2px] transition-all"
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
        </div>
      </div>
    </nav>
  );
};

