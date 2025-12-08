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
  PROFILE = 'PROFILE', // New tab for student profile/payment
  ADMIN_USERS = 'ADMIN_USERS',
  ADMIN_PAYMENTS = 'ADMIN_PAYMENTS',
  ADMIN_STATS = 'ADMIN_STATS'
}

// --- Auth & Backend Types ---

export type UserRole = 'admin' | 'student';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  password?: string; // Stored in mock DB
  
  // Student Profile
  name?: string;
  collegeName?: string;
  class?: '11' | '12';

  // Premium
  isPremium: boolean;
  premiumPlan?: '1_month' | '3_months';
  premiumExpiry?: string; // ISO Date string

  // Usage Limits
  questionsToday: number;
  lastQuestionDate: string; // YYYY-MM-DD
  joinedDate: string; // ISO Date
  
  // Account Status
  suspended?: boolean;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userEmail: string; // Snapshot for easier display
  userName?: string;
  amount: number;
  plan: '1_month' | '3_months';
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string; // ISO Date
}