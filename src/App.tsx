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
  { name: 'Volcanic Red', value: '#991b1b' },
  { name: 'Jungle Teal', value: '#0d9488' },
  { name: 'Solar Orange', value: '#ea580c' },
  { name: 'Lagoon Blue', value: '#0369a1' },
  { name: 'Forest Green', value: '#14532d' },
  { name: 'Bamboo Yellow', value: '#b45309' },
  { name: 'Spirit Purple', value: '#7e22ce' },
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

  const TikiGuard = ({ color }: { color: string }) => (
    <div className="relative w-24 h-40 flex flex-col items-center justify-end group">
      {/* Torch */}
      <div className="absolute -top-4 -left-2 z-20">
        <Flame className="w-8 h-8 text-torch-orange torch-flicker" />
        <div className="w-1 h-12 bg-stone-800 mx-auto rounded-full mt-1" />
      </div>
      
      {/* Head */}
      <div className="w-16 h-20 bg-stone-800 rounded-t-2xl border-4 border-stone-900 flex flex-col items-center pt-3 gap-2 relative shadow-2xl">
         <div className="absolute -top-3 w-20 flex justify-between px-1">
            <Palmtree className="w-6 h-6 text-green-700 -rotate-12" />
            <Palmtree className="w-6 h-6 text-green-700 rotate-12" />
         </div>
         <div className="flex gap-4">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
         </div>
         <div className="w-8 h-4 bg-stone-900 rounded-lg flex items-center justify-center">
            <div className="w-6 h-1 bg-white/20 rounded-full" />
         </div>
      </div>
      
      {/* Body */}
      <div className="w-14 h-16 bg-stone-800 border-x-4 border-b-4 border-stone-900 rounded-b-lg flex flex-col items-center p-2 relative">
         <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <Shield size={24} style={{ color }} />
         </div>
         <div className="w-full h-1 bg-stone-700 rounded-full mt-2" />
         <div className="w-full h-1 bg-stone-700 rounded-full mt-1" />
      </div>
      
      {/* Base */}
      <div className="w-20 h-4 bg-stone-950 rounded-full blur-sm -mb-2 opacity-50" />
    </div>
  );

  const Navigation = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1c1917]/90 backdrop-blur-md border-b border-[#44403c] px-6 py-4 flex items-center justify-between shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Flame className="w-10 h-10 text-torch-orange animate-pulse" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1"
          >
            <Shield className="w-4 h-4 text-amber-500" />
          </motion.div>
        </div>
        <div className="flex flex-col">
          <span className="font-display text-2xl text-torch-orange tracking-widest leading-none">KINETTIX SUMMER OUTING 2026</span>
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
              <section className="lg:col-span-2 survivor-card p-8 group relative">
                <div className="absolute -bottom-8 -right-8 opacity-10 group-hover:opacity-20 transition-opacity">
                   <TikiGuard color="#f97316" />
                </div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-torch-orange to-transparent" />
                <div className="flex items-center justify-between mb-8">
                  <h2 className="tribal-header text-3xl flex items-center gap-3">
                    <Skull className="text-stone-500" /> Kinetttix Tribes
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
                        className="w-16 bg-stone-900 border border-[#44403c] text-torch-orange font-display text-xl text-center rounded focus:outline-none focus:border-torch-orange"
                      />
                    </div>
                    <button 
                      onClick={() => setTribes([...tribes, { id: crypto.randomUUID(), name: `Tribe ${tribes.length + 1}`, color: TRIBAL_COLORS[tribes.length % TRIBAL_COLORS.length].value, leader: '', playerIds: [] }])}
                      className="p-3 bg-stone-800 text-torch-orange border border-[#44403c] rounded-lg hover:bg-stone-700 transition-all hover:scale-110 active:scale-95"
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {tribes.map((tribe) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={tribe.id}
                      className="p-5 rounded-lg bg-stone-900/50 border border-[#292524] flex items-center gap-4 group/item"
                    >
                      <input 
                        type="color"
                        value={tribe.color}
                        onChange={(e) => setTribes(tribes.map(t => t.id === tribe.id ? { ...t, color: e.target.value } : t))}
                        className="w-10 h-10 rounded cursor-pointer bg-transparent border-none"
                      />
                      <div className="flex-grow grid grid-cols-1 gap-2">
                        <input 
                          placeholder="Tribe Name"
                          value={tribe.name}
                          onChange={(e) => setTribes(tribes.map(t => t.id === tribe.id ? { ...t, name: e.target.value } : t))}
                          className="bg-transparent font-display text-xl text-stone-100 border-b border-[#44403c] focus:border-torch-orange focus:outline-none placeholder:text-stone-700"
                        />
                        <input 
                          placeholder="Tribe Leader"
                          value={tribe.leader}
                          onChange={(e) => setTribes(tribes.map(t => t.id === tribe.id ? { ...t, leader: e.target.value } : t))}
                          className="bg-transparent text-sm text-stone-500 border-b border-transparent focus:border-stone-700 focus:outline-none placeholder:text-stone-700"
                        />
                      </div>
                      <button 
                        onClick={() => setTribes(tribes.filter(t => t.id !== tribe.id))}
                        className="text-stone-700 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </motion.div>
                  ))}
                  {tribes.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-[#292524] rounded-xl">
                      <Compass className="w-12 h-12 text-stone-800 mx-auto mb-4" />
                      <p className="font-display text-stone-600 tracking-widest uppercase">No Tribes Found</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Player Log */}
              <section className="lg:col-span-3 survivor-card p-8">
                <div className="absolute top-0 right-0 p-10 opacity-5 -rotate-12 pointer-events-none">
                  <Palmtree size={200} />
                </div>
                
                <h2 className="tribal-header text-3xl mb-8 flex items-center gap-3">
                  <Users className="text-stone-500" /> Tribe Roster
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <textarea 
                      placeholder="Enter names (e.g. John Doe, M, Supervisor)"
                      className="w-full h-48 px-4 py-3 bg-[#0c0a09] text-stone-300 rounded-xl border border-[#292524] focus:border-torch-orange focus:outline-none font-mono text-sm shadow-inner"
                      value={rawPlayersInput}
                      onChange={(e) => setRawPlayersInput(e.target.value)}
                    />
                      <div className="flex flex-col gap-3 mt-4">
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
                          className="w-full py-4 bg-stone-800 border border-stone-700 text-stone-200 font-display text-lg lg:text-xl tracking-widest hover:bg-stone-700 hover:border-torch-orange transition-all flex items-center justify-center gap-3"
                        >
                          <Plus size={24} className="text-torch-orange" /> ADD USER(S)
                        </button>


                      </div>
                  </div>

                  <div className="bg-stone-900/80 p-6 rounded-xl border border-[#292524]">
                    <div className="flex items-center justify-between mb-4 border-b border-[#292524] pb-2">
                       <div className="flex items-center gap-3">
                         <span className="font-display text-stone-500">READY FOR THE DROP</span>
                         <span className="font-mono text-torch-orange">{players.length}</span>
                       </div>
                       {players.length > 0 && (
                         <button 
                           onClick={() => setPlayers([])}
                           className="text-stone-500 hover:text-torch-red font-display text-[10px] tracking-widest flex items-center gap-1 transition-colors uppercase"
                         >
                           <Trash2 size={12} /> Clear List
                         </button>
                       )}
                    </div>
                    <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar flex flex-wrap gap-2">
                      {players.map(player => (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          key={player.id} 
                          className="group inline-flex items-center gap-2 px-3 py-1.5 bg-stone-800 rounded-md border border-[#44403c] text-sm hover:border-torch-orange transition-all"
                        >
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            player.gender === 'Male' ? "bg-sky-400" : player.gender === 'Female' ? "bg-rose-400" : "bg-stone-500"
                          )} title={player.gender} />
                          <div className="flex flex-col">
                            <span className="font-medium text-stone-300 leading-none">{player.name}</span>
                            <span className={cn(
                              "text-[10px] font-display tracking-widest uppercase mt-0.5",
                              player.category === 'Supervisor' ? "text-amber-500" : "text-emerald-400"
                            )}>{player.supervisorName ? `${player.supervisorName}` : player.category}</span>
                          </div>
                          <button 
                            onClick={() => setPlayers(players.filter(p => p.id !== player.id))}
                            className="text-stone-600 hover:text-torch-red opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                          >
                            <Trash2 size={12} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mt-12 pb-4">
                  <button 
                    disabled={players.length === 0 || tribes.length === 0}
                    onClick={generateTribes}
                    className="relative group disabled:opacity-30 disabled:grayscale"
                  >
                    <div className="absolute -inset-1 bg-torch-orange blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
                    <div className="relative px-12 py-6 bg-stone-900 border-2 border-stone-700 rounded-none transform transition hover:scale-105 active:scale-95 flex items-center gap-4">
                      <Flame className="text-torch-orange group-hover:animate-bounce" />
                      <span className="font-display text-3xl text-stone-100 tracking-[0.2em]">GENERATE TRIBE MEMBERS</span>
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
              className="min-h-[70vh] flex flex-col items-center"
            >
              <div className="flex flex-col items-center text-center gap-2 mb-10">
                <h2 className="font-display text-4xl text-stone-100 tracking-[0.2em] flex items-center gap-4">
                  <Compass className="text-torch-orange animate-spin-slow" /> TRIBAL TERRITORIES <Compass className="text-torch-orange animate-spin-slow" />
                </h2>
                <p className="font-hand text-xl text-stone-500 italic opacity-80">
                  "The tribes have converged. Strength has been distributed."
                </p>

                <div className="mt-4 flex gap-4">
                  <button 
                    onClick={exportToExcel}
                    disabled={revealedCount < Object.keys(revealSequence).length}
                    className="px-8 py-3 rounded-full bg-stone-900 border border-stone-700 text-stone-400 font-display tracking-widest text-sm flex items-center gap-3 hover:bg-stone-800 hover:text-stone-200 transition-all"
                  >
                    <Download size={18} /> DOWNLOAD EXCEL
                  </button>
                </div>
              </div>
              
              <div className={cn(
                "w-full transition-all duration-1000 ease-in-out",
                revealedCount >= Object.keys(revealSequence).length 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start" 
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
                          "survivor-card flex flex-col group border-t-8 h-full relative overflow-hidden tribal-pattern transition-shadow duration-700",
                          !isAllRevealed ? "w-full max-w-4xl min-h-[550px]" : "w-full max-w-lg min-h-[280px]",
                          isActiveTribe ? "ring-2 ring-torch-orange/30 shadow-2xl" : "shadow-lg"
                        )}
                        style={{ 
                          borderTopColor: tribe.color
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
                      
                      <div className="p-5 border-b border-[#292524] bg-stone-900/40 relative z-10 flex items-center justify-between">
                         <div>
                            <h3 className="font-display text-2xl text-stone-100 uppercase tracking-tighter flex items-center gap-2">
                               {tribe.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1 text-stone-500 font-hand text-lg">
                               <Shield size={14} style={{ color: tribe.color }} />
                               <span>Leader: {tribe.leader || 'Unknown'}</span>
                            </div>
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
              className="space-y-12"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-5xl text-stone-100 tracking-widest">TRIBE SCROLLS</h2>
                <div className="flex gap-4">
                  <span className="font-hand text-xl text-stone-500 italic rotate-3">The final rosters for the challenge...</span>
                  <button 
                    onClick={() => window.print()} 
                    className="p-3 bg-stone-800 border border-stone-700 text-torch-orange rounded-full hover:scale-110 shadow-lg"
                  >
                    <Scroll size={24} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {tribes.map(tribe => (
                  <div key={tribe.id} className="relative p-1 bg-[#f5f5f4] shadow-[10px_10px_0px_#1c1917] rotate-1 hover:rotate-0 transition-transform">
                    {/* Paper Texture Overlay */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/parchment.png")' }} />
                    <div className="bg-transparent p-10 border-2 border-stone-300">
                      <div className="border-b-4 border-stone-800 pb-4 mb-8 text-center">
                        <h3 className="font-display text-4xl text-stone-900 tracking-tighter uppercase">{tribe.name}</h3>
                        <p className="font-hand text-2xl text-stone-500 mt-1">{tribe.leader}</p>
                      </div>
                      
                      <ul className="space-y-6">
                        {tribe.playerIds.map((id, index) => {
                          const player = players.find(p => p.id === id);
                          return (
                            <li key={id} className="flex items-center gap-4 border-b border-stone-200 pb-3 h-16">
                              <span className="font-display text-stone-400 text-xl self-start mt-1">{(index + 1).toString().padStart(2, '0')}</span>
                              <div className="flex flex-col flex-grow">
                                <div className="flex items-center gap-2">
                                  <span className="font-display text-2xl text-stone-800 tracking-tight">{player?.name}</span>
                                  {player?.gender === 'Male' ? (
                                    <Mars size={18} className="text-sky-700/70" />
                                  ) : player?.gender === 'Female' ? (
                                    <Venus size={18} className="text-rose-700/70" />
                                  ) : (
                                    <MoreHorizontal size={18} className="text-stone-500/70" />
                                  )}
                                </div>
                                <span className="font-display text-[10px] text-stone-500 uppercase tracking-widest leading-none mt-1">
                                  {player?.supervisorName ? `${player.supervisorName}` : player?.category}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-12">
                <button 
                  onClick={exportToExcel}
                  className="px-8 py-4 bg-emerald-600 text-white font-display text-2xl tracking-[0.2em] rounded-none shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-4 hover:scale-105 active:scale-95"
                >
                  <Download size={24} /> EXPORT RESULTS TO EXCEL
                </button>
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
