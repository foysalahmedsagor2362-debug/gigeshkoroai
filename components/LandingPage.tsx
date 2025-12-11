import React from 'react';
import { MessageSquare, Sparkles, LayoutDashboard, Check, ArrowRight, Shield, Zap } from 'lucide-react';
import { Logo, Button } from './UIComponents';

interface LandingPageProps {
  onStartApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartApp }) => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Logo size={32} className="rounded-lg" />
            <span className="font-bold text-xl tracking-tight text-slate-900">JIGESH</span>
          </div>
          <div className="flex items-center gap-4 md:gap-8">
             <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                className="text-sm font-semibold text-slate-600 hover:text-primary-600 transition-colors"
             >
                Home
             </button>
             <Button onClick={onStartApp} className="shadow-lg shadow-primary-600/20">
               Launch App
             </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50 to-slate-50 -z-10" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[url('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070&auto=format&fit=crop')] opacity-5 bg-cover bg-center -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-semibold text-primary-600">
                    <Sparkles size={12} />
                    <span>The Future of Learning is Here</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                    Master Physics, Chem, Bio & Math with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">AI Power</span>
                </h1>
                <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                    JigeshAI is your personal 24/7 tutor. Solve complex problems, summarize notes, and track your study habits in one futuristic platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={onStartApp} className="h-14 px-8 text-lg rounded-2xl">
                        Start Learning Now <ArrowRight size={20} className="ml-2" />
                    </Button>
                    <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="h-14 px-8 text-lg rounded-2xl font-semibold text-slate-600 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-200">
                        Explore Features
                    </button>
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
                    <span className="flex items-center gap-2"><CheckCircleIcon /> Instant Answers</span>
                    <span className="flex items-center gap-2"><CheckCircleIcon /> Smart Summaries</span>
                </div>
            </div>
            <div className="relative hidden md:block">
                 <div className="relative z-10 bg-white p-2 rounded-3xl shadow-2xl border border-slate-200 rotate-2 hover:rotate-0 transition-transform duration-500">
                     <img 
                        src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop" 
                        alt="Students learning" 
                        className="rounded-2xl"
                     />
                     
                     <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce duration-[3000ms]">
                         <div className="bg-green-100 p-2 rounded-full text-green-600">
                             <Check size={24} />
                         </div>
                         <div>
                             <p className="text-xs text-slate-500 font-bold uppercase">Physics Problem</p>
                             <p className="font-bold text-slate-800">Solved in 2.3s</p>
                         </div>
                     </div>
                 </div>
                 <div className="absolute top-10 right-10 w-full h-full bg-primary-200/50 rounded-3xl -z-10 blur-3xl" />
            </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything You Need to Excel</h2>
                <p className="text-slate-500">We've combined the best AI tools into a unified study dashboard designed for students.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <FeatureCard 
                    icon={<MessageSquare className="text-white" size={24} />}
                    color="bg-blue-500"
                    title="AI Tutor Chat"
                    desc="Ask questions about Physics, Chemistry, Math, or Biology. Get step-by-step solutions with LaTeX math formatting."
                />
                <FeatureCard 
                    icon={<Sparkles className="text-white" size={24} />}
                    color="bg-purple-500"
                    title="Smart Summarizer"
                    desc="Paste your notes or upload a PDF. Our AI generates key points, vocabulary lists, and practice questions instantly."
                />
                <FeatureCard 
                    icon={<LayoutDashboard className="text-white" size={24} />}
                    color="bg-emerald-500"
                    title="Study Tracker"
                    desc="Track your study hours, maintain streaks, and set daily goals to stay disciplined and motivated."
                />
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                  <Logo size={24} />
                  <span className="font-bold text-slate-700">JIGESH</span>
              </div>
              <div className="text-slate-500 text-sm">
                  © {new Date().getFullYear()} Jigesh AI. All rights reserved.
              </div>
              <div className="flex gap-6">
                  <a href="#" className="text-slate-400 hover:text-primary-600"><Shield size={20} /></a>
                  <a href="mailto:foysalahmedsagor2362@gmail.com" className="text-slate-400 hover:text-primary-600"><Zap size={20} /></a>
              </div>
          </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode, color: string, title: string, desc: string }> = ({ icon, color, title, desc }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4 shadow-md`}>
            {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
);

const CheckCircleIcon = () => (
    <div className="bg-green-100 rounded-full p-0.5">
        <Check size={12} className="text-green-600" />
    </div>
);