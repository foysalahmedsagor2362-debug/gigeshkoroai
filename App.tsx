import React, { useState, useEffect } from 'react';
import { LayoutDashboard, MessageSquare, Sparkles, Settings } from 'lucide-react';
import { StudyStats, AppTab, User } from './types';
import { TrackerPanel } from './components/TrackerPanel';
import { ChatPanel } from './components/ChatPanel';
import { SummarizerPanel } from './components/SummarizerPanel';
import { ProfilePanel } from './components/ProfilePanel';
import { getCurrentUser } from './services/backend';
import { Logo } from './components/UIComponents';

const initialStats: StudyStats = {
  studyMinutes: 0,
  questionsAsked: 0,
  summariesGenerated: 0,
  streak: 1,
  lastStudyDate: new Date().toISOString().split('T')[0],
  goals: {
    studyMinutes: 120,
    questions: 50,
    summaries: 3
  }
};

const App: React.FC = () => {
  const [user, setUser] = useState<User>(getCurrentUser());
  // Removed showLanding state to load app directly
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CHAT);
  const [language, setLanguage] = useState<'English' | 'Bangla'>('English');
  
  const [stats, setStats] = useState<StudyStats>(() => {
    const saved = localStorage.getItem('gemini-study-data');
    return saved ? JSON.parse(saved) : initialStats;
  });

  useEffect(() => {
    localStorage.setItem('gemini-study-data', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastStudyDate !== today) {
      setStats(prev => ({ 
        ...prev, 
        lastStudyDate: today,
        questionsAsked: 0,
        summariesGenerated: 0,
        streak: prev.streak 
      }));
    }
  }, []);

  const updateStats = (newStats: StudyStats) => setStats(newStats);
  const incrementQuestions = () => setStats(prev => ({ ...prev, questionsAsked: prev.questionsAsked + 1 }));
  const incrementSummaries = () => setStats(prev => ({ ...prev, summariesGenerated: prev.summariesGenerated + 1 }));

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* --- Sidebar (Desktop) --- */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white p-4 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 px-2 mb-8 mt-2 cursor-pointer">
          <Logo size={42} className="shadow-md shadow-primary-200 rounded-xl" />
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">JIGESH</h1>
            <p className="text-[10px] text-primary-600 font-bold uppercase tracking-[0.2em]">AI Tutor</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <button 
            onClick={() => setActiveTab(AppTab.TRACKER)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === AppTab.TRACKER ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab(AppTab.CHAT)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === AppTab.CHAT ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            <MessageSquare size={18} />
            AI Tutor
          </button>
          <button 
            onClick={() => setActiveTab(AppTab.SUMMARIZER)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === AppTab.SUMMARIZER ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            <Sparkles size={18} />
            Summarizer
          </button>
          <button 
            onClick={() => setActiveTab(AppTab.PROFILE)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === AppTab.PROFILE ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            <Settings size={18} />
            Profile
          </button>
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs uppercase">
                    {user.name?.charAt(0) || 'S'}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-slate-700 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.collegeName}</p>
                </div>
            </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-50">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 z-30 shrink-0">
             <div className="flex items-center gap-2">
                <Logo size={32} className="rounded-lg" />
                <span className="font-bold text-slate-800 tracking-tight">JIGESH</span>
             </div>
        </header>

        {/* Dynamic Panel Renderer */}
        <div className="flex-1 overflow-hidden relative">
            {activeTab === AppTab.TRACKER && <TrackerPanel stats={stats} updateStats={updateStats} />}
            {activeTab === AppTab.CHAT && (
                <ChatPanel 
                    incrementStats={incrementQuestions} 
                    language={language} 
                    setLanguage={setLanguage}
                    questionsAskedCount={stats.questionsAsked}
                />
            )}
            {activeTab === AppTab.SUMMARIZER && <SummarizerPanel incrementStats={incrementSummaries} />}
            {activeTab === AppTab.PROFILE && <ProfilePanel user={user} updateUser={setUser} />}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden h-16 bg-white border-t border-slate-200 flex items-center justify-around shrink-0 z-30 pb-safe">
            <button 
                onClick={() => setActiveTab(AppTab.TRACKER)}
                className={`flex flex-col items-center gap-1 ${activeTab === AppTab.TRACKER ? 'text-primary-600' : 'text-slate-400'}`}
            >
                <LayoutDashboard size={20} />
                <span className="text-[10px] font-medium">Home</span>
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
                <span className="text-[10px] font-medium">AI Tool</span>
            </button>
             <button 
                onClick={() => setActiveTab(AppTab.PROFILE)}
                className={`flex flex-col items-center gap-1 ${activeTab === AppTab.PROFILE ? 'text-primary-600' : 'text-slate-400'}`}
            >
                <Settings size={20} />
                <span className="text-[10px] font-medium">Profile</span>
            </button>
        </nav>
      </main>

    </div>
  );
};

export default App;