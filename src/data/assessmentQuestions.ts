export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  allowText: boolean;
  general: boolean;
  detailed: boolean;
}

export const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: "q01",
    question: "Little interest or pleasure in doing things?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    allowText: true,
    general: true,
    detailed: true,
  },
  {
    id: "q02",
    question: "Feeling down, depressed, or hopeless?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    allowText: true,
    general: true,
    detailed: true,
  },
  {
    id: "q03",
    question: "Trouble falling asleep, staying asleep, or sleeping too much?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    allowText: true,
    general: true,
    detailed: true,
  },
  {
    id: "q04",
    question: "Feeling tired or having very low energy?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    allowText: true,
    general: true,
    detailed: true,
  },
  {
    id: "q05",
    question: "Trouble concentrating on work, study, reading, or conversations?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    allowText: true,
    general: true,
    detailed: true,
  },
  {
    id: "q06",
    question: "Feeling nervous, anxious, or on edge?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    allowText: true,
    general: true,
    detailed: true,
  },
  {
    id: "q07",
    question: "Not being able to stop or control worrying?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    allowText: true,
    general: true,
    detailed: true,
  },
  {
    id: "q08",
    question: "Feeling overwhelmed by responsibilities at work, school, or home?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    allowText: true,
    general: false,
    detailed: true,
  },
  {
    id: "q09",
    question: "Withdrawing from friends, family, or usual activities?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    allowText: true,
    general: false,
    detailed: true,
  },
  {
    id: "q10",
    question: "Noticeable changes in appetite or eating habits?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    allowText: true,
    general: false,
    detailed: true,
  },
  {
    id: "q11",
    question: "Feeling irritable, frustrated, or easily upset?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    allowText: true,
    general: false,
    detailed: true,
  },
  {
    id: "q12",
    question: "Hard to relax, unwind, or feel mentally calm?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    allowText: true,
    general: false,
    detailed: true,
  },
  {
    id: "q13",
    question: "Mood shifts (highs/lows) affecting your routine or decisions?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    allowText: true,
    general: false,
    detailed: true,
  },
  {
    id: "q14",
    question: "Thoughts that you'd be better off dead or hurting yourself?",
    options: ["Not at all", "Several days", "More than half the days", "Nearly every day"],
    allowText: true,
    general: true,
    detailed: true,
  },
];
