
import React, { useEffect, useState, useRef } from 'react';
import { getNews, getCurrentUser } from '../services/backend';
import { GoogleGenAI } from "@google/genai";
import { NewsItem, User } from '../types';
import { Bell, MessageSquare, Send, Bot, User as UserIcon, Loader2, Info, Gift, AlertTriangle } from 'lucide-react';

export default function NewsPage() {
  const [tab, setTab] = useState<'NEWS' | 'SUPPORT'>('NEWS');
  const [news, setNews] = useState<NewsItem[]>([]);
  
  // Chat State
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
      {role: 'model', text: `Assalam-o-Alaikum ${user?.name}! Mein StockGrow ka AI Assistant hoon. Mein apki kya madad kar sakta hoon?`}
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNews(getNews());
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, tab]);

  const handleSend = async () => {
      if(!input.trim()) return;
      const userMsg = input;
      setInput('');
      setMessages(prev => [...prev, {role: 'user', text: userMsg}]);
      setChatLoading(true);

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = "gemini-2.5-flash";
        
        const systemPrompt = `
           You are a polite, helpful, and professional AI Support Agent for "StockGrow", an investment app.
           User Name: ${user?.name}
           User Balance: Rs.${user?.balance}
           Language: Urdu (Roman) or English (Mix). Be very polite (use 'Aap', 'Janab').
           
           Knowledge Base:
           - Plans: BlueCard (Rs.399, 3 days), Silver (Rs.600), Gold, etc. High returns.
           - Game: Dragon vs Tiger. 100% fair. Live betting.
           - Wallet: JazzCash, Easypaisa, Bank Transfer allowed. Deposit takes time for admin approval.
           - Issues: If user has a specific technical problem, ask them to use the "Contact Support" form in the Profile page.
           
           Your goal is to guide them and make them feel valued. Keep answers short and helpful.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: [
                { role: 'user', parts: [{ text: systemPrompt + "\n\nUser Question: " + userMsg }] }
            ]
        });

        const reply = response.text;
        setMessages(prev => [...prev, {role: 'model', text: reply}]);

      } catch (error) {
          setMessages(prev => [...prev, {role: 'model', text: "Maaf kijiye, abhi network issue hai. Thori dair baad try karein."}]);
      } finally {
          setChatLoading(false);
      }
  };

  return (
    <div className="p-4 pt-8 pb-24 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Updates & Help</h1>
        <div className="bg-slate-800 p-1 rounded-lg flex">
            <button onClick={() => setTab('NEWS')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${tab === 'NEWS' ? 'bg-neonBlue text-black' : 'text-slate-400'}`}>News</button>
            <button onClick={() => setTab('SUPPORT')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${tab === 'SUPPORT' ? 'bg-neonBlue text-black' : 'text-slate-400'}`}>AI Chat</button>
        </div>
      </div>

      {tab === 'NEWS' ? (
          <div className="space-y-4 overflow-y-auto pb-20">
              {news.length === 0 ? (
                  <div className="text-center text-slate-500 mt-20">
                      <Bell size={48} className="mx-auto mb-4 opacity-20"/>
                      <p>No new updates yet.</p>
                  </div>
              ) : (
                  news.map(item => (
                      <div key={item.id} className="bg-surface border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden animate-fade-in">
                          <div className={`absolute top-0 left-0 w-1 h-full ${
                              item.type === 'BONUS' ? 'bg-purple-500' : item.type === 'ALERT' ? 'bg-red-500' : 'bg-blue-500'
                          }`}></div>
                          
                          <div className="flex items-start mb-3">
                              <div className={`p-2 rounded-full mr-3 ${
                                  item.type === 'BONUS' ? 'bg-purple-500/20 text-purple-500' : 
                                  item.type === 'ALERT' ? 'bg-red-500/20 text-red-500' : 
                                  'bg-blue-500/20 text-blue-500'
                              }`}>
                                  {item.type === 'BONUS' ? <Gift size={20}/> : item.type === 'ALERT' ? <AlertTriangle size={20}/> : <Info size={20}/>}
                              </div>
                              <div>
                                  <h3 className="text-white font-bold text-lg">{item.title}</h3>
                                  <p className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString()}</p>
                              </div>
                          </div>
                          
                          <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                              {item.content}
                          </div>
                      </div>
                  ))
              )}
          </div>
      ) : (
          <div className="flex-1 flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden relative">
              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                  {messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                              msg.role === 'user' 
                              ? 'bg-neonBlue text-black rounded-tr-none' 
                              : 'bg-slate-800 text-white rounded-tl-none border border-slate-700'
                          }`}>
                              {msg.role === 'model' && <p className="text-[10px] opacity-50 mb-1 font-bold flex items-center"><Bot size={10} className="mr-1"/> AI Support</p>}
                              {msg.text}
                          </div>
                      </div>
                  ))}
                  {chatLoading && (
                       <div className="flex justify-start">
                           <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700">
                               <Loader2 className="animate-spin text-neonBlue" size={16} />
                           </div>
                       </div>
                  )}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask anything..." 
                    className="flex-1 bg-black/50 border border-slate-700 rounded-full px-4 py-3 text-white focus:border-neonBlue focus:outline-none text-sm"
                  />
                  <button onClick={handleSend} className="p-3 bg-neonBlue rounded-full text-black hover:bg-cyan-400 transition-colors">
                      <Send size={18} />
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}
