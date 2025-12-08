import React, { useState, useEffect } from 'react';
import { LayoutDashboard, MessageSquare, Sparkles, LogOut, Crown, Settings } from 'lucide-react';
import { StudyStats, AppTab, User } from './types';
import { TrackerPanel } from './components/TrackerPanel';
import { ChatPanel } from './components/ChatPanel';
import { SummarizerPanel } from './components/SummarizerPanel';
import { ProfilePanel } from './components/ProfilePanel';
import { Login } from './components/Auth/Login';
import { LandingPage } from './components/LandingPage';
import { ProfileSetup } from './components/Auth/ProfileSetup';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { UpgradeModal } from './components/Payment/UpgradeModal';
import { getCurrentUser, logout, syncSession } from './services/backend';
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

type ViewState = 'landing' | 'login' | 'app';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [view, setView] = useState<ViewState>('landing');
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CHAT);
  const [language, setLanguage] = useState<'English' | 'Bangla'>('English');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [stats, setStats] = useState<StudyStats>(() => {
    const saved = localStorage.getItem('gemini-study-data');
    return saved ? JSON.parse(saved) : initialStats;
  });

  useEffect(() => {
    // 1. First load simple session
    let u = getCurrentUser();
    
    // 2. Sync with "DB" (LocalStorage) to ensure if Admin approved or suspended, we get the update
    if (u) {
      const syncedUser = syncSession();
      if (syncedUser) {
        // If user got suspended while logged in, logout immediately
        if (syncedUser.suspended) {
          logout();
          setUser(null);
          setView('landing');
          setIsAuthChecking(false);
          alert("Your account has been suspended by the administrator.");
          return;
        }
        u = syncedUser;
      }
    }

    if (u) {
      setUser(u);
      setView('app');
      if (u.role === 'admin') setActiveTab(AppTab.ADMIN_STATS);
    } else {
        setView('landing');
    }
    setIsAuthChecking(false);
  }, []);

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

  const handleLogin = (u: User) => {
    setUser(u);
    setView('app');
    if (u.role === 'admin') {
      setActiveTab(AppTab.ADMIN_STATS);
    } else {
      setActiveTab(AppTab.CHAT);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setView('landing'); // Return to landing page
    setActiveTab(AppTab.CHAT);
  };

  const updateStats = (newStats: StudyStats) => setStats(newStats);
  const incrementQuestions = () => setStats(prev => ({ ...prev, questionsAsked: prev.questionsAsked + 1 }));
  const incrementSummaries = () => setStats(prev => ({ ...prev, summariesGenerated: prev.summariesGenerated + 1 }));

  if (isAuthChecking) return <div className="h-screen flex items-center justify-center bg-slate-50">Loading...</div>;

  // 1. Landing Page
  if (view === 'landing') {
      return <LandingPage onNavigateToLogin={() => setView('login')} />;
  }

  // 2. Login Page
  if (view === 'login') {
    return <Login onLoginSuccess={handleLogin} onBack={() => setView('landing')} />;
  }

  // 3. App / Admin / Profile Setup (Protected Routes)
  if (!user) {
      // Should not happen due to view state, but fallback
      return <Login onLoginSuccess={handleLogin} onBack={() => setView('landing')} />;
  }

  // Admin Dashboard
  if (user.role === 'admin') {
    return <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />;
  }

  // Student Profile Setup (First time)
  if (user.role === 'student' && (!user.name || !user.collegeName)) {
    return <ProfileSetup user={user} onComplete={(updated) => setUser(updated)} />;
  }

  // Student Main App
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {showUpgrade && <UpgradeModal user={user} onClose={() => setShowUpgrade(false)} />}

      {/* --- Sidebar (Desktop) --- */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white p-4 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 px-2 mb-8 mt-2 cursor-pointer" onClick={() => setView('landing')}>
          <Logo size={42} className="shadow-md shadow-primary-200 rounded-xl" />
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">JIGESH</h1>
            <p className="text-[10px] text-primary-600 font-bold uppercase tracking-[0.2em]">AI Tutor</p>
          </div>
        </div>

        {user.isPremium && (
          <div className="mx-2 mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-100 p-3 rounded-xl flex items-center gap-3">
             <div className="bg-white p-1.5 rounded-full shadow-sm text-orange-500"><Crown size={16} fill="currentColor" /></div>
             <div>
               <div className="text-xs font-bold text-orange-800 uppercase">Premium</div>
               <div className="text-[10px] text-orange-600">Active until {new Date(user.premiumExpiry || '').toLocaleDateString()}</div>
             </div>
          </div>
        )}

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
            Settings
          </button>
        </nav>

        {!user.isPremium && (
          <button 
            onClick={() => setShowUpgrade(true)}
            className="mb-4 mx-2 bg-slate-900 text-white p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <Crown size={14} /> Upgrade to Premium
          </button>
        )}

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
            
            <button onClick={handleLogout} className="w-full flex items-center gap-2 text-xs text-red-500 hover:bg-red-50 p-2 rounded-lg font-medium">
              <LogOut size={14} /> Sign Out
            </button>
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
             <div className="flex items-center gap-2">
               {!user.isPremium && (
                 <button onClick={() => setShowUpgrade(true)} className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded font-bold flex items-center gap-1">
                   <Crown size={10} /> PRO
                 </button>
               )}
               <button 
                  onClick={() => setLanguage(l => l === 'English' ? 'Bangla' : 'English')}
                  className="text-xs font-mono px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200"
               >
                  {language === 'English' ? 'ENG' : 'BN'}
               </button>
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
             <button 
                onClick={handleLogout}
                className="flex flex-col items-center gap-1 text-slate-400"
            >
                <LogOut size={20} />
                <span className="text-[10px] font-medium">Exit</span>
            </button>
        </nav>
      </main>

    </div>
  );
};

export default App;