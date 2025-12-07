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
        setError("Gemini API Key is missing. Please check Vercel settings.");
      } else if (error.status === 429 || error.message?.includes('429')) {
        setError("Limit Reached: Hourly usage limit exceeded. Try again later.");
      } else if (error.status === 503 || error.status === 500) {
        setError("Service Overloaded: AI is currently busy. Please retry.");
      } else if (error.message?.includes('fetch') || error.message?.includes('Network')) {
        setError("Network Error: Please check your internet.");
      } else {
        setError("Failed to generate summary. Please check your content.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto pr-2">
      {/* Input Card */}
      <GlassCard title="Content Summarizer" icon={<Layers size={18} />}>
        <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-lg">
          {(['text', 'url', 'file'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === tab 
                  ? 'bg-white text-primary-600 shadow-sm' 
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
            className="w-full h-32 bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none mb-3"
          />
        )}

        {activeTab === 'url' && (
          <div className="space-y-3 mb-3">
             <input
              type="text"
              placeholder="https://example.com/science-article"
              className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-primary-500"
              disabled
            />
             <p className="text-xs text-orange-500">URL extraction coming soon.</p>
          </div>
        )}

        {activeTab === 'file' && (
          <div className="border-2 border-dashed border-slate-200 rounded-lg h-32 flex flex-col items-center justify-center mb-3 cursor-pointer hover:bg-slate-50 transition-colors">
            <Upload className="text-slate-400 mb-2" size={24} />
            <span className="text-xs text-slate-500 font-medium">Upload PDF/TXT</span>
          </div>
        )}

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-2 text-xs text-red-700">
            <div className="flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{error}</span>
            </div>
          </div>
        )}

        <Button 
          onClick={handleSummarize} 
          isLoading={isLoading} 
          disabled={!inputText && activeTab === 'text'}
          className="w-full"
        >
          Summarize Content
        </Button>
      </GlassCard>

      {/* Results Display */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4 pb-4">
          <GlassCard title="Summary" icon={<BookOpen size={18} className="text-primary-600" />}>
            <p className="text-sm text-slate-600 leading-relaxed mb-3 text-justify">{result.summary}</p>
            <Button 
              variant="secondary" 
              className="text-xs py-1 h-8" 
              onClick={() => copyToClipboard(result.summary)}
              icon={<Copy size={12} />}
            >
              Copy
            </Button>
          </GlassCard>

          <GlassCard title="Key Concepts" icon={<FileText size={18} className="text-emerald-600" />}>
            <ul className="space-y-2">
              {result.keyPoints.map((point, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-slate-700">
                  <span className="text-emerald-500 mt-1 font-bold">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard title="Definitions" icon={<Layers size={18} className="text-orange-500" />}>
            <div className="grid gap-3">
              {result.terms.map((item, idx) => (
                <div key={idx} className="bg-orange-50/50 p-3 rounded-lg border border-orange-100">
                  <span className="text-orange-700 font-bold text-sm block mb-1">{item.term}</span>
                  <span className="text-xs text-slate-600">{item.definition}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard title="Practice Quiz" icon={<HelpCircle size={18} className="text-primary-600" />}>
             <div className="space-y-3">
              {result.practiceQuestions.map((q, idx) => (
                <div key={idx} className="bg-primary-50 border border-primary-100 p-3 rounded-lg">
                  <p className="text-sm text-primary-800 font-medium">Q{idx + 1}: {q}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};