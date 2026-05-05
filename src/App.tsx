/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, type ReactNode } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plus, 
  Trash2, 
  Users, 
  LayoutDashboard, 
  BarChart3, 
  Trophy, 
  Shuffle, 
  Palmtree,
  Settings,
  Info,
  Flame,
  Shield,
  Anchor,
  Compass,
  Map as MapIcon,
  Skull,
  Scroll,
  ChevronRight,
  UserCheck,
  Tent,
  Sun,
  Wind,
  Bird,
  Waves,
  Sprout as Flower,
  Mars,
  Venus,
  MoreHorizontal,
  Download,
  Cloud,
  Loader2,
  Check
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Gender = 'Male' | 'Female' | 'Other';
type Category = 'Standard' | 'Supervisor';

interface Player {
  id: string;
  name: string;
  gender: Gender;
  category: Category;
  supervisorName?: string;
}

interface Tribe {
  id: string;
  name: string;
  color: string;
  leader: string;
  playerIds: string[];
}

type View = 'teams' | 'compose' | 'roster' | 'outplay';

// --- Constants ---
const TRIBAL_COLORS = [
  { name: 'Hibiscus Red', value: '#e11d48' },
  { name: 'Lagoon Blue', value: '#0ea5e9' },
  { name: 'Jungle Lush', value: '#16a34a' },
  { name: 'Sunrise Gold', value: '#f97316' },
  { name: 'Orchid Flower', value: '#d946ef' },
  { name: 'Sandy Beach', value: '#fde047' },
  { name: 'Deep Reef', value: '#1e40af' },
];

const GENDERS: Gender[] = ['Male', 'Female', 'Other'];
const CATEGORIES: Category[] = ['Standard', 'Supervisor'];

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [tribes, setTribes] = useState<Tribe[]>(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: crypto.randomUUID(),
      name: `Tribe ${i + 1}`,
      color: TRIBAL_COLORS[i % TRIBAL_COLORS.length].value,
      leader: '',
      playerIds: []
    }));
  });
  const [currentView, setCurrentView] = useState<View>('roster');
  const [rawPlayersInput, setRawPlayersInput] = useState('');
  const [revealSequence, setRevealSequence] = useState<Record<string, number>>({});
  const [revealedCount, setRevealedCount] = useState(0);

  const [isMuted, setIsMuted] = useState(false);

  const audio = useMemo(() => {
    const a = new Audio('https://assets.mixkit.co/music/preview/mixkit-tribal-ritual-558.mp3');
    a.loop = true;
    return a;
  }, []);

  useEffect(() => {
    audio.muted = isMuted;
  }, [isMuted, audio]);

  const generateTribes = () => {
    if (tribes.length === 0 || players.length === 0) return;

    // Create composite buckets for maximum balance
    const buckets: Record<string, Player[]> = {};
    GENDERS.forEach(g => {
      CATEGORIES.forEach(c => {
        buckets[`${g}-${c}`] = players.filter(p => p.gender === g && p.category === c);
      });
    });

    const shuffle = <T,>(array: T[]) => [...array].sort(() => Math.random() - 0.5);
    const shuffledBuckets: Record<string, Player[]> = {};
    Object.keys(buckets).forEach(key => {
      shuffledBuckets[key] = shuffle(buckets[key]);
    });

    const newTribes = tribes.map(t => ({ ...t, playerIds: [] as string[] }));

    let tribeIndex = 0;
    const newSequence: Record<string, number> = {};

    // Distribute from each bucket
    Object.keys(shuffledBuckets).forEach(key => {
      shuffledBuckets[key].forEach(player => {
        newTribes[tribeIndex].playerIds.push(player.id);
        tribeIndex = (tribeIndex + 1) % newTribes.length;
      });
    });

    // Reveal Tribe 1 members first, then Tribe 2...
    newTribes.forEach((tribe, tIdx) => {
      tribe.playerIds.forEach((pId, pIdx) => {
        newSequence[pId] = (tIdx * 100) + pIdx; 
      });
    });

    const sortedIds = Object.keys(newSequence).sort((a, b) => newSequence[a] - newSequence[b]);
    const finalSequence: Record<string, number> = {};
    sortedIds.forEach((id, index) => {
      finalSequence[id] = index;
    });

    setRevealedCount(0);
    setRevealSequence(finalSequence);
    setTribes(newTribes);
    setCurrentView('teams');
  };

  // Reveal Timer effect
  useEffect(() => {
    if (currentView === 'teams' && Object.keys(revealSequence).length > 0) {
      const total = Object.keys(revealSequence).length;
      
      if (revealedCount < total) {
        // Play audio when reveal starts
        audio.play().catch(e => console.warn("Audio play blocked:", e));
      } else {
        // Stop audio when reveal ends
        const fadeOut = setInterval(() => {
          if (audio.volume > 0.1) {
            audio.volume -= 0.1;
          } else {
            audio.pause();
            audio.volume = 1.0;
            clearInterval(fadeOut);
          }
        }, 100);
      }

      const interval = setInterval(() => {
        setRevealedCount(prev => {
          if (prev < total) return prev + 1;
          clearInterval(interval);
          return prev;
        });
      }, 600); // Reveal speed
      
      return () => {
        clearInterval(interval);
      };
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [currentView, revealSequence, revealedCount, audio]);

  const movePlayer = (playerId: string, fromTribeId: string | null, toTribeId: string) => {
    setTribes(prev => prev.map(tribe => {
      if (tribe.id === fromTribeId) {
        return { ...tribe, playerIds: tribe.playerIds.filter(id => id !== playerId) };
      }
      if (tribe.id === toTribeId) {
        return { ...tribe, playerIds: [...tribe.playerIds, playerId] };
      }
      return tribe;
    }));
  };

  const exportToExcel = () => {
    const data = tribes.flatMap(tribe => 
      tribe.playerIds.map((pid, idx) => {
        const p = players.find(player => player.id === pid);
        return {
          'Tribe': tribe.name,
          'Position': idx + 1,
          'Name': p?.name || 'Unknown',
          'Gender': p?.gender || 'Unknown',
          'Supervisor': p?.supervisorName || 'None'
        };
      })
    );

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tribes");
    XLSX.writeFile(workbook, "Survivor_Tribes.xlsx");
  };

  // --- Stats Data ---

  const statsData = useMemo(() => {
    return tribes.map(tribe => {
      const tribePlayers = tribe.playerIds.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[];
      return {
        name: tribe.name,
        total: tribePlayers.length,
        Male: tribePlayers.filter(p => p.gender === 'Male').length,
        Female: tribePlayers.filter(p => p.gender === 'Female').length,
        Other: tribePlayers.filter(p => p.gender === 'Other').length,
        Standard: tribePlayers.filter(p => p.category === 'Standard').length,
        Supervisor: tribePlayers.filter(p => p.category === 'Supervisor').length,
        color: tribe.color
      };
    });
  }, [tribes, players]);

  const genderDistribution = useMemo(() => {
    return GENDERS.map(g => ({
      name: g,
      value: players.filter(p => p.gender === g).length
    })).filter(d => d.value > 0);
  }, [players]);

// --- Components ---

  const KinettixLogo = ({ className, size = 40 }: { className?: string, size?: number }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 400 400" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M100 100 L200 200 L100 300 L50 250 L125 200 L50 150 Z" fill="#0ea5e9" />
      <path d="M220 100 L320 100 L220 200 L170 150 Z" fill="#84cc16" />
      <path d="M220 300 L320 300 L170 200 L220 250 Z" fill="#f97316" />
    </svg>
  );

  const TikiGuard = ({ color }: { color: string }) => (
    <div className="relative w-28 h-44 flex flex-col items-center justify-end group">
      {/* Torch */}
      <div className="absolute -top-6 -left-3 z-20">
        <Flame className="w-10 h-10 text-torch-orange torch-flicker filter drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
        <div className="w-1.5 h-16 bg-[#451a03] mx-auto rounded-full mt-1 border-x border-stone-900" />
      </div>
      
      {/* Decorative Leis/Flowers */}
      <div className="absolute top-1/3 -right-6 z-30 animate-sway opacity-60">
        <Flower className="w-8 h-8 text-hibiscus" />
      </div>
      <div className="absolute top-1/4 -left-6 z-30 animate-sway opacity-40 delay-1000">
        <Flower className="w-6 h-6 text-lagoon" />
      </div>

      {/* Head - More Hawaiian Style */}
      <div className="w-18 h-24 bg-stone-800 rounded-t-3xl border-4 border-stone-900 flex flex-col items-center pt-4 gap-2 relative shadow-2xl overflow-hidden">
         {/* Tribal Markings */}
         <div className="absolute top-0 w-full h-full opacity-10 pointer-events-none">
            <div className="polynesian-pattern w-full h-full" />
         </div>
         
         <div className="absolute -top-3 w-24 flex justify-between px-1">
            <Palmtree className="w-7 h-7 text-emerald-600 -rotate-12" />
            <Palmtree className="w-7 h-7 text-emerald-600 rotate-12" />
         </div>
         
         {/* Glowing Eyes */}
         <div className="flex gap-5 mt-1">
            <div className="w-4 h-4 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.9)]" />
            <div className="w-4 h-4 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.9)]" />
         </div>
         
         {/* Large Mouth */}
         <div className="w-10 h-6 bg-stone-950 rounded-b-xl border-t-2 border-stone-700 flex flex-col items-center justify-center overflow-hidden">
            <div className="flex gap-0.5">
               <div className="w-1 h-3 bg-stone-200/20" />
               <div className="w-1 h-3 bg-stone-200/20" />
               <div className="w-1 h-3 bg-stone-200/20" />
            </div>
         </div>
      </div>
      
      {/* Body */}
      <div className="w-16 h-18 bg-stone-800 border-x-4 border-b-4 border-stone-900 rounded-b-xl flex flex-col items-center p-2 relative">
         <div className="absolute inset-0 flex items-center justify-center opacity-30 mt-2">
            <Shield size={28} style={{ color }} className="animate-pulse" />
         </div>
         <div className="w-full h-1 bg-stone-700/50 rounded-full mt-2" />
         <div className="w-full h-1 bg-stone-700/50 rounded-full mt-1" />
         <div className="w-full h-1 bg-stone-700/50 rounded-full mt-1" />
      </div>
      
      {/* Base/Shadow */}
      <div className="w-24 h-6 bg-black rounded-full blur-md -mb-3 opacity-60" />
    </div>
  );

  const Navigation = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1c1917]/90 backdrop-blur-md border-b border-[#44403c] px-6 py-4 flex items-center justify-between shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="relative">
          <KinettixLogo size={48} className="animate-pulse drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1 -right-1 opacity-20"
          >
             <Flower size={12} className="text-hibiscus" />
          </motion.div>
        </div>
        <div className="flex flex-col">
          <span className="font-display text-2xl text-stone-100 tracking-widest leading-none">KINETTIX SUMMER OUTING 2026</span>
          <span className="font-display text-sm text-stone-500 tracking-[0.3em]">OUTWIT • OUTPLAY • OUTLAST</span>
        </div>
        
        {/* Audio Toggle */}
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="ml-4 p-2 bg-stone-800 rounded-full text-stone-400 hover:text-torch-orange transition-colors"
          title={isMuted ? "Unmute Ritual Music" : "Mute Ritual Music"}
        >
          {isMuted ? <Wind size={20} /> : <Sun className="animate-spin-slow" size={20} />}
        </button>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <NavButton active={currentView === 'roster'} onClick={() => setCurrentView('roster')} icon={<MapIcon size={18} />} label="Roster" />
        <NavButton 
          active={currentView === 'teams'} 
          onClick={() => setCurrentView('teams')} 
          disabled={tribes.length === 0} 
          icon={<Scroll size={18} />} 
          label="Council" 
        />
        <NavButton 
          active={currentView === 'compose'} 
          onClick={() => setCurrentView('compose')} 
          disabled={tribes.length === 0} 
          icon={<Users size={18} />} 
          label="Tribes" 
        />
        <NavButton 
          active={currentView === 'outplay'} 
          onClick={() => setCurrentView('outplay')} 
          disabled={tribes.length === 0} 
          icon={<BarChart3 size={18} />} 
          label="Outplay" 
        />
      </div>
    </nav>
  );

  const NavButton = ({ active, onClick, icon, label, disabled = false }: { active: boolean, onClick: () => void, icon: ReactNode, label: string, disabled?: boolean }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 px-3 md:px-5 py-2 rounded-md transition-all duration-300 font-display text-lg",
        active ? "bg-torch-orange text-[#1c1917] shadow-[0_0_15px_rgba(249,115,22,0.5)]" : "text-stone-500 hover:text-stone-300",
        disabled && "opacity-20 cursor-not-allowed grayscale"
      )}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#0c0a09] font-sans selection:bg-torch-orange selection:text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_#451a03_0%,_transparent_50%)]" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-jungle-dark rounded-full blur-[100px]" />
        <div className="absolute top-40 -right-20 w-80 h-80 bg-torch-red rounded-full blur-[120px]" />
      </div>

      <Navigation />
      
      {/* Large Background Logo Watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden opacity-[0.05]">
         <KinettixLogo size={1000} className="rotate-12 translate-x-20 drop-shadow-[0_0_50px_rgba(14,165,233,0.3)]" />
      </div>
      
      <main className="max-w-7xl mx-auto px-6 relative z-10">
        <AnimatePresence mode="wait">
          {currentView === 'roster' && (
            <motion.div 
              key="roster"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-8"
            >
              {/* Tribe Setup */}
              <section className="lg:col-span-2 hawaiian-card p-10 group relative border-ocean-blue/20">
                <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                  <div className="polynesian-pattern w-full h-full" />
                </div>
                <div className="absolute -bottom-6 -right-6 opacity-30 group-hover:opacity-50 transition-opacity">
                   <TikiGuard color="#0ea5e9" />
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Flower size={64} className="text-hibiscus animate-sway" />
                </div>
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-lagoon to-transparent" />
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <h2 className="tribal-header text-4xl flex items-center gap-3">
                    <Bird className="text-hibiscus" /> TRIBES
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <label className="text-[10px] font-display text-stone-600 tracking-widest uppercase">Count</label>
                      <input 
                        type="number"
                        min="1"
                        max="20"
                        value={tribes.length}
                        onChange={(e) => {
                          const count = Math.max(1, parseInt(e.target.value) || 0);
                          if (count > tribes.length) {
                            const newTribes = [...tribes];
                            for (let i = tribes.length; i < count; i++) {
                              newTribes.push({ 
                                id: crypto.randomUUID(), 
                                name: `Tribe ${i + 1}`, 
                                color: TRIBAL_COLORS[i % TRIBAL_COLORS.length].value, 
                                leader: '', 
                                playerIds: [] 
                              });
                            }
                            setTribes(newTribes);
                          } else if (count < tribes.length) {
                            setTribes(tribes.slice(0, count));
                          }
                        }}
                        className="w-16 bg-stone-950 border-2 border-stone-800 text-lagoon font-display text-2xl text-center rounded-xl focus:outline-none focus:border-lagoon shadow-inner"
                      />
                    </div>
                    <button 
                      onClick={() => setTribes([...tribes, { id: crypto.randomUUID(), name: `Tribe ${tribes.length + 1}`, color: TRIBAL_COLORS[tribes.length % TRIBAL_COLORS.length].value, leader: '', playerIds: [] }])}
                      className="p-4 bg-stone-800 text-lagoon border-2 border-stone-700 rounded-2xl hover:bg-stone-700 transition-all hover:scale-110 active:scale-95 shadow-lg"
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                  {tribes.map((tribe) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={tribe.id}
                      className="p-6 rounded-2xl bg-stone-950/40 border-2 border-stone-800 flex items-center gap-5 group/item hover:border-stone-700 transition-all shadow-md"
                    >
                      <input 
                        type="color"
                        value={tribe.color}
                        onChange={(e) => setTribes(tribes.map(t => t.id === tribe.id ? { ...t, color: e.target.value } : t))}
                        className="w-12 h-12 rounded-full cursor-pointer bg-transparent border-4 border-stone-800 shadow-lg"
                      />
                      <div className="flex-grow grid grid-cols-1 gap-1">
                        <input 
                          placeholder="Tribe Name"
                          value={tribe.name}
                          onChange={(e) => setTribes(tribes.map(t => t.id === tribe.id ? { ...t, name: e.target.value } : t))}
                          className="bg-transparent font-display text-2xl text-stone-100 border-b border-stone-800/50 focus:border-lagoon focus:outline-none placeholder:text-stone-800 transition-colors"
                        />
                        <div className="flex items-center gap-2">
                           <Shield size={12} className="text-stone-600" />
                           <input 
                             placeholder="Tribe Leader"
                             value={tribe.leader}
                             onChange={(e) => setTribes(tribes.map(t => t.id === tribe.id ? { ...t, leader: e.target.value } : t))}
                             className="bg-transparent text-sm text-stone-600 border-b border-transparent focus:border-stone-800 focus:outline-none placeholder:text-stone-800 font-hand text-lg"
                           />
                        </div>
                      </div>
                      <button 
                        onClick={() => setTribes(tribes.filter(t => t.id !== tribe.id))}
                        className="text-stone-800 hover:text-hibiscus transition-colors p-2"
                      >
                        <Trash2 size={24} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Player Log */}
              <section className="lg:col-span-3 hawaiian-card p-10 border-hibiscus/20 overflow-visible">
                <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                  <div className="polynesian-pattern w-full h-full" />
                </div>
                <div className="absolute -top-12 -right-12 p-10 opacity-10 -rotate-12 pointer-events-none">
                  <Palmtree size={300} className="text-emerald-500 animate-sway" />
                </div>
                <div className="absolute -bottom-10 -left-10 opacity-10 pointer-events-none">
                   <Waves size={180} className="text-ocean-blue" />
                </div>
                
                <h2 className="tribal-header text-4xl mb-10 flex items-center gap-4 relative z-10">
                  <Waves className="text-ocean-blue" /> TRIBE APPLICANTS
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10 relative z-10">
                  <div className="flex flex-col">
                    <textarea 
                      placeholder="Input castaways (Name, Gender, Supervisor)..."
                      className="w-full h-56 px-5 py-4 bg-stone-950/80 text-stone-100 rounded-[2rem] border-4 border-stone-800 focus:border-lagoon focus:outline-none font-mono text-base shadow-inner resize-none transition-colors backdrop-blur-sm"
                      value={rawPlayersInput}
                      onChange={(e) => setRawPlayersInput(e.target.value)}
                    />
                      <div className="flex flex-col gap-4 mt-6">
                        <button 
                          onClick={() => {
                            const lines = rawPlayersInput.split('\n').filter(l => l.trim().includes(','));
                            const newPlayers = lines.map(line => {
                              const parts = line.split(',').map(p => p.trim());
                              const name = parts[0];
                              const genderStr = parts[1]?.toUpperCase() || '';
                              const extra1 = parts[2] || '';
                              const extra2 = parts[3] || '';
                              
                              let gender: Gender = 'Other';
                              if (genderStr === 'M' || genderStr === 'MALE') gender = 'Male';
                              else if (genderStr === 'F' || genderStr === 'FEMALE') gender = 'Female';
                              
                              let category: Category = 'Standard';
                              let supervisorName = '';

                              const low1 = extra1.toLowerCase();
                              if (['supervisor', 's', 'sup'].includes(low1)) {
                                category = 'Supervisor';
                                supervisorName = extra2; // Name is in the 4th column
                              } else if (['standard', 'std', 'normal'].includes(low1)) {
                                category = 'Standard';
                                supervisorName = extra2;
                              } else {
                                // Default: 3rd column is the supervisor name
                                supervisorName = extra1;
                              }
                              
                              return { id: crypto.randomUUID(), name, gender, category, supervisorName };
                            });
                            setPlayers([...players, ...newPlayers]);
                            setRawPlayersInput('');
                          }}
                          className="w-full py-5 bg-stone-800/90 border-2 border-stone-700 text-stone-100 font-display text-2xl tracking-[0.2em] rounded-[1.5rem] hover:bg-stone-700 hover:border-lagoon hover:text-lagoon transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95 group/btn"
                        >
                          <Plus size={32} className="text-lagoon group-hover/btn:rotate-90 transition-transform" /> INITIATE BOARDING
                        </button>
                      </div>
                  </div>

                  <div className="bg-stone-950/40 p-8 rounded-[2rem] border-4 border-stone-800 flex flex-col h-full shadow-2xl relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute -top-10 -right-10 opacity-5">
                       <Flower size={150} className="text-hibiscus" />
                    </div>
                    <div className="flex items-center justify-between mb-6 border-b-2 border-stone-800 pb-4 relative z-10">
                       <div className="flex items-center gap-4">
                         <span className="font-display text-stone-500 tracking-[0.2em] text-sm">TOTAL CASTAWAYS</span>
                         <span className="font-display text-4xl text-lagoon drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]">{players.length}</span>
                       </div>
                       {players.length > 0 && (
                         <button 
                           onClick={() => setPlayers([])}
                           className="text-stone-600 hover:text-hibiscus font-display text-xs tracking-widest flex items-center gap-2 transition-colors uppercase bg-stone-900/50 px-3 py-1.5 rounded-full border border-stone-800"
                         >
                           <Trash2 size={14} /> Clear
                         </button>
                       )}
                    </div>
                    <div className="flex-grow max-h-[14rem] overflow-y-auto pr-3 custom-scrollbar flex flex-wrap gap-3 relative z-10">
                      {players.length === 0 ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-700 border-2 border-dashed border-stone-800 rounded-xl py-10">
                           <Anchor size={48} className="mb-4 opacity-50" />
                           <p className="font-display text-xl tracking-widest">NO CASTAWAYS ON BOARD</p>
                        </div>
                      ) : (
                        players.map(player => (
                          <motion.div 
                            initial={{ scale: 0, rotate: -5 }}
                            animate={{ scale: 1, rotate: 0 }}
                            key={player.id} 
                            className="group inline-flex items-center gap-3 px-4 py-2 bg-stone-900/80 border-2 border-stone-800 rounded-xl text-sm hover:border-lagoon transition-all shadow-md backdrop-blur-sm"
                          >
                            <div className={cn(
                              "w-2.5 h-2.5 rounded-full shrink-0",
                              player.gender === 'Male' ? "bg-ocean-blue" : player.gender === 'Female' ? "bg-hibiscus" : "bg-stone-500 shadow-[0_0_5px_rgba(255,255,255,0.2)]"
                            )} />
                            <div className="flex flex-col">
                              <span className="font-display text-lg text-stone-100 leading-tight">{player.name}</span>
                              <span className={cn(
                                "text-[9px] font-display tracking-widest uppercase mt-0.5",
                                player.category === 'Supervisor' ? "text-sand" : "text-emerald-400"
                              )}>
                                 {player.supervisorName || player.category}
                              </span>
                            </div>
                            <button 
                              onClick={() => setPlayers(players.filter(p => p.id !== player.id))}
                              className="text-stone-700 hover:text-hibiscus opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mt-12 pb-4">
                  <button 
                    disabled={players.length === 0 || tribes.length === 0}
                    onClick={generateTribes}
                    className="relative group disabled:opacity-30 disabled:grayscale transition-all"
                  >
                    <div className="absolute -inset-2 bg-lagoon blur-xl opacity-20 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                    <div className="relative px-16 py-8 bg-stone-950 border-4 border-stone-800 rounded-full transform transition hover:scale-105 active:scale-95 flex items-center gap-6 shadow-2xl hover:border-lagoon">
                      <Flame className="text-lagoon group-hover:animate-pulse" size={36} />
                      <span className="font-display text-4xl text-stone-100 tracking-[0.3em]">START RITUAL</span>
                    </div>
                  </button>
                </div>
              </section>
            </motion.div>
          )}

          {currentView === 'teams' && (
            <motion.div 
              key="teams"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-h-[70vh] flex flex-col items-center relative"
            >
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                <Waves className="absolute top-10 left-10 w-64 h-64 text-ocean-blue rotate-12" />
                <Waves className="absolute bottom-10 right-10 w-64 h-64 text-lagoon -rotate-12" />
                <Bird className="absolute top-1/2 left-1/4 w-32 h-32 text-hibiscus animate-sway" />
              </div>

              <div className="flex flex-col items-center text-center gap-2 mb-10 relative z-10">
                <div className="flex items-center gap-4 mb-2">
                   <Flower className="text-hibiscus animate-pulse" size={32} />
                   <h2 className="font-display text-5xl text-stone-100 tracking-[0.2em] drop-shadow-xl">
                      ALOHA TRIBES
                   </h2>
                   <Flower className="text-hibiscus animate-pulse" size={32} />
                </div>
                <p className="font-hand text-2xl text-sand italic">
                  "The spirits of the islands have spoken. May your journey be fruitful."
                </p>

                <div className="mt-8 flex gap-4">
                  <button 
                    onClick={exportToExcel}
                    disabled={revealedCount < Object.keys(revealSequence).length}
                    className="px-10 py-4 rounded-full bg-stone-900/80 backdrop-blur-sm border-2 border-stone-700 text-stone-300 font-display tracking-[0.2em] text-sm flex items-center gap-3 hover:bg-stone-800 hover:border-lagoon hover:text-lagoon transition-all shadow-xl active:scale-95"
                  >
                    <Download size={20} /> SYNC TO SCROLL (EXCEL)
                  </button>
                </div>
              </div>
              
              <div className={cn(
                "w-full transition-all duration-1000 ease-in-out relative z-10",
                revealedCount >= Object.keys(revealSequence).length 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-start px-4" 
                  : "flex items-center justify-center p-4 md:p-12"
              )}>
                {(() => {
                  const totalToReveal = Object.keys(revealSequence).length;
                  const isAllRevealed = revealedCount >= totalToReveal && totalToReveal > 0;
                  const currentRevealingPlayerId = Object.keys(revealSequence).find(id => revealSequence[id] === revealedCount);
                  const activeTribeId = tribes.find(t => t.playerIds.includes(currentRevealingPlayerId || ''))?.id;
                  
                  const tribesToDisplay = isAllRevealed ? tribes : tribes.filter(t => t.id === activeTribeId);

                  return tribesToDisplay.map((tribe) => {
                    const revealedInTribe = tribe.playerIds.filter(id => (revealSequence[id] ?? 0) <= revealedCount);
                    const isFinished = revealedInTribe.length === tribe.playerIds.length && tribe.playerIds.length > 0 && isAllRevealed;
                    const currentRevealingId = Object.keys(revealSequence).find(id => revealSequence[id] === revealedCount);
                    const isActiveTribe = tribe.playerIds.includes(currentRevealingId || '');

                    return (
                      <motion.div 
                        layout
                        initial={{ scaleX: 0, scaleY: 0.02, opacity: 0 }}
                        animate={
                          isActiveTribe && !isAllRevealed
                            ? { 
                                scaleX: 1, 
                                scaleY: [0.02, 0.02, 1], 
                                opacity: 1,
                                boxShadow: `0 0 80px ${tribe.color}40`,
                                zIndex: 20
                              }
                            : { 
                                scaleX: 1, 
                                scaleY: 1, 
                                opacity: 1,
                                scale: isFinished ? 0.95 : 1,
                                boxShadow: isFinished ? '0 10px 30px -10px rgba(0,0,0,0.5)' : `0 0 40px ${tribe.color}10`,
                                zIndex: 10
                              }
                        }
                        transition={{ 
                          duration: 1.2,
                          times: [0, 0.4, 1],
                          ease: [0.22, 1, 0.36, 1]
                        }}
                        key={tribe.id} 
                        className={cn(
                          "hawaiian-card flex flex-col group border-4 h-full relative overflow-hidden transition-all duration-700",
                          !isAllRevealed ? "w-full max-w-4xl min-h-[550px]" : "w-full max-w-lg min-h-[280px]",
                          isActiveTribe ? "shadow-2xl scale-[1.02]" : "shadow-lg opacity-90"
                        )}
                        style={{ 
                          borderColor: tribe.color,
                          boxShadow: isActiveTribe ? `0 0 60px ${tribe.color}55` : `0 0 20px ${tribe.color}22`
                        }}
                      >
                      <AnimatePresence>
                        {isActiveTribe && !isAllRevealed && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.2, 0] }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-0 bg-stone-100 mix-blend-overlay pointer-events-none z-50"
                          />
                        )}
                      </AnimatePresence>
                      {/* Decorative Background Elements */}
                      <div className="absolute -bottom-8 -right-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none -rotate-12">
                         <TikiGuard color={tribe.color} />
                      </div>
                      <div className="absolute -top-10 -right-10 opacity-[0.05] pointer-events-none rotate-45">
                         <Palmtree size={200} style={{ color: tribe.color }} />
                      </div>
                      {isActiveTribe && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 bg-gradient-to-b from-transparent via-torch-orange/5 to-transparent pointer-events-none"
                        />
                      )}
                      <div className="absolute top-0 left-0 w-full h-2 opacity-20 pointer-events-none" style={{ background: `repeating-linear-gradient(90deg, ${tribe.color}, ${tribe.color} 5px, transparent 5px, transparent 10px)` }} />
                      
                      <div className="p-6 border-b border-stone-800 bg-stone-900/60 relative z-10 flex items-center justify-between">
                         <div>
                            <h3 className="font-display text-3xl text-stone-100 uppercase tracking-widest flex items-center gap-3">
                               <Waves size={20} style={{ color: tribe.color }} />
                               {tribe.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-sand font-hand text-xl italic">
                               <Shield size={16} />
                               <span>Leader: {tribe.leader || 'The Island Spirits'}</span>
                            </div>
                         </div>
                         <div className="p-3 rounded-full bg-stone-950 border border-stone-800">
                            <Bird size={24} style={{ color: tribe.color }} />
                         </div>
                      </div>

                      <div className="flex-grow p-4 relative z-10">
                         <div className="grid grid-cols-3 gap-2 relative">
                            <AnimatePresence mode="popLayout">
                              {tribe.playerIds.map(id => {
                                const player = players.find(p => p.id === id);
                                if (!player) return null;
                                const seqIndex = revealSequence[id] ?? 0;
                                if (seqIndex > revealedCount) return null;
                                
                                return (
                                  <motion.div 
                                    key={id}
                                    initial={{ scale: 0, opacity: 0, filter: "blur(10px)" }}
                                    animate={{ 
                                      scale: 1, 
                                      opacity: 1, 
                                      filter: "blur(0px)",
                                    }}
                                    transition={{
                                      type: "spring",
                                      damping: 15,
                                      stiffness: 200,
                                      mass: 0.8
                                    }}
                                    className={cn(
                                      "relative p-3 bg-stone-800/80 rounded border-2 border-stone-700 shadow-xl group/token overflow-hidden flex items-center justify-center transition-all",
                                      isFinished ? "min-h-[50px]" : "min-h-[65px]",
                                      seqIndex === revealedCount && "ring-2 ring-torch-orange animate-pulse"
                                    )}
                                  >
                                     <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-stone-400/20 to-transparent" />
                                     
                                     <div className="relative z-10 flex flex-col items-center text-center">
                                        <div className="flex items-center gap-2">
                                           <span className={cn(
                                             "font-display text-stone-100 tracking-tight leading-none",
                                             isFinished ? "text-base" : "text-xl"
                                           )}>{player.name}</span>
                                           {player.gender === 'Male' ? (
                                             <Mars size={isFinished ? 14 : 18} className="text-sky-400" />
                                           ) : player.gender === 'Female' ? (
                                             <Venus size={isFinished ? 14 : 18} className="text-rose-400" />
                                           ) : (
                                             <MoreHorizontal size={isFinished ? 14 : 18} className="text-stone-400" />
                                           )}
                                        </div>
                                        <span className={cn(
                                          "font-display text-stone-500 uppercase tracking-[0.2em] mt-1 opacity-80 line-clamp-1",
                                          isFinished ? "text-[10px]" : "text-xs"
                                        )}>
                                          {player.supervisorName ? `${player.supervisorName}` : player.category}
                                        </span>
                                     </div>

                                     {/* Energetic reveal effect */}
                                     {seqIndex === revealedCount && (
                                       <motion.div
                                          initial={{ width: 0, opacity: 0 }}
                                          animate={{ 
                                            width: ["0%", "100%", "0%"],
                                            opacity: [0, 0.4, 0],
                                            left: ["0%", "0%", "100%"]
                                          }}
                                          transition={{ duration: 0.8, ease: "easeInOut" }}
                                          className="absolute inset-x-0 h-full bg-stone-100 mix-blend-overlay pointer-events-none"
                                       />
                                     )}

                                     <div className="absolute inset-0 bg-[#0c0a09]/95 flex items-center justify-center opacity-0 group-hover/token:opacity-100 transition-opacity p-2">
                                        <select 
                                          value={tribe.id}
                                          onChange={(e) => movePlayer(id, tribe.id, e.target.value)}
                                          className="bg-transparent text-[10px] text-stone-300 font-display uppercase tracking-widest border border-stone-800 w-full focus:ring-0 cursor-pointer"
                                        >
                                          {tribes.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                          ))}
                                        </select>
                                     </div>
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>
                         </div>
                      </div>
                      </motion.div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          )}

          {currentView === 'compose' && (
            <motion.div 
              key="compose"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-12 pb-20"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col">
                  <h2 className="font-display text-6xl text-stone-100 tracking-widest drop-shadow-2xl">ISLAND SCROLLS</h2>
                  <div className="flex items-center gap-2 mt-2">
                     <Waves className="text-ocean-blue" size={20} />
                     <span className="font-hand text-2xl text-sand italic">"The rosters are set. The challenge awaits."</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => window.print()} 
                    className="p-4 bg-stone-800 border-2 border-stone-700 text-lagoon rounded-full hover:scale-110 shadow-lg hover:border-lagoon transition-all"
                    title="Print Tribal Decree"
                  >
                    <Scroll size={28} />
                  </button>
                  <button 
                    onClick={exportToExcel}
                    className="px-8 py-4 bg-lagoon text-[#064e3b] font-display text-xl tracking-widest rounded-full shadow-xl hover:bg-ocean-blue transition-all flex items-center gap-3 hover:scale-105 active:scale-95"
                  >
                    <Download size={24} /> DOWNLOAD SCROLL (EXCEL)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {tribes.map((tribe, tIdx) => (
                  <motion.div 
                    key={tribe.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: tIdx * 0.1 }}
                    className="relative p-1 bg-[#fef3c7] shadow-[15px_15px_0px_#1c1917] rotate-1 hover:rotate-0 transition-all group"
                  >
                    {/* Paper Texture Overlay */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/handmade-paper.png")' }} />
                    
                    {/* Tropical Flower Decoration */}
                    <div className="absolute -top-6 -right-6 z-20 group-hover:scale-125 transition-transform duration-500">
                       <Flower className="w-12 h-12 text-hibiscus drop-shadow-lg" />
                    </div>
                    
                    <div className="bg-transparent p-10 border-4 border-stone-300 relative overflow-hidden">
                      {/* Faded Tribal Pattern */}
                      <div className="absolute inset-0 opacity-5 pointer-events-none polynesian-pattern" />
                      
                      <div className="border-b-4 border-stone-900 pb-4 mb-8 text-center relative z-10">
                        <div className="flex items-center justify-center gap-3 mb-2">
                           <Waves style={{ color: tribe.color }} size={24} />
                           <h3 className="font-display text-4xl text-stone-900 tracking-tighter uppercase">{tribe.name}</h3>
                           <Waves style={{ color: tribe.color }} size={24} />
                        </div>
                        <p className="font-hand text-2xl text-stone-600 font-bold tracking-wide italic">"Led by {tribe.leader || 'The Elders'}"</p>
                      </div>
                      
                      <ul className="space-y-6 relative z-10 px-2">
                        {tribe.playerIds.map((id, index) => {
                          const player = players.find(p => p.id === id);
                          return (
                            <li key={id} className="flex items-center gap-5 border-b-2 border-stone-400/30 pb-3 h-16 group/item">
                              <span className="font-display text-stone-400 text-2xl self-start mt-1 group-hover/item:text-stone-900 transition-colors">{(index + 1).toString().padStart(2, '0')}</span>
                              <div className="flex flex-col flex-grow">
                                <div className="flex items-center gap-3">
                                  <span className="font-display text-2xl text-stone-900 tracking-tight leading-none">{player?.name}</span>
                                  <div className="flex gap-1 opacity-60">
                                    {player?.gender === 'Male' ? (
                                      <Mars size={18} className="text-ocean-blue" />
                                    ) : player?.gender === 'Female' ? (
                                      <Venus size={18} className="text-hibiscus" />
                                    ) : (
                                      <MoreHorizontal size={18} className="text-stone-500" />
                                    )}
                                  </div>
                                </div>
                                <span className="font-display text-xs text-stone-600 uppercase tracking-widest leading-none mt-2 flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tribe.color }} />
                                  {player?.supervisorName ? `${player.supervisorName}` : player?.category}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      
                      {/* Bottom Decoration */}
                      <div className="mt-10 flex justify-center opacity-30">
                         <Bird size={32} className="text-stone-900" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {currentView === 'outplay' && (
            <motion.div 
              key="outplay"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              <div className="flex flex-col gap-2">
                <h2 className="font-display text-5xl text-stone-100 tracking-widest">OUTWIT / OUTPLAY</h2>
                <div className="flex items-center gap-3 text-stone-500">
                  <BarChart3 size={20} />
                   <span className="uppercase tracking-[0.3em] text-xs">Island Balance Metrics</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Tribe Balance Chart */}
                <div className="survivor-card p-10">
                  <h3 className="font-display text-2xl text-stone-100 mb-8 flex items-center gap-4">
                    <Shield size={24} className="text-torch-orange" /> POWER DISTRIBUTION
                  </h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statsData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#292524" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={{ stroke: '#292524' }} 
                          tick={{ fill: '#78716c', fontFamily: 'Staatliches', fontSize: 16 }} 
                        />
                        <YAxis 
                          axisLine={{ stroke: '#292524' }} 
                          tick={{ fill: '#78716c', fontFamily: 'monospace' }} 
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                          contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '4px', color: '#d6d3d1' }}
                        />
                        <Legend iconType="rect" />
                        <Bar name="Male" dataKey="Male" stackId="a" fill="#0369a1" />
                        <Bar name="Female" dataKey="Female" stackId="a" fill="#9f1239" />
                        <Bar name="Other Gender" dataKey="Other" stackId="a" fill="#44403c" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category Distribution Chart */}
                <div className="survivor-card p-10">
                  <h3 className="font-display text-2xl text-stone-100 mb-8 flex items-center gap-4">
                    <Sun size={24} className="text-amber-500" /> CATEGORY DISTRIBUTION
                  </h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statsData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#292524" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={{ stroke: '#292524' }} 
                          tick={{ fill: '#78716c', fontFamily: 'Staatliches', fontSize: 16 }} 
                        />
                        <YAxis 
                          axisLine={{ stroke: '#292524' }} 
                          tick={{ fill: '#78716c', fontFamily: 'monospace' }} 
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                          contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '4px', color: '#d6d3d1' }}
                        />
                        <Legend iconType="rect" />
                        <Bar name="Standard" dataKey="Standard" stackId="role" fill="#10b981" />
                        <Bar name="Supervisor" dataKey="Supervisor" stackId="role" fill="#b45309" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Overall Roster Pie */}
                <div className="survivor-card p-10">
                  <h3 className="font-display text-2xl text-stone-100 mb-8 flex items-center gap-4">
                    <Users size={24} className="text-torch-orange" /> GENDER EQUITY SCAN
                  </h3>
                  <div className="h-[400px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderDistribution}
                          innerRadius={110}
                          outerRadius={150}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          {genderDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === 'Male' ? '#0369a1' : entry.name === 'Female' ? '#9f1239' : '#44403c'} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <span className="font-display text-4xl text-stone-800">{players.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Tribe Insights */}
              <div className="space-y-6">
                <h3 className="font-display text-3xl text-stone-100 tracking-widest border-b border-[#292524] pb-4">TRIBAL VITAL SIGNS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {statsData.map((tribeStat, idx) => (
                    <motion.div 
                      key={tribeStat.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      viewport={{ once: true }}
                      className="p-6 bg-stone-900/50 border border-[#292524] rounded-lg relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 opacity-5 rotate-12 -mr-4 -mt-4">
                        <Flame size={64} style={{ color: tribeStat.color }} />
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-display text-2xl text-stone-100 uppercase tracking-tighter" style={{ color: tribeStat.color }}>{tribeStat.name}</h4>
                        <span className="bg-stone-800 text-stone-400 px-2 py-0.5 rounded text-[10px] font-mono">ID: {idx + 1}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-stone-500 uppercase tracking-widest">Strength</span>
                          <span className="text-2xl font-display text-stone-200">{tribeStat.total}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-stone-500 uppercase tracking-widest">Ratio</span>
                          <span className="text-sm font-display text-stone-400">
                             {tribeStat.Male}M / {tribeStat.Female}F
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-1 h-1 rounded-full overflow-hidden">
                        <div style={{ width: `${(tribeStat.Male / tribeStat.total) * 100}%`, backgroundColor: '#0369a1' }} />
                        <div style={{ width: `${(tribeStat.Female / tribeStat.total) * 100}%`, backgroundColor: '#9f1239' }} />
                        <div style={{ width: `${(tribeStat.Other / tribeStat.total) * 100}%`, backgroundColor: '#44403c' }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Wisdom Section */}
              <div className="bg-stone-900 border-l-8 border-torch-orange p-10 flex gap-8 items-center shadow-2xl">
                <div className="p-5 bg-stone-800 border border-stone-700 rounded-full">
                   <Info size={40} className="text-torch-orange" />
                </div>
                <div>
                  <h4 className="font-display text-3xl text-stone-100 tracking-widest mb-3">THE ANCIENT ALGORITHM</h4>
                  <p className="font-hand text-2xl text-stone-500 italic max-w-3xl leading-relaxed">
                    "Balance is key to survival. We cluster each gender identity then rotate them through the tribes. No tribe shall carry more weight than another. Equality is the seed of true competition."
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0c0a09;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #44403c;
          border-radius: 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #f97316;
        }

        @media print {
          nav { display: none !important; }
          .min-h-screen { background: white !important; pt: 0 !important; }
          .survivor-card { border: none !important; box-shadow: none !important; background: white !important; }
          .text-stone-100 { color: black !important; }
          .text-stone-500 { color: #666 !important; }
          .bg-stone-900 { background: white !important; border: 1px solid #eee !important; }
        }
      ` }} />
    </div>
  );
}
