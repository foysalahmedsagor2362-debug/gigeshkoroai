import React, { useEffect, useState } from 'react';
import { Play, Pause, Target, Flame, CheckCircle } from 'lucide-react';
import { GlassCard, Button } from './UIComponents';
import { StudyStats } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface TrackerPanelProps {
  stats: StudyStats;
  updateStats: (newStats: StudyStats) => void;
}

export const TrackerPanel: React.FC<TrackerPanelProps> = ({ stats, updateStats }) => {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Timer Logic
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

  // Chart Data
  const data = [
    { name: 'Studied', value: stats.studyMinutes },
    { name: 'Remaining', value: Math.max(0, stats.goals.studyMinutes - stats.studyMinutes) },
  ];
  const COLORS = ['#2563eb', '#e2e8f0']; // Blue-600 and Slate-200

  const progressPercent = Math.min(100, Math.round((stats.studyMinutes / stats.goals.studyMinutes) * 100));

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-2">
      {/* Timer Card */}
      <GlassCard className="text-center py-8">
        <h3 className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-2">Session Timer</h3>
        <div className="text-5xl font-mono font-bold text-slate-800 mb-6 tabular-nums tracking-wider">
          {formatTime(sessionSeconds)}
        </div>
        <Button 
          onClick={toggleTimer} 
          variant={isTimerRunning ? 'secondary' : 'primary'}
          className="w-full max-w-[200px]"
          icon={isTimerRunning ? <Pause size={18} /> : <Play size={18} />}
        >
          {isTimerRunning ? 'Pause' : 'Start Focus'}
        </Button>
      </GlassCard>

      {/* Daily Progress */}
      <GlassCard title="Daily Goal" icon={<Target size={18} />}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-500 font-medium">Study Time</span>
          <span className="text-sm font-bold text-primary-600">{stats.studyMinutes} / {stats.goals.studyMinutes} min</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-6">
          <div 
            className="bg-primary-600 h-full transition-all duration-500 rounded-full" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 
           Added min-width/min-height to container and ResponsiveContainer to prevent 
           "width(-1) and height(-1) of chart should be greater than 0" warning 
           when component is hidden via CSS (e.g. mobile tabs).
        */}
        <div className="h-40 w-full relative" style={{ minWidth: 0, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#0f172a' }}
                />
              </PieChart>
            </ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-slate-800">{progressPercent}%</span>
            </div>
        </div>
      </GlassCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="flex flex-col items-center justify-center p-4">
          <Flame className="text-orange-500 mb-2" size={24} />
          <span className="text-2xl font-bold text-slate-800">{stats.streak}</span>
          <span className="text-xs text-slate-500 font-medium">Day Streak</span>
        </GlassCard>
        
        <GlassCard className="flex flex-col items-center justify-center p-4">
          <CheckCircle className="text-emerald-500 mb-2" size={24} />
          <span className="text-2xl font-bold text-slate-800">{stats.summariesGenerated}</span>
          <span className="text-xs text-slate-500 font-medium">Summaries</span>
        </GlassCard>
      </div>
    </div>
  );
};