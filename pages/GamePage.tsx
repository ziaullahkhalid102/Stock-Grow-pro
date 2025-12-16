
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, subscribeToAuth, playGameTransaction, consumeGameResult, updateLiveBets } from '../services/backend';
import { User } from '../types';
import { ChevronLeft, Volume2, VolumeX, Coins, Users, User as UserIcon, XCircle, Zap } from 'lucide-react';

// --- GAME ASSETS ---
const CARD_SUITS = ['♠', '♥', '♣', '♦'];
const CARD_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const VALUES = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };

const CHIPS = [10, 50, 100, 500, 1000];

// Asset URLs
const DRAGON_IMG = "https://cdn-icons-png.flaticon.com/512/4712/4712808.png";
const TIGER_IMG = "https://cdn-icons-png.flaticon.com/512/3755/3755307.png";

// --- EXPANDED BOTS DATA (12 Players) ---
const BOTS = [
  { id: 1, name: 'Ali786', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ali', side: 'left', top: '10%' },
  { id: 2, name: 'King_01', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=King', side: 'left', top: '25%' },
  { id: 3, name: 'Sana_K', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sana', side: 'left', top: '40%' },
  { id: 4, name: 'HunterX', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hunt', side: 'left', top: '55%' },
  { id: 5, name: 'Jutt_22', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jutt', side: 'left', top: '70%' },
  { id: 6, name: 'LuckyBo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luck', side: 'left', top: '85%' },
  
  { id: 7, name: 'RajaG', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raja', side: 'right', top: '10%' },
  { id: 8, name: 'Tiger11', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tiger', side: 'right', top: '25%' },
  { id: 9, name: 'Queen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Queen', side: 'right', top: '40%' },
  { id: 10, name: 'Billa', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bill', side: 'right', top: '55%' },
  { id: 11, name: 'Gamer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Game', side: 'right', top: '70%' },
  { id: 12, name: 'Zain00', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zain', side: 'right', top: '85%' },
];

type GameState = 'BETTING' | 'DEALING' | 'RESULT';
type Winner = 'DRAGON' | 'TIGER' | 'TIE' | null;

interface VisualChip {
  id: string;
  target: 'DRAGON' | 'TIGER' | 'TIE';
  x: number;
  y: number;
  rotation: number;
  amount: number;
}

export default function GamePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [balance, setBalance] = useState(0);

  // Game Logic State
  const [gameState, setGameState] = useState<GameState>('BETTING');
  const [timer, setTimer] = useState(15);
  const [selectedChip, setSelectedChip] = useState(10);
  const [customBetAmount, setCustomBetAmount] = useState<string>('');
  
  // Sound State
  const [isMuted, setIsMuted] = useState(false);
  const sounds = useRef({
      bet: new Audio('https://www.soundjay.com/button/sounds/button-37.mp3'),
      card: new Audio('https://www.soundjay.com/card/sounds/card-flip-1.mp3'),
      win: new Audio('https://www.soundjay.com/misc/sounds/magic-chime-01.mp3')
  });

  const playSound = (key: 'bet' | 'card' | 'win') => {
      if(isMuted) return;
      const audio = sounds.current[key];
      audio.currentTime = 0;
      audio.play().catch(() => {});
  };
  
  // Bets
  const [bets, setBets] = useState({ DRAGON: 12400, TIE: 1500, TIGER: 11200 });
  const [myBets, setMyBets] = useState({ DRAGON: 0, TIE: 0, TIGER: 0 });
  
  // Visual Elements
  const [visualChips, setVisualChips] = useState<VisualChip[]>([]);
  const [botActions, setBotActions] = useState<{ [key: number]: { amount: number, target: string } | null }>({});
  
  // Cards
  const [dragonCard, setDragonCard] = useState<{rank: string, suit: string} | null>(null);
  const [tigerCard, setTigerCard] = useState<{rank: string, suit: string} | null>(null);
  const [winner, setWinner] = useState<Winner>(null);
  
  // History
  const [history, setHistory] = useState<Winner[]>(['DRAGON', 'TIGER', 'TIGER', 'DRAGON', 'TIE', 'DRAGON', 'DRAGON']);

  // Robust Timing Refs
  const endTimeRef = useRef<number>(Date.now() + 15000);
  
  useEffect(() => {
    const unsub = subscribeToAuth((u) => {
      setUser(u);
      if(u) setBalance(u.balance);
    });
    return () => unsub();
  }, []);

  // --- MAIN GAME LOOP ---
  useEffect(() => {
    let interval: any;
    
    const tick = () => {
        if (gameState === 'BETTING') {
            const now = Date.now();
            const remaining = Math.max(0, (endTimeRef.current - now) / 1000);
            
            setTimer(remaining);

            // Trigger deal when time is up
            if (remaining <= 0) {
                handleDeal();
            }

            // --- SIMULATE ACTIVITY ---
            // 1. Random Pool Increase
            if(Math.random() > 0.4) setBets(prev => ({ ...prev, DRAGON: prev.DRAGON + Math.floor(Math.random() * 2000) }));
            if(Math.random() > 0.4) setBets(prev => ({ ...prev, TIGER: prev.TIGER + Math.floor(Math.random() * 2000) }));
            if(Math.random() > 0.8) setBets(prev => ({ ...prev, TIE: prev.TIE + Math.floor(Math.random() * 500) }));

            // 2. Bot Bets (Visual)
            if(Math.random() > 0.3) {
                triggerBotBet();
            }
        }
    };

    if (gameState === 'BETTING') {
      interval = setInterval(tick, 200);
    } else {
        setBotActions({});
    }

    return () => clearInterval(interval);
  }, [gameState]);

  const triggerBotBet = () => {
     const randomBot = BOTS[Math.floor(Math.random() * BOTS.length)];
     const amounts = [100, 500, 1000, 5000];
     const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];
     const targets: ('DRAGON' | 'TIGER' | 'TIE')[] = ['DRAGON', 'TIGER', 'TIE'];
     const randomTarget = targets[Math.floor(Math.random() * (Math.random() > 0.9 ? 3 : 2))];

     // 1. Show Bubble
     setBotActions(prev => ({ ...prev, [randomBot.id]: { amount: randomAmount, target: randomTarget } }));
     setTimeout(() => {
        setBotActions(prev => ({ ...prev, [randomBot.id]: null }));
     }, 600);

     // 2. Drop Chip on Table
     addChipToTable(randomTarget, randomAmount);
  };

  const addChipToTable = (target: 'DRAGON' | 'TIGER' | 'TIE', amount: number) => {
      // Limit total chips to prevent DOM overload
      if (visualChips.length > 60) return;

      const newChip: VisualChip = {
          id: Math.random().toString(36),
          target,
          x: Math.random() * 70 + 15, // 15% to 85% of box width
          y: Math.random() * 70 + 15, // 15% to 85% of box height
          rotation: Math.random() * 360,
          amount
      };
      setVisualChips(prev => [...prev, newChip]);
  };

  const placeBet = (zone: 'DRAGON' | 'TIE' | 'TIGER') => {
    if (gameState !== 'BETTING') return;
    
    const betAmount = customBetAmount ? Number(customBetAmount) : selectedChip;

    // Validation
    if (isNaN(betAmount) || betAmount < 10) {
        alert("Minimum bet is Rs.10");
        return;
    }
    if (balance < betAmount) {
      alert("Insufficient Balance! Please Recharge.");
      return;
    }

    playSound('bet');

    const newMyBets = { ...myBets, [zone]: myBets[zone] + betAmount };
    setMyBets(newMyBets);
    setBets(prev => ({ ...prev, [zone]: prev[zone] + betAmount }));
    
    // Add Chip Visual
    addChipToTable(zone, betAmount);

    // Sync with Admin
    updateLiveBets(newMyBets);

    // Transaction (Non-blocking UI)
    playGameTransaction(betAmount, 'LOSS', `Bet on ${zone} (Custom: ${!!customBetAmount})`)
        .catch(err => {
             console.error("Bet error", err);
             // Revert UI on fatal error only
        });
  };

  const getRandomCard = (minVal: number, maxVal: number) => {
     const possibleRanks = CARD_RANKS.filter(r => {
         const v = VALUES[r as keyof typeof VALUES];
         return v >= minVal && v <= maxVal;
     });
     const rank = possibleRanks[Math.floor(Math.random() * possibleRanks.length)];
     const suit = CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)];
     return { rank, suit };
  };

  const handleDeal = async () => {
    setGameState('DEALING');
    updateLiveBets({ DRAGON: 0, TIGER: 0, TIE: 0 });

    const predeterminedResult = consumeGameResult();
    
    let dCard, tCard;

    if (predeterminedResult === 'DRAGON') {
        dCard = getRandomCard(8, 13);
        tCard = getRandomCard(1, 7);
    } else if (predeterminedResult === 'TIGER') {
        dCard = getRandomCard(1, 7);
        tCard = getRandomCard(8, 13);
    } else {
        const rank = CARD_RANKS[Math.floor(Math.random() * CARD_RANKS.length)];
        dCard = { rank, suit: CARD_SUITS[0] };
        tCard = { rank, suit: CARD_SUITS[1] };
    }

    await new Promise(r => setTimeout(r, 1000));
    
    playSound('card');
    setDragonCard(dCard);
    await new Promise(r => setTimeout(r, 1000));
    
    playSound('card');
    setTigerCard(tCard);
    await new Promise(r => setTimeout(r, 500));

    setWinner(predeterminedResult);
    setGameState('RESULT');
    setHistory(prev => [predeterminedResult, ...prev].slice(0, 15));

    await handlePayout(predeterminedResult);

    setTimeout(() => {
      resetGame();
    }, 5000);
  };

  const handlePayout = async (result: string) => {
    let winnings = 0;
    if (result === 'DRAGON' && myBets.DRAGON > 0) winnings += myBets.DRAGON * 2;
    if (result === 'TIGER' && myBets.TIGER > 0) winnings += myBets.TIGER * 2;
    if (result === 'TIE' && myBets.TIE > 0) winnings += myBets.TIE * 9;

    if (winnings > 0) {
        playSound('win');
        await playGameTransaction(winnings, 'WIN', `Won on ${result}`);
    }
  };

  const resetGame = () => {
    setGameState('BETTING');
    setTimer(15);
    endTimeRef.current = Date.now() + 15000; // Reset Timer Ref
    
    setBets({ 
        DRAGON: 10000 + Math.floor(Math.random() * 5000), 
        TIE: 1000 + Math.floor(Math.random() * 500), 
        TIGER: 10000 + Math.floor(Math.random() * 5000) 
    });
    setMyBets({ DRAGON: 0, TIE: 0, TIGER: 0 });
    setVisualChips([]); // Clear table
    
    setDragonCard(null);
    setTigerCard(null);
    setWinner(null);
  };

  const renderCard = (card: {rank: string, suit: string} | null) => {
    if (!card) {
       return (
         <div className="w-16 h-24 sm:w-20 sm:h-28 bg-indigo-950 rounded-lg border-2 border-indigo-700 flex items-center justify-center shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
             <div className="text-4xl text-white/20">?</div>
         </div>
       );
    }
    const isRed = card.suit === '♥' || card.suit === '♦';
    return (
        <div className="w-16 h-24 sm:w-20 sm:h-28 bg-white rounded-lg flex flex-col items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.4)] animate-flip-in z-20">
           <div className={`text-2xl font-bold ${isRed ? 'text-red-600' : 'text-black'}`}>{card.rank}</div>
           <div className={`text-3xl ${isRed ? 'text-red-600' : 'text-black'}`}>{card.suit}</div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020508] flex flex-col font-sans overflow-hidden relative">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center p-3 bg-slate-900 border-b border-slate-800 z-30 shadow-lg relative">
         <button onClick={() => navigate('/')} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700">
            <ChevronLeft size={20} />
         </button>
         <div className="flex flex-col items-center">
             <div className="flex items-center bg-black/80 px-4 py-1.5 rounded-full border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                 <Coins className="text-yellow-500 mr-2" size={16} />
                 <span className="text-white font-mono font-bold text-lg">Rs.{balance.toLocaleString()}</span>
             </div>
         </div>
         <div className="flex gap-2">
             <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
             </button>
         </div>
      </div>

      {/* --- GAME ARENA --- */}
      <div className="flex-1 relative flex flex-col pt-2 pb-24 bg-[url('https://img.freepik.com/free-vector/dark-purple-background-with-geometric-shapes_1017-32182.jpg')] bg-cover bg-center">
         <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px]"></div> {/* Overlay */}

         {/* --- BOTS LAYER --- */}
         <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
             {BOTS.map((bot) => (
                 <div 
                    key={bot.id} 
                    className={`absolute flex flex-col items-center transition-all duration-300 ${bot.side === 'left' ? 'left-1' : 'right-1'}`}
                    style={{ top: bot.top }}
                 >
                     <div className="relative">
                         {/* Bot Avatar */}
                         <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-600 overflow-hidden shadow-lg relative z-10">
                            <img src={bot.avatar} alt={bot.name} className="w-full h-full object-cover" />
                         </div>
                         
                         {/* Bet Bubble Animation */}
                         {botActions[bot.id] && (
                             <div className={`absolute top-0 ${bot.side === 'left' ? 'left-8' : 'right-8'} bg-yellow-400 text-black text-[9px] font-black px-2 py-1 rounded-full shadow-lg border border-white animate-scale-up z-20 whitespace-nowrap flex items-center`}>
                                 <Coins size={8} className="mr-1"/> 
                                 {botActions[bot.id]?.amount}
                             </div>
                         )}
                     </div>
                 </div>
             ))}
         </div>

         {/* --- TOP SECTION: CARDS --- */}
         <div className="relative z-10 w-full flex justify-between items-center px-4 mt-4 mb-4 mx-auto max-w-md">
             
             {/* DRAGON */}
             <div className="flex flex-col items-center relative pl-8">
                 <div className={`relative w-24 h-24 sm:w-28 sm:h-28 transition-transform duration-500 ${winner === 'DRAGON' ? 'scale-110 drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]' : ''}`}>
                     <img src={DRAGON_IMG} alt="Dragon" className={`w-full h-full object-contain ${winner === 'DRAGON' ? 'animate-bounce' : ''}`} />
                 </div>
                 <div className="mt-2 transform -rotate-3 transition-all duration-300">
                     {renderCard(dragonCard)}
                 </div>
             </div>

             {/* VS/TIMER */}
             <div className="flex flex-col items-center justify-center z-20">
                 {gameState === 'BETTING' ? (
                     <div className="w-16 h-16 rounded-full bg-slate-900 border-4 border-yellow-500 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.5)] animate-pulse">
                         <span className={`text-2xl font-bold font-mono ${Math.ceil(timer) <= 3 ? 'text-red-500' : 'text-white'}`}>{Math.ceil(timer)}</span>
                     </div>
                 ) : (
                     <div className="text-yellow-500 font-black text-4xl drop-shadow-[0_0_15px_rgba(234,179,8,1)] animate-ping">VS</div>
                 )}
             </div>

             {/* TIGER */}
             <div className="flex flex-col items-center relative pr-8">
                 <div className={`relative w-24 h-24 sm:w-28 sm:h-28 transition-transform duration-500 ${winner === 'TIGER' ? 'scale-110 drop-shadow-[0_0_25px_rgba(234,179,8,0.8)]' : ''}`}>
                     <img src={TIGER_IMG} alt="Tiger" className={`w-full h-full object-contain ${winner === 'TIGER' ? 'animate-bounce' : ''}`} />
                 </div>
                 <div className="mt-2 transform rotate-3 transition-all duration-300">
                     {renderCard(tigerCard)}
                 </div>
             </div>
         </div>

         {/* HISTORY BAR */}
         <div className="relative z-10 w-full px-2 mb-2">
             <div className="flex items-center justify-end space-x-1 bg-black/40 p-1.5 rounded-full border border-white/10 overflow-hidden backdrop-blur-sm">
                <span className="text-[10px] text-slate-400 mr-auto pl-2 font-bold uppercase">Last Results:</span>
                {history.map((h, i) => (
                    <div key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm border border-white/20 ${
                        h === 'DRAGON' ? 'bg-red-600' : h === 'TIGER' ? 'bg-yellow-600' : 'bg-green-600'
                    }`}>
                        {h?.charAt(0)}
                    </div>
                ))}
            </div>
         </div>

         {winner && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce pointer-events-none w-full text-center">
                 <div className={`inline-block px-8 py-3 rounded-xl border-4 font-black text-3xl uppercase shadow-[0_0_50px_rgba(0,0,0,1)] bg-black/90 backdrop-blur-md ${
                     winner === 'DRAGON' ? 'border-red-500 text-red-500' : 
                     winner === 'TIGER' ? 'border-yellow-500 text-yellow-500' : 
                     'border-green-500 text-green-500'
                 }`}>
                     {winner} WINS
                 </div>
             </div>
         )}

         {/* --- BETTING TABLE (UPDATED DESIGN: LARGE & EQUAL) --- */}
         <div className="relative z-10 flex-1 px-4 grid grid-cols-3 gap-1 pb-2 items-end">
             
             {/* DRAGON BOX */}
             <div 
                onClick={() => placeBet('DRAGON')}
                className={`relative h-48 rounded-l-xl border-2 flex flex-col items-center justify-start pt-4 cursor-pointer active:scale-95 transition-all overflow-hidden group
                    ${winner === 'DRAGON' ? 'border-red-500 bg-red-900/60' : 'border-red-600/40 bg-gradient-to-b from-red-950/90 to-black/90'}`}
             >
                 {/* Visual Chips Overlay */}
                 <div className="absolute inset-0 z-0">
                     {visualChips.filter(c => c.target === 'DRAGON').map(c => (
                         <div key={c.id} className="absolute w-5 h-5 rounded-full bg-yellow-400 border border-white/50 shadow-md flex items-center justify-center text-[6px] font-bold text-black pointer-events-none"
                              style={{ left: `${c.x}%`, top: `${c.y}%`, transform: `rotate(${c.rotation}deg)` }}>
                             {c.amount >= 1000 ? '1k' : c.amount}
                         </div>
                     ))}
                 </div>

                 <h2 className="text-red-100 font-black text-xl uppercase drop-shadow-md z-10 tracking-widest">Dragon</h2>
                 <p className="text-red-400 text-xs font-black z-10 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm mt-1">1:2</p>
                 
                 {/* MY BET DISPLAY (LARGE) */}
                 {myBets.DRAGON > 0 && (
                     <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                         <div className="text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] stroke-black" style={{textShadow: '0 0 10px rgba(220, 38, 38, 0.8)'}}>
                             {myBets.DRAGON}
                         </div>
                     </div>
                 )}

                 {/* Total Bets */}
                 <div className="absolute bottom-2 bg-black/60 px-2 py-1 rounded border border-red-500/30 text-white font-mono text-[10px] z-10 flex items-center backdrop-blur-sm w-11/12 justify-center">
                    <Users size={8} className="mr-1 text-red-500"/> {bets.DRAGON.toLocaleString()}
                 </div>
             </div>

             {/* TIE BOX */}
             <div 
                onClick={() => placeBet('TIE')}
                className={`relative h-48 border-y-2 border-x-2 flex flex-col items-center justify-start pt-4 cursor-pointer active:scale-95 transition-all overflow-hidden group
                    ${winner === 'TIE' ? 'border-green-500 bg-green-900/60' : 'border-green-600/40 bg-gradient-to-b from-green-950/90 to-black/90'}`}
             >
                 <div className="absolute inset-0 z-0">
                     {visualChips.filter(c => c.target === 'TIE').map(c => (
                         <div key={c.id} className="absolute w-4 h-4 rounded-full bg-green-400 border border-white/50 shadow-md flex items-center justify-center text-[5px] font-bold text-black pointer-events-none"
                              style={{ left: `${c.x}%`, top: `${c.y}%`, transform: `rotate(${c.rotation}deg)` }}>
                             .
                         </div>
                     ))}
                 </div>

                 <h2 className="text-green-100 font-black text-xl uppercase drop-shadow-md z-10">Tie</h2>
                 <p className="text-green-400 text-xs font-black z-10 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm mt-1">1:9</p>
                 
                 {/* MY BET DISPLAY (LARGE) */}
                 {myBets.TIE > 0 && (
                     <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                         <div className="text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] stroke-black" style={{textShadow: '0 0 10px rgba(34, 197, 94, 0.8)'}}>
                             {myBets.TIE}
                         </div>
                     </div>
                 )}

                 <div className="absolute bottom-2 bg-black/60 px-1 py-1 rounded border border-green-500/30 text-white font-mono text-[9px] z-10 flex items-center backdrop-blur-sm w-11/12 justify-center">
                    <Users size={8} className="mr-1 text-green-500"/> {bets.TIE.toLocaleString()}
                 </div>
             </div>

             {/* TIGER BOX */}
             <div 
                onClick={() => placeBet('TIGER')}
                className={`relative h-48 rounded-r-xl border-2 flex flex-col items-center justify-start pt-4 cursor-pointer active:scale-95 transition-all overflow-hidden group
                    ${winner === 'TIGER' ? 'border-yellow-500 bg-yellow-900/60' : 'border-yellow-600/40 bg-gradient-to-b from-yellow-950/90 to-black/90'}`}
             >
                 <div className="absolute inset-0 z-0">
                     {visualChips.filter(c => c.target === 'TIGER').map(c => (
                         <div key={c.id} className="absolute w-5 h-5 rounded-full bg-blue-400 border border-white/50 shadow-md flex items-center justify-center text-[6px] font-bold text-black pointer-events-none"
                              style={{ left: `${c.x}%`, top: `${c.y}%`, transform: `rotate(${c.rotation}deg)` }}>
                             {c.amount >= 1000 ? '1k' : c.amount}
                         </div>
                     ))}
                 </div>

                 <h2 className="text-yellow-100 font-black text-xl uppercase drop-shadow-md z-10 tracking-widest">Tiger</h2>
                 <p className="text-yellow-400 text-xs font-black z-10 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm mt-1">1:2</p>
                 
                 {/* MY BET DISPLAY (LARGE) */}
                 {myBets.TIGER > 0 && (
                     <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                         <div className="text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] stroke-black" style={{textShadow: '0 0 10px rgba(234, 179, 8, 0.8)'}}>
                             {myBets.TIGER}
                         </div>
                     </div>
                 )}
                 
                 <div className="absolute bottom-2 bg-black/60 px-2 py-1 rounded border border-yellow-500/30 text-white font-mono text-[10px] z-10 flex items-center backdrop-blur-sm w-11/12 justify-center">
                    <Users size={8} className="mr-1 text-yellow-500"/> {bets.TIGER.toLocaleString()}
                 </div>
             </div>
         </div>

         {/* --- CONTROLS SECTION --- */}
         <div className="w-full px-3 z-30 mb-2">
             {/* Custom Bet Input */}
             <div className="flex items-center space-x-2 mb-2 bg-black/60 p-2 rounded-xl border border-slate-800 backdrop-blur-md">
                 <div className="relative flex-1">
                     <span className="absolute left-3 top-2.5 text-neonGreen font-bold text-xs">Rs.</span>
                     <input 
                        type="number" 
                        placeholder="Custom Bet (10-100k)" 
                        value={customBetAmount}
                        onChange={(e) => setCustomBetAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg py-2 pl-8 pr-2 focus:border-neonGreen focus:outline-none"
                        min="10"
                        max="100000"
                     />
                     {customBetAmount && (
                         <button onClick={() => setCustomBetAmount('')} className="absolute right-2 top-2.5 text-slate-500 hover:text-white">
                             <XCircle size={16} />
                         </button>
                     )}
                 </div>
                 <div className="flex gap-1">
                     <button onClick={() => setCustomBetAmount('100')} className="bg-slate-800 text-slate-300 text-[10px] px-2 py-2 rounded border border-slate-600 hover:bg-slate-700">100</button>
                     <button onClick={() => setCustomBetAmount('1000')} className="bg-slate-800 text-slate-300 text-[10px] px-2 py-2 rounded border border-slate-600 hover:bg-slate-700">1k</button>
                     <button onClick={() => setCustomBetAmount('5000')} className="bg-slate-800 text-slate-300 text-[10px] px-2 py-2 rounded border border-slate-600 hover:bg-slate-700">5k</button>
                 </div>
             </div>

             {/* Chip Selector (Hidden if Custom Amount is typed, or keep both? Keep both for flexibility) */}
             {!customBetAmount && (
                 <div className="bg-black/60 backdrop-blur-xl rounded-xl p-1.5 flex justify-between items-center border border-white/10 shadow-2xl overflow-x-auto">
                     {CHIPS.map(val => (
                         <button 
                            key={val}
                            onClick={() => setSelectedChip(val)}
                            className={`relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-black text-[9px] shadow-lg transition-transform mx-1 ${
                                selectedChip === val ? 'scale-110 ring-2 ring-white z-10 -translate-y-1' : 'scale-100 opacity-90'
                            } ${
                                val === 10 ? 'bg-gradient-to-br from-blue-400 to-blue-600 border border-white text-white' :
                                val === 50 ? 'bg-gradient-to-br from-green-400 to-green-600 border border-white text-white' :
                                val === 100 ? 'bg-gradient-to-br from-red-400 to-red-600 border border-white text-white' :
                                val === 500 ? 'bg-gradient-to-br from-purple-400 to-purple-600 border border-white text-white' :
                                'bg-gradient-to-br from-yellow-400 to-yellow-600 border border-white text-black'
                            }`}
                         >
                             <div className="absolute inset-0 rounded-full border border-white/30"></div>
                             {val}
                         </button>
                     ))}
                 </div>
             )}
         </div>

         {gameState !== 'BETTING' && gameState !== 'RESULT' && (
             <div className="absolute inset-x-0 bottom-40 z-40 flex items-center justify-center pointer-events-none">
                 <div className="bg-black/80 px-8 py-3 rounded-full text-red-500 font-black text-lg uppercase tracking-widest animate-pulse border-2 border-red-500/50 shadow-2xl backdrop-blur-md">
                     Stop Betting
                 </div>
             </div>
         )}
      </div>
    </div>
  );
}