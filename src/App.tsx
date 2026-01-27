import React, { useState, useEffect, useMemo } from 'react';
import { FridgeItem, ShoppingItem } from './types';
import { getFoodInfo } from './services/geminiService';
import { supabaseService } from './services/supabaseService';
import FridgeCard from './components/FridgeCard';

const StrawberryWallpaper = () => (
  <div
    className="fixed inset-0 pointer-events-none z-[-1] opacity-40"
    style={{
      backgroundColor: '#fdfbf7',
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M25 35c0-4 3-8 8-8s8 4 8 8-3 12-8 12-8-8-8-12z' fill='%23ff6b6b' opacity='.6'/%3E%3Cpath d='M33 27c-1 0-2 1-2 2s1 2 2 2 2-1 2-2-1-2-2-2z' fill='%234ecdc4'/%3E%3Ccircle cx='30' cy='33' r='1' fill='%23fff'/%3E%3Ccircle cx='36' cy='38' r='1' fill='%23fff'/%3E%3Cpath d='M85 85c0-4 3-8 8-8s8 4 8 8-3 12-8 12-8-8-8-12z' fill='%23ff6b6b' opacity='.5'/%3E%3Cpath d='M100 20c0-3 2-6 6-6s6 3 6 6-2 9-6 9-6-6-6-9z' fill='%23ff6b6b' opacity='.4'/%3E%3C/g%3E%3C/svg%3E")`,
      backgroundSize: '180px 180px'
    }}
  />
);

const BackgroundIcons = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden select-none">
    <span className="bg-icon top-[8%] left-[10%] animate-subtle-float" style={{ animationDelay: '0s' }}>🥑</span>
    <span className="bg-icon top-[15%] right-[12%] animate-subtle-float" style={{ animationDelay: '1.5s' }}>🥦</span>
    <span className="bg-icon bottom-[20%] left-[5%] animate-subtle-float" style={{ animationDelay: '3s' }}>🍓</span>
    <span className="bg-icon bottom-[10%] right-[15%] animate-subtle-float" style={{ animationDelay: '0.8s' }}>🥛</span>
  </div>
);

type SortOption = 'expiry' | 'name' | 'added';
const QUANTITY_OPTIONS = ['100 gm', '200 gm', '500 gm', '1 kg', '2 kg'];

export default function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>(() =>
    localStorage.getItem('kitchen_id') ? 'dashboard' : 'landing'
  );
  const [kitchenId, setKitchenId] = useState(() => localStorage.getItem('kitchen_id') || '');
  const [userName, setUserName] = useState(() => localStorage.getItem('user_name') || '');

  const [inventory, setInventory] = useState<FridgeItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('expiry');
  const [loading, setLoading] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [itemQuantity, setItemQuantity] = useState('500 gm');
  const [newShoppingItem, setNewShoppingItem] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [synced, setSynced] = useState(false);

  // Initial Load & Real-time Sync
  useEffect(() => {
    if (kitchenId && view === 'dashboard') {
      // 1. Initial Fetch
      const load = async () => {
        try {
          const data = await supabaseService.fetchData(kitchenId);
          setInventory(data.inventory);
          setShoppingList(data.shoppingList);
          setSynced(true);
        } catch (error) {
          console.error("Failed to load:", error);
        }
      };
      load();

      // 2. Subscribe to changes
      const unsubscribe = supabaseService.subscribe(kitchenId, () => {
        // Simple strategy: re-fetch on any change
        load();
      });

      // Cleanup
      localStorage.setItem('kitchen_id', kitchenId);
      localStorage.setItem('user_name', userName);

      return () => { unsubscribe(); };
    }
  }, [kitchenId, view]);

  // Removed the useEffect that saves to localStorage - we save to Cloud now!

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      // If entering a new kitchen, create a truly unique ID if left blank
      if (!kitchenId.trim()) setKitchenId('HOME-' + Math.random().toString(36).substr(2, 5).toUpperCase());
      setView('dashboard');
    }
  };

  const handleLogout = () => {
    if (confirm('Step out of this kitchen? Your household will miss you, but the data stays safe.')) {
      localStorage.removeItem('kitchen_id');
      localStorage.removeItem('user_name');
      setView('landing');
      setInventory([]);
      setShoppingList([]);
      setIsSettingsOpen(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(kitchenId);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const addItemToFridge = async (name: string, sourceId?: string) => {
    if (!name.trim() || loading) return;
    setLoading(true);
    try {
      const info = await getFoodInfo(name);
      const item: FridgeItem = {
        id: crypto.randomUUID(), // Better than random().toString()
        name: name.trim(),
        category: info.category,
        emoji: info.emoji,
        addedAt: Date.now(),
        expiresAt: Date.now() + (info.days * 86400000),
        quantity: itemQuantity,
      };

      // OPTIMISTIC UPDATE (Show immediately)
      setInventory(prev => [item, ...prev]);
      setNewItem('');

      // AB: Add to Cloud
      await supabaseService.addItem(item, kitchenId);

      if (sourceId) {
        setShoppingList(prev => prev.filter(x => x.id !== sourceId));
        await supabaseService.removeShoppingItem(sourceId);
      }
    } catch (err) {
      console.error(err);
      // Revert optimism if needed (skipped for MVP simplicity)
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id: string) => {
    setInventory(prev => prev.filter(x => x.id !== id)); // Optimistic
    await supabaseService.removeItem(id);
  };

  const addToShoppingList = async () => {
    if (!newShoppingItem.trim()) return;
    const item: ShoppingItem = {
      id: crypto.randomUUID(),
      name: newShoppingItem.trim(),
      emoji: '🛍️'
    };

    setShoppingList(prev => [...prev, item]); // Optimistic
    setNewShoppingItem('');

    await supabaseService.addShoppingItem(item, kitchenId);
  };

  const removeFromShoppingList = async (id: string) => {
    setShoppingList(prev => prev.filter(x => x.id !== id)); // Optimistic
    await supabaseService.removeShoppingItem(id);
  };

  const groupedInventory = useMemo(() => {
    const groups: Record<string, FridgeItem[]> = {};
    const list = [...inventory];
    if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'expiry') list.sort((a, b) => a.expiresAt - b.expiresAt);
    if (sortBy === 'added') list.sort((a, b) => b.addedAt - a.addedAt);

    list.forEach(item => {
      const cat = item.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [inventory, sortBy]);


  const addShoppingItem = async () => {
    if (!newShoppingItem.trim()) return;

    // 1. Optimistic UI update (temporary emoji)
    const tempId = crypto.randomUUID();
    setShoppingList(prev => [...prev, { id: tempId, name: newShoppingItem.trim(), emoji: '⏳' }]);
    setNewShoppingItem('');

    try {
      // 2. Fetch AI info
      const info = await getFoodInfo(newShoppingItem.trim());

      const item: ShoppingItem = {
        id: tempId,
        name: newShoppingItem.trim(),
        emoji: info.emoji || '🛍️'
      };

      // 3. Update state with real emoji
      setShoppingList(prev => prev.map(x => x.id === tempId ? item : x));

      // 4. Persist to DB
      await supabaseService.addShoppingItem(item, kitchenId);
    } catch (err) {
      console.error(err);
      // Fallback if AI fails (keep generic or update)
      const fallbackItem: ShoppingItem = {
        id: tempId,
        name: newShoppingItem.trim(),
        emoji: '🛍️'
      };
      setShoppingList(prev => prev.map(x => x.id === tempId ? fallbackItem : x));
      await supabaseService.addShoppingItem(fallbackItem, kitchenId);
    }
  };

  if (view === 'landing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <StrawberryWallpaper />
        <div className="w-full max-w-sm space-y-12 text-center animate-in fade-in duration-700 relative z-10">
          <div className="space-y-6">
            <div className="w-24 h-24 bg-brand-500 rounded-[2.2rem] mx-auto flex items-center justify-center text-5xl shadow-2xl shadow-brand-500/30 animate-subtle-float">🍓</div>
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">The Fridge Whisperer</h1>
              <p className="text-slate-500/80 font-semibold mt-3 text-lg leading-snug max-w-[280px] mx-auto">Your household's shared brain for a zero-waste kitchen.</p>
            </div>
          </div>

          <form onSubmit={handleStart} className="bg-white/90 backdrop-blur-md p-10 rounded-[3rem] shadow-soft space-y-8 border border-white">
            <div className="text-left space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-brand-500 uppercase tracking-[0.15em] ml-1">Your Name</label>
                <input required placeholder="Amisha, Sharvi..." value={userName} onChange={e => setUserName(e.target.value)} className="w-full p-5 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:border-brand-500 transition-all placeholder:text-slate-300" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-brand-500 uppercase tracking-[0.15em] ml-1">Household ID (Optional)</label>
                <input placeholder="Leave blank for new" value={kitchenId} onChange={e => setKitchenId(e.target.value)} className="w-full p-5 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:border-brand-500 transition-all placeholder:text-slate-300" />
              </div>
            </div>
            <button type="submit" className="w-full py-5 bg-brand-500 text-white font-black rounded-3xl shadow-xl shadow-brand-500/25 active:scale-[0.97] transition-all text-xl hover:bg-brand-600">
              Enter Kitchen
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfc] pb-24">
      <header className="bg-brand-500 text-white pt-16 pb-20 px-10 rounded-header shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight">{userName}'s fridge space</h1>
            <p className="text-[11px] font-black opacity-70 uppercase tracking-[0.18em]">KITCHEN ID: {kitchenId}</p>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center transition-all backdrop-blur-md border border-white/20 shadow-lg"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white rounded-[3.5rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="space-y-2 text-center">
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">🏠</div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Kitchen Heart</h3>
              <p className="text-slate-400 font-bold text-sm">Household Control Center</p>
            </div>

            <div className="space-y-5">
              <div className="p-6 bg-slate-50/80 rounded-3xl border border-slate-100 flex flex-col gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Your Secret Key</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-brand-600 text-lg tracking-wider">{kitchenId}</span>
                  <button
                    onClick={copyToClipboard}
                    className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all shadow-sm ${copyFeedback ? 'bg-emerald-500 text-white scale-95' : 'bg-brand-500 text-white active:scale-95'}`}
                  >
                    {copyFeedback ? 'Saved!' : 'Copy'}
                  </button>
                </div>
                <p className="text-[9px] font-bold text-slate-400 italic">Share this key with housemates so they can stay in sync.</p>
              </div>

              {/* Simplified Coming Soon Banner */}
              <div className="relative overflow-hidden p-6 rounded-[2rem] bg-slate-50 border border-slate-100 shadow-inner">
                <div className="relative z-10">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                    Coming soon
                  </span>
                  <p className="text-xs font-bold text-slate-500 leading-relaxed">
                    We're building <span className="text-brand-600 font-black">Real-time Sync</span> so your whole household sees every fridge update instantly.
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-5 bg-rose-50/50 text-rose-500 font-black rounded-3xl hover:bg-rose-100/50 active:scale-[0.98] transition-all text-sm tracking-wide"
              >
                Step out of this Kitchen
              </button>
            </div>

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full py-4 text-slate-300 hover:text-slate-500 font-black text-[11px] uppercase tracking-[0.3em] transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      <main className="max-w-xl mx-auto px-6 -mt-10 space-y-12 relative z-20">
        <div className="bg-white p-2.5 pl-8 pr-2.5 rounded-[2.5rem] shadow-soft border border-slate-50 flex items-center gap-2 group transition-all focus-within:ring-4 focus-within:ring-brand-500/10">
          <input
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItemToFridge(newItem)}
            placeholder="Add to fridge..."
            className="flex-1 bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-300 text-lg min-w-0"
          />
          <select value={itemQuantity} onChange={e => setItemQuantity(e.target.value)} className="appearance-none bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-500 text-sm cursor-pointer outline-none hover:bg-slate-100 transition-colors">
            {QUANTITY_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
          <button onClick={() => addItemToFridge(newItem)} disabled={loading || !newItem.trim()} className="px-8 py-5 bg-brand-500 text-white font-black rounded-[1.8rem] shadow-lg shadow-brand-500/25 active:scale-[0.96] transition-all disabled:opacity-40 text-sm uppercase tracking-widest whitespace-nowrap">
            {loading ? '...' : 'ADD'}
          </button>
        </div>

        <div className="space-y-12">
          {/* New Heading: In the fridge */}
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 -mb-6">In the fridge</h2>

          {Object.entries(groupedInventory).map(([category, items]) => (
            <div key={category} className="space-y-6">
              <div className="flex items-center gap-4 px-4">
                <h3 className="text-[11px] font-black text-brand-500 uppercase tracking-[0.25em]">{category}</h3>
                <div className="h-[1px] flex-1 bg-slate-100"></div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{items.length}</span>
              </div>
              <div className="space-y-4">
                {items.map(item => (
                  <FridgeCard
                    key={item.id}
                    item={item}
                    onRemove={(i) => removeItem(i.id)}
                    onMoveToList={async (i) => {
                      // Optimistic move
                      setShoppingList(prev => [...prev, { id: i.id, name: i.name, emoji: i.emoji }]);
                      setInventory(prev => prev.filter(x => x.id !== i.id));

                      // Persist changes
                      await supabaseService.addShoppingItem({ id: i.id, name: i.name, emoji: i.emoji }, kitchenId);
                      await supabaseService.removeItem(i.id);
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Shopping checklist</h2>
          <div className="checklist-glass p-8 rounded-[3rem] border border-white shadow-soft space-y-6">
            {shoppingList.map(item => (
              <div key={item.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-5">
                  <button onClick={() => addItemToFridge(item.name, item.id)} className="w-11 h-11 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-200 hover:border-brand-500/50 hover:text-brand-500 transition-all shadow-sm">
                    <div className="w-5 h-5 rounded-md border-2 border-slate-200 group-hover:border-brand-200 transition-colors"></div>
                  </button>
                  <span className="font-bold text-slate-800 text-lg flex items-center gap-3">
                    <span className="opacity-80">{item.emoji || '🛍️'}</span> {item.name}
                  </span>
                </div>
                <button onClick={() => setShoppingList(prev => prev.filter(x => x.id !== item.id))} className="w-9 h-9 flex items-center justify-center text-slate-200 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            <div className="pt-6 border-t border-slate-100">
              <input
                value={newShoppingItem}
                onChange={e => setNewShoppingItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addShoppingItem()}
                placeholder="Add to shopping list..."
                className="w-full bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-300 text-lg"
              />
            </div>
          </div>
        </div>
      </main>
      <BackgroundIcons />
    </div>
  );
}