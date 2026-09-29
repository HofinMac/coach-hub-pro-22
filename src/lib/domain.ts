// Domain types, the built-in exercise library and status colors shared across the app.

// ===== Types =====
export type UserRole = 'admin' | 'coach' | 'client';
export type ClientStatus = 'active' | 'inactive' | 'lead' | 'at_risk';
export type BookingStatus = 'pending' | 'booked' | 'completed' | 'cancelled' | 'no_show';
export type PlanStatus = 'draft' | 'active' | 'completed';
export type ExerciseCategory = 'knee_dominant' | 'hip_dominant' | 'push' | 'pull' | 'core' | 'conditioning' | 'mobility';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  defaultNotes: string;
  videoUrl?: string;
}

export interface PlanExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;
  rpe: number;
  rest: number;
  notes?: string;
}

// ===== Built-in exercise library =====
export const exercises: Exercise[] = [
  // Dominance kolene
  { id: 'e1', name: 'Zadní dřep (Back Squat)', category: 'knee_dominant', defaultNotes: 'Plná hloubka. Zpevni střed těla.' },
  { id: 'e2', name: 'Přední dřep (Front Squat)', category: 'knee_dominant', defaultNotes: 'Lokty vysoko. Vzpřímený trup.' },
  { id: 'e3', name: 'Bulharský dřep', category: 'knee_dominant', defaultNotes: 'Kontroluj sestup.' },
  { id: 'e4', name: 'Leg Press', category: 'knee_dominant', defaultNotes: 'Nohy na šířku ramen.' },
  { id: 'e21', name: 'Goblet dřep', category: 'knee_dominant', defaultNotes: 'Drž KB u hrudníku. Lokty mezi kolena.' },
  { id: 'e22', name: 'Výpady v chůzi', category: 'knee_dominant', defaultNotes: 'Dlouhý krok. Vzpřímený trup.' },
  { id: 'e23', name: 'Předkopávání (Leg Extension)', category: 'knee_dominant', defaultNotes: 'Pomalý sestup. Pauza nahoře.' },
  { id: 'e24', name: 'Výstupy na lavici (Step-Up)', category: 'knee_dominant', defaultNotes: 'Tlač přes přední patu. Neodráží se.' },
  { id: 'e25', name: 'Sissy dřep', category: 'knee_dominant', defaultNotes: 'Zakloň se. Zaměř se na quadriceps.' },
  // Dominance kyčle
  { id: 'e5', name: 'Rumunský mrtvý tah', category: 'hip_dominant', defaultNotes: 'Ohyb v kyčlích. Mírný ohyb kolen.' },
  { id: 'e6', name: 'Klasický mrtvý tah', category: 'hip_dominant', defaultNotes: 'Rovná záda. Tlač nohama do podlahy.' },
  { id: 'e7', name: 'Hip Thrust', category: 'hip_dominant', defaultNotes: 'Pauza nahoře. Plný zámek.' },
  { id: 'e8', name: 'Good Morning', category: 'hip_dominant', defaultNotes: 'Lehká zátěž. Cítit hamstringy.' },
  { id: 'e26', name: 'Sumo mrtvý tah', category: 'hip_dominant', defaultNotes: 'Široký postoj. Špičky ven 45°.' },
  { id: 'e27', name: 'Kettlebell Swing', category: 'hip_dominant', defaultNotes: 'Švih kyčlí. Ruce jsou lana.' },
  { id: 'e28', name: 'Severský curl (Nordic Curl)', category: 'hip_dominant', defaultNotes: 'Kontroluj sestup. Důraz na excentrik.' },
  { id: 'e29', name: 'Glute Bridge', category: 'hip_dominant', defaultNotes: 'Stiskni hýždě nahoře. Drž 2 s.' },
  { id: 'e30', name: 'Zakopávání vleže (Leg Curl)', category: 'hip_dominant', defaultNotes: 'Plný rozsah. Pomalý negativ.' },
  { id: 'e31', name: 'Jednorázový rumunský tah', category: 'hip_dominant', defaultNotes: 'Ohyb na jedné noze. Rovná záda.' },
  // Tlak
  { id: 'e9', name: 'Bench Press', category: 'push', defaultNotes: 'Stáhni lopatky. Prohni záda.' },
  { id: 'e10', name: 'Tlak nad hlavu (OHP)', category: 'push', defaultNotes: 'Striktně. Bez odrazu nohou.' },
  { id: 'e11', name: 'Šikmý tlak s jednoručkami', category: 'push', defaultNotes: 'Úhel 30–45°.' },
  { id: 'e12', name: 'Dipy', category: 'push', defaultNotes: 'Mírný předklon pro hrudník.' },
  { id: 'e32', name: 'Úzký bench press', category: 'push', defaultNotes: 'Ruce na šířku ramen. Důraz na triceps.' },
  { id: 'e33', name: 'Tlak s jednoručkami vsedě', category: 'push', defaultNotes: 'Neutrální nebo pronovaný úchop.' },
  { id: 'e34', name: 'Upažování (Lateral Raise)', category: 'push', defaultNotes: 'Mírný ohyb loktů. Kontroluj tempo.' },
  { id: 'e35', name: 'Kliky', category: 'push', defaultNotes: 'Plný rozsah. Střed těla zpevněný.' },
  { id: 'e36', name: 'Kabelové rozvodky (Cable Fly)', category: 'push', defaultNotes: 'Mírný ohyb loktů. Stiskni hrudník.' },
  { id: 'e37', name: 'Tricepsové stahování (Pushdown)', category: 'push', defaultNotes: 'Fixuj lokty. Stiskni dole.' },
  { id: 'e38', name: 'Francouzský tlak (Skull Crushers)', category: 'push', defaultNotes: 'Spusť k čelu. Drž lokty u sebe.' },
  // Tah
  { id: 'e13', name: 'Přítahy s velkou činkou', category: 'pull', defaultNotes: 'Trup 45°. Táhni ke spodnímu hrudníku.' },
  { id: 'e14', name: 'Shyby (Pull-Up)', category: 'pull', defaultNotes: 'Plný rozsah. Ze svisu po bradu nad.' },
  { id: 'e15', name: 'Face Pulls', category: 'pull', defaultNotes: 'Zevní rotace nahoře.' },
  { id: 'e16', name: 'Kabelové přítahy vsedě', category: 'pull', defaultNotes: 'Stiskni lopatky.' },
  { id: 'e39', name: 'Horní kladka (Lat Pulldown)', category: 'pull', defaultNotes: 'Široký úchop. Táhni k hornímu hrudníku.' },
  { id: 'e40', name: 'T-Bar přítahy', category: 'pull', defaultNotes: 'Hrudník na opěrce. Táhni ke sternu.' },
  { id: 'e41', name: 'Přítahy jednoručkou', category: 'pull', defaultNotes: 'Jedna ruka. Plný protah.' },
  { id: 'e42', name: 'Shyby nadhmatem (Chin-Up)', category: 'pull', defaultNotes: 'Supinovaný úchop. Důraz na biceps.' },
  { id: 'e43', name: 'Bicepsový zdvih s velkou činkou', category: 'pull', defaultNotes: 'Bez švihání. Plná kontrakce.' },
  { id: 'e44', name: 'Kladivový zdvih (Hammer Curl)', category: 'pull', defaultNotes: 'Neutrální úchop. Důraz na brachialis.' },
  { id: 'e45', name: 'Zadní deltový fly', category: 'pull', defaultNotes: 'Předklon. Stiskni zadní delty.' },
  // Střed těla
  { id: 'e17', name: 'Plank', category: 'core', defaultNotes: 'Neutrální páteř. Dýchej.' },
  { id: 'e18', name: 'Pallof Press', category: 'core', defaultNotes: 'Anti-rotace. Zpevni střed.' },
  { id: 'e46', name: 'Přednožování ve svisu', category: 'core', defaultNotes: 'Kontroluj houpání. Stáčej pánev.' },
  { id: 'e47', name: 'Ab Wheel Rollout', category: 'core', defaultNotes: 'Pomalý pohyb. Nespadni do prohnutí.' },
  { id: 'e48', name: 'Kabelové dřevorubce', category: 'core', defaultNotes: 'Rotuj z kyčlí. Ruce rovné.' },
  { id: 'e49', name: 'Dead Bug', category: 'core', defaultNotes: 'Tiskni bedra k zemi. Střídej strany.' },
  { id: 'e50', name: 'Boční plank', category: 'core', defaultNotes: 'Nohy na sobě. Kyčle nahoru. Drž 30 s.' },
  { id: 'e51', name: 'Ruské otáčení (Russian Twist)', category: 'core', defaultNotes: 'Nakloň se 45°. Rotuj plně.' },
  // Kondice
  { id: 'e19', name: 'Intervaly na Assault Bike', category: 'conditioning', defaultNotes: '30 s práce / 30 s pauza.' },
  { id: 'e52', name: 'Intervaly na veslovacím trenažéru', category: 'conditioning', defaultNotes: '500m opakování. Cílový split.' },
  { id: 'e53', name: 'Tlačení saní (Sled Push)', category: 'conditioning', defaultNotes: 'Nízké madla. Tlač nohama.' },
  { id: 'e54', name: 'Battle Ropes', category: 'conditioning', defaultNotes: '30 s vlny. Zůstaň nízko.' },
  { id: 'e55', name: 'Box Jumps', category: 'conditioning', defaultNotes: 'Doskoč měkce. Sestup po jedné.' },
  { id: 'e56', name: 'Burpees', category: 'conditioning', defaultNotes: 'Plný vzpřim nahoře. Hrudník na zem.' },
  { id: 'e57', name: 'Farmer\'s Walk', category: 'conditioning', defaultNotes: 'Těžká zátěž. Vzpřímený postoj. 40 m.' },
  { id: 'e58', name: 'Švihadlo', category: 'conditioning', defaultNotes: 'Zůstaň na špičkách. Uvolněná ramena.' },
  // Mobilita
  { id: 'e20', name: 'Protažení kyčle 90/90', category: 'mobility', defaultNotes: 'Drž 30 s na každou stranu.' },
  { id: 'e59', name: 'World\'s Greatest Stretch', category: 'mobility', defaultNotes: 'Výpad + rotace. 5 na každou stranu.' },
  { id: 'e60', name: 'Kočka–kráva (Cat-Cow)', category: 'mobility', defaultNotes: 'Pomalu. Dýchej do každé pozice.' },
  { id: 'e61', name: 'Protažení flexorů kyčle (Couch)', category: 'mobility', defaultNotes: 'Důraz na flexory kyčle. 60 s na stranu.' },
  { id: 'e62', name: 'Rozpažování s gumou', category: 'mobility', defaultNotes: 'Lehká guma. Zadní delty a postoj.' },
  { id: 'e63', name: 'Foam Roll (IT pásmo)', category: 'mobility', defaultNotes: 'Pomalé přejezdy. Zastav na bolestivých místech.' },
  { id: 'e64', name: 'Extenze hrudní páteře', category: 'mobility', defaultNotes: 'Přes foam roller. Ruce nad hlavu.' },
  { id: 'e65', name: 'Protažení kotníku do dorziflex', category: 'mobility', defaultNotes: 'Koleno přes špičku. Opora o zeď.' },
];

export const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-muted text-muted-foreground',
  lead: 'bg-primary/10 text-primary',
  at_risk: 'bg-destructive/10 text-destructive',
  draft: 'bg-muted text-muted-foreground',
  completed: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  booked: 'bg-primary/10 text-primary',
  cancelled: 'bg-muted text-muted-foreground',
  no_show: 'bg-destructive/10 text-destructive',
};
