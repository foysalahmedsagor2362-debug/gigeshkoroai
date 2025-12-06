export interface StudyStats {
  studyMinutes: number;
  questionsAsked: number;
  summariesGenerated: number;
  streak: number;
  lastStudyDate: string; // YYYY-MM-DD
  goals: {
    studyMinutes: number;
    questions: number;
    summaries: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
  attachment?: {
    name: string;
    type: string;
    // We won't store the full base64 in history state to keep it light, 
    // but useful for immediate UI rendering if needed.
  };
}

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  terms: { term: string; definition: string }[];
  practiceQuestions: string[];
}

export enum AppTab {
  TRACKER = 'TRACKER',
  CHAT = 'CHAT',
  SUMMARIZER = 'SUMMARIZER'
}