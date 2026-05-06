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
  playerIds: string[];
  icon: 'Flame' | 'Waves' | 'Palmtree' | 'Sun' | 'Skull' | 'Anchor';
}

type View = 'teams' | 'compose' | 'roster' | 'outplay';

type RevealEvent = 
  | { type: 'TRIBE_INTRO', tribeId: string }
  | { type: 'PLAYER_REVEAL', playerId: string };

// --- Constants ---
const TRIBAL_COLORS = [
  { name: 'Voyagers', value: '#3ebeb1', icon: 'Flame' as const },
  { name: 'StormBreakers', value: '#ca3729', icon: 'Waves' as const },
  { name: 'Keepers', value: '#d2672e', icon: 'Palmtree' as const },
  { name: 'Guardians', value: '#d3a12a', icon: 'Sun' as const },
  { name: 'Raiders', value: '#6a4d94', icon: 'Skull' as const },
  { name: 'PathFinders', value: '#6c7e35', icon: 'Anchor' as const },
];

// --- Assets ---
const TIKI_ASSETS = [
  "Asset 1.png", "Asset 3.png", "Asset 4.png", "Asset 5.png", 
  "Asset 6.png", "Asset 7.png", "Asset 8.png", "Asset 9.png", 
  "Asset 10.png", "Asset 11.png", "Asset 12.png", "Asset 13.png"
];

const GENDERS: Gender[] = ['Male', 'Female', 'Other'];
const CATEGORIES: Category[] = ['Standard', 'Supervisor'];

// --- Tiki Mask Wrapper ---
const DetailedTikiMask = ({ variant = 1, color, delay = 0, scale = 1 }: { variant?: number; color: string; delay?: number; scale?: number }) => {
  const assetIndex = (variant - 1) % TIKI_ASSETS.length;
  const assetName = TIKI_ASSETS[assetIndex >= 0 ? assetIndex : 0];
  
  return (
    <motion.div
      initial={{ y: 20, opacity: 0, scale: 0.8 * scale }}
      animate={{ 
        y: [0, -10, 0],
        rotate: [-2, 2, -2],
        opacity: [0.9, 1, 0.9]
      }}
      transition={{ 
        duration: 4, 
        repeat: Infinity, 
        delay,
        ease: "easeInOut" 
      }}
      className="relative flex flex-col items-center"
    >
      <img 
        src={`/assets/${assetName}`} 
        className="drop-shadow-2xl"
        style={{ width: 120 * scale, height: 'auto' }}
        alt="Tiki Mask"
      />
      {/* Glow based on color */}
      <div 
        className="absolute inset-0 blur-2xl opacity-20 pointer-events-none rounded-full"
        style={{ backgroundColor: color }}
      />
    </motion.div>
  );
};


// --- Silhouettes for Background ---
const RealisticTikiMask = ({ color, delay = 0, scale = 1 }: { color: string; delay?: number; scale?: number }) => (
  // Use the new DetailedTikiMask for consistency
  <DetailedTikiMask color={color} delay={delay} scale={scale} variant={(Math.floor(delay * 17) % TIKI_ASSETS.length + 1)} />
);

const DancingTribeGroup = ({ color, side }: { color: string; side: 'left' | 'right' }) => (
  <div className={cn(
    "absolute bottom-0 h-full flex flex-col justify-end gap-16 pb-10 pointer-events-none z-0",
    side === 'left' ? "-left-28 md:-left-44" : "-right-28 md:-right-44"
  )}>
    <RealisticTikiMask color={color} delay={0} scale={1.2} />
    <RealisticTikiMask color={color} delay={0.8} scale={0.9} />
    <RealisticTikiMask color={color} delay={0.4} scale={1.1} />
  </div>
);

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [tribes, setTribes] = useState<Tribe[]>(() => {
    return TRIBAL_COLORS.map((tc, i) => ({
      id: `tribe-${i + 1}`,
      name: tc.name,
      color: tc.value,
      icon: tc.icon,
      playerIds: []
    }));
  });
  const [currentView, setCurrentView] = useState<View>('roster');
  const [rawPlayersInput, setRawPlayersInput] = useState('');
  const [revealEvents, setRevealEvents] = useState<RevealEvent[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [inductionOverlayDismissed, setInductionOverlayDismissed] = useState(false);

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

    // 1. Group players by Supervisor Name
    const supervisorGroups: Record<string, Player[]> = {};
    players.forEach(p => {
      const key = (p.supervisorName || 'No Supervisor').trim().toLowerCase();
      if (!supervisorGroups[key]) supervisorGroups[key] = [];
      supervisorGroups[key].push(p);
    });

    const shuffle = <T,>(array: T[]) => [...array].sort(() => Math.random() - 0.5);
    
    // 2. Prepare buckets within each supervisor group for gender balance
    const sortedSupervisors = Object.keys(supervisorGroups).sort();
    const buckets: Player[][] = [];

    sortedSupervisors.forEach(sup => {
      const group = supervisorGroups[sup];
      // Further divide by gender within supervisor group
      const males = shuffle(group.filter(p => p.gender === 'Male'));
      const females = shuffle(group.filter(p => p.gender === 'Female'));
      const others = shuffle(group.filter(p => p.gender === 'Other'));

      // Interleave them to distribute gender equally too
      const interleaved: Player[] = [];
      const maxLength = Math.max(males.length, females.length, others.length);
      for (let i = 0; i < maxLength; i++) {
        if (males[i]) interleaved.push(males[i]);
        if (females[i]) interleaved.push(females[i]);
        if (others[i]) interleaved.push(others[i]);
      }
      buckets.push(interleaved);
    });

    const newTribes = tribes.map(t => ({ ...t, playerIds: [] as string[] }));
    let tribeIndex = 0;

    // 3. Process each supervisor bucket round-robin
    // To TRULY balance, we distribute players across the tribes
    // We want the subordinates of one supervisor to be spread out.
    buckets.forEach(groupPlayers => {
      groupPlayers.forEach(player => {
        newTribes[tribeIndex].playerIds.push(player.id);
        tribeIndex = (tribeIndex + 1) % newTribes.length;
      });
      // We don't reset tribeIndex between supervisors to ensure teams overall sizes are equal
    });

    // Create an ordered sequence of events: Tribe Intro -> Players in Tribe -> next...
    const events: RevealEvent[] = [];
    newTribes.forEach(tribe => {
      if (tribe.playerIds.length > 0) {
        events.push({ type: 'TRIBE_INTRO', tribeId: tribe.id });
        tribe.playerIds.forEach(pId => {
          events.push({ type: 'PLAYER_REVEAL', playerId: pId });
        });
      }
    });

    setRevealedCount(-1);
    setInductionOverlayDismissed(false);
    setRevealEvents(events);
    setTribes(newTribes);
    setCurrentView('teams');
  };

  // Reveal Timer effect
  useEffect(() => {
    if (currentView === 'teams' && revealEvents.length > 0) {
      const total = revealEvents.length;
      
      if (revealedCount < total && revealedCount >= 0) {
        // Play audio when reveal starts
        audio.play().catch(e => console.warn("Audio play blocked:", e));
      } else if (revealedCount >= total) {
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

      // Initial pause for Tribal Council initiation
      let delay = 2000;
      
      if (revealedCount === -1) {
        delay = 4500; // Time for "Tribal Council Begins" screen
      } else {
        const currentEvent = revealEvents[revealedCount];
        if (currentEvent?.type === 'TRIBE_INTRO') {
          delay = 3000; // Pause for tribe intro
        } else if (currentEvent?.type === 'PLAYER_REVEAL') {
          const tribe = tribes.find(t => t.playerIds.includes(currentEvent.playerId));
          const isLastInTribe = tribe?.playerIds[tribe.playerIds.length - 1] === currentEvent.playerId;
          
          if (isLastInTribe) {
            delay = 8000; // Longer pause after tribe is filled
          }
        }
      }

      const timeout = setTimeout(() => {
        setRevealedCount(prev => {
          if (prev < total) return prev + 1;
          return prev;
        });
      }, delay);
      
      return () => {
        clearTimeout(timeout);
      };
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [currentView, revealEvents, revealedCount, audio, tribes]);

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
        color: tribe.color,
        icon: tribe.icon
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

  const TribeIconComponent = ({ icon, size = 24, className, style }: { icon: string, size?: number, className?: string, style?: any }) => {
    switch (icon) {
      case 'Flame': return <Flame size={size} className={className} style={style} />;
      case 'Waves': return <Waves size={size} className={className} style={style} />;
      case 'Palmtree': return <Palmtree size={size} className={className} style={style} />;
      case 'Sun': return <Sun size={size} className={className} style={style} />;
      case 'Skull': return <Skull size={size} className={className} style={style} />;
      case 'Anchor': return <Anchor size={size} className={className} style={style} />;
      default: return <Bird size={size} className={className} style={style} />;
    }
  };

  const TikiGuard = ({ color }: { color: string }) => (
    <div className="relative flex flex-col items-center justify-end group">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none" />

      {/* Torches - Symmetrical */}
      <div className="absolute -top-12 -left-16 z-20">
        <Flame className="w-12 h-12 text-torch-orange torch-flicker filter drop-shadow-[0_0_15px_rgba(249,115,22,0.9)]" />
        <div className="w-2 h-24 bg-gradient-to-b from-[#451a03] to-[#1a0f05] mx-auto rounded-full mt-1 border-x border-stone-900" />
      </div>

      <div className="absolute -top-12 -right-16 z-20">
        <Flame className="w-12 h-12 text-torch-orange torch-flicker filter drop-shadow-[0_0_15px_rgba(249,115,22,0.9)] scale-x-[-1]" />
        <div className="w-2 h-24 bg-gradient-to-b from-[#451a03] to-[#1a0f05] mx-auto rounded-full mt-1 border-x border-stone-900" />
      </div>
      
      {/* The Updated Mask */}
      <div className="transform scale-[2.2] origin-bottom mb-4">
        <DetailedTikiMask variant={2} color={color} scale={1} />
      </div>
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
      
      <main className={cn(
        "mx-auto relative z-10 px-6",
        currentView === 'teams' ? "max-w-none w-[98%]" : "max-w-7xl"
      )}>
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
                {/* Addition: Floating Assets in Tribe Setup side */}
                <div className="absolute top-20 -left-10 opacity-20 pointer-events-none">
                   <DetailedTikiMask variant={5} color="#0ea5e9" scale={0.8} />
                </div>
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-lagoon to-transparent" />
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <h2 className="tribal-header text-4xl flex items-center gap-3">
                    <Users className="text-hibiscus" /> TRIBES
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lagoon text-4xl">6</span>
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
                      <label className="relative cursor-pointer group/color">
                        <input 
                          type="color"
                          value={tribe.color}
                          onChange={(e) => setTribes(tribes.map(t => t.id === tribe.id ? { ...t, color: e.target.value } : t))}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div 
                          className="w-12 h-12 rounded-full border-4 border-stone-800 flex items-center justify-center shadow-lg transition-transform group-hover/color:scale-110"
                          style={{ backgroundColor: tribe.color }}
                        >
                           <TribeIconComponent icon={tribe.icon} size={20} className="text-white" />
                        </div>
                      </label>
                      <div className="flex-grow grid grid-cols-1 gap-1">
                        <input 
                          placeholder="Tribe Name"
                          value={tribe.name}
                          onChange={(e) => setTribes(tribes.map(t => t.id === tribe.id ? { ...t, name: e.target.value } : t))}
                          className="bg-transparent font-display text-2xl text-stone-100 border-b border-stone-800/50 focus:border-lagoon focus:outline-none placeholder:text-stone-800 transition-colors"
                        />
                      </div>
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
                {/* Addition: Floating Asset in Applicants section */}
                <div className="absolute top-1/2 -right-8 opacity-20 pointer-events-none rotate-12">
                   <DetailedTikiMask variant={7} color="#ef4444" scale={0.7} />
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
                      <Skull className="text-lagoon group-hover:animate-pulse" size={36} />
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
              {/* Floating Dancing Side Masks during fill process */}
              {revealEvents.length > 0 && revealedCount < revealEvents.length && (
                <>
                  <div className="fixed left-4 top-1/2 -translate-y-1/2 z-[100] pointer-events-none hidden xl:flex flex-col gap-12">
                     <motion.div
                       animate={{ 
                         y: [0, -30, 0],
                         rotate: [-5, 5, -5],
                         scale: [1, 1.1, 1]
                       }}
                       transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                     >
                        <DetailedTikiMask variant={1} color="#f59e0b" scale={1.8} delay={0} />
                     </motion.div>
                     <motion.div
                       animate={{ 
                         y: [0, 30, 0],
                         rotate: [5, -5, 5],
                         scale: [1, 0.9, 1]
                       }}
                       transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                     >
                        <DetailedTikiMask variant={3} color="#ef4444" scale={1.4} delay={0.2} />
                     </motion.div>
                  </div>
                  <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[100] pointer-events-none hidden xl:flex flex-col gap-12">
                     <motion.div
                       animate={{ 
                         y: [0, 40, 0],
                         rotate: [10, -10, 10],
                         scale: [1, 1.05, 1]
                       }}
                       transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                     >
                        <DetailedTikiMask variant={7} color="#3b82f6" scale={1.8} delay={0.1} />
                     </motion.div>
                     <motion.div
                       animate={{ 
                         y: [0, -40, 0],
                         rotate: [-10, 10, -10],
                         scale: [1, 1.15, 1]
                       }}
                       transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                     >
                        <DetailedTikiMask variant={12} color="#10b981" scale={1.4} delay={0.4} />
                     </motion.div>
                  </div>
                </>
              )}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                <Waves className="absolute top-10 left-10 w-64 h-64 text-ocean-blue rotate-12" />
                <Waves className="absolute bottom-10 right-10 w-64 h-64 text-lagoon -rotate-12" />
                <Skull className="absolute top-1/2 left-1/4 w-32 h-32 text-hibiscus animate-sway" />
              </div>

              <div className="flex flex-col items-center text-center gap-2 mb-10 relative z-10">
                <div className="flex items-center gap-4 mb-2">
                   <Flower className="text-hibiscus animate-pulse" size={32} />
                   <h2 className="font-display text-5xl text-stone-100 tracking-[0.2em] drop-shadow-xl">
                      ALOHA KINETTIX
                   </h2>
                   <Flower className="text-hibiscus animate-pulse" size={32} />
                </div>
                <p className="font-hand text-2xl text-sand italic">
                  "The spirits of the islands have spoken. May your journey be fruitful."
                </p>
              </div>
              
              <div className={cn(
                "w-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] relative z-10",
                revealedCount >= revealEvents.length 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start" 
                  : "flex items-center justify-center p-4 md:p-12 mb-20"
              )}>
                {(() => {
                  const totalEvents = revealEvents.length;
                  const isAllRevealed = revealedCount >= totalEvents && totalEvents > 0;
                  
                  const currentEvent = revealedCount >= 0 && revealedCount < totalEvents ? revealEvents[revealedCount] : null;

                  const activeTribe = currentEvent?.type === 'PLAYER_REVEAL' ? tribes.find(t => t.playerIds.includes(currentEvent.playerId)) : null;
                  const isLastPlayerOfTribe = activeTribe && activeTribe.playerIds[activeTribe.playerIds.length - 1] === currentEvent?.playerId;
                  const showTribeComplete = isLastPlayerOfTribe && !isAllRevealed;

                  // Initial Initiation Splash
                  if (revealedCount === -1 && totalEvents > 0) {
                    return (
                      <motion.div
                        key="council-initiation"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.5, filter: "blur(20px)" }}
                        className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-stone-950 overflow-hidden"
                      >
                         {/* Background Ambience */}
                        <div className="absolute inset-0">
                           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#451a03_0%,_transparent_70%)] opacity-40" />
                           
                           {/* Flickering Torches (Sides) */}
                           <div className="absolute left-10 top-1/2 -translate-y-1/2 flex flex-col gap-40">
                              <TikiGuard color="#f97316" />
                              <TikiGuard color="#f97316" />
                           </div>
                           <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col gap-40">
                              <TikiGuard color="#f97316" />
                              <TikiGuard color="#f97316" />
                           </div>

                           {/* Smoke/Haze */}
                           <motion.div 
                             animate={{ 
                               scale: [1, 1.2, 1],
                               opacity: [0.1, 0.2, 0.1]
                             }}
                             transition={{ duration: 8, repeat: Infinity }}
                             className="absolute inset-0 bg-stone-900/40 blur-3xl translate-y-20"
                           />
                        </div>

                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.5, duration: 1 }}
                          className="relative z-10 text-center"
                        >
                           <motion.div
                             animate={{ scale: [1, 1.05, 1] }}
                             transition={{ duration: 4, repeat: Infinity }}
                             className="mb-8"
                           >
                             <Skull size={120} className="text-torch-orange mx-auto drop-shadow-[0_0_20px_rgba(249,115,22,0.6)]" />
                           </motion.div>
                           
                           <h1 className="font-display text-6xl md:text-8xl lg:text-9xl text-stone-100 tracking-[0.4em] uppercase mb-4 drop-shadow-[0_10px_30px_rgba(0,0,0,1)]">
                             TRIBAL INDUCTION
                           </h1>
                           <motion.p 
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             transition={{ delay: 1.5, duration: 1 }}
                             className="font-display text-3xl md:text-4xl text-sand tracking-[0.6em] uppercase opacity-60"
                           >
                             BEGINS
                           </motion.p>
                        </motion.div>

                        <motion.div 
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: 1, duration: 2 }}
                          className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-torch-orange to-transparent" 
                        />
                      </motion.div>
                    );
                  }

                  // Tribe Complete Overlay (REMOVED: Now integrated into card background)
                  
                  // Final Completion Overlay
                  if (isAllRevealed && totalEvents > 0 && !inductionOverlayDismissed) {
                    return (
                      <motion.div
                        key="final-completion"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-stone-950/80 backdrop-blur-md"
                      >
                        {/* Celebration Dancing Group */}
                        <div className="absolute inset-0 flex items-end justify-around pb-20 opacity-40 px-20">
                          <DetailedTikiMask variant={3} color="#f59e0b" delay={0} scale={1.5} />
                          <DetailedTikiMask variant={6} color="#ef4444" delay={0.2} scale={1.3} />
                          <DetailedTikiMask variant={8} color="#3b82f6" delay={0.4} scale={1.6} />
                          <DetailedTikiMask variant={11} color="#10b981" delay={0.1} scale={1.4} />
                          <DetailedTikiMask variant={12} color="#8b5cf6" delay={0.3} scale={1.5} />
                        </div>

                        <motion.div
                          initial={{ scale: 0.5, opacity: 0, y: 50 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          transition={{ 
                            type: "spring",
                            damping: 12,
                            stiffness: 100
                          }}
                          className="relative z-10 text-center px-6"
                        >
                          <motion.div
                            animate={{ rotate: [0, -5, 5, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="mb-8 flex justify-center"
                          >
                            <TikiGuard color="#fca311" />
                          </motion.div>

                          <h2 className="font-display text-4xl md:text-6xl text-sand tracking-[0.3em] mb-4 uppercase drop-shadow-xl">
                            TRIBE INDUCTION
                          </h2>
                          <h1 className="font-display text-7xl md:text-9xl text-amber-500 tracking-[0.1em] uppercase drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                            COMPLETE
                          </h1>

                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-8"
                          />
                          
                          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-12">
                            <motion.button
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 1.5 }}
                              onClick={() => {
                                setInductionOverlayDismissed(true);
                              }}
                              className="px-10 py-4 bg-amber-600 hover:bg-amber-500 text-white font-display tracking-widest uppercase rounded-full transition-colors shadow-lg hover:shadow-amber-500/20 pointer-events-auto"
                            >
                              Show Tribe List
                            </motion.button>

                            <motion.button
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 1.7 }}
                              onClick={() => {
                                setCurrentView('roster');
                                setRevealedCount(-1);
                                setInductionOverlayDismissed(false);
                              }}
                              className="px-8 py-3 bg-stone-800 hover:bg-stone-700 text-sand/80 hover:text-sand font-display tracking-widest uppercase rounded-full transition-colors pointer-events-auto text-sm"
                            >
                              Back to Entrance
                            </motion.button>
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  }
                  
                  // For intro splash
                  if (currentEvent?.type === 'TRIBE_INTRO' && !isAllRevealed) {
                    const tribe = tribes.find(t => t.id === currentEvent.tribeId);
                    if (!tribe) return null;
                    const tribeIndex = tribes.findIndex(t => t.id === tribe.id);
                    return (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                        key={`intro-${tribe.id}`}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-950 overflow-hidden"
                      >
                        {/* Background Elemental Effects */}
                        <div className="absolute inset-0 pointer-events-none scale-110">
                           {/* Fire Embers */}
                           {[...Array(40)].map((_, i) => (
                             <motion.div
                               key={`ember-${i}`}
                               initial={{ 
                                 x: Math.random() * 100 + "%", 
                                 y: "110%", 
                                 opacity: 0,
                                 scale: Math.random() * 0.5 + 0.5
                               }}
                               animate={{ 
                                 y: "-10%", 
                                 opacity: [0, 0.9, 0],
                                 x: (Math.random() * 100 + (Math.sin(i * 0.5) * 15)) + "%",
                                 rotate: 360
                               }}
                               transition={{ 
                                 duration: Math.random() * 4 + 3, 
                                 repeat: Infinity, 
                                 delay: Math.random() * 5 
                               }}
                               className="absolute w-1.5 h-1.5 rounded-full"
                               style={{ 
                                 backgroundColor: tribe.color, 
                                 boxShadow: `0 0 12px ${tribe.color}, 0 0 20px #fff4` 
                               }}
                             />
                           ))}

                           {/* Lightning Bolts */}
                           {[...Array(2)].map((_, i) => (
                             <motion.svg
                               key={`lightning-${i}`}
                               className="absolute w-full h-full text-white/40"
                               initial={{ opacity: 0 }}
                               animate={{ 
                                 opacity: [0, 1, 0, 0.8, 0],
                                 filter: ["blur(1px)", "blur(0px)", "blur(2px)"]
                               }}
                               transition={{ 
                                 duration: 0.2, 
                                 repeat: Infinity, 
                                 repeatDelay: Math.random() * 4 + 2,
                                 delay: i * 2
                               }}
                               viewBox="0 0 100 100"
                               preserveAspectRatio="none"
                             >
                               <path 
                                 d={`M ${20 + Math.random() * 60} 0 L ${15 + Math.random() * 70} 30 L ${25 + Math.random() * 50} 50 L ${10 + Math.random() * 80} 100`}
                                 fill="none" 
                                 stroke="currentColor" 
                                 strokeWidth="0.5"
                               />
                             </motion.svg>
                           ))}

                           {/* Rain Particles */}
                           {[...Array(60)].map((_, i) => (
                             <motion.div
                               key={`rain-${i}`}
                               initial={{ 
                                 x: Math.random() * 100 + "%", 
                                 y: "-10%", 
                                 opacity: 0
                               }}
                               animate={{ 
                                 y: "110%", 
                                 opacity: [0, 0.3, 0]
                               }}
                               transition={{ 
                                 duration: 0.5 + Math.random() * 0.3, 
                                 repeat: Infinity, 
                                 delay: Math.random() * 2 
                               }}
                               className="absolute w-[1px] h-12 bg-white/20 origin-bottom"
                               style={{ transform: 'rotate(15deg)' }}
                             />
                           ))}

                           {/* Wind Streaks */}
                           {[...Array(15)].map((_, i) => (
                             <motion.div
                               key={`wind-${i}`}
                               initial={{ 
                                 x: "-20%", 
                                 y: Math.random() * 100 + "%", 
                                 opacity: 0
                               }}
                               animate={{ 
                                 x: "120%", 
                                 opacity: [0, 0.15, 0],
                                 skewX: [0, 20, 0]
                               }}
                               transition={{ 
                                 duration: 2 + Math.random() * 2, 
                                 repeat: Infinity, 
                                 delay: Math.random() * 5,
                                 ease: "easeInOut"
                               }}
                               className="absolute w-64 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"
                             />
                           ))}

                           {/* Lightning Background Flashes */}
                           <motion.div 
                             animate={{ 
                               opacity: [0, 0.2, 0, 0.3, 0, 0.1, 0]
                             }}
                             transition={{ 
                               duration: 5, 
                               repeat: Infinity, 
                               times: [0, 0.1, 0.12, 0.18, 0.22, 0.3, 1] 
                             }}
                             className="absolute inset-0 bg-white mix-blend-overlay"
                           />

                           {/* Smoke/Haze */}
                           <motion.div 
                             animate={{ 
                               scale: [1, 1.3, 1.2, 1],
                               rotate: [0, 10, -10, 0],
                               opacity: [0.1, 0.3, 0.1]
                             }}
                             transition={{ duration: 12, repeat: Infinity }}
                             className="absolute inset-0 bg-gradient-to-tr from-transparent via-stone-800/30 to-transparent blur-3xl"
                           />
                        </div>

                        <motion.div
                          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                          animate={{ scale: 1, opacity: 1, rotate: 0 }}
                          transition={{ type: "spring", damping: 15, stiffness: 100 }}
                          className="relative mb-12 z-10 flex items-center gap-12"
                        >
                           {/* Side Assets for Tribe Intro - Dynamic variants to avoid duplicates */}
                           <motion.div
                             initial={{ x: -100, opacity: 0 }}
                             animate={{ x: 0, opacity: 1 }}
                             transition={{ delay: 0.6, duration: 1 }}
                             className="hidden lg:block opacity-40 hover:opacity-100 transition-opacity"
                           >
                              <DetailedTikiMask variant={(tribeIndex * 2) % TIKI_ASSETS.length + 1} color={tribe.color} scale={1.2} />
                           </motion.div>

                           <div className="relative">
                             <div 
                               className="absolute inset-0 blur-[100px] opacity-60 rounded-full" 
                               style={{ backgroundColor: tribe.color }} 
                             />
                             <div className="relative p-12 bg-stone-900 border-8 border-stone-800 rounded-full shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                                <TribeIconComponent icon={tribe.icon} size={160} style={{ color: tribe.color }} className="drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]" />
                             </div>
                             
                             {/* Animated rings */}
                             {[...Array(3)].map((_, i) => (
                               <motion.div 
                                 key={i}
                                 animate={{ 
                                   scale: [1, 1.5], 
                                   opacity: [0.5, 0],
                                   rotate: i % 2 === 0 ? 360 : -360
                                 }}
                                 transition={{ 
                                   duration: 3, 
                                   repeat: Infinity, 
                                   delay: i * 1,
                                   ease: "easeOut"
                                 }}
                                 className="absolute -inset-8 border-4 rounded-full"
                                 style={{ borderColor: tribe.color, borderStyle: i === 1 ? 'dashed' : 'solid' }}
                               />
                             ))}
                           </div>

                           <motion.div
                             initial={{ x: 100, opacity: 0 }}
                             animate={{ x: 0, opacity: 1 }}
                             transition={{ delay: 0.8, duration: 1 }}
                             className="hidden lg:block opacity-40 hover:opacity-100 transition-opacity"
                           >
                              <DetailedTikiMask variant={(tribeIndex * 2 + 1) % TIKI_ASSETS.length + 1} color={tribe.color} scale={1.2} />
                           </motion.div>
                        </motion.div>
                        
                        <div className="relative z-10 text-center">
                          <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4, duration: 1 }}
                          >
                            <h2 
                              className="font-display text-9xl md:text-[12rem] text-stone-100 tracking-[0.3em] uppercase drop-shadow-[0_10px_30px_rgba(0,0,0,1)] inline-block"
                              style={{ 
                                textShadow: `0 0 40px ${tribe.color}66`
                              }}
                            >
                              {tribe.name}
                            </h2>
                          </motion.div>

                          <motion.div 
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ delay: 1, duration: 1.5 }}
                            className="flex items-center justify-center gap-10 mt-8"
                          >
                             <div className="h-1 lg:w-48 bg-gradient-to-r from-transparent to-stone-600" />
                             <div className="flex flex-col gap-2">
                               <span className="font-hand text-5xl text-sand italic tracking-widest drop-shadow-md">The spirits have spoken...</span>
                               <motion.div 
                                 animate={{ opacity: [0.4, 1, 0.4] }}
                                 transition={{ duration: 2, repeat: Infinity }}
                                 className="flex justify-center gap-4 text-stone-500"
                               >
                                 <Waves size={24} />
                                 <TribeIconComponent icon={tribe.icon} size={24} />
                                 <Shield size={24} />
                               </motion.div>
                             </div>
                             <div className="h-1 lg:w-48 bg-gradient-to-l from-transparent to-stone-600" />
                          </motion.div>
                        </div>

                        {/* Ground shadow/glow */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-64 bg-gradient-to-t from-stone-950 to-transparent opacity-90 blur-3xl" />
                      </motion.div>
                    );
                  }

                  // Determine active tribe for player reveal
                  let activeTribeId: string | undefined;
                  if (currentEvent?.type === 'PLAYER_REVEAL') {
                    activeTribeId = tribes.find(t => t.playerIds.includes(currentEvent.playerId))?.id;
                  } else if (revealedCount === -1 && revealEvents.length > 0) {
                    // Pre-start: target first tribe intro
                    const firstEvent = revealEvents[0];
                    if (firstEvent.type === 'TRIBE_INTRO') activeTribeId = firstEvent.tribeId;
                  }
                  
                  const tribesToDisplay = isAllRevealed ? tribes : tribes.filter(t => t.id === activeTribeId);

                  return tribesToDisplay.map((tribe) => {
                    // Logic to see who is revealed in this tribe
                    // A player is revealed if their PLAYER_REVEAL event index is <= revealedCount
                    const revealedInTribe = tribe.playerIds.filter(pid => {
                      const eventIndex = revealEvents.findIndex(e => e.type === 'PLAYER_REVEAL' && e.playerId === pid);
                      return eventIndex !== -1 && eventIndex <= revealedCount;
                    });

                    const isFinished = revealedInTribe.length === tribe.playerIds.length && tribe.playerIds.length > 0 && isAllRevealed;
                    const isActiveTribe = tribe.id === activeTribeId;
                    
                    const tribeIsFilled = revealedInTribe.length === tribe.playerIds.length && tribe.playerIds.length > 0;
                    const isShowingCompleteEffect = tribeIsFilled && !isAllRevealed;

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
                          duration: 0.4,
                          times: [0, 0.2, 1],
                          ease: [0.22, 1, 0.36, 1]
                        }}
                        key={tribe.id} 
                        className={cn(
                          "hawaiian-card flex flex-col group border-4 h-full relative overflow-hidden transition-all duration-300",
                          !isAllRevealed ? "w-full max-w-4xl min-h-[600px]" : "w-full min-h-[280px]",
                          isActiveTribe ? "shadow-2xl scale-[1.02]" : "shadow-lg opacity-90"
                        )}
                        style={{ 
                          borderColor: tribe.color,
                          boxShadow: isActiveTribe ? `0 0 60px ${tribe.color}55` : `0 0 20px ${tribe.color}22`
                        }}
                      >
                      <AnimatePresence>
                        {isShowingCompleteEffect && (
                          <>
                            {/* Dancing Tribe Silhouettes on the sides */}
                            <DancingTribeGroup color={tribe.color} side="left" />
                            <DancingTribeGroup color={tribe.color} side="right" />

                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 pointer-events-none z-0"
                            >
                               {/* Fire Effect behind card content */}
                             <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden">
                                {[...Array(30)].map((_, i) => (
                                  <motion.div
                                    key={`card-ember-${i}`}
                                    initial={{ 
                                      x: Math.random() * 100 + "%", 
                                      y: "110%", 
                                      opacity: 0,
                                      scale: Math.random() * 0.5 + 0.5
                                    }}
                                    animate={{ 
                                      y: ["110%", "-10%"], 
                                      opacity: [0, 0.8, 0],
                                      x: (Math.random() * 80 + 10) + "%",
                                    }}
                                    transition={{ 
                                      duration: Math.random() * 3 + 2, 
                                      repeat: Infinity, 
                                      delay: Math.random() * 2 
                                    }}
                                    className="absolute w-2 h-2 rounded-full"
                                    style={{ 
                                      backgroundColor: tribe.color, 
                                      boxShadow: `0 0 15px ${tribe.color}, 0 0 30px #fff` 
                                    }}
                                  />
                                ))}
                             </div>

                             {/* Lightning Strikes behind card */}
                             <motion.div
                               initial={{ opacity: 0 }}
                               animate={{ opacity: [0, 1, 0, 0.8, 0] }}
                               transition={{ 
                                 duration: 0.3,
                                 repeat: Infinity,
                                 repeatDelay: 1.5
                               }}
                               className="absolute inset-0 bg-white/10 mix-blend-overlay"
                             />
                             
                             <motion.div
                               animate={{ 
                                 opacity: [0, 0.2, 0],
                                 scale: [1, 1.05, 1]
                               }}
                               transition={{ duration: 0.5, repeat: Infinity }}
                               className="absolute inset-0 bg-stone-100 mix-blend-overlay"
                             />
                          </motion.div>
                        </>
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
                               <TribeIconComponent icon={tribe.icon} size={20} style={{ color: tribe.color }} />
                               {tribe.name}
                            </h3>
                         </div>
                         <div className="p-3 rounded-full bg-stone-950 border border-stone-800">
                            <TribeIconComponent icon={tribe.icon} size={24} style={{ color: tribe.color }} />
                         </div>
                      </div>

                      <div className="flex-grow p-4 relative z-10">
                         <div className="grid grid-cols-3 gap-2 relative">
                            <AnimatePresence mode="popLayout">
                              {tribe.playerIds.map(id => {
                                const player = players.find(p => p.id === id);
                                if (!player) return null;
                                
                                const eventIndex = revealEvents.findIndex(e => e.type === 'PLAYER_REVEAL' && e.playerId === id);
                                if (eventIndex === -1 || eventIndex > revealedCount) return null;
                                
                                return (
                                  <motion.div 
                                    key={id}
                                    initial={{ scale: 0.5, opacity: 0, scaleY: 0 }}
                                    animate={{ 
                                      scale: 1, 
                                      opacity: 1, 
                                      scaleY: 1,
                                    }}
                                    transition={{
                                      duration: 3.0,
                                      ease: [0.22, 1, 0.36, 1]
                                    }}
                                    className={cn(
                                      "relative p-3 bg-stone-800/80 rounded border-2 border-stone-700 shadow-xl group/token overflow-hidden flex items-center justify-center transition-all",
                                      isFinished ? "min-h-[50px]" : "min-h-[65px]",
                                      eventIndex === revealedCount && "ring-2 ring-torch-orange animate-pulse"
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
                                     {eventIndex === revealedCount && (
                                       <motion.div
                                          initial={{ width: 0, opacity: 0 }}
                                          animate={{ 
                                            width: ["0%", "100%", "0%"],
                                            opacity: [0, 0.4, 0],
                                            left: ["0%", "0%", "100%"]
                                          }}
                                          transition={{ duration: 3.0, ease: "easeInOut" }}
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
                {/* Addition: Assets in Tribes Summary header */}
                <div className="flex gap-8 items-center mr-8 hidden lg:flex">
                   <DetailedTikiMask variant={9} color="#d3a12a" scale={0.8} />
                   <DetailedTikiMask variant={10} color="#6a4d94" scale={0.8} />
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
                         <TribeIconComponent icon={tribe.icon} size={32} className="text-stone-900" />
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
                        <TribeIconComponent icon={tribeStat.icon} size={64} style={{ color: tribeStat.color }} />
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
