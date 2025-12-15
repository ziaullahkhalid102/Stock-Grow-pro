
import React, { useState } from 'react';
import { PLANS } from '../constants';
import { TrendingUp, Clock, AlertCircle, Zap, Gamepad2, PlayCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="p-4 pt-8 pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">StockGrow</h1>
          <p className="text-xs text-slate-400 mt-1">Invest & Play to Win</p>
        </div>
        <div className="bg-slate-800/50 p-2 rounded-full border border-slate-700 backdrop-blur-md">
          <TrendingUp className="text-neonGreen" size={24} />
        </div>
      </div>

      {/* GAME PROMO BANNER */}
      <div 
        onClick={() => navigate('/game')}
        className="relative group w-full bg-gradient-to-r from-indigo-900 to-purple-900 rounded-3xl p-6 mb-8 overflow-hidden cursor-pointer shadow-2xl border border-indigo-500/50 hover:scale-[1.02] transition-transform"
      >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex items-center justify-between">
             <div>
                <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase">Hot</span>
                    <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Casino Game</span>
                </div>
                <h2 className="text-2xl font-black text-white mb-2 italic">DRAGON <span className="text-yellow-400">VS</span> TIGER</h2>
                <p className="text-sm text-slate-300 mb-4">Use wallet balance to play & win instant cash!</p>
                <button className="bg-white text-indigo-900 px-5 py-2 rounded-full font-bold text-xs uppercase flex items-center shadow-lg group-hover:bg-yellow-400 group-hover:text-black transition-colors">
                    <PlayCircle size={16} className="mr-2" /> Play Now
                </button>
             </div>
             <div className="w-20 h-20 bg-black/30 rounded-full flex items-center justify-center border-4 border-indigo-400/30">
                 <Gamepad2 size={40} className="text-yellow-400" />
             </div>
          </div>
      </div>

      <h2 className="text-lg font-bold text-white mb-4">Investment Plans</h2>

      <div className="space-y-6">
        {PLANS.map((plan) => (
          <div 
            key={plan.id}
            onClick={() => navigate(`/plan/${plan.id}`)}
            className="relative group rounded-3xl overflow-hidden bg-surface border border-slate-800 shadow-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:border-slate-600 cursor-pointer"
          >
            {/* Card Header */}
            <div className={`h-28 bg-gradient-to-r ${plan.color} p-5 flex justify-between items-start relative`}>
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white drop-shadow-md">{plan.name}</h3>
                <div className="flex items-center text-white/90 text-xs mt-2 font-medium bg-black/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                  <Clock size={12} className="mr-1.5" /> {plan.duration} Days Lock-in
                </div>
              </div>

              <div className="text-right relative z-10">
                <span className="block text-sm text-white/80 mb-1">Price</span>
                <span className="block text-2xl font-bold text-white tracking-tighter">
                  <span className="text-base align-top mr-1">Rs.</span>{plan.price.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5">
              <div className="flex justify-between items-center mb-6 bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
                 <div className="text-center flex-1">
                    <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-1">Daily Profit</p>
                    <p className="text-neonGreen font-bold text-lg">{plan.dailyProfitPercent}%</p>
                 </div>
                 <div className="h-8 w-px bg-slate-700"></div>
                 <div className="text-center flex-1">
                    <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-1">Total Return</p>
                    <p className="text-white font-bold text-lg">Rs. {plan.totalReturn.toLocaleString()}</p>
                 </div>
              </div>
              
              <div className="w-full py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm tracking-widest uppercase flex items-center justify-center group-hover:bg-neonBlue group-hover:text-black transition-colors">
                  View Details <ChevronRight size={16} className="ml-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
