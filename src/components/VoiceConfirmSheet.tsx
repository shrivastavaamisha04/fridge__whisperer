import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { ConfirmItem } from '../types';

const QUANTITY_OPTIONS = ['100 gm', '200 gm', '500 gm', '1 kg', '2 kg', '250 ml', '500 ml', '1 litre', '2 litres'];

interface VoiceConfirmSheetProps {
  mode: 'fridge' | 'shopping';
  items: ConfirmItem[];
  onConfirm: (items: ConfirmItem[]) => void;
  onCancel: () => void;
}

export default function VoiceConfirmSheet({ mode, items: initialItems, onConfirm, onCancel }: VoiceConfirmSheetProps) {
  const [items, setItems] = useState<ConfirmItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [openQtyId, setOpenQtyId] = useState<string | null>(null);

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(x => x.id !== id));
    if (openQtyId === id) setOpenQtyId(null);
  };

  const startEdit = (item: ConfirmItem) => {
    setEditingId(item.id);
    setEditingName(item.name);
    setOpenQtyId(null);
  };

  const saveEdit = (id: string) => {
    if (editingName.trim()) {
      setItems(prev => prev.map(x => x.id === id ? { ...x, name: editingName.trim() } : x));
    }
    setEditingId(null);
  };

  const setQuantity = (id: string, qty: string) => {
    setItems(prev => prev.map(x => x.id === id ? { ...x, quantity: qty } : x));
    setOpenQtyId(null);
  };

  const label = mode === 'fridge' ? 'fridge' : 'shopping list';

  const content = (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm bg-white rounded-t-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-4 duration-300 flex flex-col"
        style={{ maxHeight: '82vh' }}
      >
        {/* Handle + header */}
        <div className="flex-shrink-0 px-6 pt-5 pb-4">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">
              🎙️
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 leading-tight">
                {items.length} {items.length === 1 ? 'item' : 'items'} heard
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                Tap a name to edit · {mode === 'fridge' ? 'tap quantity to change · ' : ''}tap × to remove
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 mx-5 flex-shrink-0" />

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {items.length === 0 ? (
            <p className="text-center text-slate-400 font-bold text-sm py-6">All items removed</p>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3">
                {/* Emoji */}
                <span className="text-2xl flex-shrink-0">{item.emoji}</span>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  {editingId === item.id ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onBlur={() => saveEdit(item.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(item.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="w-full font-bold text-slate-800 bg-white border border-brand-300 rounded-xl px-3 py-1.5 outline-none text-sm focus:border-brand-500"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(item)}
                      className="text-left font-bold text-slate-800 text-sm truncate w-full hover:text-brand-500 transition-colors active:text-brand-500"
                    >
                      {item.name}
                    </button>
                  )}
                </div>

                {/* Quantity (fridge only) */}
                {mode === 'fridge' && (
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setOpenQtyId(openQtyId === item.id ? null : item.id)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap hover:border-brand-300 hover:text-brand-500 active:scale-95 transition-all"
                    >
                      {item.quantity || '500 gm'}
                    </button>
                    {openQtyId === item.id && (
                      <div className="absolute bottom-full right-0 mb-1 bg-white rounded-2xl shadow-2xl border border-slate-100 z-10 w-28 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                        {QUANTITY_OPTIONS.map(opt => (
                          <button
                            key={opt}
                            onClick={() => setQuantity(item.id, opt)}
                            className={`w-full text-left px-3 py-2.5 text-xs font-bold transition-all
                              ${item.quantity === opt ? 'text-brand-500 bg-brand-50' : 'text-slate-600 hover:bg-slate-50 active:bg-slate-100'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-rose-400 flex-shrink-0 transition-colors active:text-rose-500"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 mx-5 flex-shrink-0" />

        {/* Actions */}
        <div className="flex-shrink-0 px-5 pt-4 pb-8 space-y-2">
          <button
            onClick={() => items.length > 0 && onConfirm(items)}
            disabled={items.length === 0}
            className="w-full py-4 bg-brand-500 text-white font-black rounded-2xl shadow-lg shadow-brand-500/25 active:scale-[0.98] transition-all text-base disabled:opacity-40"
          >
            Add {items.length} to {label}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 text-slate-400 font-black text-sm active:text-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
}
