import React, { useEffect, useState } from 'react';
import { Play, Pause, Target, Flame, CheckCircle, BarChart2 } from 'lucide-react';
import { GlassCard, Button } from './UIComponents';
import { StudyStats } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface TrackerPanelProps {
  stats: StudyStats;
  updateStats: (newStats: StudyStats) => void;
}

export const TrackerPanel: React.FC<TrackerPanelProps> = ({ stats, updateStats }) => {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  useEffect(() => {
    let interval: number;
    if (isTimerRunning) {
      interval = window.setInterval(() => {
        setSessionSeconds(s => s + 1);
        if ((sessionSeconds + 1) % 60 === 0) {
          updateStats({
            ...stats,
            studyMinutes: stats.studyMinutes + 1
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, sessionSeconds, stats, updateStats]);

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const data = [
    { name: 'Studied', value: stats.studyMinutes },
    { name: 'Remaining', value: Math.max(0, stats.goals.studyMinutes - stats.studyMinutes) },
  ];
  const COLORS = ['#6366f1', '#e2e8f0'];

  const progressPercent = Math.min(100, Math.round((stats.studyMinutes / stats.goals.studyMinutes) * 100));

  return (
    <div className="flex flex-col gap-6 h-full p-4 md:p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h2>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">{new Date().toLocaleDateString()}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timer Card */}
        <GlassCard className="flex flex-col justify-center items-center py-10 bg-white">
            <h3 className="text-slate-400 text-xs uppercase tracking-[0.2em] font-bold mb-4">Focus Session</h3>
            <div className="text-6xl md:text-7xl font-mono font-bold text-slate-800 mb-8 tabular-nums tracking-wider">
            {formatTime(sessionSeconds)}
            </div>
            <Button 
            onClick={toggleTimer} 
            variant={isTimerRunning ? 'danger' : 'primary'}
            className="w-full max-w-[220px] h-12 text-base"
            icon={isTimerRunning ? <Pause size={20} /> : <Play size={20} />}
            >
            {isTimerRunning ? 'Pause Session' : 'Start Focus'}
            </Button>
        </GlassCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
            <GlassCard className="flex flex-col items-center justify-center p-6 bg-orange-50/50 border-orange-100">
            <Flame className="text-orange-500 mb-3" size={32} />
            <span className="text-4xl font-bold text-slate-800 mb-1">{stats.streak}</span>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Day Streak</span>
            </GlassCard>
            
            <GlassCard className="flex flex-col items-center justify-center p-6 bg-emerald-50/50 border-emerald-100">
            <CheckCircle className="text-emerald-500 mb-3" size={32} />
            <span className="text-4xl font-bold text-slate-800 mb-1">{stats.summariesGenerated}</span>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Summaries</span>
            </GlassCard>

            <GlassCard className="col-span-2 p-6 flex items-center justify-between relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-primary-600">
                        <Target size={18} />
                        <span className="text-sm font-bold uppercase tracking-wider">Daily Goal</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-800">
                        {Math.round(stats.studyMinutes / 60 * 10) / 10} <span className="text-lg text-slate-400 font-medium">/ {stats.goals.studyMinutes / 60} hrs</span>
                    </div>
                </div>
                <div className="w-24 h-24 relative z-10">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={45}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                            >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>
        </div>
      </div>

      {/* Progress Bar Detail */}
      <GlassCard title="Progress Detail" icon={<BarChart2 size={18} />}>
        <div className="space-y-4 pt-4 px-6 pb-6">
            <div>
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Study Time</span>
                    <span className="text-slate-800 font-mono">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                        className="bg-primary-500 h-full transition-all duration-500" 
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>
             <div>
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Questions Asked</span>
                    <span className="text-slate-800 font-mono">{stats.questionsAsked} / {stats.goals.questions}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                        className="bg-emerald-500 h-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (stats.questionsAsked / stats.goals.questions) * 100)}%` }}
                    />
                </div>
            </div>
        </div>
      </GlassCard>
    </div>
  );
};