
export const CRISIS_KEYWORDS = [
    "kill myself",
    "end my life",
    "no right to live",
    "no right to be alive",
    "suicide",
    "suicidal",
    "want to die",
    "dont want to live",
    "don't want to live",
    "hurt myself",
    "self harm",
    "self-harm",
    "cut myself",
];

export function detectCrisis(text: string) {
    if (!text) return { risk_level: "none", matched_phrases: [] };
    const lowerText = text.toLowerCase();
    const matched = CRISIS_KEYWORDS.filter(kw => lowerText.includes(kw));
    return {
        risk_level: matched.length > 0 ? "high" : "none",
        matched_phrases: matched
    };
}

const MOOD_POSITIVE_CUES = ["calm", "better", "grateful", "happy", "hopeful", "supported", "relieved", "okay", "good", "productive", "confident"];
const MOOD_NEGATIVE_CUES = ["sad", "down", "depressed", "hopeless", "overwhelmed", "stressed", "stress", "angry", "alone", "lonely", "worthless", "upset", "exhausted", "burned out", "numb", "crying"];
const MOOD_ANXIETY_CUES = ["anxious", "anxiety", "worried", "panic", "on edge", "restless", "fear", "afraid", "uneasy", "racing thoughts"];
const MOOD_LOW_ENERGY_CUES = ["tired", "fatigued", "drained", "low energy", "no energy", "sluggish"];
const MOOD_HIGH_ENERGY_CUES = ["energetic", "motivated", "active", "excited", "focused", "ready"];

function countMatches(text: string, cues: string[]) {
    const lower = text.toLowerCase();
    return cues.reduce((count, cue) => count + (lower.includes(cue) ? 1 : 0), 0);
}

function clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val));
}

export function buildAutoMoodFromText(text: string, source: string) {
    const pos = countMatches(text, MOOD_POSITIVE_CUES);
    const neg = countMatches(text, MOOD_NEGATIVE_CUES);
    const aux = countMatches(text, MOOD_ANXIETY_CUES);
    const lowE = countMatches(text, MOOD_LOW_ENERGY_CUES);
    const highE = countMatches(text, MOOD_HIGH_ENERGY_CUES);

    const delta = pos - neg;
    const mood_score = Math.round(clamp(5.0 + (delta * 0.8) - (aux * 0.4) - (lowE * 0.25) + (highE * 0.2), 1, 10));
    const energy = Math.round(clamp(5.0 + (highE * 1.2) - (lowE * 1.2) - (neg * 0.2), 1, 10));
    const anxiety = Math.round(clamp(3.0 + (aux * 1.5) + (Math.max(0, neg - pos) * 0.5) - (pos * 0.3), 1, 10));

    const tags = [];
    if (aux > 0) tags.push("anxiety");
    if (neg > pos) tags.push("stress");
    if (lowE > 0) tags.push("low-energy");
    if (pos > neg) tags.push("positive");
    if (tags.length === 0) tags.push("check-in");

    return {
        mood_score,
        energy,
        anxiety,
        tags,
        journal_text: text.slice(0, 500),
        source,
        timestamp: new Date().toISOString()
    };
}

const SEVERITY_MAP: Record<string, number> = {
    "not at all": 0.0,
    "never": 0.0,
    "rarely": 0.5,
    "a little": 1.0,
    "several days": 1.0,
    "sometimes": 1.0,
    "moderately": 2.0,
    "more than half the days": 2.5,
    "often": 2.5,
    "very much": 3.0,
    "nearly every day": 3.5,
    "extremely": 4.0,
    "yes": 2.0,
    "no": 0.0,
};

const SAFETY_CUES = ["better off dead", "hurting yourself", "killing yourself", "end your life", "suicide", "self-harm"];

export function buildAssessmentMood(answers: { question: string, answer: string }[], type: string) {
    const severities: number[] = [];
    let highRisk = false;

    answers.forEach(item => {
        const ans = item.answer.toLowerCase();
        if (ans in SEVERITY_MAP) {
            severities.push(SEVERITY_MAP[ans]);
        }
        if (SAFETY_CUES.some(cue => item.question.toLowerCase().includes(cue)) && SEVERITY_MAP[ans] >= 2.0) {
            highRisk = true;
        }
    });

    if (severities.length === 0) return null;

    const avg = severities.reduce((a, b) => a + b, 0) / severities.length;
    let mood_score = Math.round(clamp(9.0 - (avg * 2.0), 1, 10));
    let energy = Math.round(clamp(8.0 - (avg * 1.4), 1, 10));
    let anxiety = Math.round(clamp(2.0 + (avg * 2.1), 1, 10));

    const tags = ["assessment", `assessment-${type}`];
    if (highRisk) {
        mood_score = Math.min(mood_score, 3);
        anxiety = Math.max(anxiety, 8);
        tags.push("safety-check");
    }

    return {
        mood_score,
        energy,
        anxiety,
        tags,
        journal_text: `Auto-generated from ${type} assessment`,
        source: `assessment_${type}`,
        timestamp: new Date().toISOString()
    };
}
