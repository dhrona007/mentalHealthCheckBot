export interface MoodEntry {
  id?: string;
  userId: string;
  mood_score: number;
  energy: number;
  anxiety: number;
  tags: string[];
  journal_text: string;
  timestamp: any;
  source: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
}

export interface Assessment {
  id?: string;
  userId: string;
  answers: any[];
  analysis: string;
  type: string;
  timestamp: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatThread {
  id?: string;
  userId: string;
  messages: Message[];
  updatedAt: string;
}
