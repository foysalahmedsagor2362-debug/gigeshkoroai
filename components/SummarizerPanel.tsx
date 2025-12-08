import React, { useState } from 'react';
import { FileText, Upload, Copy, BookOpen, Layers, HelpCircle, AlertTriangle } from 'lucide-react';
import { GlassCard, Button } from './UIComponents';
import { SummaryResult } from '../types';
import { generateSmartSummary } from '../services/geminiService';

interface SummarizerPanelProps {
  incrementStats: () => void;
}

export const SummarizerPanel: React.FC<SummarizerPanelProps> = ({ incrementStats }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'url' | 'file'>('text');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const summaryData = await generateSmartSummary(inputText);
      setResult(summaryData);
      incrementStats();
    } catch (error: any) {
      console.error("Summary error:", error);
      if (error.message === "API_KEY_MISSING") {
        setError("Missing API Key. Set VITE_API_KEY.");
      } else if (error.status === 429) {
        setError("Limit Reached: Try again later.");
      } else {
        setError("Failed to generate summary.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="h-full flex flex-col gap-6 p-4 md:p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">AI Summarizer</h2>
      </div>

      {/* Input Card */}
      <GlassCard icon={<Layers size={18} />} title="Input Source">
        <div className="px-6 pb-6 pt-2">
            <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['text', 'url', 'file'] as const).map((tab) => (
                <button
                key={tab}
                onClick={() => { setActiveTab(tab); setError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === tab 
                    ? 'bg-white text-primary-600 shadow-sm border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                >
                {tab.toUpperCase()}
                </button>
            ))}
            </div>

            {activeTab === 'text' && (
            <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your Physics, Chemistry, Bio or Math notes here..."
                className="w-full h-40 bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-800 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none mb-4 placeholder-slate-400"
            />
            )}

            {activeTab === 'url' && (
            <div className="space-y-3 mb-4">
                <input
                type="text"
                placeholder="https://example.com/science-article"
                className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-800 focus:outline-none focus:border-primary-500"
                disabled
                />
                <p className="text-xs text-orange-500 font-mono">:: Feature Pending ::</p>
            </div>
            )}

            {activeTab === 'file' && (
            <div className="border-2 border-dashed border-slate-200 rounded-xl h-40 flex flex-col items-center justify-center mb-4 cursor-pointer hover:bg-slate-50 transition-colors group">
                <Upload className="text-slate-400 group-hover:text-primary-500 transition-colors mb-3" size={28} />
                <span className="text-xs text-slate-500 font-medium group-hover:text-slate-600">Upload PDF/TXT</span>
            </div>
            )}

            {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs text-red-600">
                <AlertTriangle size={16} />
                <span>{error}</span>
            </div>
            )}

            <Button 
            onClick={handleSummarize} 
            isLoading={isLoading} 
            disabled={!inputText && activeTab === 'text'}
            className="w-full h-10"
            >
            Generate Summary
            </Button>
        </div>
      </GlassCard>

      {/* Results Display */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-8">
          <GlassCard title="Executive Summary" icon={<BookOpen size={18} />}>
            <div className="px-6 pb-6">
                <p className="text-sm text-slate-600 leading-relaxed mb-4 text-justify">{result.summary}</p>
                <Button 
                variant="secondary" 
                className="text-xs py-1.5 h-8" 
                onClick={() => copyToClipboard(result.summary)}
                icon={<Copy size={12} />}
                >
                Copy
                </Button>
            </div>
          </GlassCard>

          <div className="grid md:grid-cols-2 gap-6">
            <GlassCard title="Key Concepts" icon={<FileText size={18} />}>
                <div className="px-6 pb-6">
                    <ul className="space-y-3">
                    {result.keyPoints.map((point, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-slate-600">
                        <span className="text-emerald-500 font-bold mt-0.5">›</span>
                        {point}
                        </li>
                    ))}
                    </ul>
                </div>
            </GlassCard>

            <GlassCard title="Vocabulary" icon={<Layers size={18} />}>
                <div className="px-6 pb-6">
                    <div className="grid gap-3">
                    {result.terms.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-primary-600 font-bold text-xs block mb-1 uppercase tracking-wide">{item.term}</span>
                        <span className="text-xs text-slate-600">{item.definition}</span>
                        </div>
                    ))}
                    </div>
                </div>
            </GlassCard>
          </div>

          <GlassCard title="Knowledge Check" icon={<HelpCircle size={18} />}>
             <div className="space-y-3 px-6 pb-6">
              {result.practiceQuestions.map((q, idx) => (
                <div key={idx} className="bg-primary-50 p-4 rounded-lg border border-primary-100">
                  <p className="text-sm text-slate-700"><span className="text-primary-600 font-mono mr-2">Q{idx + 1}.</span> {q}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};