import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Send, Bot, User, Sparkles, Paperclip, X, FileText, AlertTriangle, Image as ImageIcon, Lock } from 'lucide-react';
import { GlassCard, Button } from './UIComponents';
import { ChatMessage } from '../types';
import { createChatSession, fileToGenerativePart } from '../services/geminiService';
import { Chat } from '@google/genai';

interface ChatPanelProps {
  incrementStats: () => void;
  language: 'English' | 'Bangla';
  setLanguage: (lang: 'English' | 'Bangla') => void;
  questionsAskedCount: number;
}

const DAILY_LIMIT = 50;

export const ChatPanel: React.FC<ChatPanelProps> = ({ incrementStats, language, setLanguage, questionsAskedCount }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: language === 'English' 
        ? "Hello! I am **JIGESHAI**, your personal AI Tutor. \n\nI can help you understand concepts in **Physics, Chemistry, Biology, and Math**. \n\nTry asking: $E=mc^2$ or $\\int x dx$"
        : "হ্যালো! আমি **জিজ্ঞাসএআই (JIGESHAI)**। আমি আপনার ব্যক্তিগত এআই শিক্ষক। \n\nআমি আপনাকে **পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান এবং গণিত** বুঝতে সাহায্য করতে পারি।",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLimitReached = questionsAskedCount >= DAILY_LIMIT;

  // Initialize or Re-initialize chat when language changes
  useEffect(() => {
    try {
      chatSessionRef.current = createChatSession(language);
    } catch (e: any) {
      console.error("Failed to init chat:", e);
      if (e.message === "API_KEY_MISSING") {
         setMessages(prev => [...prev, {
            id: 'system-error',
            role: 'model',
            text: "⚠️ **System Error**: API Key is missing. Please check your deployment settings.",
            timestamp: Date.now(),
            isError: true
         }]);
      }
    }
  }, [language]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Accept PDF or Images
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        setAttachment(file);
      } else {
        alert("Please upload a PDF or an Image file.");
      }
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generateResponse = async (text: string, file: File | null) => {
    if (!chatSessionRef.current) return;

    setIsLoading(true);
    try {
      let result;
      
      if (file) {
        // Send file + text
        const filePart = await fileToGenerativePart(file);
        const textPart = { text: text || "Analyze this document/image." };
        
        result = await chatSessionRef.current.sendMessageStream({ 
          message: [textPart, filePart] as any 
        });
      } else {
        // Text only
        result = await chatSessionRef.current.sendMessageStream({ message: text });
      }
      
      const botMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: botMsgId,
        role: 'model',
        text: '', // Start empty
        timestamp: Date.now()
      }]);

      let fullText = '';
      for await (const chunk of result) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          setMessages(prev => prev.map(msg => 
            msg.id === botMsgId ? { ...msg, text: fullText } : msg
          ));
        }
      }
      incrementStats();
    } catch (error: any) {
      console.error("Chat error:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error.message === "API_KEY_MISSING") {
        errorMessage = "⚠️ **Config Error**: Gemini API Key is missing in Vercel environment variables.";
      } else if (error.status === 429 || error.message?.includes('429')) {
        errorMessage = "⏳ **Limit Reached**: You have hit the hourly usage limit for the Gemini API. Please take a study break and try again later!";
      } else if (error.status === 503 || error.status === 500) {
        errorMessage = "🔧 **Service Overloaded**: The AI service is currently busy or experiencing issues. Please try again in a moment.";
      } else if (error.message?.includes('fetch') || error.message?.includes('Network')) {
        errorMessage = "📡 **Network Error**: Please check your internet connection.";
      } else if (error.message?.includes('safety') || error.message?.includes('blocked')) {
        errorMessage = "🛡️ **Safety Block**: The response was blocked due to safety guidelines. Please rephrase your question.";
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: errorMessage,
        timestamp: Date.now(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (isLimitReached) return;
    if ((!input.trim() && !attachment) || !chatSessionRef.current) return;

    const currentText = input;
    const currentFile = attachment;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: currentText,
      timestamp: Date.now(),
      attachment: currentFile ? { name: currentFile.name, type: currentFile.type } : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    await generateResponse(currentText, currentFile);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <GlassCard className="h-full flex flex-col p-0 border-primary-200" active>
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="bg-primary-50 p-2 rounded-lg border border-primary-100">
             <Bot className="text-primary-600" size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">JIGESHAI</h2>
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-500">{language === 'English' ? 'Science & Math Tutor' : 'বিজ্ঞান ও গণিত শিক্ষক'}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isLimitReached ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                {questionsAskedCount}/{DAILY_LIMIT}
              </span>
            </div>
          </div>
        </div>
        
        {/* Language Toggle for Mobile/Tablet context */}
        <div className="md:hidden flex bg-slate-100 rounded-lg p-1">
             <button 
                  onClick={() => setLanguage('English')}
                  className={`px-2 py-1 rounded-md text-[10px] transition-all ${language === 'English' ? 'bg-white text-primary-600 shadow-sm font-bold' : 'text-slate-500'}`}
                >
                  ENG
                </button>
                <button 
                  onClick={() => setLanguage('Bangla')}
                  className={`px-2 py-1 rounded-md text-[10px] transition-all ${language === 'Bangla' ? 'bg-white text-primary-600 shadow-sm font-bold' : 'text-slate-500'}`}
                >
                  BN
                </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
               <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.isError ? 'bg-red-100' : 'bg-primary-100'}`}>
                  {msg.isError ? <AlertTriangle size={14} className="text-red-600" /> : <Bot size={14} className="text-primary-600" />}
               </div>
            )}

            <div className="flex flex-col gap-1 max-w-[85%]">
              {msg.attachment && (
                <div className={`p-2 rounded-lg border flex items-center gap-2 mb-1 self-end ${msg.role === 'user' ? 'bg-primary-700 border-primary-600 text-white' : 'bg-white border-slate-200'}`}>
                  {msg.attachment.type.startsWith('image/') ? <ImageIcon size={16} /> : <FileText size={16} />}
                  <span className="text-xs truncate max-w-[150px]">{msg.attachment.name}</span>
                </div>
              )}
              <div 
                className={`
                  rounded-2xl p-4 shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-primary-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                  }
                  ${msg.isError ? 'border-red-200 bg-red-50 text-red-800' : ''}
                `}
              >
                {msg.role === 'model' ? (
                  <div className="prose prose-sm max-w-none prose-slate">
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                )}
              </div>
            </div>
            
            {msg.role === 'user' && (
               <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <User size={14} className="text-slate-600" />
               </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start gap-3">
             <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-primary-600" />
             </div>
            <div className="bg-white rounded-2xl rounded-tl-none p-4 border border-slate-200 shadow-sm flex items-center gap-2">
              <Sparkles className="text-primary-500 animate-pulse" size={16} />
              <span className="text-xs text-slate-500 font-medium">{language === 'English' ? 'Thinking...' : 'ভাবছি...'}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 bg-white">
        {isLimitReached ? (
          <div className="flex items-center justify-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100">
            <Lock size={16} />
            <span className="text-sm font-medium">Daily limit of {DAILY_LIMIT} questions reached.</span>
          </div>
        ) : (
          <>
            {attachment && (
              <div className="flex items-center gap-2 mb-2 bg-slate-100 p-2 rounded-lg w-fit">
                <div className="bg-white p-1 rounded border border-slate-200">
                  {attachment.type.startsWith('image/') ? <ImageIcon size={14} className="text-blue-500" /> : <FileText size={14} className="text-red-500" />}
                </div>
                <span className="text-xs text-slate-700 font-medium truncate max-w-[200px]">{attachment.name}</span>
                <button onClick={clearAttachment} className="ml-2 hover:bg-slate-200 rounded-full p-1">
                  <X size={12} className="text-slate-500" />
                </button>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden" 
                accept="application/pdf,image/png,image/jpeg,image/webp"
              />
              <Button 
                variant="secondary"
                className="h-[52px] w-[52px] !p-0 rounded-xl"
                onClick={() => fileInputRef.current?.click()}
                title="Upload PDF or Photo"
              >
                <Paperclip size={20} className="text-slate-500" />
              </Button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={language === 'English' ? "Ask a question or send a photo..." : "একটি প্রশ্ন জিজ্ঞাসা করুন বা ছবি পাঠান..."}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none h-[52px] scrollbar-hide text-sm"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={(!input.trim() && !attachment) || isLoading}
                className="h-[52px] w-[52px] !p-0 rounded-xl shadow-none"
              >
                <Send size={20} />
              </Button>
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-2">
              {language === 'English' ? 'Upload PDF or Photos for analysis.' : 'বিশ্লেষণের জন্য পিডিএফ বা ছবি আপলোড করুন।'}
            </p>
          </>
        )}
      </div>
    </GlassCard>
  );
};