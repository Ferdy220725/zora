"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, X, Send, Paperclip, Sparkles, Maximize2, Minimize2, 
  FileText, Trash2, Copy, Check, Mic, MicOff, GraduationCap, 
  Microscope, PenTool, MessageCircle, RefreshCw, TrendingDown, TrendingUp 
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/utils/supabase/client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function ChatBot({ materialsFromSupabase }: { materialsFromSupabase?: any[] }) {
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [fileToUpload, setFileToUpload] = useState<{name: string, base64: string} | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [currentMode, setCurrentMode] = useState("Free Chat");
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const modes = [
    { id: 'study', name: 'Study Mode', icon: <GraduationCap size={16} />, desc: 'Fokus rangkum materi' },
    { id: 'research', name: 'Deep Research', icon: <Microscope size={16} />, desc: 'Analisis mendalam' },
    { id: 'writing', name: 'Writing Mode', icon: <PenTool size={16} />, desc: 'Bantu susun laporan' },
    { id: 'chat', name: 'Free Chat', icon: <MessageCircle size={16} />, desc: 'Diskusi santai' },
  ];

  // --- DITAMBAHKAN DI SINI: FUNGSI LOGOUT ---
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUserId(null);
      setMessages([]);
      setShowModeMenu(false); // Tutup menu setelah logout
      toast.success("Berhasil keluar! 👋");
    } else {
      toast.error("Gagal logout");
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // (Bagian useEffect Voice, FetchHistory, dan SendMessage tetap sama seperti sebelumnya...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.lang = 'id-ID';
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(prev => prev + (prev ? " " : "") + transcript);
          setIsListening(false);
        };
        recognitionRef.current.onend = () => setIsListening(false);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return toast.error("Browser tidak support.");
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { setIsListening(true); recognitionRef.current.start(); toast.info("Zora Mendengarkan..."); }
  };

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-zora', handleOpen);
    return () => window.removeEventListener('open-zora', handleOpen);
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userId) return;
      const { data } = await supabase.from('chat_history').select('*').eq('user_id', userId).order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchHistory();
  }, [userId, supabase]);

  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !fileToUpload) || isLoading || !userId) return;
    const userMsg = { user_id: userId, role: 'user', content: fileToUpload ? `[Analisis: ${fileToUpload.name}]\n${input}` : input };
    await supabase.from('chat_history').insert([userMsg]);
    setMessages(prev => [...prev, userMsg]);
    const currentMessages = [...messages, userMsg];
    const currentFile = fileToUpload;
    setInput(""); setFileToUpload(null); setIsLoading(true);
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: currentMessages, fileData: currentFile, supabaseData: materialsFromSupabase, mode: currentMode }), });
      if (!response.ok) throw new Error();
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      setMessages(prev => [...prev, { role: 'assistant', content: "" }]);
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantContent += decoder.decode(value);
          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], content: assistantContent };
            return newMsgs;
          });
        }
        await supabase.from('chat_history').insert([{ user_id: userId, role: 'assistant', content: assistantContent }]);
      }
    } catch (err) { toast.error("Gagal konek!"); } finally { setIsLoading(false); }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    toast.success("Disalin! 📋");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      setFileToUpload({ name: file.name, base64: base64 });
      toast.success(`${file.name} siap!`);
    };
    reader.readAsDataURL(file);
  };

  const clearHistory = async () => {
    if (!userId) return;
    const { error } = await supabase.from('chat_history').delete().eq('user_id', userId);
    if (!error) { setMessages([]); toast.success("Riwayat bersih! 🧹"); }
  };

  const handleQuickCommand = (command: string) => {
    setInput(command);
    setTimeout(() => {
      const form = document.getElementById('chat-form') as HTMLFormElement;
      form?.requestSubmit();
    }, 100);
  };

  return (
    <>
      {isOpen && (
        <div className={`fixed z-[10000] flex flex-col bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 shadow-2xl transition-all duration-300
          ${isFullScreen ? 'inset-0' : 'bottom-24 right-4 md:right-8 w-[calc(100%-2rem)] md:w-[420px] h-[620px] max-h-[85vh] rounded-3xl'} overflow-hidden`}>
          
          {/* Header */}
          <div className="px-5 py-4 bg-[#800020] text-white flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-3">
              <Bot size={18} />
              <div>
                <h3 className="font-bold text-sm tracking-tight text-white">Zora Assistant 🍃</h3>
                <span className="text-[10px] opacity-70 block -mt-1 uppercase tracking-widest text-white">{currentMode}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {userId && <button onClick={clearHistory} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Trash2 size={16} /></button>}
              <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 hover:bg-white/10 rounded-lg hidden md:block">{isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X size={20} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative flex flex-col">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-transparent scrollbar-thin">
              {!userId ? (
                <div className="flex flex-col h-full justify-center p-2 animate-in fade-in duration-500">
                  <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow-sm border dark:border-white/10">
                    <div className="text-center mb-6">
                      <div className="bg-[#800020]/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="text-[#800020]" size={24} />
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-white">Akses Zora Assistant</h4>
                      <p className="text-[11px] text-slate-500 mt-1">Masuk untuk simpan riwayat chat Agrotek kamu</p>
                    </div>
                    <Auth
                      supabaseClient={supabase}
                      appearance={{ 
                        theme: ThemeSupa,
                        style: {
                          button: { background: '#800020', color: 'white', borderRadius: '12px', fontSize: '12px' },
                          input: { borderRadius: '12px', fontSize: '12px', backgroundColor: '#ffffff', color: '#000000', borderColor: '#e2e8f0' },
                          label: { fontSize: '12px', fontWeight: '600', color: '#475569' },
                          anchor: { color: '#800020', fontSize: '12px' }
                        }
                      }}
                      providers={[]}
                      localization={{
                        variables: {
                          sign_in: { email_label: 'Email Kampus/Pribadi', password_label: 'Password', button_label: 'Masuk Sekarang' },
                          sign_up: { email_label: 'Email Kampus/Pribadi', password_label: 'Password', button_label: 'Daftar Akun Baru', link_text: 'Belum punya akun? Daftar' }
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-10">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-30 mt-20">
                      <Sparkles size={32} className="text-[#800020]" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">Ready in {currentMode}</p>
                    </div>
                  )}
                  {messages.map((m, idx) => (
                    <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
                      <div className={`flex flex-col gap-2 max-w-[90%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`relative px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm
                          ${m.role === 'user' ? 'bg-[#800020] text-white rounded-tr-none' : 'bg-white dark:bg-[#1a1a1a] border dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-tl-none'}`}>
                          <div className="prose prose-sm dark:prose-invert break-words text-inherit">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                          </div>
                        </div>
                        {m.role === 'assistant' && m.content && (
                          <div className="flex flex-wrap gap-2 items-center pl-1">
                            <button onClick={() => handleCopy(m.content, idx)} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-[#800020] bg-white dark:bg-white/5 px-2 py-1 rounded-md border dark:border-white/10 shadow-sm uppercase">
                              {copiedId === idx ? <Check size={10} className="text-green-500" /> : <Copy size={10} />} SALIN
                            </button>
                            <button onClick={() => handleQuickCommand("Jelaskan ulang bagian ini")} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-blue-600 bg-white dark:bg-white/5 px-2 py-1 rounded-md border dark:border-white/10 shadow-sm uppercase">
                              <RefreshCw size={10} /> Jelaskan ulang
                            </button>
                            <button onClick={() => handleQuickCommand("Sederhanakan penjelasan ini")} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-orange-600 bg-white dark:bg-white/5 px-2 py-1 rounded-md border dark:border-white/10 shadow-sm uppercase">
                              <TrendingDown size={10} /> Lebih sederhana
                            </button>
                            <button onClick={() => handleQuickCommand("Detailkan bagian ini")} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-emerald-600 bg-white dark:bg-white/5 px-2 py-1 rounded-md border dark:border-white/10 shadow-sm uppercase">
                              <TrendingUp size={10} /> Lebih detail
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isLoading && <div className="flex gap-1.5 pl-2 text-[#800020] animate-pulse mt-4"><div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" /></div>}
            </div>

            {/* --- DITAMBAHKAN DI SINI: MENU MODE + TOMBOL LOGOUT --- */}
            {userId && showModeMenu && (
              <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-[#1a1a1a] border dark:border-white/10 rounded-2xl shadow-2xl p-2 animate-in slide-in-from-bottom-2 duration-200 z-50">
                <div className="grid grid-cols-2 gap-2">
                  {modes.map((mode) => (
                    <button key={mode.id} onClick={() => { setCurrentMode(mode.name); setShowModeMenu(false); }}
                      className={`flex flex-col items-start gap-1 p-3 rounded-xl border transition-all ${
                        currentMode === mode.name ? 'bg-[#800020] border-[#800020] text-white' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-600 dark:text-slate-300'
                      }`}>
                      <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-tight">{mode.icon} {mode.name}</div>
                      <span className={`text-[9px] ${currentMode === mode.name ? 'opacity-80' : 'text-slate-400'}`}>{mode.desc}</span>
                    </button>
                  ))}
                </div>
                
                {/* TOMBOL LOGOUT BARU */}
                <button 
                  onClick={handleLogout}
                  className="w-full mt-2 flex items-center justify-center gap-2 p-3 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-100 transition-colors"
                >
                  <X size={14} /> Keluar / Ganti Akun
                </button>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-[#0a0a0a] border-t dark:border-white/10 flex-shrink-0">
            {fileToUpload && (
              <div className="mb-2 flex items-center justify-between bg-[#800020]/5 p-2 rounded-xl border border-[#800020]/10 text-[10px] font-bold">
                <div className="flex items-center gap-2 truncate text-slate-600 dark:text-slate-400">
                  <FileText size={14} className="text-[#800020]" /> {fileToUpload.name}
                </div>
                <button onClick={() => setFileToUpload(null)} className="text-red-500"><X size={14}/></button>
              </div>
            )}
            <form id="chat-form" onSubmit={handleSendMessage} className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
              <button type="button" onClick={() => setShowModeMenu(!showModeMenu)} disabled={!userId} className={`p-2 rounded-lg ${showModeMenu ? 'bg-[#800020] text-white' : 'text-slate-400'}`}><Sparkles size={18} /></button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.txt,.docx" />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!userId} className="p-2 text-slate-400 hover:text-[#800020]"><Paperclip size={18} /></button>
              <input className="flex-1 bg-transparent border-none focus:outline-none text-sm py-2 px-1 text-slate-700 dark:text-slate-200 disabled:opacity-50" value={input} placeholder={!userId ? "Silakan login di atas..." : `Tanya di ${currentMode}...`} onChange={(e) => setInput(e.target.value)} disabled={!userId} />
              <button type="button" onClick={toggleListening} disabled={!userId} className={`p-2 ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button type="submit" disabled={(!input.trim() && !fileToUpload) || isLoading || !userId} className="p-2.5 bg-[#800020] text-white rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50">
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}