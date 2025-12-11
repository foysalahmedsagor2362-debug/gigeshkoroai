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
  SUMMARIZER = 'SUMMARIZER',
  PROFILE = 'PROFILE',
  ADMIN_STATS = 'ADMIN_STATS',
  ADMIN_USERS = 'ADMIN_USERS',
  ADMIN_PAYMENTS = 'ADMIN_PAYMENTS'
}

export interface User {
  id: string;
  name: string;
  collegeName: string;
  class: '11' | '12';
  email?: string;
  password?: string;
  isPremium?: boolean;
  suspended?: boolean;
  role?: 'student' | 'admin';
  createdAt?: number;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: '1_month' | '3_months';
  amount: number;
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}