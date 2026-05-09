import React, { useMemo, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { jsPDF } from "jspdf";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ClipboardList,
  Download,
  Loader2,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { buildAssessmentMood, detectCrisis } from "../../lib/logic";
import {
  AssessmentQuestion,
  assessmentQuestions,
} from "../../data/assessmentQuestions";
import { formatAiError, generateGeminiText, isGeminiConfigured } from "../../lib/ai";

type AssessmentMode = "simple" | "detailed";
type AssessmentStep = "start" | "questions" | "analysis";

interface AssessmentAnswer {
  questionId: string;
  question: string;
  answer: string;
}

interface AssessmentEntry extends AssessmentAnswer {
  selectedOption: string;
  customAnswer: string;
}

const MODE_CONFIG: Record<
  AssessmentMode,
  { label: string; description: string; min: number; max: number }
> = {
  simple: {
    label: "Simple Assessment",
    description: "A shorter check-in using the core screening questions.",
    min: 4,
    max: 7,
  },
  detailed: {
    label: "Detailed Assessment",
    description: "A deeper check-in that can explore more areas when needed.",
    min: 6,
    max: 12,
  },
};

const getQuestionBank = (mode: AssessmentMode) =>
  assessmentQuestions.filter((question) =>
    mode === "simple" ? question.general : question.detailed,
  );

const formatAnswer = (selectedOption: string, customAnswer: string) => {
  const trimmedCustom = customAnswer.trim();
  if (selectedOption && trimmedCustom) {
    return `${selectedOption}. ${trimmedCustom}`;
  }

  return selectedOption || trimmedCustom;
};

const toAssessmentAnswers = (entries: AssessmentEntry[]): AssessmentAnswer[] =>
  entries.map(({ questionId, question, answer }) => ({
    questionId,
    question,
    answer,
  }));

const cleanReportText = (text: string) =>
  text
    .replace(/[#*_`>]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .trim();

const addWrappedText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const lines = doc.splitTextToSize(text, maxWidth);
  let nextY = y;

  lines.forEach((line: string) => {
    if (nextY > pageHeight - 18) {
      doc.addPage();
      nextY = 18;
    }
    doc.text(line, x, nextY);
    nextY += 7;
  });

  return nextY;
};

const extractQuestionFromAi = (
  aiText: string | undefined,
  entries: AssessmentEntry[],
  bank: AssessmentQuestion[],
): AssessmentQuestion | "finish" | null => {
  const text = aiText?.trim() || "";
  if (text.toUpperCase().includes("FINISH")) return "finish";

  const answeredIds = new Set(entries.map((entry) => entry.questionId));
  return (
    bank.find(
      (question) =>
        !answeredIds.has(question.id) &&
        new RegExp(`\\b${question.id}\\b`, "i").test(text),
    ) || null
  );
};

const getFallbackQuestion = (
  entries: AssessmentEntry[],
  bank: AssessmentQuestion[],
) => {
  const answeredIds = new Set(entries.map((entry) => entry.questionId));

  const latestAnswer = entries.at(-1)?.answer.toLowerCase() || "";
  if (
    /(hurt|harm|dead|die|suicide|kill|end it)/i.test(latestAnswer) &&
    !answeredIds.has("q14")
  ) {
    return bank.find((question) => question.id === "q14") || null;
  }

  return bank.find((question) => !answeredIds.has(question.id)) || null;
};

export const AssessmentView = () => {
  const [user] = useAuthState(auth);
  const [step, setStep] = useState<AssessmentStep>("start");
  const [mode, setMode] = useState<AssessmentMode>("simple");
  const [entries, setEntries] = useState<AssessmentEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [customAnswer, setCustomAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [moodLogged, setMoodLogged] = useState(false);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);

  const config = MODE_CONFIG[mode];
  const questionBank = useMemo(() => getQuestionBank(mode), [mode]);
  const currentEntry = entries[currentIndex];
  const currentDraftAnswer = formatAnswer(selectedOption, customAnswer);
  const answeredCount = entries.filter((entry) => entry.answer.trim()).length;
  const answeredCountWithDraft = entries.filter((entry, index) =>
    (index === currentIndex ? currentDraftAnswer : entry.answer).trim(),
  ).length;
  const canSubmitAnswer = Boolean(currentDraftAnswer);
  const canFinish = answeredCountWithDraft >= config.min;

  const loadEntry = (entry: AssessmentEntry) => {
    setSelectedOption(entry.selectedOption);
    setCustomAnswer(entry.customAnswer);
  };

  const createEntry = (question: AssessmentQuestion): AssessmentEntry => ({
    questionId: question.id,
    question: question.question,
    answer: "",
    selectedOption: "",
    customAnswer: "",
  });

  const askAiForQuestion = async (nextEntries: AssessmentEntry[]) => {
    const text = await generateGeminiText(
      `You are selecting the next question for a ${mode} mental health assessment.
      Choose the most relevant unused question from the bank based on the user's latest answer and full history.
      Return only one question id, for example q06. Return FINISH only when enough information has been collected.

      Rules:
      - The flow must be dynamic, not sequential.
      - Ask at least ${config.min} answered questions unless there is an urgent safety signal.
      - Finish by ${config.max} answered questions.
      - If self-harm seems possible, choose q14 unless already answered.
      - Use only IDs from the question bank below.

      Question bank:
      ${questionBank.map((question) => `${question.id}: ${question.question}`).join("\n")}

      Answer history:
      ${nextEntries
        .filter((entry) => entry.answer.trim())
        .map((entry) => `${entry.questionId}: ${entry.question}\nAnswer: ${entry.answer}`)
        .join("\n\n") || "No answers yet."}`,
    );

    return extractQuestionFromAi(text, nextEntries, questionBank);
  };

  const chooseNextQuestion = async (nextEntries: AssessmentEntry[]) => {
    if (nextEntries.length >= config.max) {
      return "finish" as const;
    }

    try {
      const aiChoice = await askAiForQuestion(nextEntries);
      if (aiChoice) return aiChoice;
    } catch (error) {
      console.error("Assessment question selection error", error);
      setErrorMessage(formatAiError(error));
    }

    return getFallbackQuestion(nextEntries, questionBank) || "finish";
  };

  const startAssessment = async (selectedMode: AssessmentMode) => {
    setMode(selectedMode);
    setStep("questions");
    setEntries([]);
    setCurrentIndex(0);
    setSelectedOption("");
    setCustomAnswer("");
    setAnalysis("");
    setErrorMessage("");
    setMoodLogged(false);
    setShowCrisisAlert(false);
    setIsLoading(true);

    const bank = getQuestionBank(selectedMode);
    try {
      const text = await generateGeminiText(
        `Pick the best first question id for a ${selectedMode} mental health assessment.
        Return only one id from this bank:
        ${bank.map((question) => `${question.id}: ${question.question}`).join("\n")}`,
      );

      const firstQuestion =
        bank.find((question) =>
          new RegExp(`\\b${question.id}\\b`, "i").test(text),
        ) || bank[0];

      const firstEntry = createEntry(firstQuestion);
      setEntries([firstEntry]);
      loadEntry(firstEntry);
    } catch (error) {
      console.error("Start assessment error", error);
      setErrorMessage(formatAiError(error));
      const firstEntry = createEntry(bank[0]);
      setEntries([firstEntry]);
      loadEntry(firstEntry);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCurrentAnswer = () => {
    if (!currentEntry) return entries;

    const answer = formatAnswer(selectedOption, customAnswer);
    const updatedEntries = entries.map((entry, index) =>
      index === currentIndex
        ? {
            ...entry,
            selectedOption,
            customAnswer,
            answer,
          }
        : entry,
    );

    setEntries(updatedEntries);
    return updatedEntries;
  };

  const handlePrevious = () => {
    if (currentIndex === 0) return;
    saveCurrentAnswer();
    const previousEntry = entries[currentIndex - 1];
    setCurrentIndex((index) => index - 1);
    loadEntry(previousEntry);
  };

  const handleNext = async () => {
    if (!canSubmitAnswer || isLoading || !currentEntry) return;

    const answer = formatAnswer(selectedOption, customAnswer);
    const crisis = detectCrisis(`${currentEntry.question} ${answer}`);
    if (
      crisis.risk_level === "high" ||
      (currentEntry.questionId === "q14" && selectedOption !== "Not at all")
    ) {
      setShowCrisisAlert(true);
    }

    const updatedEntries = saveCurrentAnswer();

    if (currentIndex < updatedEntries.length - 1) {
      const nextEntry = updatedEntries[currentIndex + 1];
      setCurrentIndex((index) => index + 1);
      loadEntry(nextEntry);
      return;
    }

    setIsLoading(true);
    const nextQuestion = await chooseNextQuestion(updatedEntries);

    if (nextQuestion === "finish") {
      await generateFinalAnalysis(toAssessmentAnswers(updatedEntries));
      setIsLoading(false);
      return;
    }

    const nextEntry = createEntry(nextQuestion);
    const nextEntries = [...updatedEntries, nextEntry];
    setEntries(nextEntries);
    setCurrentIndex(nextEntries.length - 1);
    loadEntry(nextEntry);
    setIsLoading(false);
  };

  const generateFinalAnalysis = async (answersList: AssessmentAnswer[]) => {
    if (answersList.length === 0) return;

    setStep("analysis");
    setIsAnalyzing(true);
    setErrorMessage("");

    try {
      const text = await generateGeminiText(
        `Perform a ${mode} mental health check-in analysis based on these answers:
        ${answersList.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join("\n")}
        Provide a warm, empathetic summary, key observed themes, and 3-5 practical self-care suggestions.
        Always remind the user that this is not a clinical diagnosis.`,
      );
      const reportText =
        text || "Sorry, we couldn't generate your analysis at this time.";
      setAnalysis(reportText);

      await addDoc(collection(db, "users", user!.uid, "assessments"), {
        userId: user!.uid,
        answers: answersList,
        analysis: reportText,
        type: mode,
        timestamp: serverTimestamp(),
      });

      const autoEntry = buildAssessmentMood(answersList, mode);
      if (autoEntry) {
        await addDoc(collection(db, "users", user!.uid, "mood_entries"), {
          ...autoEntry,
          userId: user!.uid,
          timestamp: serverTimestamp(),
        });
        setMoodLogged(true);
      }
    } catch (error) {
      console.error("Analysis error", error);
      const friendlyError = formatAiError(error);
      setErrorMessage(friendlyError);
      setAnalysis(friendlyError);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFinish = async () => {
    const updatedEntries = canSubmitAnswer ? saveCurrentAnswer() : entries;
    const completeAnswers = toAssessmentAnswers(
      updatedEntries.filter((entry) => entry.answer.trim()),
    );

    if (completeAnswers.length >= config.min) {
      await generateFinalAnalysis(completeAnswers);
    }
  };

  const downloadReport = () => {
    const answers = toAssessmentAnswers(entries.filter((entry) => entry.answer));
    const doc = new jsPDF();
    const marginX = 16;
    const maxWidth = 178;
    let y = 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`Mentalyze ${config.label} Report`, marginX, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y += 9;
    doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Answers", marginX, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    answers.forEach((answer, index) => {
      y = addWrappedText(
        doc,
        `${index + 1}. ${answer.question}\nAnswer: ${answer.answer}`,
        marginX,
        y,
        maxWidth,
      );
      y += 4;
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    y += 4;
    y = addWrappedText(doc, "AI Report", marginX, y, maxWidth);
    y += 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    addWrappedText(doc, cleanReportText(analysis), marginX, y, maxWidth);

    doc.save(
      `mentalyze-${mode}-assessment-${new Date().toISOString().slice(0, 10)}.pdf`,
    );
  };

  const resetAssessment = () => {
    setStep("start");
    setEntries([]);
    setCurrentIndex(0);
    setSelectedOption("");
    setCustomAnswer("");
    setAnalysis("");
    setErrorMessage("");
    setMoodLogged(false);
    setShowCrisisAlert(false);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white dark:bg-slate-800 rounded-3xl shadow-xl">
        <ClipboardList className="w-16 h-16 text-teal-700 mb-6 opacity-20" />
        <h3 className="text-xl font-bold mb-2">
          Please login to take an assessment
        </h3>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {step === "start" && (
        <div className="bg-white dark:bg-slate-800 p-6 sm:p-10 lg:p-12 rounded-3xl lg:rounded-[2rem] shadow-xl border border-teal-700/5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-teal-50 dark:bg-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8">
            <ClipboardList className="w-10 h-10 text-teal-700 dark:text-cyan-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-['Sora'] mb-4 text-center">
            AI-Driven Mental Health Check-in
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-md mx-auto text-center">
            Choose a mode, answer with options or your own words, and let AI
            decide which question should come next.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Object.keys(MODE_CONFIG) as AssessmentMode[]).map((item) => (
              <button
                key={item}
                onClick={() => startAssessment(item)}
                className="text-left p-5 rounded-3xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-teal-700/50 dark:hover:border-cyan-400/50 transition-all"
              >
                <div className="flex items-center gap-2 text-teal-700 dark:text-cyan-400 font-bold mb-2">
                  <Sparkles className="w-4 h-4" />
                  {MODE_CONFIG[item].label}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {MODE_CONFIG[item].description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "questions" && (
        <div className="space-y-6 sm:space-y-8">
          {!isGeminiConfigured() && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-500/30 rounded-2xl text-sm text-amber-800 dark:text-amber-200">
              Gemini is not configured. Add <strong>VITE_GEMINI_API_KEY</strong>{" "}
              to a local .env file and restart the dev server.
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-500/30 rounded-2xl text-sm text-rose-700 dark:text-rose-200">
              {errorMessage}
            </div>
          )}

          {showCrisisAlert && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-500/30 rounded-2xl flex items-start sm:items-center gap-3 sm:gap-4 animate-in slide-in-from-top-2">
              <AlertTriangle className="text-rose-500 w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-rose-700 dark:text-rose-300 font-bold mb-1">
                  We're here for you.
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-400 leading-tight">
                  If you're in danger, please contact local emergency services
                  or a crisis hotline immediately.
                </p>
              </div>
              <button
                onClick={() => setShowCrisisAlert(false)}
                className="px-2 text-rose-400 font-bold text-xl"
              >
                x
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 p-6 sm:p-10 lg:p-12 rounded-3xl lg:rounded-[2.5rem] shadow-2xl border border-teal-700/5 min-h-[420px] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
              <div className="flex items-center gap-2 text-teal-700 dark:text-cyan-400 font-bold text-sm uppercase tracking-widest">
                <Sparkles className="w-4 h-4" />
                {config.label}
              </div>
              <div className="text-sm font-bold text-slate-400">
                Question {currentIndex + 1} - {answeredCountWithDraft}/
                {config.min} minimum answered
              </div>
            </div>

            <div className="mb-8 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-700 to-cyan-400 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (answeredCountWithDraft / config.max) * 100,
                  )}%`,
                }}
              />
            </div>

            <div className="flex-1">
              <h3 className="text-xl sm:text-2xl font-bold mb-8 text-slate-800 dark:text-white leading-tight">
                {isLoading ? (
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                ) : (
                  currentEntry?.question
                )}
              </h3>

              {currentEntry && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {questionBank
                      .find((question) => question.id === currentEntry.questionId)
                      ?.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => setSelectedOption(option)}
                          disabled={isLoading}
                          className={`rounded-2xl border-2 px-4 py-3 text-left font-semibold transition-all ${
                            selectedOption === option
                              ? "border-teal-700 bg-teal-50 text-teal-800 dark:border-cyan-400 dark:bg-cyan-400/10 dark:text-cyan-200"
                              : "border-slate-100 bg-slate-50 text-slate-600 hover:border-teal-700/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                  </div>

                  <textarea
                    value={customAnswer}
                    onChange={(event) => setCustomAnswer(event.target.value)}
                    placeholder="Add your own answer or extra context..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 sm:p-5 focus:ring-2 focus:ring-teal-700 outline-none shadow-sm dark:text-white"
                    rows={4}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-8">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0 || isLoading}
                className="sm:w-32 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-4 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={!canSubmitAnswer || isLoading}
                className="flex-1 bg-teal-700 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-teal-800 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Next Question
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              <button
                onClick={handleFinish}
                disabled={!canFinish || isLoading}
                className="sm:w-32 bg-slate-900 dark:bg-cyan-500 text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Finish
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "analysis" && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-10 rounded-3xl lg:rounded-[2.5rem] shadow-xl border border-teal-700/5">
            {isAnalyzing ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-16 h-16 text-teal-700 animate-spin mb-6" />
                <h3 className="text-2xl font-bold mb-2">
                  Analyzing your answers...
                </h3>
                <p className="text-slate-500">
                  Mentalyze is preparing your report.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-teal-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-teal-700 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold font-['Sora']">
                      {config.label} Report
                    </h3>
                    <p className="text-sm text-slate-500">
                      {answeredCount} answers reviewed
                    </p>
                  </div>
                </div>

                {moodLogged && (
                  <div className="mb-6 p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-700/20 rounded-2xl flex items-center gap-3 text-teal-700 dark:text-cyan-400">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">
                      Your mood history has been updated based on your
                      responses.
                    </p>
                  </div>
                )}

                {errorMessage && (
                  <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-500/30 rounded-2xl text-sm text-rose-700 dark:text-rose-200">
                    {errorMessage}
                  </div>
                )}

                <div className="prose prose-teal dark:prose-invert max-w-none mb-10">
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={resetAssessment}
                    className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Back to Start
                  </button>
                  <button
                    onClick={downloadReport}
                    className="flex-1 bg-teal-700 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Report
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
