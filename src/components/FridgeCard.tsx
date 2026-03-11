import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { FridgeItem } from '../types';

const QUANTITY_OPTIONS = ['100 gm', '200 gm', '500 gm', '1 kg', '2 kg', '250 ml', '500 ml', '1 litre', '2 litres'];

interface FridgeCardProps {
  item: FridgeItem;
  viewerLang: string;
  onRemove: (item: FridgeItem) => void;
  onMoveToList?: (item: FridgeItem) => void;
  onUpdateQuantity?: (itemId: string, quantity: string) => void;
}

const FridgeCard: React.FC<FridgeCardProps> = ({ item, viewerLang, onRemove, onMoveToList, onUpdateQuantity }) => {
  const [now, setNow] = useState(Date.now());
  const [showQtyPicker, setShowQtyPicker] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const qtyBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Close qty picker on outside click
  useEffect(() => {
    if (!showQtyPicker) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-qty-menu]')) setShowQtyPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showQtyPicker]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!showQtyPicker) return;
    const reposition = () => {
      if (qtyBtnRef.current) {
        const rect = qtyBtnRef.current.getBoundingClientRect();
        setMenuPos({
          top: rect.bottom + 6,
          left: rect.left,
        });
      }
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [showQtyPicker]);

  const totalShelfLife = item.expiresAt - item.addedAt;
  const timeRemaining = Math.max(0, item.expiresAt - now);
  const percentRemaining = (timeRemaining / totalShelfLife) * 100;
  const daysLeft = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

  let barColor = 'bg-[#10b981]';
  let textColor = 'text-slate-300';
  if (daysLeft <= 2) { barColor = 'bg-rose-500'; textColor = 'text-rose-500'; }
  else if (daysLeft <= 3) { barColor = 'bg-orange-400'; textColor = 'text-orange-400'; }

  // Bilingual logic: if item was added in viewer's language → local is primary
  const hasLocal = !!item.localName && item.localName !== item.name;
  const isViewerLang = hasLocal && item.localLang === viewerLang;
  const primaryName = isViewerLang ? item.localName! : item.name;
  const secondaryName = hasLocal ? (isViewerLang ? item.name : item.localName) : null;

  const handleQtyBtnClick = () => {
    if (qtyBtnRef.current) {
      const rect = qtyBtnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 6,
        left: rect.left,
      });
    }
    setShowQtyPicker(v => !v);
  };

  const handleQtySelect = (qty: string) => {
    setShowQtyPicker(false);
    onUpdateQuantity?.(item.id, qty);
  };

  // Portal dropdown — renders outside any overflow:hidden containers
  const qtyDropdown = showQtyPicker ? ReactDOM.createPortal(
    <>
      <div className="fixed inset-0 z-[190]" onClick={() => setShowQtyPicker(false)} />
      <div
        data-qty-menu
        className="fixed z-[200] bg-white rounded-2xl shadow-2xl border border-slate-100 w-32 py-1.5 animate-in fade-in zoom-in-95 duration-150"
        style={{ top: menuPos.top, left: menuPos.left }}
      >
        {QUANTITY_OPTIONS.map(opt => (
          <button
            key={opt}
            data-qty-menu
            onClick={() => handleQtySelect(opt)}
            className={`w-full text-left px-3 py-2.5 text-xs font-bold transition-all
              ${item.quantity === opt
                ? 'text-brand-500 bg-brand-50'
                : 'text-slate-600 hover:bg-slate-50 active:bg-slate-100'}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div className="relative group animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white rounded-[2.5rem] p-4 pl-5 pr-4 flex items-center justify-between shadow-soft border border-slate-50/50 transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden">

        {/* Expiry bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[6px] bg-slate-50">
          <div
            className={`h-full ${barColor} transition-all duration-1000 ease-out`}
            style={{ width: `${Math.min(100, percentRemaining)}%` }}
          />
        </div>

        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Emoji + quantity badge */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-3xl shadow-inner border border-white">
              <span className="group-hover:scale-110 transition-transform duration-500">{item.emoji}</span>
            </div>
            {/* Tappable quantity badge — dropdown via portal */}
            {onUpdateQuantity && (
              <button
                ref={qtyBtnRef}
                onClick={handleQtyBtnClick}
                className="absolute -bottom-1 -left-1 bg-white border border-slate-100 px-1.5 py-0.5 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest shadow-sm hover:border-brand-300 hover:text-brand-500 active:scale-95 transition-all whitespace-nowrap"
              >
                {item.quantity || '500 gm'}
              </button>
            )}
          </div>

          {/* Name + bilingual subtitle + date */}
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="font-extrabold text-slate-800 text-lg tracking-tight lowercase leading-tight truncate">
              {primaryName}
            </h3>
            {secondaryName && (
              <span className="text-[10px] font-semibold text-slate-300 leading-tight truncate">
                {secondaryName}
              </span>
            )}
            <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
              Added: {new Date(item.addedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            <span className={`text-[9px] font-black mt-1 uppercase tracking-[0.2em] ${textColor}`}>
              {daysLeft <= 0 ? 'EXPIRED' : `${daysLeft}D REMAINING`}
            </span>
          </div>
        </div>

        {/* Actions — always visible on mobile (no hover-only) */}
        <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
          <button
            onClick={() => onMoveToList?.(item)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-brand-500 active:text-brand-500 hover:bg-brand-50 active:bg-brand-50 transition-all"
            title="Move to shopping list"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
          <button
            onClick={() => onRemove(item)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-400 active:text-rose-500 hover:bg-rose-50 active:bg-rose-50 transition-all"
            title="Remove from fridge"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {qtyDropdown}
    </div>
  );
};

export default FridgeCard;
