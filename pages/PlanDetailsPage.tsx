
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PLANS } from '../constants';
import { buyPlan, getCurrentUser } from '../services/backend';
import { ChevronLeft, CheckCircle, AlertTriangle, Wallet, Zap, Calendar, TrendingUp } from 'lucide-react';

export default function PlanDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const plan = PLANS.find(p => p.id === id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  if (!plan) return <div className="p-10 text-white">Plan not found</div>;

  const handleBuy = async () => {
    if(!window.confirm(`Are you sure you want to invest Rs.${plan.price} in ${plan.name}?`)) return;
    
    setLoading(true);
    setError('');
    try {
        await buyPlan(plan.id);
        alert("Investment Successful!");
        navigate('/plans');
    } catch(err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const user = getCurrentUser();
  const balance = user?.balance || 0;
  const canAfford = balance >= plan.price;

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
        {/* Header Image/Gradient */}
        <div className={`h-64 bg-gradient-to-br ${plan.color} relative p-4 flex flex-col justify-between`}>
             <button onClick={() => navigate(-1)} className="absolute top-4 left-4 bg-black/20 p-2 rounded-full text-white backdrop-blur-md hover:bg-black/40 transition-colors z-20">
                 <ChevronLeft size={24} />
             </button>
             
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>

             <div className="mt-auto relative z-10">
                 <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2 inline-block">Premium Plan</span>
                 <h1 className="text-4xl font-black text-white drop-shadow-lg">{plan.name}</h1>
                 <p className="text-white/80 text-sm mt-1 flex items-center"><Calendar size={14} className="mr-1"/> {plan.duration} Days Lock-in Period</p>
             </div>
        </div>

        <div className="p-5 -mt-6 bg-slate-950 rounded-t-3xl relative z-10">
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Investment</p>
                    <p className="text-2xl font-bold text-white">Rs.{plan.price.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total Return</p>
                    <p className="text-2xl font-bold text-neonGreen">Rs.{plan.totalReturn.toLocaleString()}</p>
                </div>
            </div>

            {/* Benefits List */}
            <div className="mb-8 space-y-4">
                <h3 className="text-white font-bold text-lg">Plan Benefits</h3>
                
                <div className="flex items-start">
                    <div className="bg-green-500/10 p-2 rounded-full text-green-500 mr-3 mt-1">
                        <TrendingUp size={18} />
                    </div>
                    <div>
                        <p className="text-white font-bold">Daily Profit: {plan.dailyProfitPercent}%</p>
                        <p className="text-slate-400 text-xs">You will receive profit daily in your wallet.</p>
                    </div>
                </div>

                <div className="flex items-start">
                    <div className="bg-blue-500/10 p-2 rounded-full text-blue-500 mr-3 mt-1">
                        <CheckCircle size={18} />
                    </div>
                    <div>
                        <p className="text-white font-bold">Capital Returned</p>
                        <p className="text-slate-400 text-xs">Principal amount returns after {plan.duration} days.</p>
                    </div>
                </div>

                <div className="flex items-start">
                    <div className="bg-purple-500/10 p-2 rounded-full text-purple-500 mr-3 mt-1">
                        <Zap size={18} />
                    </div>
                    <div>
                        <p className="text-white font-bold">Instant Withdrawals</p>
                        <p className="text-slate-400 text-xs">Withdraw your profit anytime 24/7.</p>
                    </div>
                </div>
            </div>

            {/* Wallet Check */}
            <div className={`p-4 rounded-xl border mb-6 flex items-center justify-between ${canAfford ? 'bg-slate-900 border-slate-800' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className="flex items-center">
                    <Wallet size={20} className={canAfford ? 'text-slate-400' : 'text-red-500'} />
                    <div className="ml-3">
                        <p className="text-xs text-slate-400">Your Balance</p>
                        <p className="text-white font-bold">Rs.{balance.toLocaleString()}</p>
                    </div>
                </div>
                {!canAfford && (
                    <button onClick={() => navigate('/wallet')} className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-bold">Add Funds</button>
                )}
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-xl flex items-center text-red-500 text-sm font-bold mb-4">
                    <AlertTriangle size={16} className="mr-2" /> {error}
                </div>
            )}

            <button 
                onClick={handleBuy}
                disabled={loading || !canAfford}
                className={`w-full py-4 rounded-xl font-bold text-lg tracking-wider uppercase shadow-lg transition-all ${
                    canAfford 
                    ? 'bg-neonBlue text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
            >
                {loading ? 'Processing...' : canAfford ? 'Invest Now' : 'Insufficient Balance'}
            </button>
            
        </div>
    </div>
  );
}
