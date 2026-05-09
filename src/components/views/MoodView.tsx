import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Heart, Activity, Wind, Save, PlusCircle, Brain } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';
import { MoodEntry } from '../../types';
import { formatAiError, generateGeminiText, isGeminiConfigured } from '../../lib/ai';

interface SliderFieldProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (val: number) => void;
  color: string;
}

const SliderField = ({ icon, label, value, onChange, color }: SliderFieldProps) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={cn("p-2 rounded-lg bg-opacity-10", color.replace('bg-', 'text-'))}>
          {icon}
        </div>
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{label}</label>
      </div>
      <span className="text-lg font-black text-teal-700 dark:text-cyan-400">{value}</span>
    </div>
    <input
      type="range"
      min="1"
      max="10"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-700"
    />
  </div>
);

export const MoodView = () => {
  const [user] = useAuthState(auth);
  const [moodScore, setMoodScore] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [anxiety, setAnxiety] = useState(5);
  const [journal, setJournal] = useState('');
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [aiInsights, setAiInsights] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'mood_entries'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MoodEntry[];
      setHistory(entries);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      await addDoc(collection(db, 'users', user.uid, 'mood_entries'), {
        userId: user.uid,
        mood_score: moodScore,
        energy,
        anxiety,
        tags: [],
        journal_text: journal,
        timestamp: serverTimestamp(),
        source: 'manual'
      });
      setJournal('');
    } catch (error) {
      console.error("Save mood error", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getAiInsights = async () => {
    if (!user || history.length === 0) return;
    setIsAnalyzing(true);
    setAiError('');
    try {
      const moodSummary = history.slice(0, 10).map(e => ({
        score: e.mood_score,
        text: e.journal_text,
        date: e.timestamp?.toDate ? format(e.timestamp.toDate(), 'MMM d') : 'unknown'
      }));

      const text = await generateGeminiText(
        `Analyze this user's recent mood history and provide empathetic insights and small self-care tips:
        ${moodSummary.map(m => `Date: ${m.date}, Score: ${m.score}, Journal: ${m.text}`).join('\n')}`,
      );
      setAiInsights(text || "No insights available at the moment.");
    } catch (error) {
      console.error("AI Insights error", error);
      setAiError(formatAiError(error));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const chartData = [...history].reverse().map(entry => ({
    date: entry.timestamp?.toDate ? format(entry.timestamp.toDate(), 'MMM d, p') : '',
    score: entry.mood_score
  }));

  // Weekday Averages
  const weekdayData = [
    { name: 'Sun', total: 0, count: 0 },
    { name: 'Mon', total: 0, count: 0 },
    { name: 'Tue', total: 0, count: 0 },
    { name: 'Wed', total: 0, count: 0 },
    { name: 'Thu', total: 0, count: 0 },
    { name: 'Fri', total: 0, count: 0 },
    { name: 'Sat', total: 0, count: 0 },
  ];

  history.forEach(e => {
    if (e.timestamp?.toDate) {
      const date = e.timestamp.toDate();
      const day = date.getDay();
      weekdayData[day].total += e.mood_score;
      weekdayData[day].count += 1;
    }
  });

  const weekdayChartData = weekdayData.map(d => ({
    name: d.name,
    avg: d.count > 0 ? Number((d.total / d.count).toFixed(1)) : 0
  }));

  // Source Breakdown
  const sources: Record<string, number> = {};
  history.forEach(e => {
    const s = e.source || 'manual';
    sources[s] = (sources[s] || 0) + 1;
  });
  const sourceData = Object.entries(sources).map(([name, value]) => ({ name, value }));

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white dark:bg-slate-800 rounded-3xl shadow-xl">
        <Heart className="w-16 h-16 text-rose-500 mb-6 opacity-20" />
        <h3 className="text-xl font-bold mb-2">Please login to track your mood</h3>
        <p className="text-slate-500">Log your feelings daily and discover patterns over time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8 min-w-0">
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-3xl lg:rounded-[2rem] shadow-xl border border-teal-700/5">
            <h3 className="text-xl sm:text-2xl font-bold font-['Sora'] mb-6 sm:mb-8">Mood Timeline</h3>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" hide />
                  <YAxis domain={[0, 10]} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#0ea5e9' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#0f766e" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#0f766e', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl shadow-lg border border-teal-700/5 min-w-0">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Weekday Average</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayChartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                    <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                      {weekdayChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.avg > 7 ? '#0f766e' : entry.avg > 4 ? '#0ea5e9' : '#f43f5e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl shadow-lg border border-teal-700/5 min-w-0">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Entry Sources</h4>
              <div className="space-y-3">
                {sourceData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 capitalize">{s.name}</span>
                    <div className="flex-1 mx-3 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-700 rounded-full" 
                        style={{ width: `${(s.value / history.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-400">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-3xl lg:rounded-[2rem] shadow-xl border border-teal-700/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <h3 className="text-lg sm:text-xl font-bold font-['Sora'] flex items-center gap-2">
                        <Brain className="text-teal-700 w-6 h-6" /> AI Reflective Insights
                    </h3>
                    <button 
                        onClick={getAiInsights}
                        disabled={isAnalyzing || history.length === 0}
                        className="text-xs font-bold text-teal-700 hover:underline disabled:opacity-50"
                    >
                        {isAnalyzing ? "Analyzing..." : "Refresh Insights"}
                    </button>
                </div>
                {aiInsights ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-2xl border border-teal-700/10">
                        <ReactMarkdown>{aiInsights}</ReactMarkdown>
                    </div>
                ) : aiError ? (
                    <p className="text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20 border border-rose-500/20 rounded-2xl p-4 text-sm">
                        {aiError}
                    </p>
                ) : !isGeminiConfigured() ? (
                    <p className="text-amber-700 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 border border-amber-500/20 rounded-2xl p-4 text-sm">
                        Gemini is not configured. Add <strong>VITE_GEMINI_API_KEY</strong> to a local .env file and restart the dev server.
                    </p>
                ) : (
                    <p className="text-slate-400 italic text-center py-8">
                        {history.length > 0 ? "Click 'Refresh Insights' to get AI-powered feedback on your recent mood logs." : "Log a few entries to enable AI insights."}
                    </p>
                )}
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8 min-w-0">
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-3xl lg:rounded-[2rem] shadow-xl border border-teal-700/5">
            <h3 className="text-lg sm:text-xl font-bold font-['Sora'] mb-6 flex items-center gap-2">
              <PlusCircle className="text-teal-700" /> Log Check-in
            </h3>
            
            <div className="space-y-8">
              <SliderField 
                icon={<Heart className="text-rose-500 w-4 h-4" />}
                label="Mood" 
                value={moodScore} 
                onChange={setMoodScore} 
                color="bg-rose-500" 
              />
              <SliderField 
                icon={<Activity className="text-amber-500 w-4 h-4" />}
                label="Energy" 
                value={energy} 
                onChange={setEnergy} 
                color="bg-amber-500" 
              />
              <SliderField 
                icon={<Wind className="text-cyan-500 w-4 h-4" />}
                label="Anxiety" 
                value={anxiety} 
                onChange={setAnxiety} 
                color="bg-cyan-500" 
              />

              <div>
                <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Reflection</label>
                <textarea
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                  placeholder="How was your day?"
                  className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl p-4 focus:ring-2 focus:ring-teal-700 outline-none text-slate-800 dark:text-slate-200"
                  rows={4}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-teal-700 to-cyan-400 text-white py-4 rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-3xl lg:rounded-[2rem] shadow-xl border border-teal-700/5">
            <h3 className="text-lg sm:text-xl font-bold font-['Sora'] mb-6">Recent Logs</h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {history.map((entry, i) => (
                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-teal-700 dark:text-cyan-400 uppercase tracking-widest">{entry.source || 'manual'}</span>
                    <span className="text-[10px] font-bold text-slate-400">{entry.timestamp?.toDate ? format(entry.timestamp.toDate(), 'MMM d, h:mm a') : ''}</span>
                  </div>
                  {entry.journal_text && <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 italic">"{entry.journal_text}"</p>}
                  <div className="flex gap-3 text-[10px] font-bold text-slate-500">
                      <span>M: {entry.mood_score}</span>
                      <span>E: {entry.energy}</span>
                      <span>A: {entry.anxiety}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
