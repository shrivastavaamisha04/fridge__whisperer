import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FridgeItem, ShoppingItem, ConfirmItem } from './types';
import { getFoodInfo, parseItemList, parseShoppingItems } from './services/geminiService';
import { supabaseService } from './services/supabaseService';
import FridgeCard from './components/FridgeCard';
import VoiceInput from './components/VoiceInput';
import HoldMicButton from './components/HoldMicButton';
import HowToUse from './components/HowToUse';
import VoiceConfirmSheet from './components/VoiceConfirmSheet';

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
const QUANTITY_OPTIONS = ['100 gm', '200 gm', '500 gm', '1 kg', '2 kg', '250 ml', '500 ml', '1 litre', '2 litres'];

export default function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>(() =>
    localStorage.getItem('kitchen_id') ? 'dashboard' : 'landing'
  );
  const [kitchenId, setKitchenId] = useState(() => localStorage.getItem('kitchen_id') || '');
  const [userName, setUserName] = useState(() => localStorage.getItem('user_name') || '');
  const [householdName, setHouseholdName] = useState(() => localStorage.getItem('household_name') || 'My Kitchen');
  const [editingHouseholdName, setEditingHouseholdName] = useState(false);
  const [householdNameInput, setHouseholdNameInput] = useState('');
  const householdNameInputRef = useRef<HTMLInputElement>(null);

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
  const [householdMembers, setHouseholdMembers] = useState<string[]>([]);
  // Voice confirm sheet state
  const [pendingFridgeItems, setPendingFridgeItems] = useState<ConfirmItem[] | null>(null);
  const [pendingShoppingItems, setPendingShoppingItems] = useState<ConfirmItem[] | null>(null);
  const [voiceProcessing, setVoiceProcessing] = useState(false);

  // Voice language — persisted per device so each household member remembers their own
  const [selectedLang, setSelectedLang] = useState(() => localStorage.getItem('voice_lang') || 'hi-IN');
  const handleLangChange = useCallback((lang: string) => {
    setSelectedLang(lang);
    localStorage.setItem('voice_lang', lang);
  }, []);
  // Guide: auto-open on ?guide=true URL, or first visit (pill shown until dismissed)
  const [showGuide, setShowGuide] = useState(() =>
    new URLSearchParams(window.location.search).get('guide') === 'true'
  );
  const [guideSeen, setGuideSeen] = useState(() =>
    localStorage.getItem('guide_seen') === 'true'
  );
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  // Track IDs of items we inserted ourselves — suppress their realtime notifications
  const selfInsertedIds = useRef(new Set<string>());

  // ── Supabase: Initial Load & Real-time Sync ───────────────────────────────
  useEffect(() => {
    if (kitchenId && view === 'dashboard') {
      const load = async () => {
        try {
          const data = await supabaseService.fetchData(kitchenId);
          setInventory(data.inventory);
          setShoppingList(data.shoppingList);
          setSynced(true);
        } catch (error) {
          console.error('Failed to load:', error);
        }
      };
      load();

      const unsubscribe = supabaseService.subscribe(kitchenId, (payload) => {
        load();
        if (Notification.permission === 'granted') {
          const event = payload.eventType;
          const insertedId = payload.new?.id as string | undefined;
          // Suppress notification for items we inserted ourselves
          if (event === 'INSERT' && insertedId && selfInsertedIds.current.has(insertedId)) {
            selfInsertedIds.current.delete(insertedId);
            return;
          }
          const table = payload.table;
          if (event === 'INSERT') {
            const name = payload.new.name;
            const emoji = payload.new.emoji || '';
            const isShoppingItem = table === 'shopping_items';
            new Notification(`${emoji} ${name}`, {
              body: isShoppingItem ? 'Added to shopping list' : 'Added to fridge'
            });
          } else if (event === 'DELETE') {
            new Notification('List updated', { body: 'Your household made a change' });
          }
        }
      });

      localStorage.setItem('kitchen_id', kitchenId);
      localStorage.setItem('user_name', userName);

      return () => { unsubscribe(); };
    }
  }, [kitchenId, view]);

  // ── Expiry push notifications ─────────────────────────────────────────────
  useEffect(() => {
    if (inventory.length === 0) return;
    const lastAlert = localStorage.getItem('last_expiry_alert');
    const today = new Date().toDateString();
    if (lastAlert !== today && Notification.permission === 'granted') {
      const expiringSoon = inventory.filter(item => {
        const daysLeft = Math.ceil((item.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 3 && daysLeft > 0;
      });
      if (expiringSoon.length > 0) {
        new Notification('Fridge Alert', {
          body: `${expiringSoon.length} items are expiring within 3 days! Use them up!`
        });
        localStorage.setItem('last_expiry_alert', today);
      }
    }
  }, [inventory]);

  // ── Household name persistence ────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('household_name', householdName);
  }, [householdName]);

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      new Notification('Notifications Enabled!', { body: 'You will now see updates from your household.' });
    }
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      const resolvedId = kitchenId.trim() || 'HOME-' + Math.random().toString(36).substr(2, 5).toUpperCase();
      if (!kitchenId.trim()) setKitchenId(resolvedId);
      supabaseService.upsertMember(resolvedId, userName.trim());
      setView('dashboard');
    }
  };

  const handleLogout = () => {
    if (confirm('Step out of this kitchen? Your household will miss you, but the data stays safe.')) {
      localStorage.removeItem('kitchen_id');
      localStorage.removeItem('user_name');
      localStorage.removeItem('household_name');
      localStorage.removeItem('guide_seen');
      setHouseholdName('My Kitchen');
      setGuideSeen(false);
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

  const openGuide = () => { setShowGuide(true); setGuideSeen(true); localStorage.setItem('guide_seen', 'true'); };
  const closeGuide = () => { setShowGuide(false); setGuideSeen(true); localStorage.setItem('guide_seen', 'true'); };

  // ── WhatsApp share ────────────────────────────────────────────────────────
  const shareOnWhatsApp = () => {
    const msg = `Hey! Join our household on Fridge Whisperer!\n\nHousehold: ${householdName}\nKey: ${kitchenId}\n\nOpen the app, enter this key and you're in:\nhttps://fridge-whisperer.vercel.app/\n\nNew to the app? Step-by-step guide:\nhttps://fridge-whisperer.vercel.app/?guide=true`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // ── Household name editing ────────────────────────────────────────────────
  const startEditingName = () => {
    setHouseholdNameInput(householdName);
    setEditingHouseholdName(true);
    setTimeout(() => householdNameInputRef.current?.focus(), 50);
  };

  const saveHouseholdName = () => {
    const trimmed = householdNameInput.trim();
    if (trimmed) setHouseholdName(trimmed);
    setEditingHouseholdName(false);
  };

  // ── Fridge operations (Supabase-backed) ──────────────────────────────────
  const addItemToFridge = async (name: string, sourceId?: string) => {
    if (!name.trim() || loading) return;
    setLoading(true);
    let item: FridgeItem | null = null;
    try {
      const info = await getFoodInfo(name);
      item = {
        id: crypto.randomUUID(),
        name: name.trim(),
        category: info.category,
        emoji: info.emoji,
        addedAt: Date.now(),
        expiresAt: Date.now() + (info.days * 86400000),
        quantity: itemQuantity,
      };
      setInventory(prev => [item!, ...prev]);
      setNewItem('');
      selfInsertedIds.current.add(item.id);
      await supabaseService.addItem(item, kitchenId);
      if (sourceId) {
        setShoppingList(prev => prev.filter(x => x.id !== sourceId));
        await supabaseService.removeShoppingItem(sourceId);
      }
    } catch (err) {
      console.error('Failed to save item:', err);
      if (item) setInventory(prev => prev.filter(x => x.id !== item!.id));
      alert('Could not save item — check your internet connection or Supabase setup.');
    } finally {
      setLoading(false);
    }
  };

  // ── Voice: parse transcript → show confirm sheet (fridge) ─────────────────
  const handleVoiceRelease = useCallback(async (transcript: string) => {
    if (!transcript.trim() || loading) return;
    setNewItem('');
    setVoiceProcessing(true);
    try {
      const parsed = await parseItemList(transcript, selectedLang);
      const confirmItems: ConfirmItem[] = parsed.map(p => {
        const isDifferentLang = p.localName && p.localName !== p.name;
        return {
          id: crypto.randomUUID(),
          name: p.name,
          emoji: p.emoji,
          quantity: p.quantity || itemQuantity,
          category: p.category,
          shelfLifeDays: p.shelfLifeDays,
          localName: isDifferentLang ? p.localName : undefined,
          localLang: isDifferentLang ? selectedLang : undefined,
        };
      });
      setPendingFridgeItems(confirmItems);
    } catch (err) {
      console.error('Voice parse failed:', err);
      alert('Could not process voice input. Please try again.');
    } finally {
      setVoiceProcessing(false);
    }
  }, [selectedLang, loading, itemQuantity]);

  // ── Voice: parse transcript → show confirm sheet (shopping) ───────────────
  const handleShoppingVoiceRelease = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;
    setVoiceProcessing(true);
    try {
      const parsed = await parseShoppingItems(transcript, selectedLang);
      const confirmItems: ConfirmItem[] = parsed.map(p => ({
        id: crypto.randomUUID(),
        name: p.name,
        emoji: p.emoji || '🛍️',
      }));
      setPendingShoppingItems(confirmItems);
    } catch (err) {
      console.error('Shopping voice parse failed:', err);
    } finally {
      setVoiceProcessing(false);
    }
  }, [selectedLang]);

  // ── Confirm: add reviewed fridge items ────────────────────────────────────
  const confirmAddToFridge = useCallback(async (items: ConfirmItem[]) => {
    setPendingFridgeItems(null);
    setLoading(true);
    try {
      for (const p of items) {
        // Strip trailing punctuation (Devanagari danda etc.) from names
        const cleanedName = p.name.replace(/[।.!?،؟]+$/, '').trim();
        const cleanedLocal = p.localName ? p.localName.replace(/[।.!?،؟]+$/, '').trim() : undefined;
        const item: FridgeItem = {
          id: crypto.randomUUID(),
          name: cleanedName,
          localName: cleanedLocal !== cleanedName ? cleanedLocal : undefined,
          localLang: (cleanedLocal && cleanedLocal !== cleanedName) ? p.localLang : undefined,
          category: p.category || 'Other',
          emoji: p.emoji,
          addedAt: Date.now(),
          expiresAt: Date.now() + ((p.shelfLifeDays || 7) * 86400000),
          quantity: p.quantity || itemQuantity,
        };
        setInventory(prev => [item, ...prev]);
        selfInsertedIds.current.add(item.id);
        await supabaseService.addItem(item, kitchenId);
      }
    } catch (err) {
      console.error('Confirm fridge add failed:', err);
      alert('Could not save items — check your internet connection.');
    } finally {
      setLoading(false);
    }
  }, [kitchenId, itemQuantity]);

  // ── Confirm: add reviewed shopping items ──────────────────────────────────
  const confirmAddToShoppingList = useCallback(async (items: ConfirmItem[]) => {
    setPendingShoppingItems(null);
    try {
      for (const p of items) {
        const item: ShoppingItem = { id: crypto.randomUUID(), name: p.name, emoji: p.emoji || '🛍️' };
        setShoppingList(prev => [...prev, item]);
        selfInsertedIds.current.add(item.id);
        await supabaseService.addShoppingItem(item, kitchenId);
      }
    } catch (err) {
      console.error('Confirm shopping add failed:', err);
    }
  }, [kitchenId]);

  // ── Update quantity on an existing fridge item ────────────────────────────
  const updateQuantity = useCallback(async (itemId: string, quantity: string) => {
    setInventory(prev => prev.map(x => x.id === itemId ? { ...x, quantity } : x));
    await supabaseService.updateItemQuantity(itemId, quantity);
  }, []);

  const removeItem = async (id: string) => {
    setInventory(prev => prev.filter(x => x.id !== id)); // optimistic
    await supabaseService.removeItem(id);
  };

  const removeFromShoppingList = async (id: string) => {
    setShoppingList(prev => prev.filter(x => x.id !== id)); // optimistic
    await supabaseService.removeShoppingItem(id);
  };

  // ── Shopping list add (Supabase + emoji fetch) ────────────────────────────
  const addShoppingItem = async () => {
    if (!newShoppingItem.trim()) return;
    const name = newShoppingItem.trim();
    const tempId = crypto.randomUUID();
    setShoppingList(prev => [...prev, { id: tempId, name, emoji: '⏳' }]);
    setNewShoppingItem('');
    try {
      const info = await getFoodInfo(name);
      const item: ShoppingItem = { id: tempId, name, emoji: info.emoji || '🛍️' };
      setShoppingList(prev => prev.map(x => x.id === tempId ? item : x));
      selfInsertedIds.current.add(tempId);
      await supabaseService.addShoppingItem(item, kitchenId);
    } catch {
      const fallback: ShoppingItem = { id: tempId, name, emoji: '🛍️' };
      setShoppingList(prev => prev.map(x => x.id === tempId ? fallback : x));
      selfInsertedIds.current.add(tempId);
      await supabaseService.addShoppingItem(fallback, kitchenId);
    }
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

  // Real-time display while holding mic — shows transcript in input
  const handleTranscript = useCallback((text: string, _isFinal: boolean) => {
    setNewItem(text);
  }, []);

  // ─── LANDING PAGE ──────────────────────────────────────────────────────────
  if (view === 'landing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">
        <StrawberryWallpaper />
        <div className="w-full max-w-sm space-y-8 text-center animate-in fade-in duration-700 relative z-10">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-brand-500 rounded-[2rem] mx-auto flex items-center justify-center text-4xl shadow-2xl shadow-brand-500/30 animate-subtle-float">
              🍓
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                The Fridge Whisperer
              </h1>
              <p className="text-slate-500/80 font-semibold mt-2 text-base leading-snug max-w-[260px] mx-auto">
                Your household's shared brain for a zero-waste kitchen.
              </p>
            </div>
          </div>

          <form onSubmit={handleStart} className="bg-white/90 backdrop-blur-md px-6 py-8 rounded-[2.5rem] shadow-soft space-y-6 border border-white">
            <div className="text-left space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-brand-500 uppercase tracking-[0.15em] ml-1">
                  Your Name
                </label>
                <input
                  required
                  placeholder="Amisha, Sharvi..."
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="w-full p-4 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:border-brand-500 transition-all placeholder:text-slate-300 text-base"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-brand-500 uppercase tracking-[0.15em] ml-1">
                  Household ID (Optional)
                </label>
                <input
                  placeholder="Leave blank for new"
                  value={kitchenId}
                  onChange={e => setKitchenId(e.target.value)}
                  className="w-full p-4 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:border-brand-500 transition-all placeholder:text-slate-300 text-base"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-brand-500 text-white font-black rounded-2xl shadow-xl shadow-brand-500/25 active:scale-[0.97] transition-all text-lg hover:bg-brand-600"
            >
              Enter Kitchen
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── DASHBOARD ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#fcfdfc] pb-28">

      {/* Header */}
      <header className="bg-brand-500 text-white pt-12 pb-16 px-5 rounded-header shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-0.5 flex-1 min-w-0 pr-3">
            <h1 className="text-2xl font-extrabold tracking-tight truncate">
              {householdName}
            </h1>
            <p className="text-[11px] font-semibold opacity-70">
              Hi {userName} 👋
            </p>
            <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.15em]">
              ID: {kitchenId}
            </p>
          </div>
          <button
            onClick={() => { setIsSettingsOpen(true); supabaseService.fetchMembers(kitchenId).then(setHouseholdMembers); }}
            className="w-11 h-11 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center transition-all backdrop-blur-md border border-white/20 shadow-lg flex-shrink-0"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white rounded-t-[2.5rem] sm:rounded-[3rem] px-6 py-8 shadow-2xl space-y-6 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto sm:hidden" />

            <div className="space-y-1 text-center">
              <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-xl mx-auto mb-3">🏠</div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Kitchen Heart</h3>
              <p className="text-slate-400 font-bold text-sm">Household Control Center</p>
            </div>

            <div className="space-y-4">

              {/* Household name */}
              <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">
                  Household Name
                </span>
                {editingHouseholdName ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={householdNameInputRef}
                      value={householdNameInput}
                      onChange={e => setHouseholdNameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveHouseholdName(); if (e.key === 'Escape') setEditingHouseholdName(false); }}
                      onBlur={saveHouseholdName}
                      className="flex-1 font-black text-slate-800 text-base bg-white border border-brand-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500"
                      maxLength={32}
                    />
                    <button
                      onMouseDown={e => { e.preventDefault(); saveHouseholdName(); }}
                      className="px-3 py-2 bg-brand-500 text-white rounded-xl font-black text-xs"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-800 text-base truncate">{householdName}</span>
                    <button
                      onClick={startEditingName}
                      className="ml-3 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase bg-slate-100 text-slate-500 hover:bg-brand-50 hover:text-brand-500 transition-all flex-shrink-0"
                    >
                      Rename
                    </button>
                  </div>
                )}
              </div>

              {/* Household members */}
              {householdMembers.length > 0 && (
                <div className="px-4 py-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1.5">
                    Members
                  </span>
                  <p className="text-xs font-bold text-slate-700">
                    {householdMembers.length} {householdMembers.length === 1 ? 'person' : 'people'}{' '}
                    <span className="font-normal text-slate-400">({householdMembers.join(', ')})</span>
                  </p>
                </div>
              )}

              {/* Household key + share */}
              <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-col gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                  Household Key
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-black text-brand-600 text-base tracking-wider truncate">
                    {kitchenId}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className={`px-3 py-2 rounded-xl font-black text-[10px] uppercase transition-all shadow-sm flex-shrink-0 ${copyFeedback ? 'bg-emerald-500 text-white scale-95' : 'bg-brand-500 text-white active:scale-95'}`}
                  >
                    {copyFeedback ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {/* WhatsApp share */}
                <button
                  onClick={shareOnWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white font-black rounded-xl text-sm active:scale-[0.98] transition-all shadow-sm shadow-green-500/20"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Invite on WhatsApp
                </button>
                <p className="text-[9px] font-bold text-slate-400 italic">
                  Share this key so housemates can sync their fridge.
                </p>
              </div>

              {/* Notifications */}
              <div className={`p-4 rounded-2xl border transition-all ${notifPermission === 'granted' ? 'bg-emerald-50 border-emerald-100' : 'bg-indigo-50 border-indigo-100'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${notifPermission === 'granted' ? 'text-emerald-900' : 'text-indigo-900'}`}>
                    {notifPermission === 'granted' ? 'Notifications On' : 'Get Notified?'}
                  </span>
                  {notifPermission === 'granted' ? (
                    <span className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-xl">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                      Enabled
                    </span>
                  ) : notifPermission === 'denied' ? (
                    <span className="px-3 py-2 bg-slate-200 text-slate-500 text-[10px] font-black uppercase rounded-xl">
                      Blocked
                    </span>
                  ) : (
                    <button
                      onClick={requestNotifications}
                      className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-sm active:scale-95 transition-all"
                    >
                      Enable
                    </button>
                  )}
                </div>
                <p className={`text-[9px] mt-1 font-semibold italic ${notifPermission === 'granted' ? 'text-emerald-500' : notifPermission === 'denied' ? 'text-slate-400' : 'text-indigo-400'}`}>
                  {notifPermission === 'granted'
                    ? "You'll be alerted for expiring food & household updates."
                    : notifPermission === 'denied'
                    ? 'Notifications blocked in browser settings.'
                    : 'Get alerts for expiring food & new items.'}
                </p>
              </div>

              <button
                onClick={() => { setIsSettingsOpen(false); openGuide(); }}
                className="w-full py-4 bg-slate-50 text-slate-500 font-black rounded-2xl active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                How to use
              </button>

              <button
                onClick={handleLogout}
                className="w-full py-4 bg-rose-50/50 text-rose-500 font-black rounded-2xl active:scale-[0.98] transition-all text-sm tracking-wide"
              >
                Step out of this Kitchen
              </button>
            </div>

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full py-3 text-slate-300 font-black text-[11px] uppercase tracking-[0.3em] transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 -mt-8 space-y-8 relative z-20">

        {/* ── Add to Fridge bar (two-row mobile layout) ── */}
        <div className="bg-white rounded-[2rem] shadow-soft border border-slate-50 overflow-hidden focus-within:ring-4 focus-within:ring-brand-500/10 transition-all">
          {/* Row 1: voice controls + text input */}
          <div className="flex items-center gap-3 px-5 pt-4 pb-2">
            <VoiceInput
              lang={selectedLang}
              onLangChange={handleLangChange}
              disabled={loading || voiceProcessing}
              onTranscript={handleTranscript}
              onRelease={handleVoiceRelease}
            />
            <input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItemToFridge(newItem)}
              placeholder="Add to fridge..."
              className="flex-1 bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-300 text-base min-w-0"
            />
          </div>
          {/* Row 2: quantity + ADD */}
          <div className="flex items-center gap-2 px-3 pb-3">
            <select
              value={itemQuantity}
              onChange={e => setItemQuantity(e.target.value)}
              className="flex-1 appearance-none bg-slate-50 border-none rounded-xl px-3 py-3 font-bold text-slate-500 text-sm cursor-pointer outline-none"
            >
              {QUANTITY_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
            <button
              onClick={() => addItemToFridge(newItem)}
              disabled={loading || !newItem.trim()}
              className="flex-1 py-3 bg-brand-500 text-white font-black rounded-xl shadow-lg shadow-brand-500/25 active:scale-[0.96] transition-all disabled:opacity-40 text-sm uppercase tracking-widest"
            >
              {loading ? '...' : 'ADD'}
            </button>
          </div>
        </div>

        {/* ── Fridge inventory ── */}
        <div className="space-y-8">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 -mb-4">
            In the fridge
          </h2>
          {Object.entries(groupedInventory).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <h3 className="text-[11px] font-black text-brand-500 uppercase tracking-[0.25em]">{category}</h3>
                <div className="h-[1px] flex-1 bg-slate-100" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.map(item => (
                  <FridgeCard
                    key={item.id}
                    item={item}
                    viewerLang={selectedLang}
                    onRemove={(i) => removeItem(i.id)}
                    onUpdateQuantity={updateQuantity}
                    onMoveToList={async (i) => {
                      setShoppingList(prev => [...prev, { id: i.id, name: i.name, emoji: i.emoji }]);
                      setInventory(prev => prev.filter(x => x.id !== i.id));
                      selfInsertedIds.current.add(i.id);
                      await supabaseService.addShoppingItem({ id: i.id, name: i.name, emoji: i.emoji }, kitchenId);
                      await supabaseService.removeItem(i.id);
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Shopping checklist ── */}
        <div className="space-y-4">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">
            Shopping checklist
          </h2>
          <div className="checklist-glass px-5 py-5 rounded-[2rem] border border-white shadow-soft space-y-4">
            {shoppingList.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <button
                    onClick={() => addItemToFridge(item.name, item.id)}
                    className="w-10 h-10 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center hover:border-brand-500/50 transition-all shadow-sm flex-shrink-0"
                  >
                    <div className="w-4 h-4 rounded-md border-2 border-slate-200" />
                  </button>
                  <span className="font-bold text-slate-800 text-base flex items-center gap-2 truncate">
                    <span className="opacity-80">{item.emoji || '🛍️'}</span>
                    <span className="truncate">{item.name}</span>
                  </span>
                </div>
                {/* Always visible on mobile — no hover-only */}
                <button
                  onClick={() => removeFromShoppingList(item.id)}
                  className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-rose-400 flex-shrink-0 ml-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
              <HoldMicButton
                lang={selectedLang}
                onRelease={handleShoppingVoiceRelease}
              />
              <input
                value={newShoppingItem}
                onChange={e => setNewShoppingItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addShoppingItem()}
                placeholder="Add to shopping list..."
                className="flex-1 bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-300 text-base"
              />
            </div>
          </div>
        </div>
      </main>

      {/* First-visit how-to pill — shown until dismissed */}
      {!guideSeen && !showGuide && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md text-white pl-3 pr-1.5 py-1.5 rounded-full shadow-2xl">
            <span className="text-xs font-semibold whitespace-nowrap text-white/80">New here?</span>
            <button
              onClick={openGuide}
              className="px-3 py-1 bg-brand-500 text-white text-xs font-bold rounded-full whitespace-nowrap active:scale-95 transition-all"
            >
              How to use
            </button>
            <button
              onClick={closeGuide}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 transition-all flex-shrink-0"
            >
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Voice processing toast — shown while Gemini parses the transcript */}
      {voiceProcessing && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[200] pointer-events-none animate-in fade-in duration-200"
          style={{ whiteSpace: 'nowrap', top: 'calc(env(safe-area-inset-top, 16px) + 52px)' }}
        >
          <span className="bg-slate-800/90 text-white text-xs font-black px-4 py-2 rounded-full shadow-xl flex items-center gap-2">
            <svg className="w-3 h-3 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a8 8 0 100 16v-2a6 6 0 010-12z" />
            </svg>
            Analysing items…
          </span>
        </div>
      )}

      {/* How to use modal */}
      {showGuide && <HowToUse onClose={closeGuide} />}

      {/* Voice confirm sheets */}
      {pendingFridgeItems && (
        <VoiceConfirmSheet
          mode="fridge"
          items={pendingFridgeItems}
          onConfirm={confirmAddToFridge}
          onCancel={() => setPendingFridgeItems(null)}
        />
      )}
      {pendingShoppingItems && (
        <VoiceConfirmSheet
          mode="shopping"
          items={pendingShoppingItems}
          onConfirm={confirmAddToShoppingList}
          onCancel={() => setPendingShoppingItems(null)}
        />
      )}

      <BackgroundIcons />
    </div>
  );
}
