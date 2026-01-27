import React, { useState, useEffect } from 'react';
import { FridgeItem } from '../types';

interface FridgeCardProps {
  item: FridgeItem;
  onRemove: (item: FridgeItem) => void;
  onMoveToList?: (item: FridgeItem) => void;
}

const FridgeCard: React.FC<FridgeCardProps> = ({ item, onRemove, onMoveToList }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const totalShelfLife = item.expiresAt - item.addedAt;
  const timeRemaining = Math.max(0, item.expiresAt - now);
  const percentRemaining = (timeRemaining / totalShelfLife) * 100;
  const daysLeft = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

  // Dynamic color logic: Fresh (Emerald), Warning (Orange), Urgent/Expired (Rose/Red)
  let barColor = 'bg-[#10b981]'; // Emerald
  let textColor = 'text-slate-300';

  if (daysLeft <= 2) {
    barColor = 'bg-rose-500'; // URGENT ROSE
    textColor = 'text-rose-500';
  } else if (daysLeft <= 3) {
    barColor = 'bg-orange-400';
    textColor = 'text-orange-400';
  }

  return (
    <div className="relative group animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white rounded-[2.5rem] p-4 pl-5 pr-5 flex items-center justify-between shadow-soft border border-slate-50/50 transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden">

        {/* Modern Horizontal Bar at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[6px] bg-slate-50">
          <div
            className={`h-full ${barColor} transition-all duration-1000 ease-out`}
            style={{ width: `${Math.min(100, percentRemaining)}%` }}
          />
        </div>

        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl shadow-inner border border-white">
              <span className="group-hover:scale-110 transition-transform duration-500">{item.emoji}</span>
            </div>
            {item.quantity && (
              <div className="absolute -bottom-1 -left-1 bg-white border border-slate-100 px-2 py-0.5 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                {item.quantity}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <h3 className="font-extrabold text-slate-800 text-xl tracking-tight lowercase leading-none">
              {item.name}
            </h3>
            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
              Added: {new Date(item.addedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            <span className={`text-[9px] font-black mt-2 uppercase tracking-[0.2em] ${textColor}`}>
              {daysLeft <= 0 ? 'EXPIRED' : `${daysLeft}D REMAINING`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => onMoveToList?.(item)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-200 hover:text-brand-500 hover:bg-brand-50 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </button>
          <button onClick={() => onRemove(item)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-100 hover:text-rose-400 hover:bg-rose-50 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
export default FridgeCard;