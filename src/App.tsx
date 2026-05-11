/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, type ReactNode, FormEvent } from 'react';
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
  Lock,
  ShieldCheck,
  Tent,
  Sun,
  Wind,
  Bird,
  Waves,
  Search,
  Sprout as Flower,
  Mars,
  Venus,
  MoreHorizontal,
  Download,
  Cloud,
  CloudUpload,
  Save,
  Loader2,
  Check,
  Play,
  LayoutGrid
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
  reputation?: string;
}

interface Tribe {
  id: string;
  name: string;
  color: string;
  playerIds: string[];
  icon: string;
}

type View = 'teams' | 'compose' | 'roster' | 'outplay' | 'member-roster';

type RevealEvent = 
  | { type: 'TRIBE_INTRO', tribeId: string }
  | { type: 'PLAYER_REVEAL', playerId: string };

// --- Constants ---
const TRIBAL_COLORS = [
  { name: 'Voyagers', value: '#3ebeb1', icon: 'Asset_1.png' },
  { name: 'StormBreakers', value: '#ca3729', icon: 'Asset_3.png' },
  { name: 'Keepers', value: '#d2672e', icon: 'Asset_4.png' },
  { name: 'Guardians', value: '#d3a12a', icon: 'Asset_5.png' },
  { name: 'Raiders', value: '#6a4d94', icon: 'Asset_6.png' },
  { name: 'PathFinders', value: '#6c7e35', icon: 'Asset_7.png' },
];

// --- Assets ---
const TIKI_ASSETS = [
  "Asset_1.png", "Asset_3.png", "Asset_4.png", "Asset_5.png", 
  "Asset_6.png", "Asset_7.png", "Asset_8.png", "Asset_9.png", 
  "Asset_10.png", "Asset_11.png", "Asset_12.png", "Asset_13.png"
];

const GENDERS: Gender[] = ['Male', 'Female', 'Other'];
const CATEGORIES: Category[] = ['Standard', 'Supervisor'];

const WITTY_DESCRIPTIONS = [
  "Can ignite a fire with just a stern look.",
  "Able to camouflage as a palm tree for up to 4 hours.",
  "Primary diet consists of coconut water and sheer ambition.",
  "Has a secret strategic alliance with a local hermit crab.",
  "Can solve a slide puzzle faster than they can find their keys.",
  "Speaks fluent Seagull and moderate Crab.",
  "Survived 3 days on nothing but willpower and one grape.",
  "Challenged the sun to a staring contest. The sun blinked first.",
  "Navigates the jungle using only the smell of distant coffee.",
  "Has 'Hidden Immunity Idol' vibes but it's just a cool rock.",
  "Legend says they once outrun a falling coconut.",
  "Can detect a betrayal from three islands away.",
  "Tactical genius. Specialized in bamboo-based architecture.",
  "Expert at avoiding eye contact during Tribal Council.",
  "Actually just here for the free island tan.",
  "Can weave a waterproof hammock using only sarcasm.",
  "Possesses the agility of a panther... after coffee.",
  "Once argued with a parrot and won the debate.",
  "Can charm a shark into giving up its lunch.",
  "Once convinced a rainstorm to move to the next island.",
  "Expert at making fire with two wet noodles and a dream.",
  "Calculates the trajectory of falling coconuts in their sleep.",
  "Has a standing appointment with the island's most influential crab.",
  "Secretly fluent in 'Tropical Bird' and moderate 'Tidal Wave'.",
  "Holds the record for the longest duration of holding a coconut while balancing on one leg.",
  "Can identify every type of type of sand by taste alone.",
  "Once successfully bartered a single sea shell for a four-course dinner.",
  "Expert at predicting Tribal Council drama based on wind direction.",
  "Can out-stare a grumpy iguana for 10 minutes straight.",
  "Has an uncanny ability to find the only spot on the island with zero mosquitoes.",
  "Knows exactly which palm leaf is the most aerodynamic.",
  "Can start a campfire by sheer willpower and a really good joke.",
  "Once out-danced a Sinulog queen during a tropical downpour.",
  "Possesses a mental map of every hidden immunity idol that hasn't been found yet.",
  "Can navigate the island using only the positions of sleeping monkeys.",
  "Legend says their footprint actually makes the sand whiter.",
  "Able to distinguish 50 different shades of 'Tropical Cyan'.",
  "Once used a pineapple as a defensive weapon against a very small crab.",
  "Has the highest recorded 'Tree-to-Ground' descent speed on the island.",
  "Can braid a sturdy rope out of seaweed and determination.",
  "Negotiated a trade deal between two rival fruit-bat colonies.",
  "Spends their free time teaching hermit crabs how to play 4D chess.",
  "Can predict low tide by the way their thumb twitches.",
  "Once held their breath so long the ocean thought they were a coral reef.",
  "Expert at crafting tactical advantages out of driftwood and optimism.",
  "Has a voice that can soothe a frantic parrot or start a Stampede.",
  "Can start a fire using only the reflection from a silver lining.",
  "Legendary navigator who once used a mango as a compass.",
  "Possesses the unique skill of 'Psychic Sand-Castle Engineering'.",
  "Can identify 12 types of hibiscus by their scent in a hurricane.",
  "Spends way too much time theorizing about the hidden society of beach-dwelling spiders.",
  "Once out-climbed a resident monkey for the last ripe banana.",
  "Has a secret recipe for 'Island Tea' that the local volcano highly approves of.",
  "Can weave a full tuxedo out of palm fronds in under 20 minutes.",
  "Negotiated a peace treaty between a tribe and a very persistent mosquito swarm.",
  "Known for having the most aerodynamic 'Survivor Buff' in island history.",
  "Once used a conch shell to broadcast a podcast to the local marine life.",
  "Expert at turning 'Island Hardships' into 'Strategic Marketing Opportunities'.",
  "Can summon a school of dolphins using only a rhythmic clapping sequence.",
  "Possesses an immunity to all forms of island-related fashion disasters.",
  "Once successfully convinced a cloud to provide shade for exactly 15 minutes.",
  "Can track a competitor based solely on the scent of their suntan lotion.",
  "Expert in 'Aggressive Bamboo Whittling' for psychological warfare.",
  "Can whistle a tune that makes coconuts drop exactly where they want.",
  "Once traded a cool rock for a 5-star resort-style bamboo hut.",
  "Has the uncanny ability to always find the 'sweet side' of a wild pineapple.",
  "Known for being able to meditate while being actively poked by a crab.",
  "Can predict a blindside by monitoring the heart rate of a nearby seagull.",
  "Once successfully audited the island's entire sand depository.",
  "Expert at navigating the social hierarchy of a group of wild boars.",
  "Can start a fire by rubbing two very enthusiastic sticks together.",
  "Has a PhD in 'Island Logistics' from the University of Drifting Logs.",
  "Once out-survived a survival instructor in a 1-on-1 dehydration contest.",
  "Known for being the only person to keep a secret from the island's gossiping birds.",
  "Can craft a fully functional surfboard out of an old crate and sheer luck.",
  "Once interpreted a sunset as a detailed 5-year strategic plan.",
  "Has an honorary degree in 'Coral Reef Diplomacy'.",
  "Can identify a traitor by the way they peel a banana.",
  "Once used a starfish as a stylish (but temporary) broach.",
  "Expert at finding the most dramatic lighting for their Tribal Council confessionals.",
  "Can predict the winning tribe based on the flight paths of dragonflies.",
  "Once survived a week on nothing but 'Island Vibes' and a single lime.",
  "Has the agility of a panther... specifically one that is very late for a nap.",
  "Can weave a waterproof hat out of bad luck and palm leaves.",
  "Once successfully convinced a volcano not to erupt until after the outing.",
  "Has a collection of 'Lucky Shells' that actually seem to be working.",
  "Expert at determining the exact age of a coconut by tapping it with a rhythm.",
  "Can identify a fake immunity idol by licking it (not recommended).",
  "Once choreographed a dance routine for a confused group of iguanas.",
  "Has the most meticulously organized shelter in 'Survivor' history.",
  "Can find the 'North' using only the way moss grows on a discarded flip-flop.",
  "Once used a signal mirror to accidentally discover a new coordinate system.",
  "Expert at making island-style cocktails using only naturally occurring ingredients.",
  "Can hear the sound of a closing alliance from across the lagoon.",
  "Once successfully negotiated a rent-controlled agreement with a group of tree-shrews.",
  "Has the most infectious laugh on the island—it's actually a tactical distraction.",
  "Can craft a pair of sandals out of coconut husks and pure spite.",
  "Once out-stared a tropical storm until it decided to rain elsewhere.",
  "Expert at interpreting the subtle social cues of the island's resident turtle.",
  "Can find a four-leaf clover in a field of poisonous ivy (don't ask how).",
  "Once used a bamboo pole to 'Vault' over a strategic disagreement.",
  "Has an internal clock that is accurate to the millisecond of high tide."
];

const SPECIAL_REPUTATIONS: Record<string, string> = {
  "Margaux Kylie Cañete": "Former title holder of Miss Carcar 2024. Currently defending her crown against a highly judgmental group of seagulls.",
  "Margaux Canete": "Former title holder of Miss Carcar 2024. Currently defending her crown against a highly judgmental group of seagulls.",
  "Marvin Keith Tan": "Richest man in Kinettix. Elon Musk of Cebu. Currently negotiating an acquisition of the Pacific Ocean while optimizing his hydration-to-hustle ratios.",
  "Ariel Tabacolde": "A person who brushes his teeth 10 times a day. Has the brightest smile in the archipelago and can blind opponents during challenges with a single grin.",
  "Jennelyn Oporto": "Recently won the title Little Miss Bacayan 2026. Her strategic brilliance is only matched by her ability to negotiate peace between feuding island monkeys.",
  "WhiteMillen Ponsica": "Can perform accounting using roman numerals in Braille System. Can audit the entire island's coconut inventory while blindfolded and submerged in salt water.",
  "Jason Mondejar": "Former title holder of Mister Compostela 2024. All the girls from lapu lapu city loves him. Currently considering a move into aquatic fashion design.",
  "Fionah Sophia Monisit": "Former Sarok Festival Queen of 2025, she can dance the ghosts away. Her footwork is so fast she can actually walk on coconut milk.",
  "Michael Amores": "She hates exercise, but does it anyway in her mind. A gold medalist in mental marathons and hypothetical heavy lifting.",
  "Benny Ong": "Unofficial and hidden member of the P-Pop Girl Group BINI. Often seen practicing choreographies with confused hermit crabs under the moonlight.",
  "Neil Joshua Paradero": "He loves to perform during christmass parties. Once sang Jingle Bells so passionately that a tropical storm decided to skip the island.",
  "Mil Matthew Malinao": "Soon to be groom. Already practicing his 'I do' while dodging falling coconuts and sand-fly invasions.",
  "Riffy Campo": "The most popular governor in Kinettix. Her campaign platform consists entirely of 'More Coconuts for Everyone' and 'Mandatory Island Siestas'.",
  "Catherine Ballena": "The dancing zumba queen of Kinettix. Can maintain a perfect squat while balance-testing a tribe's strategic alliance.",
  "Kein Negre": "Can summit mount busay by running backwards with one foot. Currently using this skill to retreat from complex social situations and incoming Tribal Councils.",
  "Klyde Elydom Etang": "His inspiration is from his multiple children. He has mastered the art of lightning-fast reflexes, primarily from years of catching falling juice boxes and dodging airborne LEGO bricks.",
  "Carmel Grace Basalo": "Pickleball pro player, part time accountant. Can calculate your taxes while delivering a 60mph serve. If you see her with a paddle and a ledger, run.",
  "Mary Louise Duaban": "Can perform accounting with her eyes closed and hands tied behind her back. She’s currently auditing the wind to ensure the trade winds are staying within budget.",
  "Crystel Mae Pontino": "Most successful businesswoman in Kinettix. She can turn a handful of sand into a profitable resort chain before the tide even comes in.",
  "Cecilio Ramirez": "Successful food entrepreneur. He can whip up a five-course gourmet meal using only a rusty spoon, a coconut, and sheer willpower."
};

const getWittyReputation = (name: string, excluded: Set<string>): string => {
  const trimmedName = name.trim();
  if (SPECIAL_REPUTATIONS[trimmedName]) return SPECIAL_REPUTATIONS[trimmedName];
  
  // Find standard ones that aren't used
  const available = WITTY_DESCRIPTIONS.filter(d => !excluded.has(d));
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  
  // Fallback if we run out (unlikely with 100+)
  return WITTY_DESCRIPTIONS[Math.floor(Math.random() * WITTY_DESCRIPTIONS.length)];
};

const getPlayerStats = (player: Player) => {
  const seed = player.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const getVal = (offset: number) => 60 + ((seed * offset) % 40);
  
  return {
    strength: getVal(7),
    agility: getVal(13),
    intel: getVal(19),
    spirit: getVal(23),
    description: player.reputation || "The silent strategist of the island."
  };
};

// --- Tiki Mask Wrapper ---
const DetailedTikiMask = ({ variant = 1, color, delay = 0, scale = 1, assetName: forcedAssetName }: { variant?: number; color: string; delay?: number; scale?: number; assetName?: string }) => {
  const assetIndex = (variant - 1) % TIKI_ASSETS.length;
  const assetName = forcedAssetName || TIKI_ASSETS[assetIndex >= 0 ? assetIndex : 0];
  
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
        src={`${import.meta.env.BASE_URL}assets/${assetName}`} 
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<View>('member-roster');
  const [rawPlayersInput, setRawPlayersInput] = useState('');
  const [loginStep1, setLoginStep1] = useState('');
  const [loginStep2, setLoginStep2] = useState('');
  const [loginError, setLoginError] = useState(false);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (loginStep1.toLowerCase() === 'one punch man' && loginStep2.toLowerCase() === 'saitama') {
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const navToSetup = () => {
    setIsAuthenticated(false);
    setLoginStep1('');
    setLoginStep2('');
    setLoginError(false);
    setCurrentView('roster');
  };

  useEffect(() => {
    if (currentView !== 'roster') {
      setIsAuthenticated(false);
      setLoginStep1('');
      setLoginStep2('');
      setLoginError(false);
    }
  }, [currentView]);
  const [revealEvents, setRevealEvents] = useState<RevealEvent[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [inductionOverlayDismissed, setInductionOverlayDismissed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const saveToGoogleSheets = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      // Prepare data for Google Sheets: name, tribe, supervisor in that order
      const dataToSave = players
        .filter(p => tribes.some(t => t.playerIds.includes(p.id)))
        .map(p => ({
          name: p.name,
          tribe: tribes.find(t => t.playerIds.includes(p.id))?.name || 'N/A',
          supervisor: p.supervisorName || 'N/A'
        }));

      console.log('Syncing data to Google Sheets:', dataToSave);

      // Using an object envelope to ensure the script has context
      const payload = {
        action: 'saveTribes',
        timestamp: new Date().toISOString(),
        rows: dataToSave
      };

      // Sending via text/plain with no-cors to handle GAS redirection and CORS restrictions
      await fetch("https://script.google.com/macros/s/AKfycbyaLTqpOOj2bNO0coHaLjpHdOdtC6vu1JmSH-Bujiuc3dzdPEJN1k50zoQlaTtqAij5/exec", {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload),
      });

      // Verification: Since we use no-cors, we can't read the response.
      // We assume success if the fetch promise resolves without timing out or erroring.
      console.log('Sync request successfully dispatched to Google Apps Script.');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      alert('Failed to save data. Please check your connection.');
    } finally {
      setIsSaving(false);
    }
  };
  const [selectedTribeId, setSelectedTribeId] = useState<string | null>(null);
  const [vitalsSearch, setVitalsSearch] = useState('');
  const [isPlayMode, setIsPlayMode] = useState(false);
  const [currentPlayIndex, setCurrentPlayIndex] = useState(0);

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlayMode) {
      interval = setInterval(() => {
        setCurrentPlayIndex(prev => prev + 1);
      }, 6000);
    }
    return () => clearInterval(interval);
  }, [isPlayMode]);

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
    setSelectedTribeId(null);
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
      if (revealedCount === -1) {
        return; // Wait for manual start
      }
      
      // Check if current reveal just completed a tribe
      const currentEvent = revealEvents[revealedCount];
      let isTribeCompletionPause = false;
      
      if (currentEvent?.type === 'PLAYER_REVEAL') {
        const tribe = tribes.find(t => t.playerIds.includes(currentEvent.playerId));
        const isLastInTribe = tribe?.playerIds[tribe.playerIds.length - 1] === currentEvent.playerId;
        if (isLastInTribe) {
          isTribeCompletionPause = true;
        }
      }

      if (isTribeCompletionPause) {
        return; // Wait for manual proceed
      }
      
      let delay = 2000;
      
      if (currentEvent?.type === 'TRIBE_INTRO') {
        delay = 3000; // Pause for tribe intro
      } else if (currentEvent?.type === 'PLAYER_REVEAL') {
        // We already checked for isLastInTribe above, which returns, 
        // so if we are here it's just a normal player reveal
        delay = 2000;
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
    if (icon && icon.startsWith('Asset')) {
      return (
        <img 
          src={`${import.meta.env.BASE_URL}assets/${icon}`} 
          style={{ ...style, width: size, height: size, objectFit: 'contain' }} 
          className={cn("drop-shadow-md", className)}
          alt="Tribe Symbol"
        />
      );
    }
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
        <NavButton active={currentView === 'member-roster'} onClick={() => setCurrentView('member-roster')} icon={<UserCheck size={18} />} label="Member Roster" />
        <NavButton active={currentView === 'roster'} onClick={navToSetup} icon={<MapIcon size={18} />} label="Setup" />
        <NavButton 
          active={currentView === 'teams'} 
          onClick={() => {
            setCurrentView('teams');
            setSelectedTribeId(null);
          }} 
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
          label="Metrics" 
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
        (currentView === 'teams' || currentView === 'member-roster') ? "max-w-none w-[98%]" : "max-w-7xl"
      )}>
        <AnimatePresence mode="wait">
          {currentView === 'member-roster' && (
            <motion.div 
              key="member-roster"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              <div className="flex flex-col gap-2">
                <h2 className="font-display text-5xl text-stone-100 tracking-widest">MEMBER ROSTER</h2>
                <div className="flex items-center gap-3 text-stone-500">
                  <UserCheck size={20} />
                  <span className="uppercase tracking-[0.3em] text-xs">Official Tribe Assignment</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-500">
                      <Search size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Find your name..."
                      value={vitalsSearch}
                      onChange={(e) => setVitalsSearch(e.target.value)}
                      className="w-full bg-stone-900/40 border-2 border-stone-800 rounded-2xl py-3 pl-12 pr-4 text-stone-100 font-display tracking-widest focus:outline-none focus:border-torch-orange/50 transition-all placeholder:text-stone-600"
                    />
                  </div>
                </div>

                <div className="hawaiian-card overflow-hidden border-stone-800/40 bg-stone-900/20 backdrop-blur-sm">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left font-display">
                      <thead>
                        <tr className="bg-stone-950/60 text-stone-500 text-xs tracking-[0.3em] uppercase">
                          <th className="px-10 py-6 w-24">#</th>
                          <th className="px-10 py-6">Castaway</th>
                          <th className="px-10 py-6">Tribe</th>
                          <th className="px-10 py-6">Reputation</th>
                          <th className="px-10 py-6 text-right">Power Vitals</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800/40">
                        {players
                          .filter(p => {
                            const searchLower = vitalsSearch.toLowerCase();
                            return p.name.toLowerCase().includes(searchLower) || 
                                   (p.supervisorName || '').toLowerCase().includes(searchLower);
                          })
                          .map((player, pIdx) => {
                            const tribe = tribes.find(t => t.playerIds.includes(player.id));
                            if (!tribe) return null;
                            const stats = getPlayerStats(player);
                            
                            return (
                              <motion.tr 
                                key={player.id}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: pIdx * 0.01 }}
                                viewport={{ once: true }}
                                className="hover:bg-stone-800/40 transition-colors group/row"
                              >
                                <td className="px-10 py-8">
                                  <div className="text-stone-500 font-mono text-sm">
                                    {String(pIdx + 1).padStart(2, '0')}
                                  </div>
                                </td>
                                <td className="px-10 py-8">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl text-stone-100 group-hover/row:text-sand transition-colors font-display tracking-tight">
                                        {player.name}
                                      </span>
                                      <div className="opacity-60 group-hover/row:opacity-100 transition-opacity">
                                        {player.gender === 'Male' ? <Mars size={18} className="text-sky-400" /> : player.gender === 'Female' ? <Venus size={18} className="text-rose-400" /> : <MoreHorizontal size={18} className="text-stone-500" />}
                                      </div>
                                    </div>
                                    <span className="text-stone-500 text-xs uppercase tracking-widest font-mono">
                                      Sup: {player.supervisorName || '—'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-10 py-8">
                                  <div className="flex items-center gap-4">
                                    <div className="w-5 h-5 rounded-full shadow-lg" style={{ backgroundColor: tribe.color }} />
                                    <span className="text-stone-300 tracking-[0.2em] text-base uppercase font-display">{tribe.name}</span>
                                  </div>
                                </td>
                                <td className="px-10 py-8 max-w-sm">
                                  <p className="font-hand text-xl text-sand/70 leading-tight italic">"{stats.description}"</p>
                                </td>
                                <td className="px-10 py-8 text-right flex justify-end">
                                  <div className="flex flex-col gap-3 w-64">
                                    <div className="flex items-center justify-between text-xs uppercase tracking-tighter text-stone-500">
                                      <span>STR / AGI / INT</span>
                                      <span>{Math.round((stats.strength + stats.agility + stats.intel) / 3)} MAX</span>
                                    </div>
                                    <div className="flex gap-1 h-2 w-full bg-stone-950 rounded-full overflow-hidden">
                                      <div title={`Strength: ${stats.strength}`} className="h-full bg-torch-red" style={{ width: `${stats.strength/3}%` }} />
                                      <div title={`Agility: ${stats.agility}`} className="h-full bg-lagoon" style={{ width: `${stats.agility/3}%` }} />
                                      <div title={`Intelligence: ${stats.intel}`} className="h-full bg-sky-500" style={{ width: `${stats.intel/3}%` }} />
                                    </div>
                                    <div className="flex items-center gap-6 mt-1 justify-end">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-torch-red" />
                                        <span className="text-[10px] text-stone-500">S:{stats.strength}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-lagoon" />
                                        <span className="text-[10px] text-stone-500">A:{stats.agility}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-sky-500" />
                                        <span className="text-[10px] text-stone-500">I:{stats.intel}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </motion.tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'roster' && (
            <motion.div 
              key="roster"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              {!isAuthenticated ? (
                <div className="flex flex-col items-center justify-center py-20 px-6">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-md bg-stone-900/60 backdrop-blur-2xl border-2 border-stone-800 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Lock size={120} />
                    </div>
                    
                    <div className="relative z-10 text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-800 text-torch-orange mb-4 shadow-inner">
                        <ShieldCheck size={32} />
                      </div>
                      <h2 className="font-display text-4xl text-stone-100 tracking-[0.2em] mb-2 uppercase">Command Center</h2>
                      <p className="text-stone-500 text-sm uppercase tracking-widest font-mono">Restricted Access Territory</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                      <div className="space-y-2">
                        <label className="block text-[10px] text-stone-500 uppercase tracking-[0.3em] ml-4">Primary Clearance</label>
                        <input
                          type="password"
                          value={loginStep1}
                          onChange={(e) => setLoginStep1(e.target.value)}
                          className="w-full bg-stone-950/60 border-2 border-stone-800 rounded-2xl py-4 px-6 text-stone-100 focus:outline-none focus:border-torch-orange/50 transition-all text-center tracking-[1em]"
                          placeholder="••••••••••"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-[10px] text-stone-500 uppercase tracking-[0.3em] ml-4">Secondary Key</label>
                        <input
                          type="password"
                          value={loginStep2}
                          onChange={(e) => setLoginStep2(e.target.value)}
                          className="w-full bg-stone-950/60 border-2 border-stone-800 rounded-2xl py-4 px-6 text-stone-100 focus:outline-none focus:border-torch-orange/50 transition-all text-center tracking-[1em]"
                          placeholder="••••••••••"
                        />
                      </div>

                      <AnimatePresence>
                        {loginError && (
                          <motion.p 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-torch-red text-center text-xs tracking-widest uppercase font-mono"
                          >
                            Incorrect Credentials
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <button 
                        type="submit"
                        className="w-full py-5 bg-gradient-to-r from-torch-orange to-stone-900 rounded-2xl font-display text-stone-100 tracking-[0.4em] uppercase hover:scale-[1.02] active:scale-95 transition-all shadow-lg hover:shadow-torch-orange/20"
                      >
                        Enter Terminal
                      </button>
                    </form>
                  </motion.div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
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
                <div className="absolute top-20 -left-10 opacity-10 pointer-events-none">
                   <DetailedTikiMask variant={5} color="#0ea5e9" scale={0.4} />
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
                <div className="absolute top-1/2 -right-8 opacity-10 pointer-events-none rotate-12">
                   <DetailedTikiMask variant={7} color="#ef4444" scale={0.3} />
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
                            const usedReps = new Set(players.map(p => p.reputation).filter(Boolean) as string[]);
                            
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
                              
                              let finalGender = gender;
                              if (name.toUpperCase() === "RIFFY CAMPO") {
                                finalGender = 'Female';
                              }
                              
                              const reputation = getWittyReputation(name, usedReps);
                              usedReps.add(reputation);
                              
                              return { 
                                id: crypto.randomUUID(), 
                                name, 
                                gender: finalGender, 
                                category, 
                                supervisorName,
                                reputation
                              };
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
                </div>
              )}
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
                  <div className="fixed left-2 top-1/2 -translate-y-1/2 z-[100] pointer-events-none hidden xl:flex flex-col gap-12 opacity-60">
                     <motion.div
                       animate={{ 
                         y: [0, -20, 0],
                         rotate: [-5, 5, -5],
                       }}
                       transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                     >
                        <DetailedTikiMask variant={1} color="#f59e0b" scale={0.8} delay={0} />
                     </motion.div>
                     <motion.div
                       animate={{ 
                         y: [0, 20, 0],
                         rotate: [5, -5, 5],
                       }}
                       transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                     >
                        <DetailedTikiMask variant={3} color="#ef4444" scale={0.6} delay={0.2} />
                     </motion.div>
                  </div>
                  <div className="fixed right-2 top-1/2 -translate-y-1/2 z-[100] pointer-events-none hidden xl:flex flex-col gap-12 opacity-60">
                     <motion.div
                       animate={{ 
                         y: [0, 20, 0],
                         rotate: [10, -10, 10],
                       }}
                       transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                     >
                        <DetailedTikiMask variant={7} color="#3b82f6" scale={0.8} delay={0.1} />
                     </motion.div>
                     <motion.div
                       animate={{ 
                         y: [0, -20, 0],
                         rotate: [-10, 10, -10],
                       }}
                       transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                     >
                        <DetailedTikiMask variant={12} color="#10b981" scale={0.6} delay={0.4} />
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
                      RISE, TRIBE KINETTIX!
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
                  ? (selectedTribeId ? "flex flex-col items-center" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start") 
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
                             <Skull size={100} className="text-torch-orange mx-auto drop-shadow-[0_0_20px_rgba(249,115,22,0.6)]" />
                           </motion.div>
                           
                           <h1 className="font-display text-6xl md:text-8xl lg:text-9xl text-stone-100 tracking-[0.4em] uppercase mb-4 drop-shadow-[0_10px_30px_rgba(0,0,0,1)]">
                             THE TRIBAL ASSEMBLY
                           </h1>
                           <motion.p 
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             transition={{ delay: 1.5, duration: 1 }}
                             className="font-display text-3xl md:text-4xl text-sand tracking-[0.6em] uppercase opacity-60 mb-12"
                           >
                             BEGINS
                           </motion.p>

                           {/* Row of all 6 Tribes */}
                           <div className="flex flex-wrap justify-center gap-8 md:gap-12 mt-12 max-w-6xl mx-auto">
                             {tribes.map((t, idx) => (
                               <motion.div
                                 key={t.id}
                                 initial={{ y: 50, opacity: 0, scale: 0.8 }}
                                 animate={{ y: 0, opacity: 1, scale: 1 }}
                                 transition={{ delay: 1 + (idx * 0.1), duration: 0.8 }}
                                 className="flex flex-col items-center gap-4 group"
                               >
                                 <div className="relative p-6 bg-stone-900/60 border-2 border-stone-800 rounded-[2rem] shadow-2xl transition-transform hover:scale-110">
                                   <div className="absolute inset-0 blur-2xl opacity-10 rounded-full" style={{ backgroundColor: t.color }} />
                                   <TribeIconComponent icon={t.icon} size={64} style={{ color: t.color }} className="relative z-10" />
                                   
                                   {/* Decorative Ring */}
                                   <div className="absolute -inset-2 border-2 border-stone-800/50 rounded-[2.5rem] pointer-events-none" />
                                 </div>
                                 <div className="flex flex-col items-center">
                                   <span className="font-display text-lg text-stone-100 tracking-widest uppercase" style={{ textShadow: `0 0 10px ${t.color}44` }}>
                                     {t.name}
                                   </span>
                                   <div className="w-12 h-1 mt-2 rounded-full" style={{ backgroundColor: t.color }} />
                                 </div>
                               </motion.div>
                             ))}
                           </div>

                           <motion.div
                             initial={{ opacity: 0, scale: 0.8 }}
                             animate={{ opacity: 1, scale: 1 }}
                             transition={{ delay: 2.5, duration: 0.8 }}
                             className="mt-16 relative z-30"
                           >
                             <button 
                               onClick={() => setRevealedCount(0)}
                               className="group relative px-20 py-8 overflow-hidden rounded-full transition-all hover:scale-110 active:scale-95 shadow-[0_0_50px_rgba(249,115,22,0.4)] active:shadow-inner"
                             >
                                <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-xl border-4 border-torch-orange/50 rounded-full group-hover:border-torch-orange transition-colors" />
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-torch-orange/20 animate-shimmer" />
                                <span className="relative z-10 flex items-center gap-6 font-display text-4xl text-stone-100 tracking-[0.5em] uppercase">
                                  PROCEED <ChevronRight size={40} className="text-torch-orange group-hover:translate-x-3 transition-transform" />
                                </span>
                             </button>
                           </motion.div>
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
                        {/* Celebration Dancing Group - All Assigned Tribes */}
                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-12 md:px-24 pb-12 opacity-30 pointer-events-none">
                          {tribes.map((t, idx) => (
                            <motion.div
                              key={`final-${t.id}`}
                              animate={{ 
                                y: [0, -40, 0],
                                rotate: [-10, 10, -10]
                              }}
                              transition={{ 
                                duration: 3 + Math.random() * 2, 
                                repeat: Infinity, 
                                ease: "easeInOut",
                                delay: idx * 0.3
                              }}
                            >
                              <DetailedTikiMask assetName={t.icon} color={t.color} scale={0.7} />
                            </motion.div>
                          ))}
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
                            THE TRIBAL ASSEMBLY
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
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 1.4 }}
                              disabled={isSaving || saveSuccess}
                              onClick={saveToGoogleSheets}
                              className={cn(
                                "flex items-center gap-3 px-10 py-4 font-display tracking-widest uppercase rounded-full transition-all shadow-lg pointer-events-auto",
                                saveSuccess 
                                  ? "bg-green-600 text-white" 
                                  : "bg-lagoon hover:bg-ocean-blue text-white hover:shadow-lagoon/20"
                              )}
                            >
                              {isSaving ? (
                                <Loader2 size={20} className="animate-spin" />
                              ) : saveSuccess ? (
                                <Check size={20} />
                              ) : (
                                <CloudUpload size={20} />
                              )}
                              <span>{isSaving ? 'Syncing...' : saveSuccess ? 'Saved to Sheet' : 'Save to Registry'}</span>
                            </motion.button>

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
                             className="hidden lg:block opacity-30 hover:opacity-80 transition-opacity"
                           >
                              <DetailedTikiMask assetName={tribe.icon} color={tribe.color} scale={1.0} />
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
                             className="hidden lg:block opacity-30 hover:opacity-80 transition-opacity"
                           >
                              <DetailedTikiMask assetName={tribe.icon} color={tribe.color} scale={1.0} />
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

                  if (selectedTribeId && isAllRevealed) {
                    const selectedTribe = tribes.find(t => t.id === selectedTribeId);
                    if (!selectedTribe) return null;

                    return (
                      <motion.div 
                        key="tribe-detail"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="w-full max-w-[95rem] bg-stone-900/40 backdrop-blur-xl rounded-[4rem] border-4 border-stone-800 p-10 md:p-16 relative overflow-hidden shadow-2xl"
                        style={{ borderColor: selectedTribe.color }}
                      >
                         {/* Background Pattern */}
                         <div className="absolute inset-0 opacity-10 pointer-events-none polynesian-pattern" />
                         
                         {/* Header */}
                         <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12 relative z-10 border-b border-stone-800 pb-8">
                            <div className="flex items-center gap-8">
                               <div className="p-6 bg-stone-950 border-4 border-stone-800 rounded-3xl shadow-xl relative group">
                                  <TribeIconComponent icon={selectedTribe.icon} size={80} style={{ color: selectedTribe.color }} />
                                  <div className="absolute inset-0 blur-2xl opacity-20 bg-current rounded-full" style={{ color: selectedTribe.color }} />
                               </div>
                               <div className="text-left">
                                  <h2 className="font-display text-7xl text-stone-100 tracking-widest uppercase mb-2" style={{ textShadow: `0 0 20px ${selectedTribe.color}44` }}>
                                     {selectedTribe.name}
                                  </h2>
                                  <div className="flex items-center gap-4 text-stone-500 font-display tracking-[0.3em] text-sm uppercase">
                                     <Waves size={16} />
                                     <span>Established Kinettix Tribe</span>
                                     <Waves size={16} />
                                  </div>
                               </div>
                            </div>
                            
                            <button 
                              onClick={() => setSelectedTribeId(null)}
                              className="px-8 py-3 bg-stone-800 hover:bg-stone-700 text-sand font-display tracking-widest uppercase rounded-full transition-all border border-stone-700 hover:border-sand group/back"
                            >
                               <ChevronRight className="inline-block mr-2 rotate-180 group-hover/back:-translate-x-1 transition-transform" /> Back to Tribes
                            </button>
                         </div>

                         {/* Content Grid */}
                         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
                            {/* Table Section */}
                            <div className="lg:col-span-8">
                               <div className="overflow-hidden rounded-3xl border-2 border-stone-800 bg-stone-950/60 shadow-2xl">
                                  <table className="w-full text-left font-display">
                                     <thead>
                                        <tr className="bg-stone-900/80 text-stone-500 text-xs tracking-[0.2em] uppercase">
                                           <th className="px-6 py-4">#</th>
                                           <th className="px-6 py-4">Castaway</th>
                                           <th className="px-6 py-4">Gender</th>
                                           <th className="px-6 py-4">Supervisor</th>
                                        </tr>
                                     </thead>
                                     <tbody className="divide-y divide-stone-800">
                                        {selectedTribe.playerIds.map((pid, idx) => {
                                           const player = players.find(p => p.id === pid);
                                           if (!player) return null;
                                           return (
                                              <motion.tr 
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={pid} 
                                                className="hover:bg-stone-800/30 transition-colors group/row"
                                              >
                                                 <td className="px-6 py-5 text-stone-600 font-mono">{(idx + 1).toString().padStart(2, '0')}</td>
                                                 <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                       <span className="text-xl text-stone-100 group-hover/row:text-sand transition-colors">{player.name}</span>
                                                       <span className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">Castaway</span>
                                                    </div>
                                                 </td>
                                                 <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                       {player.gender === 'Male' ? (
                                                         <Mars size={18} className="text-sky-400" />
                                                       ) : player.gender === 'Female' ? (
                                                         <Venus size={18} className="text-rose-400" />
                                                       ) : (
                                                         <MoreHorizontal size={18} className="text-stone-400" />
                                                       )}
                                                       <span className="text-xs text-stone-400 uppercase tracking-widest">{player.gender}</span>
                                                    </div>
                                                 </td>
                                                 <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                       <span className="text-lg text-sand/80 font-medium">{player.supervisorName || '—'}</span>
                                                       <span className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">Lead Supervisor</span>
                                                    </div>
                                                 </td>
                                              </motion.tr>
                                           );
                                        })}
                                     </tbody>
                                  </table>
                               </div>
                            </div>

                            {/* Dancing Mascot Section */}
                            <div className="lg:col-span-4 flex flex-col items-center justify-center relative py-12">
                               <div className="absolute inset-0 bg-gradient-to-t from-stone-950 to-transparent flex items-end justify-center">
                                  <div className="w-full h-1/2 blur-3xl opacity-20" style={{ backgroundColor: selectedTribe.color }} />
                                </div>
                               
                               <motion.div
                                 animate={{ 
                                   y: [0, -30, 0],
                                   rotate: [-8, 8, -8],
                                   scale: [1, 1.1, 1]
                                 }}
                                 transition={{ 
                                   duration: 5, 
                                   repeat: Infinity, 
                                   ease: "easeInOut" 
                                 }}
                                 className="relative z-20"
                               >
                                  <div className="absolute -inset-20 blur-[60px] opacity-20 rounded-full" style={{ backgroundColor: selectedTribe.color }} />
                                  <DetailedTikiMask assetName={selectedTribe.icon} color={selectedTribe.color} scale={1.5} />
                               </motion.div>

                               <div className="mt-12 text-center relative z-20">
                                  <p className="font-hand text-3xl text-sand/60 italic">The choice is made.</p>
                                  <div className="mt-4 flex justify-center gap-6 opacity-30">
                                     <Flower className="animate-spin-slow text-hibiscus" />
                                     <Waves className="animate-sway text-ocean-blue" />
                                     <Flower className="animate-spin-slow text-hibiscus" />
                                  </div>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    );
                  }

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
                        onClick={() => {
                          if (isAllRevealed) setSelectedTribeId(tribe.id);
                        }}
                        className={cn(
                          "hawaiian-card flex flex-col group border-4 h-full relative overflow-hidden transition-all duration-300",
                          !isAllRevealed ? "w-full max-w-4xl min-h-[600px]" : "w-full min-h-[280px] cursor-pointer hover:shadow-2xl hover:-translate-y-1 active:scale-95",
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

                         {tribeIsFilled && !isAllRevealed && (
                           <motion.div 
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                             className="mt-8 flex justify-center"
                           >
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setRevealedCount(prev => prev + 1);
                               }}
                               className="group relative px-12 py-5 overflow-hidden rounded-full transition-all hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(249,115,22,0.3)]"
                             >
                               <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xl border-2 border-torch-orange/50 rounded-full group-hover:border-torch-orange transition-colors" />
                               <span className="relative z-10 flex items-center gap-3 font-display text-xl text-stone-100 tracking-widest uppercase">
                                 PROCEED <ChevronRight size={24} className="text-torch-orange group-hover:translate-x-2 transition-transform" />
                               </span>
                             </button>
                           </motion.div>
                         )}
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
                <div className="flex gap-4 items-center mr-8 hidden lg:flex opacity-60">
                   <DetailedTikiMask variant={9} color="#d3a12a" scale={0.4} />
                   <DetailedTikiMask variant={10} color="#6a4d94" scale={0.4} />
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => window.print()} 
                    className="p-4 bg-stone-800 border-2 border-stone-700 text-lagoon rounded-full hover:scale-110 shadow-lg hover:border-lagoon transition-all"
                    title="Print Tribal Decree"
                  >
                    <Scroll size={28} />
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
                                </div>
                                <div className="flex flex-col gap-1 mt-2">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 opacity-70">
                                      {player?.gender === 'Male' ? (
                                        <Mars size={14} className="text-ocean-blue" />
                                      ) : player?.gender === 'Female' ? (
                                        <Venus size={14} className="text-hibiscus" />
                                      ) : (
                                        <MoreHorizontal size={14} className="text-stone-500" />
                                      )}
                                      <span className="font-display text-[10px] text-stone-600 uppercase tracking-widest">{player?.gender}</span>
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-stone-300" />
                                    <div className="flex items-center gap-1.5 opacity-70">
                                      <Shield size={12} className="text-stone-400" />
                                      <span className="font-display text-[10px] text-stone-600 uppercase tracking-widest">
                                        Sup: {player?.supervisorName || player?.category || 'None'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
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
              {(() => {
                const filteredPlayers = players.filter(p => {
                  const searchLower = vitalsSearch.toLowerCase();
                  return p.name.toLowerCase().includes(searchLower) || 
                         (p.supervisorName || '').toLowerCase().includes(searchLower);
                });

                return (
                  <>
                    <div className="flex flex-col gap-2">
                <h2 className="font-display text-5xl text-stone-100 tracking-widest">OUTWIT / OUTPLAY</h2>
                <div className="flex items-center gap-3 text-stone-500">
                  <BarChart3 size={20} />
                   <span className="uppercase tracking-[0.3em] text-xs">Island Balance Metrics</span>
                </div>
              </div>

              {/* Advanced Survivor Vitals Table */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                  <h3 className="font-display text-3xl text-stone-100 tracking-widest">SURVIVOR VITALS & WIT</h3>
                  <div className="px-4 py-1 bg-torch-orange/10 border border-torch-orange/20 rounded-full">
                    <span className="text-[10px] font-display text-torch-orange uppercase tracking-[0.2em]">Live Simulation Data</span>
                  </div>
                </div>

                {/* Search & Mode Toggle */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-500">
                      <Search size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Search survivors or supervisors..."
                      value={vitalsSearch}
                      onChange={(e) => setVitalsSearch(e.target.value)}
                      className="w-full bg-stone-900/40 border-2 border-stone-800 rounded-2xl py-3 pl-12 pr-4 text-stone-100 font-display tracking-widest focus:outline-none focus:border-torch-orange/50 transition-all placeholder:text-stone-600"
                    />
                  </div>
                  
                  <button
                    onClick={() => setIsPlayMode(!isPlayMode)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-2xl font-display tracking-[0.2em] transition-all",
                      isPlayMode 
                        ? "bg-stone-800 text-stone-300 border-2 border-stone-700" 
                        : "bg-torch-orange text-stone-900 border-2 border-torch-orange/50 shadow-[0_0_20px_rgba(249,115,22,0.3)] animate-pulse"
                    )}
                  >
                    {isPlayMode ? <LayoutGrid size={20} /> : <Play size={20} />}
                    {isPlayMode ? "VIEW TABLE" : "PLAY MODE"}
                  </button>
                </div>

                {!isPlayMode ? (
                  <div className="hawaiian-card overflow-hidden border-stone-800/40 bg-stone-900/20 backdrop-blur-sm">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left font-display">
                        <thead>
                          <tr className="bg-stone-950/60 text-stone-500 text-[10px] tracking-[0.3em] uppercase">
                            <th className="px-8 py-5">Survivor</th>
                            <th className="px-8 py-5">Tribe</th>
                            <th className="px-8 py-5">Island Reputation</th>
                            <th className="px-8 py-5">Power Vitals</th>
                            <th className="px-8 py-5 text-right">Survival %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800/40">
                          {filteredPlayers.map((player, pIdx) => {
                            // Gender Override for Riffy Campo
                            let p = { ...player };
                            if (p.name === "Riffy Campo") {
                              p.gender = 'Female';
                            }

                            const tribe = tribes.find(t => t.playerIds.includes(p.id));
                            if (!tribe) return null;
                            const stats = getPlayerStats(p);
                            
                            return (
                              <motion.tr 
                                key={p.id}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: pIdx * 0.02 }}
                                viewport={{ once: true }}
                                className="hover:bg-stone-800/40 transition-colors group/row"
                              >
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-stone-950 border-2 border-stone-800 flex items-center justify-center text-stone-500 font-mono text-xs group-hover/row:border-sand transition-colors">
                                      {pIdx + 1}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-xl text-stone-100 group-hover/row:text-sand transition-colors">{player.name}</span>
                                      <div className="flex items-center gap-2 mt-1">
                                        {player.gender === 'Male' ? <Mars size={12} className="text-sky-400" /> : player.gender === 'Female' ? <Venus size={12} className="text-rose-400" /> : <MoreHorizontal size={12} className="text-stone-500" />}
                                        <span className="text-[9px] text-sand/60 uppercase tracking-widest">Sup: {player.supervisorName || '—'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tribe.color }} />
                                    <span className="text-stone-300 tracking-widest text-sm uppercase">{tribe.name}</span>
                                  </div>
                                </td>
                                <td className="px-8 py-6 max-w-xs">
                                  <p className="font-hand text-lg text-sand/70 leading-tight italic">"{stats.description}"</p>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex flex-col gap-2 w-48">
                                    <div className="flex items-center justify-between text-[9px] uppercase tracking-tighter text-stone-500">
                                      <span>STR / AGI / INT</span>
                                      <span>{Math.round((stats.strength + stats.agility + stats.intel) / 3)} MAX</span>
                                    </div>
                                    <div className="flex gap-1 h-1.5 w-full">
                                      <div title={`Strength: ${stats.strength}`} className="h-full rounded-l-full bg-torch-red" style={{ width: `${stats.strength/3}%` }} />
                                      <div title={`Agility: ${stats.agility}`} className="h-full bg-lagoon" style={{ width: `${stats.agility/3}%` }} />
                                      <div title={`Intelligence: ${stats.intel}`} className="h-full rounded-r-full bg-sky-500" style={{ width: `${stats.intel/3}%` }} />
                                    </div>
                                    <div className="flex items-center gap-4 mt-1">
                                      <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-torch-red" />
                                        <span className="text-[8px] text-stone-500">S:{stats.strength}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-lagoon" />
                                        <span className="text-[8px] text-stone-500">A:{stats.agility}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-sky-500" />
                                        <span className="text-[8px] text-stone-500">I:{stats.intel}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                  <div className="inline-flex flex-col items-end">
                                    <span className="text-2xl text-stone-100 font-mono tracking-tighter">{stats.spirit}%</span>
                                    <span className="text-[8px] text-stone-500 uppercase tracking-widest">Fortitude</span>
                                  </div>
                                </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {(() => {
                           const PAGE_SIZE = 4;
                           const totalPages = Math.ceil(filteredPlayers.length / PAGE_SIZE);
                           const pageIndex = currentPlayIndex % (totalPages || 1);
                           const displayPlayers = filteredPlayers.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE);
                           
                           return (
                             <>
                               {/* Progress Bar for the 5-second interval */}
                               <div className="w-full h-1 bg-stone-900 rounded-full overflow-hidden">
                                 <motion.div 
                                   key={currentPlayIndex}
                                   initial={{ width: "0%" }}
                                   animate={{ width: "100%" }}
                                   transition={{ duration: 6, ease: "linear" }}
                                   className="h-full bg-torch-orange shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                                 />
                               </div>

                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                   <div className="px-4 py-1 bg-stone-800 border border-stone-700 rounded-full">
                                     <span className="text-[10px] font-display text-stone-400 uppercase tracking-[0.2em]">Batch {pageIndex + 1} of {totalPages}</span>
                                   </div>
                                   <div className="flex gap-1">
                                      {Array.from({ length: totalPages }).map((_, i) => (
                                        <div 
                                          key={i} 
                                          className={cn(
                                            "w-2 h-2 rounded-full transition-all duration-300",
                                            i === pageIndex ? "bg-torch-orange w-4" : "bg-stone-800"
                                          )} 
                                        />
                                      ))}
                                   </div>
                                 </div>
                                 <p className="text-stone-500 font-display text-xs tracking-widest uppercase">Displays updating every 6 seconds</p>
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {displayPlayers.map((player, pIdx) => {
                                  let p = { ...player };
                                  if (p.name === "Riffy Campo") p.gender = 'Female';
                                  
                                  const tribe = tribes.find(t => t.playerIds.includes(p.id));
                                  if (!tribe) return null;
                                  const stats = getPlayerStats(p);
                                  
                                  return (
                                    <motion.div
                                      key={`${p.id}-${currentPlayIndex}`}
                                      initial={{ opacity: 0, y: 40, scale: 0.95 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: -40, scale: 0.95 }}
                                      transition={{ 
                                        type: "spring",
                                        damping: 20,
                                        stiffness: 100,
                                        delay: pIdx * 0.1 
                                      }}
                                      className="hawaiian-card p-8 flex flex-col gap-6 group/card border-stone-800 bg-stone-900/60 backdrop-blur-xl relative overflow-hidden min-h-[500px] shadow-2xl"
                                    >
                                      {/* Decorative Tribe Background */}
                                      <div className="absolute -top-10 -right-10 w-40 h-40 opacity-10 pointer-events-none group-hover/card:scale-125 transition-transform duration-1000">
                                        <div className="w-full h-full rounded-full blur-[40px]" style={{ backgroundColor: tribe.color }} />
                                      </div>

                                      <div className="flex items-center justify-start relative z-10">
                                        <div className="px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.2em] font-display text-white shadow-xl border border-white/10" style={{ backgroundColor: tribe.color }}>
                                          {tribe.name}
                                        </div>
                                      </div>

                                      <div className="space-y-4 relative z-10 border-b border-stone-800/80 pb-6 flex-grow-0">
                                        <div className="flex flex-col gap-1">
                                          <h4 className="text-4xl font-display text-stone-100 leading-tight group-hover/card:text-torch-orange transition-colors">{p.name}</h4>

                                        </div>
                                        <p className="font-hand text-2xl text-sand leading-relaxed italic animate-in fade-in slide-in-from-left-2 duration-1000 delay-300">
                                          "{stats.description}"
                                        </p>
                                      </div>

                                      <div className="space-y-6 py-4 relative z-10 flex-grow">
                                        <div className="space-y-4">
                                           <div className="grid grid-cols-1 gap-3">
                                            {[
                                              { label: 'Strength', val: stats.strength, color: 'bg-torch-red', icon: <Flame size={10} /> },
                                              { label: 'Agility', val: stats.agility, color: 'bg-lagoon', icon: <Waves size={10} /> },
                                              { label: 'Intelligence', val: stats.intel, color: 'bg-sky-500', icon: <Compass size={10} /> }
                                            ].map((vit) => (
                                              <div key={vit.label} className="bg-stone-950/80 p-3 rounded-2xl border border-stone-800/80 group-hover/card:border-stone-700 transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                  <div className="flex items-center gap-2">
                                                    <span className={cn("p-1 rounded-md text-stone-400", vit.color.replace('bg-', 'text-'))}>{vit.icon}</span>
                                                    <span className="text-[10px] text-stone-500 font-display uppercase tracking-widest">{vit.label}</span>
                                                  </div>
                                                  <span className="text-sm text-stone-100 font-mono font-bold">{vit.val}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                                                  <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${vit.val}%` }}
                                                    transition={{ duration: 1.5, ease: "easeOut", delay: pIdx * 0.1 + 0.5 }}
                                                    className={cn("h-full rounded-full", vit.color)} 
                                                  />
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="mt-auto pt-6 flex items-center justify-between border-t border-stone-800/80">
                                        <div className="flex flex-col">
                                          <span className="text-[9px] text-stone-600 uppercase tracking-[0.2em]">Survivor Index</span>
                                          <span className="text-xl font-mono font-bold text-torch-orange">0{Math.round((stats.strength + stats.agility + stats.intel) / 3)}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                          <span className="text-[9px] text-stone-600 uppercase tracking-[0.2em]">Survival %</span>
                                          <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-stone-900 rounded-full overflow-hidden">
                                               <div className="h-full bg-hibiscus" style={{ width: `${stats.spirit}%` }} />
                                            </div>
                                            <span className="text-lg font-mono text-stone-100">{stats.spirit}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                             </>
                           );
                        })()}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
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
