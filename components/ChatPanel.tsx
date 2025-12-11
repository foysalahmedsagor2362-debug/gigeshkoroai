import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Send, Bot, User, Paperclip, X, FileText, AlertTriangle, Image as ImageIcon, Trash2, Bold, Italic, Code, Sigma, Eye, EyeOff, History, Clock } from 'lucide-react';
import { GlassCard, Button } from './UIComponents';
import { ChatMessage } from '../types';
import { createChatSession, fileToGenerativePart } from '../services/geminiService';
import { getCurrentUser, incrementQuestionCount } from '../services/backend';
import { Chat, Content } from '@google/genai';

interface ChatPanelProps {
  incrementStats: () => void;
  language: 'English' | 'Bangla';
  setLanguage: (lang: 'English' | 'Bangla') => void;
  questionsAskedCount: number;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ incrementStats, language, setLanguage, questionsAskedCount }) => {
  // Load chat history from localStorage or initialize default
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('jigesh_chat_history');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
    
    return [{
      id: 'welcome',
      role: 'model',
      text: language === 'English' 
        ? "Hello! I am **JIGESHAI**. \n\nI can help you understand concepts in **Physics, Chemistry, Biology, and Math**. \n\nTry asking: $E=mc^2$ or $\\int x dx$"
        : "হ্যালো! আমি **জিজ্ঞাসএআই (JIGESHAI)**। আমি আপনার ব্যক্তিগত এআই শিক্ষক। \n\nআমি আপনাকে **পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান এবং গণিত** বুঝতে সাহায্য করতে পারি।",
      timestamp: Date.now()
    }];
  });

  // Search History State
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('jigesh_search_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState(false);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Save chat history whenever messages change
  useEffect(() => {
    localStorage.setItem('jigesh_chat_history', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  // Initialize Chat Session with History
  useEffect(() => {
    try {
      // Reconstruct history for Gemini context
      const history: Content[] = messages
        .filter(m => !m.isError && m.id !== 'welcome' && m.id !== 'system-error')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      chatSessionRef.current = createChatSession(language, history);
    } catch (e: any) {
      console.error("Failed to init chat:", e);
      if (e.message === "API_KEY_MISSING") {
         setMessages(prev => [...prev, {
            id: 'system-error',
            role: 'model',
            text: "⚠️ **Configuration Error**: API Key is missing.\n\nPlease set **VITE_API_KEY** or **API_KEY** in your Vercel/Netlify project settings.",
            timestamp: Date.now(),
            isError: true
         }]);
      }
    }
  }, [language]); // Re-initialize if language changes

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClearChat = () => {
    if (window.confirm(language === 'English' ? "Clear conversation history?" : "কথপোকথনের ইতিহাস মুছে ফেলবেন?")) {
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        role: 'model',
        text: language === 'English' 
          ? "Hello! I am **JIGESHAI**. \n\nI can help you understand concepts in **Physics, Chemistry, Biology, and Math**."
          : "হ্যালো! আমি **জিজ্ঞাসএআই (JIGESHAI)**।",
        timestamp: Date.now()
      };
      setMessages([welcomeMsg]);
      localStorage.removeItem('jigesh_chat_history');
      chatSessionRef.current = createChatSession(language, []);
    }
  };

  const addToHistory = (text: string) => {
    if (!text.trim()) return;
    setSearchHistory(prev => {
      // Remove duplicate if exists, add new to top, keep last 15
      const newHistory = [text, ...prev.filter(h => h !== text)].slice(0, 15);
      localStorage.setItem('jigesh_search_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const handleClearHistory = () => {
    if (window.confirm("Clear search history?")) {
      setSearchHistory([]);
      localStorage.removeItem('jigesh_search_history');
    }
  };

  const selectHistoryItem = (text: string) => {
    setInput(text);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
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

  const insertText = (before: string, after: string = '') => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const newText = text.substring(0, start) + before + text.substring(start, end) + after + text.substring(end);
    
    setInput(newText);
    
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const generateResponse = async (text: string, file: File | null) => {
    if (!chatSessionRef.current) return;

    setIsLoading(true);
    setShowPreview(false); // Switch back to edit mode on send
    
    // Optimistic UI
    const botMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: botMsgId,
      role: 'model',
      text: '', // Start empty
      timestamp: Date.now()
    }]);

    try {
      let result;
      
      if (file) {
        const filePart = await fileToGenerativePart(file);
        const textPart = { text: text || "Analyze this document/image." };
        result = await chatSessionRef.current.sendMessageStream({ 
          message: [textPart, filePart] as any 
        });
      } else {
        result = await chatSessionRef.current.sendMessageStream({ message: text });
      }
      
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
      
      const u = getCurrentUser();
      incrementQuestionCount(u);
      incrementStats();

    } catch (error: any) {
      console.error("Chat error:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error.message === "API_KEY_MISSING") {
        errorMessage = "⚠️ **Config Error**: Gemini API Key is missing.";
      } else if (error.status === 429) {
        errorMessage = "⏳ **Limit Reached**: Hourly usage limit exceeded.";
      } else if (error.status === 503 || error.status === 500) {
        errorMessage = "🔧 **Service Overloaded**: The AI service is currently busy.";
      } else if (error.message?.includes('fetch')) {
        errorMessage = "📡 **Network Error**: Please check your internet connection.";
      }

      setMessages(prev => prev.map(msg => 
        msg.id === botMsgId ? { ...msg, text: errorMessage, isError: true } : msg
      ));
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !attachment) || !chatSessionRef.current) return;

    const currentText = input;
    const currentFile = attachment;

    // Save to history
    if (currentText) addToHistory(currentText);

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
    <GlassCard className="h-full border-primary-200 shadow-sm p-0" active>
      <div className="flex flex-col h-full relative">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-2xl z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary-50 p-2 rounded-lg border border-primary-100">
               <Bot className="text-primary-600" size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">JIGESHAI</h2>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500">{language === 'English' ? 'Physics • Chem • Bio • Math' : 'পদার্থ • রসায়ন • জীববিজ্ঞান • গণিত'}</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleClearChat}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear Conversation"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 min-h-0">
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

              <div className="flex flex-col gap-1 max-w-[85%] lg:max-w-[75%] min-w-0">
                {msg.attachment && (
                  <div className={`p-2 rounded-lg border flex items-center gap-2 mb-1 self-end ${msg.role === 'user' ? 'bg-primary-700 border-primary-600 text-white' : 'bg-white border-slate-200'}`}>
                    {msg.attachment.type.startsWith('image/') ? <ImageIcon size={16} /> : <FileText size={16} />}
                    <span className="text-xs truncate max-w-[150px]">{msg.attachment.name}</span>
                  </div>
                )}
                
                {/* Message Bubble */}
                <div 
                  className={`
                    rounded-2xl p-4 shadow-sm relative group
                    ${msg.role === 'user' 
                      ? 'bg-primary-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }
                    ${msg.isError ? 'border-red-200 bg-red-50 text-red-800' : ''}
                  `}
                >
                  {msg.role === 'model' && !msg.text && !msg.isError ? (
                    /* Loading state */
                    <div className="flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                       <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                       <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                    </div>
                  ) : msg.role === 'model' ? (
                    <div className="prose prose-sm max-w-none prose-slate overflow-x-auto">
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none prose-invert overflow-x-auto">
                      <ReactMarkdown 
                          remarkPlugins={[remarkMath]} 
                          rehypePlugins={[rehypeKatex]}
                      >
                          {msg.text}
                      </ReactMarkdown>
                    </div>
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
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl z-20 shrink-0 relative">
          {showHistory && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowHistory(false)}></div>
              <div className="absolute bottom-full left-4 mb-2 w-64 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-20 animate-in fade-in slide-in-from-bottom-2">
                 <div className="p-2 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><History size={12}/> Recent</span>
                    <button onClick={handleClearHistory} className="text-[10px] text-red-500 hover:text-red-600 font-medium">Clear All</button>
                 </div>
                 {searchHistory.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">No history yet</div>
                 ) : (
                   <div className="py-1">
                     {searchHistory.map((item, idx) => (
                       <button 
                          key={idx}
                          onClick={() => selectHistoryItem(item)}
                          className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 truncate transition-colors"
                       >
                          <Clock size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{item}</span>
                       </button>
                     ))}
                   </div>
                 )}
              </div>
            </>
          )}

          <div className="space-y-3">
               {/* Formatting Toolbar */}
               <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1">
                     <button onClick={() => insertText('**', '**')} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" title="Bold"><Bold size={14} /></button>
                     <button onClick={() => insertText('*', '*')} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" title="Italic"><Italic size={14} /></button>
                     <button onClick={() => insertText('$', '$')} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" title="Math (LaTeX)"><Sigma size={14} /></button>
                     <button onClick={() => insertText('`', '`')} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" title="Code"><Code size={14} /></button>
                     <div className="w-px h-4 bg-slate-200 mx-1"></div>
                     <button 
                        onClick={() => setShowHistory(!showHistory)} 
                        className={`p-1.5 rounded transition-colors ${showHistory ? 'text-primary-600 bg-primary-50' : 'text-slate-400 hover:text-primary-600 hover:bg-primary-50'}`} 
                        title="Search History"
                     >
                       <History size={14} />
                     </button>
                  </div>
                  <button 
                    onClick={() => setShowPreview(!showPreview)} 
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${showPreview ? 'bg-primary-100 text-primary-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                  >
                     {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                     <span>{showPreview ? 'Edit' : 'Preview'}</span>
                  </button>
               </div>

              {attachment && (
                <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg w-fit">
                  <div className="bg-white p-1 rounded border border-slate-200">
                    {attachment.type.startsWith('image/') ? <ImageIcon size={14} className="text-blue-500" /> : <FileText size={14} className="text-red-500" />}
                  </div>
                  <span className="text-xs text-slate-700 font-medium truncate max-w-[200px]">{attachment.name}</span>
                  <button onClick={clearAttachment} className="ml-2 hover:bg-slate-200 rounded-full p-1">
                    <X size={12} className="text-slate-500" />
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-start">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden" 
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                />
                <Button 
                  variant="secondary"
                  className="h-[52px] w-[52px] !p-0 rounded-xl shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload PDF or Photo"
                >
                  <Paperclip size={20} className="text-slate-500" />
                </Button>
                
                <div className="flex-1 relative">
                  {showPreview ? (
                     <div className="w-full h-[80px] overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm prose prose-sm max-w-none">
                        {input.trim() ? (
                          <ReactMarkdown 
                            remarkPlugins={[remarkMath]} 
                            rehypePlugins={[rehypeKatex]}
                          >
                            {input}
                          </ReactMarkdown>
                        ) : (
                          <span className="text-slate-400 italic">Preview will appear here...</span>
                        )}
                     </div>
                  ) : (
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={language === 'English' ? "Ask a question about Math, Physics..." : "গণিত বা বিজ্ঞান সম্পর্কে প্রশ্ন করুন..."}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none h-[80px] scrollbar-hide text-sm block"
                      disabled={isLoading}
                    />
                  )}
                </div>

                <Button 
                  onClick={handleSendMessage} 
                  disabled={(!input.trim() && !attachment) || isLoading}
                  className="h-[52px] w-[52px] !p-0 rounded-xl shadow-none shrink-0"
                >
                  {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"/> : <Send size={20} />}
                </Button>
              </div>
            </div>
        </div>
      </div>
    </GlassCard>
  );
};