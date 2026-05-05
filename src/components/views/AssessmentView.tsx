import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import { ClipboardList, ChevronRight, ChevronLeft, CheckCircle, Loader2, Sparkles, Download, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';
import { buildAssessmentMood, detectCrisis } from '../../lib/logic';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const AssessmentView = () => {
  const [user] = useAuthState(auth);
  const [step, setStep] = useState(0); // 0: start, 1: chatting, 2: analysis
  const [messages, setMessages] = useState<{question: string, answer: string}[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [moodLogged, setMoodLogged] = useState(false);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);

  const startAssessment = async () => {
    setStep(1);
    setIsLoading(true);
    try {
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "You are conducting a mental health check-in. Start by asking a warm, open-ended question about how the user has been feeling lately."
      });
      setCurrentQuestion(result.text || "How have you been feeling lately?");
    } catch (error) {
      console.error("Start assessment error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponse = async () => {
    if (!input.trim() || isLoading) return;

    const currentInput = input;
    const crisis = detectCrisis(currentInput);
    if (crisis.risk_level === 'high') setShowCrisisAlert(true);

    const newMessages = [...messages, { question: currentQuestion, answer: currentInput }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Determine if we have enough info or need more
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are conducting a mental health assessment. 
        Conversation history: ${newMessages.map(m => `Q: ${m.question}\nA: ${m.answer}`).join('\n')}
        
        If you have enough information (after 5-8 questions), output the word "FINISH". 
        Otherwise, ask the next relevant question to understand their emotional state better.`
      });

      const text = result.text?.trim() || "";
      if (text.toUpperCase().includes("FINISH") || newMessages.length >= 8) {
        generateFinalAnalysis(newMessages);
      } else {
        setCurrentQuestion(text);
      }
    } catch (error) {
       console.error("Assessment step error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFinalAnalysis = async (answersList: {question: string, answer: string}[]) => {
    setStep(2);
    setIsAnalyzing(true);

    try {
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Perform a mental health check-in analysis based on these answers:
        ${answersList.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n')}
        Provide a warm, empathetic summary and 3-5 practical self-care suggestions. Always remind the user that this is not a clinical diagnosis.`
      });
      const text = result.text || "Sorry, we couldn't generate your analysis at this time.";
      setAnalysis(text);

      // Save Assessment to Firestore
      await addDoc(collection(db, 'users', user!.uid, 'assessments'), {
        userId: user!.uid,
        answers: answersList,
        analysis: text,
        type: 'dynamic',
        timestamp: serverTimestamp()
      });

      // Auto Mood Logging
      const autoEntry = buildAssessmentMood(answersList, 'dynamic');
      if (autoEntry) {
        await addDoc(collection(db, 'users', user!.uid, 'mood_entries'), {
          ...autoEntry,
          userId: user!.uid,
          timestamp: serverTimestamp(),
        });
        setMoodLogged(true);
      }

    } catch (error) {
      console.error("Analysis error", error);
      setAnalysis("Sorry, we couldn't generate your analysis at this time. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-800 rounded-3xl shadow-xl">
        <ClipboardList className="w-16 h-16 text-teal-700 mb-6 opacity-20" />
        <h3 className="text-xl font-bold mb-2">Please login to take an assessment</h3>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {step === 0 && (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-[2rem] shadow-xl text-center border border-teal-700/5">
          <div className="w-20 h-20 bg-teal-50 dark:bg-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <ClipboardList className="w-10 h-10 text-teal-700 dark:text-cyan-400" />
          </div>
          <h2 className="text-3xl font-bold font-['Sora'] mb-4">AI-Driven Mental Health Check-in</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed max-w-md mx-auto">
            Experience a dynamic, personalized assessment powered by AI. No fixed questions—just a natural conversation to understand your well-being.
          </p>
          <button 
            onClick={startAssessment}
            className="bg-gradient-to-r from-teal-700 to-cyan-400 text-white px-10 py-4 rounded-2xl font-bold shadow-lg hover:scale-105 transition-transform"
          >
            Start Dynamic Check-in
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-8">
          {showCrisisAlert && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-500/30 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2">
              <AlertTriangle className="text-rose-500 w-10 h-10 flex-shrink-0" />
              <div className="flex-1">
                  <p className="text-rose-700 dark:text-rose-300 font-bold mb-1">We're here for you.</p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 leading-tight">If you're in danger, please contact local emergency services or a crisis hotline immediately.</p>
              </div>
              <button onClick={() => setShowCrisisAlert(false)} className="px-2 text-rose-400 font-bold text-xl">×</button>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 p-12 rounded-[2.5rem] shadow-2xl border border-teal-700/5 min-h-[400px] flex flex-col">
            <div className="flex-1">
                <div className="flex items-center gap-2 text-teal-700 mb-4 font-bold text-sm uppercase tracking-widest">
                    <Sparkles className="w-4 h-4" /> Question {messages.length + 1}
                </div>
                <h3 className="text-2xl font-bold mb-10 text-slate-800 dark:text-white leading-tight">
                {isLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : currentQuestion}
                </h3>
            </div>
            
            <div className="space-y-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-6 focus:ring-2 focus:ring-teal-700 outline-none shadow-sm dark:text-white"
                rows={4}
              />
              <button
                onClick={handleResponse}
                disabled={isLoading || !input.trim()}
                className="w-full bg-teal-700 text-white py-5 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-teal-800 transition-colors"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] shadow-xl border border-teal-700/5">
            {isAnalyzing ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-16 h-16 text-teal-700 animate-spin mb-6" />
                <h3 className="text-2xl font-bold mb-2">Analyzing your conversation...</h3>
                <p className="text-slate-500">Mentalyze is processing your data with AI.</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-teal-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-teal-700 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold font-['Sora']">Dynamic Report</h3>
                    <p className="text-sm text-slate-500">Completed just now</p>
                  </div>
                </div>

                {moodLogged && (
                  <div className="mb-6 p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-700/20 rounded-2xl flex items-center gap-3 text-teal-700 dark:text-cyan-400">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">Your mood history has been updated based on your responses.</p>
                  </div>
                )}

                <div className="prose prose-teal dark:prose-invert max-w-none mb-10">
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>

                <div className="flex flex-wrap gap-4 pt-8 border-t border-slate-100 dark:border-slate-700">
                  <button onClick={() => { setStep(0); setMessages([]); }} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                    Back to Start
                  </button>
                  <button className="flex-1 bg-teal-700 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" /> Save Analysis
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

