
import { Plan } from './types';

export const PLANS: Plan[] = [
  {
    id: 'p1',
    name: 'BlueCard-399',
    price: 399,
    duration: 3, // Reduced from 10
    dailyProfitPercent: 5.0, // Increased
    totalReturn: 458,
    color: 'from-blue-900 to-blue-600'
  },
  {
    id: 'p2',
    name: 'SilverCard-600',
    price: 600,
    duration: 5, // Reduced from 12
    dailyProfitPercent: 4.5,
    totalReturn: 735,
    color: 'from-slate-700 to-slate-400'
  },
  {
    id: 'p3',
    name: 'GoldCard-1200',
    price: 1200,
    duration: 7, // Reduced from 15
    dailyProfitPercent: 4.0,
    totalReturn: 1536,
    color: 'from-yellow-900 to-yellow-600'
  },
  {
    id: 'p4',
    name: 'RubyCard-2000',
    price: 2000,
    duration: 10, // Reduced from 20
    dailyProfitPercent: 3.5,
    totalReturn: 2700,
    color: 'from-red-900 to-red-600'
  },
  {
    id: 'p5',
    name: 'EmeraldCard-5000',
    price: 5000,
    duration: 12, // Reduced from 30
    dailyProfitPercent: 3.2,
    totalReturn: 6920,
    color: 'from-emerald-900 to-emerald-600'
  },
  {
    id: 'p6',
    name: 'DiamondCard-10K',
    price: 10000,
    duration: 15, // Reduced from 45
    dailyProfitPercent: 3.0,
    totalReturn: 14500,
    color: 'from-cyan-900 to-cyan-600'
  },
  {
    id: 'p7',
    name: 'SapphireCard-20K',
    price: 20000,
    duration: 20, // Reduced from 60
    dailyProfitPercent: 2.8,
    totalReturn: 31200,
    color: 'from-indigo-900 to-indigo-600'
  },
  {
    id: 'p8',
    name: 'TitaniumCard-30K',
    price: 30000,
    duration: 25, // Reduced from 70
    dailyProfitPercent: 2.6,
    totalReturn: 49500,
    color: 'from-gray-900 to-gray-600'
  },
  {
    id: 'p9',
    name: 'PlatinumCard-50K',
    price: 50000,
    duration: 30, // Reduced from 80
    dailyProfitPercent: 2.5,
    totalReturn: 87500,
    color: 'from-purple-900 to-purple-600'
  },
  {
    id: 'p10',
    name: 'UltraCard-100K',
    price: 100000,
    duration: 35, // Reduced from 85
    dailyProfitPercent: 2.4,
    totalReturn: 184000,
    color: 'from-rose-900 to-rose-600'
  },
  {
    id: 'p11',
    name: 'InfinityCard-200K',
    price: 200000,
    duration: 40, // Reduced from 90
    dailyProfitPercent: 2.3,
    totalReturn: 384000,
    color: 'from-fuchsia-900 to-fuchsia-600'
  }
];
