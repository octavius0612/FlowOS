import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { 
  Mic, X, Settings, Zap, Award, 
  Layers, CheckCircle2, ArrowUp, Sparkles, 
  Briefcase, Heart, Dumbbell, Coffee, Star, 
  TrendingUp, Fingerprint, MessageCircle, Trash2,
  Globe, ChevronRight
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- CONFIGURATION ---
const APP_NAME = "Flow OS";
const VERSION = "8.0 Genesis Web";
// Clé API intégrée pour la démo
const HARDCODED_API_KEY = "AIzaSyDaJsBfCuPzQejo73TC72_lGCbfB6iLyU8"; 

// --- TEXTES & TRADUCTIONS ---
const TEXTS = {
  fr: {
    welcome: "Bienvenue sur Flow",
    selectLang: "Choisir la langue",
    whatsName: "Comment t'appelles-tu ?",
    namePlace: "Ton prénom...",
    pickHabits: "Choisis tes bases",
    start: "Lancer l'expérience",
    profile: "Profil",
    empty: "Zone vide",
    emptySub: "Ajoute des tâches via l'IA",
    listening: "Je vous écoute...",
    pressToSpeak: "Appuyez pour parler",
    level: "Niveau",
    streak: "Série",
    done: "Fait",
    aiIntro: (name) => `Bonjour ${name} ! Prêt à exploser tes objectifs ?`,
    aiAdded: (count) => `J'ai ajouté ${count} carte(s) au Flow.`,
  },
  en: {
    welcome: "Welcome to Flow",
    selectLang: "Select Language",
    whatsName: "What's your name?",
    namePlace: "Your name...",
    pickHabits: "Pick your habits",
    start: "Start Experience",
    profile: "Profile",
    empty: "Empty Zone",
    emptySub: "Add tasks via AI",
    listening: "Listening...",
    pressToSpeak: "Press to speak",
    level: "Level",
    streak: "Streak",
    done: "Done",
    aiIntro: (name) => `Hello ${name}! Ready to crush your goals?`,
    aiAdded: (count) => `Added ${count} card(s) to Flow.`,
  }
};

const CATEGORIES = {
  Work: { id: 'Work', label: "Work", icon: Briefcase, color: "text-blue-500", gradient: "from-blue-500 to-cyan-500", shadow: "shadow-blue-500/30" },
  Health: { id: 'Health', label: "Health", icon: Dumbbell, color: "text-emerald-500", gradient: "from-emerald-500 to-teal-400", shadow: "shadow-emerald-500/30" },
  Personal: { id: 'Personal', label: "Perso", icon: Heart, color: "text-pink-500", gradient: "from-pink-500 to-rose-400", shadow: "shadow-pink-500/30" },
  Social: { id: 'Social', label: "Social", icon: Coffee, color: "text-orange-500", gradient: "from-orange-500 to-yellow-400", shadow: "shadow-orange-500/30" },
  Other: { id: 'Other', label: "Misc", icon: Star, color: "text-indigo-500", gradient: "from-indigo-500 to-purple-400", shadow: "shadow-indigo-500/30" }
};

const PRESET_HABITS = [
  { id: 'h1', title: "Drink Water", fr: "Boire de l'eau", category: 'Health', xp: 50 },
  { id: 'h2', title: "Read 10 pages", fr: "Lire 10 pages", category: 'Personal', xp: 100 },
  { id: 'h3', title: "Meditation", fr: "Méditation", category: 'Health', xp: 150 },
  { id: 'h4', title: "Check Emails", fr: "Vérifier emails", category: 'Work', xp: 80 },
  { id: 'h5', title: "Call Parents", fr: "Appeler parents", category: 'Social', xp: 200 },
];

// --- UTILS ---
const getStorage = (key, def) => { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
const setStorage = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// --- COMPONENTS ---

const AuroraBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#F2F2F7]">
    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_50%_50%,rgba(0,122,255,0.08),transparent_50%)] animate-[spin_20s_linear_infinite]" />
    <div className="absolute top-[-20%] right-[-20%] w-[100%] h-[100%] bg-[radial-gradient(circle_at_50%_50%,rgba(255,59,48,0.05),transparent_40%)] animate-[pulse_8s_ease-in-out_infinite]" />
    <div className="absolute bottom-[-20%] left-[20%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,rgba(52,199,89,0.05),transparent_40%)]" />
    <div className="absolute inset-0 backdrop-blur-[100px]" />
  </div>
);

// --- ONBOARDING ---
const Onboarding = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState('fr');
  const [name, setName] = useState("");
  const [selectedHabits, setSelectedHabits] = useState([]);

  const t = TEXTS[lang];
  const goNext = () => setStep(s => s + 1);

  const toggleHabit = (habit) => {
    if (selectedHabits.find(h => h.id === habit.id)) {
      setSelectedHabits(prev => prev.filter(h => h.id !== habit.id));
    } else {
      setSelectedHabits(prev => [...prev, { ...habit, title: lang === 'fr' ? habit.fr : habit.title }]);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 relative z-50 justify-center">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="lang" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="text-center space-y-8">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl mx-auto flex items-center justify-center mb-4"><Globe className="text-blue-500" size={48} /></div>
            <h2 className="text-3xl font-black text-slate-900">Select Language</h2>
            <div className="flex gap-4">
              <button onClick={() => { setLang('fr'); goNext(); }} className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:scale-105 transition-all font-bold text-xl">🇫🇷 Français</button>
              <button onClick={() => { setLang('en'); goNext(); }} className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:scale-105 transition-all font-bold text-xl">🇬🇧 English</button>
            </div>
          </motion.div>
        )}
        {step === 1 && (
          <motion.div key="name" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6 text-center">
            <h2 className="text-3xl font-black text-slate-900">{t.whatsName}</h2>
            <input 
              autoFocus value={name} onChange={e => setName(e.target.value)} placeholder={t.namePlace}
              className="w-full bg-white h-16 rounded-2xl px-6 text-xl font-bold outline-none border-2 border-transparent focus:border-blue-500 shadow-sm text-center"
            />
            {name.trim() && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={goNext} className="w-full bg-blue-600 h-14 rounded-2xl text-white font-bold text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                Continue <ChevronRight />
              </motion.button>
            )}
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="habits" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-4 h-full flex flex-col">
            <h2 className="text-2xl font-black text-slate-900 text-center">{t.pickHabits}</h2>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto no-scrollbar flex-1 pb-4">
              {PRESET_HABITS.map(habit => {
                const isSelected = selectedHabits.find(h => h.id === habit.id);
                const Cat = CATEGORIES[habit.category];
                return (
                  <button key={habit.id} onClick={() => toggleHabit(habit)} className={`p-4 rounded-2xl border transition-all duration-200 text-left flex flex-col justify-between h-32 relative overflow-hidden ${isSelected ? 'bg-slate-900 text-white border-transparent scale-[1.02]' : 'bg-white border-slate-200 text-slate-600'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-slate-100'}`}><Cat.icon size={16} /></div>
                    <span className="font-bold text-sm leading-tight">{lang === 'fr' ? habit.fr : habit.title}</span>
                    {isSelected && <div className="absolute top-2 right-2 text-green-400"><CheckCircle2 size={16} /></div>}
                  </button>
                )
              })}
            </div>
            <button onClick={() => onComplete({ lang, name, habits: selectedHabits })} className="w-full bg-slate-900 h-16 rounded-2xl text-white font-bold shadow-lg shrink-0">{t.start} ({selectedHabits.length})</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- ANIMATIONS & COMPONENTS ---

const GenerationLoader = () => (
  <div className="flex items-center justify-center scale-75 sm:scale-100">
    <style>{`
      .loader-wrapper { position: relative; display: flex; align-items: center; justify-content: center; width: 180px; height: 180px; font-family: "Inter", sans-serif; font-size: 1.2em; font-weight: 300; color: white; border-radius: 50%; background-color: transparent; user-select: none; }
      .loader { position: absolute; top: 0; left: 0; width: 100%; aspect-ratio: 1 / 1; border-radius: 50%; background-color: transparent; animation: loader-rotate 2s linear infinite; z-index: 0; }
      @keyframes loader-rotate { 0% { transform: rotate(90deg); box-shadow: 0 10px 20px 0 #fff inset, 0 20px 30px 0 #ad5fff inset, 0 60px 60px 0 #471eec inset; } 50% { transform: rotate(270deg); box-shadow: 0 10px 20px 0 #fff inset, 0 20px 10px 0 #d60a47 inset, 0 40px 60px 0 #311e80 inset; } 100% { transform: rotate(450deg); box-shadow: 0 10px 20px 0 #fff inset, 0 20px 30px 0 #ad5fff inset, 0 60px 60px 0 #471eec inset; } }
      .loader-letter { display: inline-block; opacity: 0.4; transform: translateY(0); animation: loader-letter-anim 2s infinite; z-index: 1; border-radius: 50ch; border: none; font-weight: 800; letter-spacing: 2px; text-shadow: 0 0 10px rgba(255,255,255,0.5); }
      .loader-letter:nth-child(1) { animation-delay: 0s; } .loader-letter:nth-child(2) { animation-delay: 0.1s; } .loader-letter:nth-child(3) { animation-delay: 0.2s; } .loader-letter:nth-child(4) { animation-delay: 0.3s; } .loader-letter:nth-child(5) { animation-delay: 0.4s; } .loader-letter:nth-child(6) { animation-delay: 0.5s; } .loader-letter:nth-child(7) { animation-delay: 0.6s; } .loader-letter:nth-child(8) { animation-delay: 0.7s; } .loader-letter:nth-child(9) { animation-delay: 0.8s; } .loader-letter:nth-child(10) { animation-delay: 0.9s; }
      @keyframes loader-letter-anim { 0%, 100% { opacity: 0.4; transform: translateY(0); } 20% { opacity: 1; transform: scale(1.15); color: #fff; } 40% { opacity: 0.7; transform: translateY(0); } }
    `}</style>
    <div className="loader-wrapper"><span className="loader-letter">G</span><span className="loader-letter">e</span><span className="loader-letter">n</span><span className="loader-letter">e</span><span className="loader-letter">r</span><span className="loader-letter">a</span><span className="loader-letter">t</span><span className="loader-letter">i</span><span className="loader-letter">n</span><span className="loader-letter">g</span><div className="loader"></div></div>
  </div>
);

const QuickSuccess = () => (
  <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
    <style>{`
      .check-path { fill: none; stroke: white; stroke-width: 6; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 100; stroke-dashoffset: 100; animation: dash 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards 0.1s; } @keyframes dash { 100% { stroke-dashoffset: 0; } }
      .burst-particle { position: absolute; top: 50%; left: 50%; width: 6px; height: 20px; background: #4ade80; border-radius: 4px; opacity: 0; animation: burst-out 0.6s cubic-bezier(0.165, 0.84, 0.44, 1) forwards; }
      @keyframes burst-out { 0% { transform: translate(-50%, -50%) rotate(var(--rot)) translateY(0) scale(0); opacity: 1; } 100% { transform: translate(-50%, -50%) rotate(var(--rot)) translateY(120px) scale(1); opacity: 0; } }
    `}</style>
    <motion.div initial={{ scale: 0, opacity: 0.6 }} animate={{ scale: 20, opacity: 0 }} transition={{ duration: 0.8 }} className="absolute w-20 h-20 rounded-full bg-emerald-500/20 backdrop-blur-sm z-0" />
    <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} exit={{ scale: 0, opacity: 0 }} className="relative z-10 w-32 h-32 bg-gradient-to-tr from-emerald-500 to-green-400 rounded-full shadow-[0_10px_40px_-10px_rgba(16,185,129,0.8)] flex items-center justify-center">
      <svg className="w-20 h-20" viewBox="0 0 50 50"><path className="check-path" d="M10 25 L20 35 L40 15" /></svg>
    </motion.div>
    {[...Array(8)].map((_, i) => <div key={i} className="burst-particle" style={{ '--rot': `${i * 45}deg` }} />)}
  </div>
);

const QuickFailure = () => (
  <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
    <style>{`
      .shake-anim { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; } @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
      .trash-particle { position: absolute; top: 50%; left: 50%; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; opacity: 0; animation: trash-burst 0.6s ease-out forwards; }
      @keyframes trash-burst { 0% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; } }
    `}</style>
    <motion.div initial={{ scale: 0, opacity: 0.6 }} animate={{ scale: 20, opacity: 0 }} transition={{ duration: 0.8 }} className="absolute w-20 h-20 rounded-full bg-red-500/20 backdrop-blur-sm z-0" />
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }} className="relative z-10 w-32 h-32 bg-gradient-to-br from-red-500 to-rose-600 rounded-full shadow-[0_10px_40px_-10px_rgba(239,68,68,0.8)] flex items-center justify-center shake-anim">
      <Trash2 size={48} className="text-white drop-shadow-md" strokeWidth={3} />
    </motion.div>
    {[...Array(10)].map((_, i) => <div key={i} className="trash-particle" style={{ '--tx': `${(Math.random()-0.5)*200}px`, '--ty': `${(Math.random()-0.5)*200}px` }} />)}
  </div>
);

const SiriOrb = ({ isListening }) => (
  <div className="relative w-28 h-28 flex items-center justify-center">
    {isListening && (
      <>
        <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-40 mix-blend-screen" />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-2 border-2 border-transparent border-t-white/50 border-b-blue-300/50 rounded-full blur-md" />
      </>
    )}
    <motion.div whileTap={{ scale: 0.9 }} animate={isListening ? { boxShadow: "0 0 30px rgba(59, 130, 246, 0.6)" } : {}} className="relative z-10 w-16 h-16 bg-black/90 backdrop-blur-2xl rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
      <Mic className={`w-6 h-6 transition-colors duration-300 ${isListening ? 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]' : 'text-slate-400'}`} />
    </motion.div>
  </div>
);

const GlowButton = ({ onClick, icon: Icon, active }) => (
  <button onClick={onClick} className={`relative group w-14 h-14 rounded-[1.2rem] flex items-center justify-center transition-all duration-500 ${active ? 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)] scale-110' : 'bg-white/40 hover:bg-white/60'}`}>
    {active && <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-[1.2rem] blur-xl" />}
    <Icon size={22} strokeWidth={active ? 2.5 : 2} className={`relative z-10 transition-colors duration-300 ${active ? 'text-blue-600' : 'text-slate-500'}`} />
  </button>
);

const TaskCard = ({ task, index, onSwipe, lang }) => {
  const x = useMotionValue(0);
  const scale = useTransform(x, [-200, 200], [0.9, 0.9]);
  const rotateZ = useTransform(x, [-200, 200], [-10, 10]);
  const bg = useTransform(x, [-150, 0, 150], ["rgba(255, 240, 240, 0.98)", "rgba(255, 255, 255, 0.95)", "rgba(240, 255, 245, 0.98)"]);
  const shadowColor = useTransform(x, [-150, 0, 150], ["rgba(239, 68, 68, 0.4)", "rgba(0, 0, 0, 0.1)", "rgba(34, 197, 94, 0.4)"]);
  const checkScale = useTransform(x, [50, 150], [0.5, 1.2]);
  const checkOpacity = useTransform(x, [20, 100], [0, 1]);
  const crossScale = useTransform(x, [-50, -150], [0.5, 1.2]);
  const crossOpacity = useTransform(x, [-20, -100], [0, 1]);
  const isTop = index === 0;
  const Category = CATEGORIES[task.category] || CATEGORIES.Other;

  return (
    <motion.div
      style={{ x: isTop ? x : 0, y: isTop ? 0 : index * 8, zIndex: 50 - index, scale: isTop ? 1 : 1 - (index * 0.04), rotateZ: isTop ? rotateZ : 0, opacity: index === 0 ? 1 : 1 - (index * 0.2), backgroundColor: isTop ? bg : 'rgba(255,255,255,0.8)', boxShadow: useTransform(shadowColor, c => `0 15px 40px -10px ${c}`) }}
      drag={isTop ? "x" : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6} dragSnapToOrigin onDragEnd={(e, { offset }) => offset.x > 100 ? onSwipe(task.id, 'done', task.xp) : offset.x < -100 ? onSwipe(task.id, 'skip') : null}
      className={`absolute top-0 w-full h-[460px] rounded-[2rem] border border-white/60 p-6 flex flex-col justify-between origin-bottom backdrop-blur-xl ${isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
         <motion.div style={{ scale: checkScale, opacity: checkOpacity }} className="text-green-500 drop-shadow-2xl"><CheckCircle2 size={100} strokeWidth={3} /></motion.div>
         <motion.div style={{ scale: crossScale, opacity: crossOpacity }} className="text-red-500 drop-shadow-2xl"><Trash2 size={100} strokeWidth={3} /></motion.div>
      </div>
      <div className="flex justify-between items-start relative z-0">
        <div className={`px-3 py-1.5 rounded-full bg-white/50 border border-white/60 flex items-center gap-2 backdrop-blur-md shadow-sm`}>
          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${Category.gradient} flex items-center justify-center text-white shadow-inner`}><Category.icon size={12} /></div>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{Category.label}</span>
        </div>
        <div className="flex flex-col items-end"><span className="text-2xl font-black text-slate-800 tracking-tighter drop-shadow-sm">{task.xp}</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">XP</span></div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-0">
        <motion.div whileHover={{ scale: 1.05, rotate: 5 }} className={`w-28 h-28 rounded-[1.5rem] bg-gradient-to-br ${Category.gradient} flex items-center justify-center shadow-2xl ${Category.shadow} mb-6 text-white relative overflow-hidden group`}>
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Category.icon size={48} strokeWidth={1.5} className="relative z-10 drop-shadow-lg" />
        </motion.div>
        <h3 className="text-3xl font-bold text-slate-900 leading-tight tracking-tight select-none drop-shadow-sm px-2">{task.title}</h3>
      </div>
      <div className="flex justify-between items-center px-4 opacity-30 relative z-0"><X size={24} /><div className="text-[9px] font-bold uppercase tracking-[0.2em]">Flow OS</div><CheckCircle2 size={24} /></div>
    </motion.div>
  );
};

const ChatView = ({ messages, onSendMessage, onVoiceClick }) => {
  const scrollRef = useRef(null);
  const [input, setInput] = useState("");
  useEffect(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-y-auto px-4 pt-16 pb-24 space-y-3 no-scrollbar mask-image-b">
        {messages.map((m) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3.5 text-[14px] leading-relaxed shadow-sm backdrop-blur-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-[1.2rem] rounded-br-none shadow-blue-500/20' : 'bg-white/80 text-slate-800 rounded-[1.2rem] rounded-bl-none border border-white/50'}`}>{m.text}</div>
          </motion.div>
        ))}
        <div ref={scrollRef} />
      </div>
      <div className="absolute bottom-24 left-4 right-4 z-20">
        <div className="backdrop-blur-xl bg-white/80 p-1.5 rounded-[1.8rem] shadow-[0_5px_30px_-5px_rgba(0,0,0,0.1)] border border-white/60 flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onVoiceClick} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-500 transition-colors"><Mic size={18} /></motion.button>
          <form onSubmit={(e) => { e.preventDefault(); if(input.trim()) { onSendMessage(input); setInput(""); } }} className="flex-1 flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Message..." className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 h-10 px-2 font-medium text-sm" />
            {input.trim() && (<motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} type="submit" className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30"><ArrowUp size={18} strokeWidth={3} /></motion.button>)}
          </form>
        </div>
      </div>
    </div>
  );
};

const ProfileView = ({ user, texts }) => (
  <div className="px-5 pt-16 pb-24 space-y-5 overflow-y-auto h-full no-scrollbar">
    <div className="flex justify-between items-end"><h1 className="text-3xl font-bold text-slate-900 tracking-tighter drop-shadow-sm">{texts.profile}</h1></div>
    <div className="relative w-full h-64 rounded-[2rem] bg-black text-white p-6 overflow-hidden shadow-2xl shadow-slate-400/50 group">
      <div className="absolute top-[-50%] right-[-50%] w-[150%] h-[150%] bg-[conic-gradient(from_0deg,transparent_0deg,#4f46e5_120deg,#ec4899_240deg,transparent_360deg)] animate-[spin_10s_linear_infinite] opacity-40 blur-3xl" />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      <div className="relative z-10 h-full flex flex-col justify-between">
         <div className="flex items-start justify-between">
           <div><span className="text-[10px] font-bold text-white/70 uppercase tracking-widest border border-white/10 px-2 py-1 rounded-lg backdrop-blur-md">{texts.level} {user.level}</span><div className="text-6xl font-black mt-2 tracking-tighter tabular-nums bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">{user.xp}</div></div>
           <Award className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" size={32} />
         </div>
         <div>
           <div className="flex justify-between text-xs font-medium mb-2 text-white/80"><span>{texts.level}</span><span>{Math.round((user.xp % 1000) / 10)}%</span></div>
           <div className="h-4 bg-white/10 rounded-full overflow-hidden backdrop-blur-md border border-white/5 shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: `${(user.xp % 1000) / 10}%` }} className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]" /></div>
         </div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white/60 backdrop-blur-xl p-5 rounded-[1.8rem] flex flex-col justify-between h-40 border border-white/50 shadow-lg shadow-slate-200/50">
         <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-inner"><Zap size={20} fill="currentColor" /></div>
         <div><div className="text-3xl font-bold text-slate-800">{user.streak}</div><div className="text-[10px] font-bold text-slate-400 uppercase mt-1">{texts.streak}</div></div>
      </div>
      <div className="bg-white/60 backdrop-blur-xl p-5 rounded-[1.8rem] flex flex-col justify-between h-40 border border-white/50 shadow-lg shadow-slate-200/50">
         <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner"><TrendingUp size={20} /></div>
         <div><div className="text-3xl font-bold text-slate-800">{user.tasksDone}</div><div className="text-[10px] font-bold text-slate-400 uppercase mt-1">{texts.done}</div></div>
      </div>
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---

export default function App() {
  const [onboarded, setOnboarded] = useState(getStorage('flow_onboarded', false));
  const [lang, setLang] = useState(getStorage('flow_lang', 'fr'));
  const [userName, setUserName] = useState(getStorage('flow_name', ''));
  
  const [view, setView] = useState('chat');
  const [showVoice, setShowVoice] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); 
  const [resultAnim, setResultAnim] = useState(null);
  
  const [tasks, setTasks] = useState(getStorage('flow_tasks', []));
  const [user, setUser] = useState(getStorage('flow_user', { xp: 0, level: 1, streak: 0, tasksDone: 0 }));
  const [messages, setMessages] = useState([]);

  // Initialize Chat with name
  useEffect(() => {
    if (onboarded && messages.length === 0) {
      setMessages([{ id: 'init', role: 'ai', text: TEXTS[lang].aiIntro(userName) }]);
    }
  }, [onboarded, userName, lang]);

  // Persist Data
  useEffect(() => setStorage('flow_tasks', tasks), [tasks]);
  useEffect(() => setStorage('flow_user', user), [user]);

  const activeTasks = tasks.filter(t => !t.done && !t.skipped);
  const t = TEXTS[lang];

  const handleOnboardingComplete = (data) => {
    setLang(data.lang); setStorage('flow_lang', data.lang);
    setUserName(data.name); setStorage('flow_name', data.name);
    
    const initialTasks = data.habits.map(h => ({ ...h, id: Math.random().toString(36).substr(2, 9), done: false, skipped: false }));
    setTasks(initialTasks);
    
    setOnboarded(true); setStorage('flow_onboarded', true);
  };

  const processAI = async (text, fromVoice = false) => {
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text }]);
    setIsGenerating(true); 

    try {
      let newTasks = [];
      const genAI = new GoogleGenerativeAI(HARDCODED_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });
      const prompt = `Task extraction. Text: "${text}". Language: "${lang}". Return JSON array: [{"title": "Short title (max 4 words)", "category": "Work/Health/Personal/Social/Other", "xp": 50-300}]. Strict JSON.`;
      const result = await model.generateContent(prompt);
      const json = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
      newTasks = json;

      const formatted = newTasks.map(t => ({ ...t, id: Math.random().toString(36).substr(2, 9), done: false, skipped: false }));
      setTasks(prev => [...formatted, ...prev]);
      setMessages(prev => [...prev, { id: Date.now()+1, role: 'ai', text: t.aiAdded(newTasks.length) }]);
      
      setIsGenerating(false);
      if (fromVoice) setTimeout(() => setView('flow'), 200);

    } catch (e) { 
      console.error(e); 
      setIsGenerating(false);
    }
  };

  const handleSwipe = (id, action, xp) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (action === 'done') {
      setUser(u => ({ ...u, xp: u.xp + xp, tasksDone: u.tasksDone + 1 }));
      setResultAnim('success');
      setTimeout(() => setResultAnim(null), 800);
    } else {
      setResultAnim('failure');
      setTimeout(() => setResultAnim(null), 800);
    }
  };

  const VoiceModeWrapper = ({ onResult, onClose }) => {
    const [isListening, setIsListening] = useState(false);
    const [text, setText] = useState(t.pressToSpeak);
    const textRef = useRef("");
  
    const toggle = () => {
      if(isListening) { setIsListening(false); return; }
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if(!SR) { setText("Not Supported"); return; }
      const r = new SR(); r.lang = lang === 'fr' ? 'fr-FR' : 'en-US'; r.continuous = false; r.interimResults = true;
      r.onstart = () => { setIsListening(true); setText(t.listening); textRef.current = ""; };
      r.onresult = (e) => { const tx = e.results[e.resultIndex][0].transcript; setText(tx); textRef.current = tx; };
      r.onend = () => { setIsListening(false); if(textRef.current.trim().length > 0) { onResult(textRef.current); onClose(); }};
      r.start();
    };
  
    return (
      <div className="flex flex-col items-center">
         <div onClick={toggle} className="cursor-pointer mb-6 hover:scale-105 transition-transform"><SiriOrb isListening={isListening} /></div>
         <h3 className="text-white font-bold text-xl mb-1">{isListening ? t.listening : t.pressToSpeak}</h3>
         <p className="text-white/60 text-center max-w-xs h-8 text-sm">{text}</p>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black font-sans text-slate-900 selection:bg-blue-200">
      <div className="w-full h-[100dvh] sm:h-[850px] sm:max-w-[400px] bg-[#F2F2F7] sm:rounded-[2.5rem] shadow-[0_0_100px_rgba(255,255,255,0.2)] relative overflow-hidden flex flex-col sm:border-[10px] sm:border-slate-900 ring-1 ring-white/10">
        <AuroraBackground />
        
        {!onboarded ? (
          <Onboarding onComplete={handleOnboardingComplete} />
        ) : (
          <>
            <AnimatePresence>
              {isGenerating && (<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-xl flex items-center justify-center"><GenerationLoader /></motion.div>)}
              {showVoice && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 z-50 bg-black/60 backdrop-blur-lg flex flex-col items-center justify-center p-6">
                   <div className="relative"><button onClick={() => setShowVoice(false)} className="absolute top-[-60px] right-0 p-2 bg-white/10 rounded-full text-white"><X /></button><VoiceModeWrapper onResult={(tx) => { setShowVoice(false); processAI(tx, true); }} onClose={() => setShowVoice(false)} /></div>
                </motion.div>
              )}
              {showSettings && (
                 <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center">
                    <div className="bg-white w-[90%] rounded-3xl p-6 relative"><button onClick={() => setShowSettings(false)} className="absolute top-4 right-4"><X /></button><h2 className="text-xl font-bold mb-4">API Key</h2><div className="text-sm text-gray-500">Managed internally</div></div>
                 </motion.div>
              )}
              {resultAnim === 'success' && <QuickSuccess />}
              {resultAnim === 'failure' && <QuickFailure />}
            </AnimatePresence>

            <div className="absolute top-0 w-full h-20 z-30 flex justify-center pt-6 pointer-events-none bg-gradient-to-b from-[#F2F2F7]/90 to-transparent">
               <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase opacity-60">Flow OS</span>
            </div>

            <div className="flex-1 relative z-10 overflow-hidden">
              <AnimatePresence mode="popLayout">
                {view === 'chat' && (
                  <motion.div key="chat" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:1.05}} className="h-full absolute inset-0">
                    <ChatView messages={messages} onSendMessage={(t) => processAI(t, false)} onVoiceClick={() => setShowVoice(true)} texts={t} lang={lang} />
                  </motion.div>
                )}
                {view === 'flow' && (
                  <motion.div key="flow" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full absolute inset-0 flex items-center justify-center p-4 pt-10">
                     {activeTasks.length > 0 ? (
                       <div className="relative w-full max-w-[340px] h-[460px]">
                          <AnimatePresence>
                            {activeTasks.map((task, i) => <TaskCard key={task.id} task={task} index={i} onSwipe={handleSwipe} lang={lang} />)}
                          </AnimatePresence>
                       </div>
                     ) : (
                       <div className="text-center opacity-50 flex flex-col items-center"><div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mb-3 animate-pulse"><Zap size={24} /></div><h3 className="font-bold text-lg">{t.empty}</h3><p className="text-xs">{t.emptySub}</p></div>
                     )}
                  </motion.div>
                )}
                {view === 'profile' && (
                  <motion.div key="profile" initial={{x: '100%'}} animate={{x: 0}} exit={{x: '100%'}} className="h-full absolute inset-0 bg-[#F2F2F7]/50 backdrop-blur-xl">
                    <ProfileView user={user} texts={t} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
               <div className="h-16 px-2 bg-white/70 backdrop-blur-2xl rounded-[2rem] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] border border-white/40 flex items-center gap-2 ring-1 ring-white/50">
                  <GlowButton icon={MessageCircle} active={view === 'chat'} onClick={() => setView('chat')} />
                  <div className="w-px h-6 bg-slate-300/50 mx-1" />
                  <GlowButton icon={Layers} active={view === 'flow'} onClick={() => setView('flow')} />
                  <div className="w-px h-6 bg-slate-300/50 mx-1" />
                  <GlowButton icon={Fingerprint} active={view === 'profile'} onClick={() => setView('profile')} />
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}