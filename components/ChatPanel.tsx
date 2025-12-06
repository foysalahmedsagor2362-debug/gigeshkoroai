import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Sparkles, Paperclip, X, FileText } from 'lucide-react';
import { GlassCard, Button } from './UIComponents';
import { ChatMessage } from '../types';
import { createChatSession, fileToGenerativePart } from '../services/geminiService';
import { Chat } from '@google/genai';

interface ChatPanelProps {
  incrementStats: () => void;
  language: 'English' | 'Bangla';
  setLanguage: (lang: 'English' | 'Bangla') => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ incrementStats, language, setLanguage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: language === 'English' 
        ? "Hello! I am Gigesh Koro AI. I can help you with Physics, Chemistry, Biology, and Mathematics. How can I help you today?"
        : "হ্যালো! আমি জিজ্ঞাস করো এআই (Gigesh Koro AI)। আমি আপনাকে পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান এবং গণিতে সাহায্য করতে পারি। আজ আপনি কী পড়তে চান?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or Re-initialize chat when language changes
  useEffect(() => {
    try {
      chatSessionRef.current = createChatSession(language);
      // Optional: If we want to reset history on language change, we can do it here.
      // For now, we keep history but the system instruction changes for future turns if we were to preserve context manually.
      // Since createChatSession returns a NEW session, the history is effectively reset for the Model's context,
      // but we keep the UI history.
    } catch (e) {
      console.error("Failed to init chat:", e);
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
      if (file.type === 'application/pdf') {
        setAttachment(file);
      } else {
        alert("Please upload a PDF file.");
      }
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !attachment) || !chatSessionRef.current) return;

    const currentAttachment = attachment;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
      attachment: currentAttachment ? { name: currentAttachment.name, type: currentAttachment.type } : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setIsLoading(true);

    try {
      let result;
      
      if (currentAttachment) {
        // Send file + text
        const filePart = await fileToGenerativePart(currentAttachment);
        const textPart = { text: userMsg.text || "Analyze this document." };
        
        // When sending parts, we must construct the message payload correctly
        result = await chatSessionRef.current.sendMessageStream({ 
          message: [textPart, filePart] as any // Casting as any because SDK types might be strict but API supports it
        });
      } else {
        // Text only
        result = await chatSessionRef.current.sendMessageStream({ message: userMsg.text });
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
      let errorMessage = "Network error. Please try again.";
      if (error.message === "API_KEY_MISSING") {
        errorMessage = "⚠️ **Config Error**: Gemini API Key is missing.";
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
            <h2 className="font-bold text-slate-800">Gigesh Koro AI</h2>
            <p className="text-xs text-slate-500">{language === 'English' ? 'Science & Math Tutor' : 'বিজ্ঞান ও গণিত শিক্ষক'}</p>
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
               <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-primary-600" />
               </div>
            )}

            <div className="flex flex-col gap-1 max-w-[85%]">
              {msg.attachment && (
                <div className={`p-2 rounded-lg border flex items-center gap-2 mb-1 self-end ${msg.role === 'user' ? 'bg-primary-700 border-primary-600 text-white' : 'bg-white border-slate-200'}`}>
                  <FileText size={16} />
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
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
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
        {attachment && (
          <div className="flex items-center gap-2 mb-2 bg-slate-100 p-2 rounded-lg w-fit">
            <div className="bg-white p-1 rounded border border-slate-200">
               <FileText size={14} className="text-red-500" />
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
            accept="application/pdf"
          />
          <Button 
            variant="secondary"
            className="h-[52px] w-[52px] !p-0 rounded-xl"
            onClick={() => fileInputRef.current?.click()}
            title="Upload PDF"
          >
            <Paperclip size={20} className="text-slate-500" />
          </Button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'English' ? "Ask a question..." : "একটি প্রশ্ন জিজ্ঞাসা করুন..."}
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
          {language === 'English' ? 'Upload PDF for analysis.' : 'বিশ্লেষণের জন্য পিডিএফ আপলোড করুন।'}
        </p>
      </div>
    </GlassCard>
  );
};