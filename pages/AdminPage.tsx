
import React, { useEffect, useState, useRef } from 'react';
import { getAllUsers, approveWithdrawal, rejectWithdrawal, approveDeposit, rejectDeposit, getCurrentUser, logout, getPlatformStats, adminUpdateUser, getDatabaseString, importDatabaseString, getGameSequence, updateGameResultAtIndex, getLiveBets, publishNews, deleteNews, getNews, getAllTickets, replyToTicket } from '../services/backend';
import { User, NewsItem, SupportTicket } from '../types';
import { ShieldCheck, ArrowUpRight, ArrowDownLeft, Check, X, Loader2, LogOut, LayoutDashboard, Users, Activity, Edit2, Lock, Smartphone, Database, Download, Upload, AlertTriangle, RefreshCw, Bell, Gamepad2, ArrowRight, CreditCard, Calendar, FileText, Newspaper, Wand2, Trash2, Headphones, MessageSquare, Send, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";

export default function AdminPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'DASHBOARD' | 'REQUESTS' | 'GAME' | 'USERS' | 'DATA' | 'NEWS' | 'SUPPORT'>('REQUESTS');
  const [stats, setStats] = useState({ totalDeposit: 0, totalWithdraw: 0, totalProfitDistributed: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Game Control State
  const [gameSequence, setGameSequence] = useState<string[]>([]);
  const [liveBets, setLiveBets] = useState<{ DRAGON: number, TIGER: number, TIE: number }>({ DRAGON: 0, TIGER: 0, TIE: 0 });
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ mobile: '', password: '' });

  // News State
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [newsPrompt, setNewsPrompt] = useState('');
  const [generatingNews, setGeneratingNews] = useState(false);

  // Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Success Modal
  const [successModal, setSuccessModal] = useState<{show: boolean, data: any}>({show: false, data: null});

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.mobile !== '03281614102') {
       navigate('/');
       return;
    }

    fetchData();

    // Polling for updates
    const interval = setInterval(() => {
        if(!replyingTo && !successModal.show) fetchData(true); 
    }, 3000); 

    return () => clearInterval(interval);
  }, [replyingTo, successModal.show]);

  const fetchData = async (silent = false) => {
    if(!silent) setLoading(true);
    const data = await getAllUsers();
    const platformStats = await getPlatformStats();
    
    const seq = getGameSequence();
    const bets = getLiveBets();
    const n = getNews();
    const t = getAllTickets();

    setUsers(data);
    setStats(platformStats);
    setGameSequence(seq);
    setLiveBets(bets);
    setNewsList(n);
    setTickets(t);
    
    if(!silent) setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  // --- NEWS GENERATOR ---
  const handleGenerateNews = async () => {
    if(!newsPrompt.trim()) return;
    setGeneratingNews(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = "gemini-2.5-flash";
        const prompt = `
            You are a content writer for "StockGrow" investment app. 
            User Input: "${newsPrompt}"
            Task: Generate a JSON object with 'title', 'content', and 'type'.
            'type' must be one of: 'INFO', 'ALERT', 'BONUS'.
            Content should be professional, exciting, and short (under 50 words).
            Example JSON: {"title": "Eid Bonus!", "content": "Get 50% extra on all deposits till Sunday.", "type": "BONUS"}
            Only return the JSON.
        `;
        
        const result = await ai.models.generateContent({ model, contents: prompt });
        const text = result.text.trim();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '');
        const newsData = JSON.parse(jsonStr);
        
        publishNews(newsData);
        setNewsPrompt('');
        fetchData();
        alert("News Generated & Published!");
    } catch(e) {
        alert("Failed to generate news. Try again.");
    } finally {
        setGeneratingNews(false);
    }
  };

  const handleDeleteNews = (id: string) => {
      if(confirm("Delete news?")) {
          deleteNews(id);
          fetchData();
      }
  };

  // --- TICKET REPLY ---
  const handleReplyClick = (id: string) => {
      setReplyingTo(id);
      setReplyText('');
  };

  const submitReply = (id: string) => {
      if(!replyText.trim()) return;
      replyToTicket(id, replyText);
      setReplyingTo(null);
      setReplyText('');
      fetchData();
  };

  const toggleGameResult = (index: number) => {
    const current = gameSequence[index];
    let next: 'DRAGON' | 'TIGER' | 'TIE' = 'TIGER';
    if(current === 'DRAGON') next = 'TIGER';
    if(current === 'TIGER') next = 'TIE';
    if(current === 'TIE') next = 'DRAGON';
    
    updateGameResultAtIndex(index, next);
    setGameSequence(prev => {
        const copy = [...prev];
        copy[index] = next;
        return copy;
    });
  };

  const handleAction = async (action: 'APPROVE' | 'REJECT', type: 'DEPOSIT' | 'WITHDRAW', tx: any) => {
    if(!window.confirm(`Are you sure you want to ${action} this request?`)) return;

    setActionLoading(tx.id);
    try {
        if (type === 'DEPOSIT') {
            if (action === 'APPROVE') {
                await approveDeposit(tx.userId, tx.id, tx.amount);
                // Show Success Modal
                setSuccessModal({
                    show: true,
                    data: {
                        type: 'DEPOSIT',
                        amount: tx.amount,
                        user: tx.userName,
                        id: tx.trxId || tx.id
                    }
                });
            }
            else await rejectDeposit(tx.userId, tx.id);
        } else {
             if (action === 'APPROVE') {
                 await approveWithdrawal(tx.userId, tx.id);
                 setSuccessModal({
                    show: true,
                    data: {
                        type: 'WITHDRAW',
                        amount: tx.amount,
                        user: tx.userName,
                        id: tx.id
                    }
                });
             }
             else await rejectWithdrawal(tx.userId, tx.id, tx.amount);
        }
        await fetchData(true); 
    } catch (error: any) {
        alert("Operation Failed: " + error.message);
    } finally {
        setActionLoading(null);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({ mobile: user.mobile, password: '' });
  };

  const saveUserChanges = async () => {
    if(!editingUser) return;
    try {
      await adminUpdateUser(editingUser.id, editForm.mobile, editForm.password);
      setEditingUser(null);
      alert("User updated successfully");
      fetchData();
    } catch(e: any) {
      alert(e.message);
    }
  };

  const handleDownloadData = () => {
    const data = getDatabaseString();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stockgrow_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (confirm("WARNING: Overwrite data?")) {
           if (importDatabaseString(content)) {
             alert("Data restored!");
             fetchData();
           } else {
             alert("Invalid file.");
           }
        }
      }
    };
    reader.readAsText(file);
    if(fileInputRef.current) fileInputRef.current.value = ''; 
  };

  // FETCH ALL TRANSACTIONS
  const allDeposits = users.flatMap(u => (u.transactions || []).filter(t => t.type === 'DEPOSIT').map(t => ({ ...t, userId: u.id, userName: u.name, userMobile: u.mobile }))).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const allWithdrawals = users.flatMap(u => (u.transactions || []).filter(t => t.type === 'WITHDRAW').map(t => ({ ...t, userId: u.id, userName: u.name, userMobile: u.mobile }))).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const pendingDepositCount = allDeposits.filter(t => t.status === 'PENDING').length;
  const pendingWithdrawCount = allWithdrawals.filter(t => t.status === 'PENDING').length;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-neonBlue" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 p-4 pb-24 font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center"><ShieldCheck className="mr-2 text-neonBlue"/> Admin Panel</h1>
        </div>
        <button onClick={handleLogout} className="bg-red-500/20 text-red-500 p-2 rounded-full hover:bg-red-500 hover:text-white transition-all">
          <LogOut size={20} />
        </button>
      </div>

      {/* Nav Tabs */}
      <div className="flex space-x-2 mb-6 bg-slate-900/50 p-1 rounded-xl overflow-x-auto no-scrollbar">
        <button onClick={() => setTab('DASHBOARD')} className={`flex-1 py-3 px-3 rounded-lg text-xs font-bold whitespace-nowrap ${tab === 'DASHBOARD' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}><LayoutDashboard size={18} className="mb-1 mx-auto" /> Dashboard</button>
        <button onClick={() => setTab('REQUESTS')} className={`flex-1 py-3 px-3 rounded-lg text-xs font-bold whitespace-nowrap relative ${tab === 'REQUESTS' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}><Activity size={18} className="mb-1 mx-auto" /> Requests {(pendingDepositCount + pendingWithdrawCount) > 0 && <span className="absolute top-1 right-2 bg-red-500 text-white text-[9px] px-1.5 rounded-full">{pendingDepositCount + pendingWithdrawCount}</span>}</button>
        <button onClick={() => setTab('NEWS')} className={`flex-1 py-3 px-3 rounded-lg text-xs font-bold whitespace-nowrap ${tab === 'NEWS' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}><Newspaper size={18} className="mb-1 mx-auto" /> News AI</button>
        <button onClick={() => setTab('SUPPORT')} className={`flex-1 py-3 px-3 rounded-lg text-xs font-bold whitespace-nowrap ${tab === 'SUPPORT' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}><Headphones size={18} className="mb-1 mx-auto" /> Support</button>
        <button onClick={() => setTab('GAME')} className={`flex-1 py-3 px-3 rounded-lg text-xs font-bold whitespace-nowrap ${tab === 'GAME' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}><Gamepad2 size={18} className="mb-1 mx-auto" /> Game</button>
        <button onClick={() => setTab('USERS')} className={`flex-1 py-3 px-3 rounded-lg text-xs font-bold whitespace-nowrap ${tab === 'USERS' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}><Users size={18} className="mb-1 mx-auto" /> Users</button>
        <button onClick={() => setTab('DATA')} className={`flex-1 py-3 px-3 rounded-lg text-xs font-bold whitespace-nowrap ${tab === 'DATA' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}><Database size={18} className="mb-1 mx-auto" /> Data</button>
      </div>

      {/* --- DASHBOARD TAB --- */}
      {tab === 'DASHBOARD' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <p className="text-slate-400 text-xs font-bold uppercase mb-2">Total Deposits</p>
                <p className="text-2xl font-bold text-green-500">Rs.{stats.totalDeposit.toLocaleString()}</p>
             </div>
             <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <p className="text-slate-400 text-xs font-bold uppercase mb-2">Total Withdraw</p>
                <p className="text-2xl font-bold text-red-500">Rs.{stats.totalWithdraw.toLocaleString()}</p>
             </div>
          </div>
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
             <p className="text-slate-400 text-xs font-bold uppercase mb-2">Profit Distributed</p>
             <p className="text-3xl font-bold text-neonBlue">Rs.{stats.totalProfitDistributed.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* --- NEWS AI TAB --- */}
      {tab === 'NEWS' && (
          <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                  <h3 className="text-white font-bold mb-4 flex items-center"><Wand2 className="mr-2 text-neonPurple"/> AI News Generator</h3>
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-neonPurple focus:outline-none mb-3"
                    rows={3}
                    placeholder="E.g. Tell users about 50% extra deposit bonus for Eid..."
                    value={newsPrompt}
                    onChange={e => setNewsPrompt(e.target.value)}
                  ></textarea>
                  <button 
                    onClick={handleGenerateNews} 
                    disabled={generatingNews}
                    className="w-full bg-neonPurple text-white py-2 rounded-xl font-bold flex items-center justify-center hover:bg-purple-600 transition-colors"
                  >
                      {generatingNews ? <Loader2 className="animate-spin"/> : "Generate & Publish"}
                  </button>
              </div>

              <div className="space-y-3">
                  <h4 className="text-slate-400 text-xs font-bold uppercase">Published News</h4>
                  {newsList.map(item => (
                      <div key={item.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-start">
                          <div>
                              <p className="text-white font-bold">{item.title}</p>
                              <p className="text-xs text-slate-400 mt-1">{item.content}</p>
                              <span className="text-[9px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded mt-2 inline-block">{item.type}</span>
                          </div>
                          <button onClick={() => handleDeleteNews(item.id)} className="text-red-500 bg-red-500/10 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                              <Trash2 size={16}/>
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- SUPPORT TAB --- */}
      {tab === 'SUPPORT' && (
          <div className="space-y-4 animate-fade-in">
              {tickets.length === 0 && <p className="text-slate-500 text-center">No active tickets.</p>}
              {tickets.map(t => (
                  <div key={t.id} className={`bg-slate-900 p-4 rounded-xl border ${t.status === 'RESOLVED' ? 'border-green-500/30' : 'border-slate-800'}`}>
                      <div className="flex justify-between items-start mb-2">
                          <div>
                              <p className="text-white font-bold flex items-center">
                                  {t.userName} <span className="text-[10px] text-slate-500 ml-2 font-mono">({t.userMobile})</span>
                              </p>
                              <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString()}</p>
                          </div>
                          {t.status === 'RESOLVED' && (
                              <span className="bg-green-500/20 text-green-500 text-[9px] font-bold px-2 py-0.5 rounded border border-green-500/20">RESOLVED</span>
                          )}
                      </div>
                      <div className="bg-black/30 p-3 rounded-lg mb-2">
                          <p className="text-sm text-slate-300">{t.message}</p>
                      </div>
                      {t.adminReply && (
                          <div className="pl-4 border-l-2 border-green-500 mt-2 mb-2">
                              <p className="text-xs text-green-500 font-bold">Admin Reply:</p>
                              <p className="text-xs text-slate-400">{t.adminReply}</p>
                          </div>
                      )}
                      
                      {t.status === 'OPEN' && (
                          <div className="mt-3">
                              {replyingTo === t.id ? (
                                  <div className="flex gap-2 animate-fade-in">
                                      <input 
                                        type="text" 
                                        autoFocus
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && submitReply(t.id)}
                                        placeholder="Type reply here..."
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-neonBlue focus:outline-none"
                                      />
                                      <button onClick={() => submitReply(t.id)} className="bg-neonBlue p-2 rounded-lg text-black hover:bg-cyan-400">
                                          <Send size={16} />
                                      </button>
                                      <button onClick={() => setReplyingTo(null)} className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-white">
                                          <X size={16} />
                                      </button>
                                  </div>
                              ) : (
                                  <button onClick={() => handleReplyClick(t.id)} className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center">
                                      <MessageSquare size={14} className="mr-2"/> Reply
                                  </button>
                              )}
                          </div>
                      )}
                  </div>
              ))}
          </div>
      )}

      {/* --- GAME CONTROL TAB --- */}
      {tab === 'GAME' && (
        <div className="space-y-6 animate-fade-in">
            {/* LIVE BETS MONITOR */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-bold flex items-center"><Activity className="text-red-500 mr-2 animate-pulse"/> Live Bets (Current Round)</h2>
                    <span className="text-[10px] bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-500/30">Auto-updating</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-blue-900/20 p-3 rounded-xl border border-blue-500/30">
                        <p className="text-blue-400 text-xs font-bold uppercase">Dragon</p>
                        <p className="text-xl font-bold text-white">Rs.{liveBets.DRAGON.toLocaleString()}</p>
                    </div>
                    <div className="bg-green-900/20 p-3 rounded-xl border border-green-500/30">
                        <p className="text-green-400 text-xs font-bold uppercase">Tie</p>
                        <p className="text-xl font-bold text-white">Rs.{liveBets.TIE.toLocaleString()}</p>
                    </div>
                    <div className="bg-yellow-900/20 p-3 rounded-xl border border-yellow-500/30">
                        <p className="text-yellow-400 text-xs font-bold uppercase">Tiger</p>
                        <p className="text-xl font-bold text-white">Rs.{liveBets.TIGER.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* UPCOMING RESULTS EDITOR */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4">
                <h2 className="text-white font-bold mb-2 flex items-center"><Gamepad2 className="text-neonPurple mr-2"/> Upcoming Results Sequence</h2>
                <p className="text-xs text-slate-400 mb-4">Click on any result to toggle it (Dragon -> Tiger -> Tie).</p>
                
                <div className="space-y-2">
                    {gameSequence.slice(0, 10).map((res, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-slate-800">
                             <div className="flex items-center">
                                 <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs flex items-center justify-center mr-3 font-mono">{idx + 1}</span>
                                 <span className="text-xs text-slate-500 mr-4">Status:</span>
                                 <span className={`font-bold uppercase w-20 text-center py-1 rounded ${
                                     res === 'DRAGON' ? 'bg-red-500 text-white' :
                                     res === 'TIGER' ? 'bg-yellow-500 text-black' :
                                     'bg-green-500 text-white'
                                 }`}>{res}</span>
                             </div>
                             <button 
                                onClick={() => toggleGameResult(idx)}
                                className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded text-white font-bold"
                             >
                                Change
                             </button>
                        </div>
                    ))}
                </div>
                {gameSequence.length === 0 && <p className="text-slate-500 text-sm p-4 text-center">No active sequence. Game will generate one.</p>}
            </div>
        </div>
      )}

      {/* --- REQUESTS TAB --- */}
      {tab === 'REQUESTS' && (
        <div className="space-y-6 animate-fade-in">
          {/* Deposits */}
          <div>
            <div className="flex justify-between items-center mb-3">
               <h3 className="text-green-500 font-bold flex items-center text-sm uppercase tracking-wider"><ArrowDownLeft size={16} className="mr-2"/> Deposits History</h3>
               <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-white">{pendingDepositCount} Pending</span>
            </div>
            
            {allDeposits.map((tx) => (
                <div key={tx.id} className={`bg-slate-900 border rounded-xl p-5 mb-4 shadow-lg relative overflow-hidden group ${tx.status === 'PENDING' ? 'border-green-500' : 'border-slate-800 opacity-80 hover:opacity-100'}`}>
                   {/* Decorative Bar */}
                   <div className={`absolute top-0 left-0 w-2 h-full ${tx.status === 'REJECTED' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                   
                   {/* Header Info */}
                   <div className="flex justify-between items-start mb-4 pl-3">
                      <div>
                         <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Request from</p>
                         <p className="text-white font-black text-xl">{tx.userName}</p>
                         <p className="text-neonBlue text-sm font-mono mt-0.5 flex items-center">
                             <Smartphone size={12} className="mr-1"/> {tx.userMobile}
                         </p>
                      </div>
                      <div className="text-right">
                         <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${tx.status === 'REJECTED' ? 'bg-red-900/30 text-red-400 border-red-500/30' : 'bg-green-900/30 text-green-400 border-green-500/30'}`}>Deposit</span>
                         <p className="text-2xl font-bold text-white mt-1">Rs.{tx.amount.toLocaleString()}</p>
                      </div>
                   </div>

                   {/* Transaction Details Box */}
                   <div className="bg-black/40 rounded-lg p-3 ml-3 border border-white/5 space-y-2 mb-5">
                       <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-500 flex items-center"><FileText size={14} className="mr-2"/> TRX ID</span>
                           <span className="text-neonBlue font-mono font-bold tracking-wider">{tx.trxId || tx.id}</span>
                       </div>
                       {tx.senderMobile && (
                           <>
                               <div className="w-full h-px bg-white/5"></div>
                               <div className="flex justify-between items-center text-sm">
                                   <span className="text-slate-500 flex items-center"><Smartphone size={14} className="mr-2"/> Sender</span>
                                   <span className="text-white">{tx.senderMobile}</span>
                               </div>
                           </>
                       )}
                       <div className="w-full h-px bg-white/5"></div>
                       <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-500 flex items-center"><CreditCard size={14} className="mr-2"/> Method</span>
                           <span className="text-white">{tx.method}</span>
                       </div>
                       <div className="w-full h-px bg-white/5"></div>
                       <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-500 flex items-center"><Calendar size={14} className="mr-2"/> Date</span>
                           <span className="text-white">{new Date(tx.date).toLocaleString()}</span>
                       </div>
                   </div>

                   {/* Action Buttons or Status Badge */}
                   <div className="ml-3">
                       {tx.status === 'PENDING' ? (
                           <div className="flex gap-3">
                               <button 
                                   onClick={() => handleAction('APPROVE', 'DEPOSIT', tx)} 
                                   disabled={actionLoading === tx.id}
                                   className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center shadow-lg transition-all disabled:opacity-50"
                               >
                                   {actionLoading === tx.id ? <Loader2 className="animate-spin" size={18} /> : "Confirm"}
                               </button>
                               
                               <button 
                                   onClick={() => handleAction('REJECT', 'DEPOSIT', tx)} 
                                   disabled={actionLoading === tx.id}
                                   className="flex-1 bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-500 border border-slate-700 hover:border-red-500/50 py-3 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center transition-all disabled:opacity-50"
                               >
                                   {actionLoading === tx.id ? <Loader2 className="animate-spin" size={18} /> : "Reject"}
                               </button>
                           </div>
                       ) : (
                           <div className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center border ${
                               tx.status === 'APPROVED' 
                               ? 'bg-green-500/10 text-green-500 border-green-500/30' 
                               : 'bg-red-500/10 text-red-500 border-red-500/30'
                           }`}>
                               {tx.status === 'APPROVED' ? <CheckCircle size={20} className="mr-2"/> : <XCircle size={20} className="mr-2"/>}
                               {tx.status}
                           </div>
                       )}
                   </div>
                </div>
            ))}
            {allDeposits.length === 0 && <div className="p-8 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">No deposits found</div>}
          </div>

          {/* Withdrawals */}
          <div>
            <div className="flex justify-between items-center mb-3">
               <h3 className="text-red-500 font-bold flex items-center text-sm uppercase tracking-wider"><ArrowUpRight size={16} className="mr-2"/> Withdrawal History</h3>
               <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-white">{pendingWithdrawCount} Pending</span>
            </div>
            
            {allWithdrawals.map((tx) => (
                <div key={tx.id} className={`bg-slate-900 border rounded-xl p-5 mb-4 shadow-lg relative overflow-hidden group ${tx.status === 'PENDING' ? 'border-red-500' : 'border-slate-800 opacity-80 hover:opacity-100'}`}>
                   <div className={`absolute top-0 left-0 w-2 h-full ${tx.status === 'REJECTED' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                   
                   {/* Header */}
                   <div className="flex justify-between items-start mb-4 pl-3">
                      <div>
                         <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Request from</p>
                         <p className="text-white font-black text-xl">{tx.userName}</p>
                         <p className="text-neonBlue text-sm font-mono mt-0.5 flex items-center">
                             <Smartphone size={12} className="mr-1"/> {tx.userMobile}
                         </p>
                      </div>
                      <div className="text-right">
                         <span className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-[10px] font-bold uppercase border border-red-500/30">Withdraw</span>
                         <p className="text-2xl font-bold text-white mt-1">Rs.{tx.amount.toLocaleString()}</p>
                      </div>
                   </div>

                   {/* Details */}
                   <div className="bg-black/40 rounded-lg p-3 ml-3 border border-white/5 space-y-2 mb-5">
                       <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-500 flex items-center"><CreditCard size={14} className="mr-2"/> Payment To</span>
                           <span className="text-white font-bold">{tx.method}</span>
                       </div>
                       <div className="w-full h-px bg-white/5"></div>
                       <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-500 flex items-center"><Smartphone size={14} className="mr-2"/> Account No</span>
                           <span className="text-neonBlue font-mono">{tx.userMobile}</span>
                       </div>
                       <div className="w-full h-px bg-white/5"></div>
                       <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-500 flex items-center"><Calendar size={14} className="mr-2"/> Date</span>
                           <span className="text-white">{new Date(tx.date).toLocaleString()}</span>
                       </div>
                   </div>

                   {/* Action Buttons or Status Badge */}
                   <div className="ml-3">
                       {tx.status === 'PENDING' ? (
                           <div className="flex gap-3">
                               <button 
                                   onClick={() => handleAction('APPROVE', 'WITHDRAW', tx)} 
                                   disabled={actionLoading === tx.id}
                                   className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center shadow-lg transition-all disabled:opacity-50"
                               >
                                   {actionLoading === tx.id ? <Loader2 className="animate-spin" size={18} /> : "Confirm"}
                               </button>
                               
                               <button 
                                   onClick={() => handleAction('REJECT', 'WITHDRAW', tx)} 
                                   disabled={actionLoading === tx.id}
                                   className="flex-1 bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-500 border border-slate-700 hover:border-red-500/50 py-3 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center transition-all disabled:opacity-50"
                               >
                                   {actionLoading === tx.id ? <Loader2 className="animate-spin" size={18} /> : "Reject"}
                               </button>
                           </div>
                       ) : (
                           <div className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center border ${
                               tx.status === 'APPROVED' 
                               ? 'bg-green-500/10 text-green-500 border-green-500/30' 
                               : 'bg-red-500/10 text-red-500 border-red-500/30'
                           }`}>
                               {tx.status === 'APPROVED' ? <CheckCircle size={20} className="mr-2"/> : <XCircle size={20} className="mr-2"/>}
                               {tx.status}
                           </div>
                       )}
                   </div>
                </div>
            ))}
            {allWithdrawals.length === 0 && <div className="p-8 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">No withdrawals found</div>}
          </div>
        </div>
      )}

      {/* --- USERS TAB --- */}
      {tab === 'USERS' && (
        <div className="space-y-3 animate-fade-in">
           {users.map(u => (
             <div key={u.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                   <div className="flex items-center">
                     <p className="font-bold text-white mr-2">{u.name}</p>
                     {u.role === 'ADMIN' && <span className="bg-neonPurple/20 text-neonPurple text-[8px] px-1 rounded uppercase font-bold">Admin</span>}
                   </div>
                   <p className="text-xs text-slate-400 font-mono mt-1">{u.mobile}</p>
                </div>
                <div className="text-right">
                   <p className="text-neonGreen font-mono font-bold">Rs.{u.balance}</p>
                   <button onClick={() => openEditModal(u)} className="mt-2 text-[10px] bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg flex items-center ml-auto transition-colors"><Edit2 size={10} className="mr-1" /> Edit</button>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* --- DATA TAB --- */}
      {tab === 'DATA' && (
        <div className="space-y-6 animate-fade-in">
           <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
             <h3 className="text-white font-bold mb-4 flex items-center"><Download size={18} className="mr-2 text-neonBlue"/> Export Database</h3>
             <button onClick={handleDownloadData} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-colors">Download Backup</button>
           </div>
           <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
             <h3 className="text-white font-bold mb-4 flex items-center"><Upload size={18} className="mr-2 text-neonPurple"/> Restore Database</h3>
             <input type="file" accept=".json" ref={fileInputRef} onChange={handleUploadData} className="hidden" />
             <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-neonPurple text-white font-bold rounded-xl hover:bg-purple-600 transition-all">Select File & Restore</button>
           </div>
        </div>
      )}

      {/* --- EDIT USER MODAL --- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="bg-slate-900 border border-slate-700 w-full max-w-xs rounded-2xl p-6 shadow-2xl animate-scale-up">
              <h3 className="text-lg font-bold text-white mb-4">Edit User</h3>
              <div className="space-y-4">
                 <div>
                    <label className="block text-xs text-slate-400 mb-1 font-bold uppercase">Mobile Number</label>
                    <input type="tel" value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-3 text-sm text-white focus:border-neonBlue focus:outline-none"/>
                 </div>
                 <div>
                    <label className="block text-xs text-slate-400 mb-1 font-bold uppercase">New Password</label>
                    <input type="text" placeholder="Leave empty to keep same" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-3 text-sm text-white focus:border-neonBlue focus:outline-none"/>
                 </div>
              </div>
              <div className="flex gap-3 mt-6">
                 <button onClick={() => setEditingUser(null)} className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold">Cancel</button>
                 <button onClick={saveUserChanges} className="flex-1 py-2 bg-neonBlue text-black rounded-lg text-sm font-bold">Save Changes</button>
              </div>
           </div>
        </div>
      )}

      {/* --- SUCCESS MODAL --- */}
      {successModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
           <div className="bg-slate-900 border-2 border-green-500 w-full max-w-sm rounded-3xl p-8 text-center relative shadow-[0_0_50px_rgba(34,197,94,0.3)]">
               <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
                  <Check size={40} className="text-black stroke-[3]" />
               </div>
               <h2 className="text-3xl font-black text-white mb-2">Payment Confirmed!</h2>
               <p className="text-slate-400 text-sm mb-6">Money has been transferred to user's wallet successfully.</p>
               
               <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Amount Added</p>
                  <p className="text-3xl font-bold text-green-500">Rs.{successModal.data?.amount?.toLocaleString()}</p>
                  <p className="text-xs text-white mt-2">To: <span className="text-neonBlue">{successModal.data?.user}</span></p>
               </div>
               
               <button 
                  onClick={() => setSuccessModal({show: false, data: null})}
                  className="w-full py-4 bg-green-500 text-black font-black text-lg rounded-xl hover:bg-green-400 transition-transform hover:scale-[1.02] shadow-lg"
               >
                  DONE
               </button>
           </div>
        </div>
      )}
    </div>
  );
}