import React, { useState, useEffect } from 'react';
import { LayoutDashboard, MessageSquare, Sparkles, Brain } from 'lucide-react';
import { StudyStats, AppTab } from './types';
import { TrackerPanel } from './components/TrackerPanel';
import { ChatPanel } from './components/ChatPanel';
import { SummarizerPanel } from './components/SummarizerPanel';

// Default / Initial Stats
const initialStats: StudyStats = {
  studyMinutes: 0,
  questionsAsked: 0,
  summariesGenerated: 0,
  streak: 1,
  lastStudyDate: new Date().toISOString().split('T')[0],
  goals: {
    studyMinutes: 120,
    questions: 50, // Updated goal to match daily limit
    summaries: 3
  }
};

const App: React.FC = () => {
  // --- State Management ---
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CHAT);
  const [language, setLanguage] = useState<'English' | 'Bangla'>('English');
  const [stats, setStats] = useState<StudyStats>(() => {
    const saved = localStorage.getItem('gemini-study-data');
    return saved ? JSON.parse(saved) : initialStats;
  });

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('gemini-study-data', JSON.stringify(stats));
  }, [stats]);

  // Check streak and reset daily counts on load
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastStudyDate !== today) {
      setStats(prev => ({ 
        ...prev, 
        lastStudyDate: today,
        // Reset daily counters
        questionsAsked: 0,
        summariesGenerated: 0,
        // Basic streak logic (if consecutive days, keep streak, else reset to 1)
        streak: prev.streak // Keeping streak simple for now, can be enhanced
      }));
    }
  }, []);

  // --- Handlers ---
  const updateStats = (newStats: StudyStats) => {
    setStats(newStats);
  };

  const incrementQuestions = () => {
    setStats(prev => ({
      ...prev,
      questionsAsked: prev.questionsAsked + 1
    }));
  };

  const incrementSummaries = () => {
    setStats(prev => ({
      ...prev,
      summariesGenerated: prev.summariesGenerated + 1
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden flex flex-col">
      
      {/* --- Header --- */}
      <header className="h-16 border-b border-slate-200 bg-white shadow-sm flex items-center justify-between px-6 z-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 p-2 rounded-lg text-white shadow-md shadow-primary-200">
            <Brain size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase">
              JIGESH KORO
            </h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">AI Study Companion</p>
          </div>
        </div>

        {/* Desktop Nav - Hidden on Mobile */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
             <div className="flex bg-slate-100 rounded-lg p-1">
                <button 
                  onClick={() => setLanguage('English')}
                  className={`px-3 py-1 rounded-md text-xs transition-all ${language === 'English' ? 'bg-white text-primary-600 shadow-sm font-bold' : 'hover:text-slate-700'}`}
                >
                  English
                </button>
                <button 
                  onClick={() => setLanguage('Bangla')}
                  className={`px-3 py-1 rounded-md text-xs transition-all ${language === 'Bangla' ? 'bg-white text-primary-600 shadow-sm font-bold' : 'hover:text-slate-700'}`}
                >
                  Bangla
                </button>
            </div>
            <span className="hover:text-primary-600 cursor-pointer transition-colors" onClick={() => setActiveTab(AppTab.TRACKER)}>Dashboard</span>
            <span className="hover:text-primary-600 cursor-pointer transition-colors" onClick={() => setActiveTab(AppTab.CHAT)}>Chat</span>
        </div>
      </header>

      {/* --- Main Content Layout --- */}
      <main className="flex-1 overflow-hidden relative p-4 md:p-6 max-w-[1600px] mx-auto w-full">
        <div className="grid md:grid-cols-12 gap-6 h-full">
          
          {/* Left Panel: Tracker */}
          <div className={`md:col-span-3 h-full overflow-hidden ${activeTab === AppTab.TRACKER ? 'block' : 'hidden md:block'}`}>
            <TrackerPanel stats={stats} updateStats={updateStats} />
          </div>

          {/* Center Panel: Chat */}
          <div className={`md:col-span-6 h-full flex flex-col ${activeTab === AppTab.CHAT ? 'block' : 'hidden md:block'}`}>
            <ChatPanel 
              incrementStats={incrementQuestions} 
              language={language} 
              setLanguage={setLanguage}
              questionsAskedCount={stats.questionsAsked}
            />
          </div>

          {/* Right Panel: Summarizer */}
          <div className={`md:col-span-3 h-full overflow-hidden ${activeTab === AppTab.SUMMARIZER ? 'block' : 'hidden md:block'}`}>
            <SummarizerPanel incrementStats={incrementSummaries} />
          </div>

        </div>
      </main>
      
      {/* --- Footer --- */}
      <footer className="hidden md:block py-2 bg-white border-t border-slate-200 text-center text-[10px] text-slate-400 shrink-0">
        <p>Powered by <span className="font-semibold text-primary-600">Google Gemini API</span>. JIGESHAI Assistant.</p>
      </footer>

      {/* --- Mobile Navigation Bar --- */}
      <div className="md:hidden h-16 bg-white border-t border-slate-200 flex items-center justify-around shrink-0 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab(AppTab.TRACKER)}
          className={`flex flex-col items-center gap-1 ${activeTab === AppTab.TRACKER ? 'text-primary-600' : 'text-slate-400'}`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-medium">Tracker</span>
        </button>
        <button 
          onClick={() => setActiveTab(AppTab.CHAT)}
          className={`flex flex-col items-center gap-1 ${activeTab === AppTab.CHAT ? 'text-primary-600' : 'text-slate-400'}`}
        >
          <MessageSquare size={20} />
          <span className="text-[10px] font-medium">Tutor</span>
        </button>
        <button 
          onClick={() => setActiveTab(AppTab.SUMMARIZER)}
          className={`flex flex-col items-center gap-1 ${activeTab === AppTab.SUMMARIZER ? 'text-primary-600' : 'text-slate-400'}`}
        >
          <Sparkles size={20} />
          <span className="text-[10px] font-medium">Summarize</span>
        </button>
      </div>

    </div>
  );
};

export default App;