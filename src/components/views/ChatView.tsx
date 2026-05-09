import React, { useState, useEffect, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  arrayUnion,
  limit,
} from "firebase/firestore";
import {
  Send,
  Loader2,
  Sparkles,
  Mic,
  Volume2,
  VolumeX,
  History,
  Plus,
  AlertTriangle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "../../lib/utils";
import { Message, ChatThread } from "../../types";
import { buildAutoMoodFromText, detectCrisis } from "../../lib/logic";
import { formatAiError, generateGeminiText, isGeminiConfigured } from "../../lib/ai";

export const ChatView = () => {
  const [user] = useAuthState(auth);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<ChatThread[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>("main");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    // Load History Sidebar
    const historyQuery = query(
      collection(db, "users", user.uid, "chats"),
      orderBy("updatedAt", "desc"),
      limit(10),
    );

    const unsubHistory = onSnapshot(historyQuery, (snapshot) => {
      const threads = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatThread[];
      setHistory(threads);
    });

    // Load Active Chat
    const chatRef = doc(db, "users", user.uid, "chats", activeChatId);
    const unsubChat = onSnapshot(chatRef, (doc) => {
      if (doc.exists()) {
        setMessages(doc.data().messages || []);
      } else {
        setMessages([]);
      }
    });

    return () => {
      unsubHistory();
      unsubChat();
    };
  }, [user, activeChatId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Voice Recognition Setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startNewChat = () => {
    const newId = `chat_${Date.now()}`;
    setActiveChatId(newId);
    setMessages([]);
  };

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const currentInput = input;
    const userMessage: Message = {
      role: "user",
      content: currentInput,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setErrorMessage("");

    try {
      const crisis = detectCrisis(currentInput);
      if (crisis.risk_level === "high") {
        setShowCrisisAlert(true);
      }

      const autoMood = buildAutoMoodFromText(currentInput, "chat");
      addDoc(collection(db, "users", user.uid, "mood_entries"), {
        ...autoMood,
        userId: user.uid,
        timestamp: serverTimestamp(),
      }).catch((error) => console.error("Mood auto-log failed", error));

      const responseText = await generateGeminiText(
        `You are Mentalyze, a compassionate AI mental health companion.
        ${crisis.risk_level === "high" ? "CRITICAL: The user expressed distress. Provide warm support and safety resources." : ""}
        User history: ${messages
          .slice(-5)
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n")}
        Current user message: ${currentInput}
        Respond warmly and supportively. Keep it human.`,
      );

      const assistantMessage: Message = {
        role: "assistant",
        content: responseText || "I'm sorry, I couldn't process that right now.",
        timestamp: new Date().toISOString(),
      };

      const chatRef = doc(db, "users", user.uid, "chats", activeChatId);
      await setDoc(
        chatRef,
        {
          userId: user.uid,
          messages: arrayUnion(userMessage, assistantMessage),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      if (isSpeaking) speak(assistantMessage.content);
    } catch (error) {
      console.error("Chat error", error);
      const friendlyError = formatAiError(error);
      setErrorMessage(friendlyError);

      const assistantMessage: Message = {
        role: "assistant",
        content: friendlyError,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const chatRef = doc(db, "users", user.uid, "chats", activeChatId);
      await setDoc(
        chatRef,
        {
          userId: user.uid,
          messages: arrayUnion(userMessage, assistantMessage),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ).catch((saveError) => console.error("Failed to save chat error", saveError));
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
        <Sparkles className="w-16 h-16 text-teal-700 mb-6 opacity-20" />
        <h3 className="text-xl font-bold mb-2">
          Please login to start chatting
        </h3>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 h-[calc(100vh-9rem)] sm:h-[80vh] bg-white dark:bg-slate-800 rounded-3xl sm:rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl border border-teal-700/5 dark:border-cyan-400/10 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hidden md:flex flex-col">
        <div className="p-4">
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-teal-700/20 py-3 rounded-xl font-bold text-sm hover:bg-teal-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {history.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChatId(chat.id!)}
              className={cn(
                "w-full text-left p-3 rounded-xl text-sm transition-all flex items-center gap-2 truncate",
                activeChatId === chat.id
                  ? "bg-teal-700 text-white font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
              )}
            >
              <History className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                {chat.messages[0]?.content || "New Conversation"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-bold font-['Sora']">Mentalyze</h3>
            <p className="text-xs text-slate-500">Always here to listen.</p>
          </div>
          <button
            onClick={() => setIsSpeaking(!isSpeaking)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isSpeaking ? "text-teal-700 bg-teal-50" : "text-slate-400",
            )}
          >
            {isSpeaking ? <Volume2 /> : <VolumeX />}
          </button>
        </div>

        {showCrisisAlert && (
          <div className="m-4 sm:m-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-500/30 rounded-2xl flex items-start sm:items-center gap-3 sm:gap-4 animate-in slide-in-from-top-2">
            <AlertTriangle className="text-rose-500 w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-rose-700 dark:text-rose-300 font-bold mb-1">
                We're here for you.
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-400 leading-tight">
                If you're in danger, please contact local emergency services or
                a crisis hotline immediately.
              </p>
            </div>
            <button
              onClick={() => setShowCrisisAlert(false)}
              className="px-2 text-rose-400 font-bold text-xl"
            >
              ×
            </button>
          </div>
        )}

        {!isGeminiConfigured() && (
          <div className="mx-4 sm:mx-6 mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-500/30 rounded-2xl text-sm text-amber-800 dark:text-amber-200">
            Gemini is not configured. Add <strong>VITE_GEMINI_API_KEY</strong>{" "}
            to a local .env file and restart the dev server.
          </div>
        )}

        {errorMessage && (
          <div className="mx-4 sm:mx-6 mt-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-500/30 rounded-2xl text-sm text-rose-700 dark:text-rose-200">
            {errorMessage}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col max-w-[92%] sm:max-w-[85%]",
                msg.role === "user"
                  ? "ml-auto items-end"
                  : "mr-auto items-start",
              )}
            >
              <div
                className={cn(
                  "px-4 sm:px-5 py-3 rounded-2xl shadow-sm break-words",
                  msg.role === "user"
                    ? "bg-teal-700 text-white rounded-tr-none"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none",
                )}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 italic text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Thinking...
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-3 sm:p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-end gap-2">
            <button
              onClick={toggleListening}
              className={cn(
                "h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 flex items-center justify-center rounded-2xl transition-all",
                isListening
                  ? "bg-rose-500 text-white animate-pulse"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-500",
              )}
            >
              <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Tell me what's on your mind..."
              className="min-w-0 flex-1 bg-white dark:bg-slate-800 border-none rounded-2xl px-4 sm:px-6 py-3 sm:py-4 focus:ring-2 focus:ring-teal-700 outline-none shadow-sm dark:text-white"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center bg-teal-700 text-white rounded-2xl hover:scale-105 transition-transform disabled:opacity-50"
            >
              <Send className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
