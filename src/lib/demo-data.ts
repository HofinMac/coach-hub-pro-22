// ===== Types =====
export type UserRole = 'admin' | 'coach' | 'client';
export type ClientStatus = 'active' | 'inactive' | 'lead' | 'at_risk';
export type BookingStatus = 'pending' | 'booked' | 'completed' | 'cancelled' | 'no_show';
export type PlanStatus = 'draft' | 'active' | 'completed';
export type ExerciseCategory = 'knee_dominant' | 'hip_dominant' | 'push' | 'pull' | 'core' | 'conditioning' | 'mobility';

export interface Coach {
  id: string;
  name: string;
  email: string;
  avatar: string;
  specialties: string[];
  bio: string;
  hourlyRate: number;
  isVerified: boolean;
  clientCount: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  avatar: string;
  coachId: string;
  status: ClientStatus;
  goals: string;
  injuries: string;
  tags: string[];
  packageCredits: number;
  lastActivity: string;
  joinedAt: string;
  weight?: number;
  bodyFat?: number;
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  defaultNotes: string;
  videoUrl?: string;
}

export interface WorkoutPlan {
  id: string;
  coachId: string;
  clientId: string;
  clientName: string;
  title: string;
  status: PlanStatus;
  exercises: PlanExercise[];
  createdAt: string;
}

export interface PlanExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;
  rpe: number;
  rest: number;
}

export interface Booking {
  id: string;
  coachId: string;
  clientId: string;
  clientName: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  type: '1:1' | 'group';
}

export interface ProgressEntry {
  id: string;
  clientId: string;
  weight: number;
  bodyFat?: number;
  notes: string;
  loggedAt: string;
}

// ===== Demo Data =====
export const coaches: Coach[] = [
  {
    id: 'c1',
    name: 'Alex Rivera',
    email: 'alex@coachhub.cz',
    avatar: 'AR',
    specialties: ['Strength & Conditioning', 'Pro Athletes'],
    bio: 'CSCS-certified coach with 10+ years training professional athletes.',
    hourlyRate: 120,
    isVerified: true,
    clientCount: 8,
  },
  {
    id: 'c2',
    name: 'Sarah Chen',
    email: 'sarah@coachhub.cz',
    avatar: 'SC',
    specialties: ['Post-Op Rehab', 'Physiotherapy'],
    bio: 'DPT with a focus on return-to-sport rehabilitation.',
    hourlyRate: 95,
    isVerified: true,
    clientCount: 6,
  },
  {
    id: 'c3',
    name: 'Mike Johnson',
    email: 'mike@coachhub.cz',
    avatar: 'MJ',
    specialties: ['Bodybuilding', 'Contest Prep'],
    bio: 'IFBB Pro coach. Specializing in natural bodybuilding and contest prep.',
    hourlyRate: 85,
    isVerified: false,
    clientCount: 10,
  },
];

export const clients: Client[] = [
  { id: 'cl1', name: 'Marcus Aurelius', email: 'marcus@email.com', avatar: 'MA', coachId: 'c1', status: 'at_risk', goals: 'Increase squat 1RM to 200kg', injuries: 'Previous ACL tear (L)', tags: ['strength', 'pro-athlete'], packageCredits: 4, lastActivity: '2026-03-13', joinedAt: '2025-09-01', weight: 92.3, bodyFat: 14.2 },
  { id: 'cl2', name: 'Elena Voss', email: 'elena@email.com', avatar: 'EV', coachId: 'c1', status: 'active', goals: 'Marathon sub 3:30', injuries: 'None', tags: ['endurance', 'online'], packageCredits: 8, lastActivity: '2026-03-18', joinedAt: '2025-11-15', weight: 62.1, bodyFat: 18.5 },
  { id: 'cl3', name: 'James Park', email: 'james@email.com', avatar: 'JP', coachId: 'c1', status: 'active', goals: 'General strength and mobility', injuries: 'Shoulder impingement (R)', tags: ['strength', 'rehab'], packageCredits: 12, lastActivity: '2026-03-17', joinedAt: '2025-06-20', weight: 78.5, bodyFat: 16.8 },
  { id: 'cl4', name: 'Sofia Reyes', email: 'sofia@email.com', avatar: 'SR', coachId: 'c1', status: 'active', goals: 'Body recomposition', injuries: 'None', tags: ['fat-loss', 'strength'], packageCredits: 6, lastActivity: '2026-03-18', joinedAt: '2026-01-05', weight: 68.2, bodyFat: 24.1 },
  { id: 'cl5', name: 'David Kim', email: 'david@email.com', avatar: 'DK', coachId: 'c1', status: 'at_risk', goals: 'Powerlifting meet prep', injuries: 'Lower back disc issue', tags: ['powerlifting', 'rehab'], packageCredits: 2, lastActivity: '2026-03-11', joinedAt: '2025-08-10', weight: 105.0, bodyFat: 18.9 },
  { id: 'cl6', name: 'Lily Thompson', email: 'lily@email.com', avatar: 'LT', coachId: 'c2', status: 'active', goals: 'Post-ACL return to sport', injuries: 'ACL reconstruction (R) - 4 months post-op', tags: ['rehab', 'return-to-sport'], packageCredits: 16, lastActivity: '2026-03-18', joinedAt: '2025-12-01', weight: 58.0 },
  { id: 'cl7', name: 'Omar Hassan', email: 'omar@email.com', avatar: 'OH', coachId: 'c2', status: 'active', goals: 'Shoulder rehab and strengthening', injuries: 'Rotator cuff repair', tags: ['rehab'], packageCredits: 10, lastActivity: '2026-03-17', joinedAt: '2026-01-10', weight: 82.3 },
  { id: 'cl8', name: 'Anna Weber', email: 'anna@email.com', avatar: 'AW', coachId: 'c2', status: 'inactive', goals: 'Pain management and mobility', injuries: 'Chronic lower back pain', tags: ['rehab', 'inactive'], packageCredits: 0, lastActivity: '2026-02-20', joinedAt: '2025-10-15', weight: 71.0 },
  { id: 'cl9', name: 'Ryan Brooks', email: 'ryan@email.com', avatar: 'RB', coachId: 'c3', status: 'active', goals: 'Mens physique competition', injuries: 'None', tags: ['bodybuilding', 'contest-prep'], packageCredits: 20, lastActivity: '2026-03-18', joinedAt: '2025-07-01', weight: 88.5, bodyFat: 10.2 },
  { id: 'cl10', name: 'Jessica Lane', email: 'jessica@email.com', avatar: 'JL', coachId: 'c3', status: 'active', goals: 'Bikini competition prep', injuries: 'None', tags: ['bodybuilding', 'contest-prep'], packageCredits: 14, lastActivity: '2026-03-17', joinedAt: '2025-09-20', weight: 57.8, bodyFat: 15.3 },
  { id: 'cl11', name: 'Tom Bradley', email: 'tom@email.com', avatar: 'TB', coachId: 'c3', status: 'at_risk', goals: 'Muscle gain - offseason', injuries: 'Tennis elbow (R)', tags: ['bodybuilding'], packageCredits: 1, lastActivity: '2026-03-10', joinedAt: '2025-11-01', weight: 95.2, bodyFat: 16.5 },
  { id: 'cl12', name: 'Mia Santos', email: 'mia@email.com', avatar: 'MS', coachId: 'c1', status: 'lead', goals: 'Weight loss and toning', injuries: 'None', tags: ['fat-loss', 'online'], packageCredits: 0, lastActivity: '2026-03-16', joinedAt: '2026-03-15' },
];

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

export const workoutPlans: WorkoutPlan[] = [
  {
    id: 'wp1', coachId: 'c1', clientId: 'cl1', clientName: 'Marcus Aurelius', title: 'Dřep – peaking, týden 6', status: 'active',
    createdAt: '2026-03-10',
    exercises: [
      { exerciseId: 'e1', exerciseName: 'Zadní dřep (Back Squat)', sets: 5, reps: '3', rpe: 9, rest: 180 },
      { exerciseId: 'e3', exerciseName: 'Bulharský dřep', sets: 3, reps: '8', rpe: 7, rest: 120 },
      { exerciseId: 'e5', exerciseName: 'Rumunský mrtvý tah', sets: 3, reps: '10', rpe: 7, rest: 120 },
      { exerciseId: 'e18', exerciseName: 'Pallof Press', sets: 3, reps: '12', rpe: 6, rest: 60 },
    ],
  },
  {
    id: 'wp2', coachId: 'c1', clientId: 'cl2', clientName: 'Elena Voss', title: 'Vytrvalostní základ – fáze 2', status: 'active',
    createdAt: '2026-03-12',
    exercises: [
      { exerciseId: 'e1', exerciseName: 'Zadní dřep (Back Squat)', sets: 3, reps: '12', rpe: 6, rest: 90 },
      { exerciseId: 'e7', exerciseName: 'Hip Thrust', sets: 3, reps: '12', rpe: 7, rest: 90 },
      { exerciseId: 'e17', exerciseName: 'Plank', sets: 3, reps: '45s', rpe: 6, rest: 60 },
      { exerciseId: 'e19', exerciseName: 'Intervaly na Assault Bike', sets: 8, reps: '30s', rpe: 8, rest: 30 },
    ],
  },
  {
    id: 'wp3', coachId: 'c3', clientId: 'cl9', clientName: 'Ryan Brooks', title: 'Soutěžní příprava – tlakový den', status: 'active',
    createdAt: '2026-03-14',
    exercises: [
      { exerciseId: 'e9', exerciseName: 'Bench Press', sets: 4, reps: '8', rpe: 8, rest: 120 },
      { exerciseId: 'e11', exerciseName: 'Šikmý tlak s jednoručkami', sets: 4, reps: '10', rpe: 8, rest: 90 },
      { exerciseId: 'e10', exerciseName: 'Tlak nad hlavu (OHP)', sets: 3, reps: '10', rpe: 7, rest: 90 },
      { exerciseId: 'e12', exerciseName: 'Dipy', sets: 3, reps: '12', rpe: 7, rest: 60 },
    ],
  },
  {
    id: 'wp4', coachId: 'c1', clientId: 'cl3', clientName: 'James Park', title: 'Rehabilitace horní části – týden 3', status: 'active',
    createdAt: '2026-03-11',
    exercises: [
      { exerciseId: 'e62', exerciseName: 'Rozpažování s gumou', sets: 3, reps: '15', rpe: 5, rest: 60 },
      { exerciseId: 'e15', exerciseName: 'Face Pulls', sets: 3, reps: '15', rpe: 6, rest: 60 },
      { exerciseId: 'e41', exerciseName: 'Přítahy jednoručkou', sets: 3, reps: '10', rpe: 6, rest: 90 },
      { exerciseId: 'e49', exerciseName: 'Dead Bug', sets: 3, reps: '10', rpe: 5, rest: 60 },
      { exerciseId: 'e64', exerciseName: 'Extenze hrudní páteře', sets: 2, reps: '10', rpe: 4, rest: 60 },
    ],
  },
  {
    id: 'wp5', coachId: 'c1', clientId: 'cl4', clientName: 'Sofia Reyes', title: 'Full Body rekompozice A', status: 'active',
    createdAt: '2026-03-13',
    exercises: [
      { exerciseId: 'e21', exerciseName: 'Goblet dřep', sets: 3, reps: '12', rpe: 7, rest: 90 },
      { exerciseId: 'e7', exerciseName: 'Hip Thrust', sets: 4, reps: '10', rpe: 8, rest: 90 },
      { exerciseId: 'e35', exerciseName: 'Kliky', sets: 3, reps: '12', rpe: 7, rest: 60 },
      { exerciseId: 'e39', exerciseName: 'Horní kladka (Lat Pulldown)', sets: 3, reps: '12', rpe: 7, rest: 90 },
      { exerciseId: 'e46', exerciseName: 'Přednožování ve svisu', sets: 3, reps: '10', rpe: 7, rest: 60 },
    ],
  },
  {
    id: 'wp6', coachId: 'c1', clientId: 'cl5', clientName: 'David Kim', title: 'Příprava na závod – 8 týdnů do startu', status: 'active',
    createdAt: '2026-03-08',
    exercises: [
      { exerciseId: 'e1', exerciseName: 'Zadní dřep (Back Squat)', sets: 4, reps: '4', rpe: 8.5, rest: 240 },
      { exerciseId: 'e9', exerciseName: 'Bench Press', sets: 4, reps: '4', rpe: 8.5, rest: 180 },
      { exerciseId: 'e6', exerciseName: 'Klasický mrtvý tah', sets: 3, reps: '3', rpe: 9, rest: 300 },
      { exerciseId: 'e32', exerciseName: 'Úzký bench press', sets: 3, reps: '8', rpe: 7, rest: 120 },
    ],
  },
  {
    id: 'wp7', coachId: 'c2', clientId: 'cl6', clientName: 'Lily Thompson', title: 'ACL návrat ke sportu – fáze 3', status: 'active',
    createdAt: '2026-03-09',
    exercises: [
      { exerciseId: 'e24', exerciseName: 'Výstupy na lavici (Step-Up)', sets: 3, reps: '10', rpe: 6, rest: 90 },
      { exerciseId: 'e22', exerciseName: 'Výpady v chůzi', sets: 3, reps: '12', rpe: 6, rest: 90 },
      { exerciseId: 'e29', exerciseName: 'Glute Bridge', sets: 3, reps: '15', rpe: 6, rest: 60 },
      { exerciseId: 'e28', exerciseName: 'Severský curl (Nordic Curl)', sets: 3, reps: '5', rpe: 7, rest: 120 },
      { exerciseId: 'e50', exerciseName: 'Boční plank', sets: 3, reps: '30s', rpe: 5, rest: 60 },
    ],
  },
  {
    id: 'wp8', coachId: 'c2', clientId: 'cl7', clientName: 'Omar Hassan', title: 'Rehabilitace ramene – posilování', status: 'active',
    createdAt: '2026-03-10',
    exercises: [
      { exerciseId: 'e62', exerciseName: 'Rozpažování s gumou', sets: 3, reps: '20', rpe: 5, rest: 45 },
      { exerciseId: 'e15', exerciseName: 'Face Pulls', sets: 3, reps: '15', rpe: 5, rest: 60 },
      { exerciseId: 'e34', exerciseName: 'Upažování (Lateral Raise)', sets: 3, reps: '12', rpe: 5, rest: 60 },
      { exerciseId: 'e33', exerciseName: 'Tlak s jednoručkami vsedě', sets: 3, reps: '10', rpe: 6, rest: 90 },
      { exerciseId: 'e60', exerciseName: 'Kočka–kráva (Cat-Cow)', sets: 2, reps: '10', rpe: 3, rest: 30 },
    ],
  },
  {
    id: 'wp9', coachId: 'c3', clientId: 'cl9', clientName: 'Ryan Brooks', title: 'Soutěžní příprava – tahový den', status: 'active',
    createdAt: '2026-03-15',
    exercises: [
      { exerciseId: 'e6', exerciseName: 'Klasický mrtvý tah', sets: 4, reps: '6', rpe: 8, rest: 180 },
      { exerciseId: 'e13', exerciseName: 'Přítahy s velkou činkou', sets: 4, reps: '8', rpe: 8, rest: 120 },
      { exerciseId: 'e39', exerciseName: 'Horní kladka (Lat Pulldown)', sets: 3, reps: '12', rpe: 7, rest: 90 },
      { exerciseId: 'e42', exerciseName: 'Shyby nadhmatem (Chin-Up)', sets: 3, reps: '10', rpe: 7, rest: 90 },
      { exerciseId: 'e43', exerciseName: 'Bicepsový zdvih s velkou činkou', sets: 3, reps: '12', rpe: 7, rest: 60 },
      { exerciseId: 'e45', exerciseName: 'Zadní deltový fly', sets: 3, reps: '15', rpe: 6, rest: 60 },
    ],
  },
  {
    id: 'wp10', coachId: 'c3', clientId: 'cl10', clientName: 'Jessica Lane', title: 'Bikini příprava – hýždě', status: 'active',
    createdAt: '2026-03-14',
    exercises: [
      { exerciseId: 'e7', exerciseName: 'Hip Thrust', sets: 4, reps: '12', rpe: 8, rest: 120 },
      { exerciseId: 'e3', exerciseName: 'Bulharský dřep', sets: 3, reps: '10', rpe: 8, rest: 120 },
      { exerciseId: 'e5', exerciseName: 'Rumunský mrtvý tah', sets: 3, reps: '12', rpe: 7, rest: 90 },
      { exerciseId: 'e30', exerciseName: 'Zakopávání vleže (Leg Curl)', sets: 3, reps: '12', rpe: 7, rest: 60 },
      { exerciseId: 'e22', exerciseName: 'Výpady v chůzi', sets: 3, reps: '16', rpe: 7, rest: 90 },
    ],
  },
  {
    id: 'wp11', coachId: 'c3', clientId: 'cl11', clientName: 'Tom Bradley', title: 'Offseason hypertrofie – horní tělo', status: 'active',
    createdAt: '2026-03-12',
    exercises: [
      { exerciseId: 'e9', exerciseName: 'Bench Press', sets: 4, reps: '10', rpe: 7, rest: 120 },
      { exerciseId: 'e40', exerciseName: 'T-Bar přítahy', sets: 4, reps: '10', rpe: 7, rest: 120 },
      { exerciseId: 'e33', exerciseName: 'Tlak s jednoručkami vsedě', sets: 3, reps: '12', rpe: 7, rest: 90 },
      { exerciseId: 'e36', exerciseName: 'Kabelové rozvodky (Cable Fly)', sets: 3, reps: '15', rpe: 7, rest: 60 },
      { exerciseId: 'e44', exerciseName: 'Kladivový zdvih (Hammer Curl)', sets: 3, reps: '12', rpe: 7, rest: 60 },
      { exerciseId: 'e37', exerciseName: 'Tricepsové stahování (Pushdown)', sets: 3, reps: '15', rpe: 7, rest: 60 },
    ],
  },
  {
    id: 'wp12', coachId: 'c1', clientId: 'cl2', clientName: 'Elena Voss', title: 'Mobilita a zotavení', status: 'draft',
    createdAt: '2026-03-16',
    exercises: [
      { exerciseId: 'e59', exerciseName: 'World\'s Greatest Stretch', sets: 2, reps: '5 na stranu', rpe: 3, rest: 30 },
      { exerciseId: 'e60', exerciseName: 'Kočka–kráva (Cat-Cow)', sets: 2, reps: '10', rpe: 3, rest: 30 },
      { exerciseId: 'e20', exerciseName: 'Protažení kyčle 90/90', sets: 2, reps: '30s na stranu', rpe: 3, rest: 30 },
      { exerciseId: 'e64', exerciseName: 'Extenze hrudní páteře', sets: 2, reps: '10', rpe: 3, rest: 30 },
      { exerciseId: 'e65', exerciseName: 'Protažení kotníku do dorziflex', sets: 2, reps: '30s na stranu', rpe: 3, rest: 30 },
      { exerciseId: 'e63', exerciseName: 'Foam Roll (IT pásmo)', sets: 1, reps: '60s na stranu', rpe: 4, rest: 0 },
    ],
  },
];

export const bookings: Booking[] = [
  { id: 'b1', coachId: 'c1', clientId: 'cl2', clientName: 'Elena Voss', startTime: '2026-03-18T09:00', endTime: '2026-03-18T10:00', status: 'booked', type: '1:1' },
  { id: 'b2', coachId: 'c1', clientId: 'cl3', clientName: 'James Park', startTime: '2026-03-18T10:30', endTime: '2026-03-18T11:30', status: 'booked', type: '1:1' },
  { id: 'b3', coachId: 'c1', clientId: 'cl4', clientName: 'Sofia Reyes', startTime: '2026-03-18T14:00', endTime: '2026-03-18T15:00', status: 'booked', type: '1:1' },
  { id: 'b4', coachId: 'c1', clientId: 'cl1', clientName: 'Marcus Aurelius', startTime: '2026-03-19T08:00', endTime: '2026-03-19T09:00', status: 'booked', type: '1:1' },
  { id: 'b5', coachId: 'c1', clientId: 'cl5', clientName: 'David Kim', startTime: '2026-03-19T11:00', endTime: '2026-03-19T12:00', status: 'booked', type: '1:1' },
  { id: 'b6', coachId: 'c1', clientId: 'cl2', clientName: 'Elena Voss', startTime: '2026-03-17T09:00', endTime: '2026-03-17T10:00', status: 'completed', type: '1:1' },
  { id: 'b7', coachId: 'c1', clientId: 'cl4', clientName: 'Sofia Reyes', startTime: '2026-03-17T14:00', endTime: '2026-03-17T15:00', status: 'completed', type: '1:1' },
  { id: 'b8', coachId: 'c2', clientId: 'cl6', clientName: 'Lily Thompson', startTime: '2026-03-18T08:00', endTime: '2026-03-18T09:00', status: 'booked', type: '1:1' },
  { id: 'b9', coachId: 'c2', clientId: 'cl7', clientName: 'Omar Hassan', startTime: '2026-03-18T10:00', endTime: '2026-03-18T11:00', status: 'booked', type: '1:1' },
  { id: 'b10', coachId: 'c3', clientId: 'cl9', clientName: 'Ryan Brooks', startTime: '2026-03-18T07:00', endTime: '2026-03-18T08:30', status: 'booked', type: '1:1' },
  { id: 'b11', coachId: 'c1', clientId: 'cl2', clientName: 'Elena Voss', startTime: '2026-03-20T09:00', endTime: '2026-03-20T10:00', status: 'pending', type: '1:1' },
  { id: 'b12', coachId: 'c1', clientId: 'cl3', clientName: 'James Park', startTime: '2026-03-21T15:00', endTime: '2026-03-21T16:00', status: 'pending', type: '1:1' },
];

export const progressEntries: ProgressEntry[] = [
  { id: 'p1', clientId: 'cl1', weight: 94.5, bodyFat: 15.8, notes: 'Starting baseline', loggedAt: '2025-09-05' },
  { id: 'p2', clientId: 'cl1', weight: 93.8, bodyFat: 15.2, notes: 'Good adherence', loggedAt: '2025-10-01' },
  { id: 'p3', clientId: 'cl1', weight: 93.1, bodyFat: 14.8, notes: 'Strength increasing', loggedAt: '2025-11-01' },
  { id: 'p4', clientId: 'cl1', weight: 92.8, bodyFat: 14.5, notes: 'Squat PR 185kg', loggedAt: '2025-12-01' },
  { id: 'p5', clientId: 'cl1', weight: 92.5, bodyFat: 14.3, notes: 'Holiday disruption', loggedAt: '2026-01-05' },
  { id: 'p6', clientId: 'cl1', weight: 92.3, bodyFat: 14.2, notes: 'Back on track', loggedAt: '2026-02-01' },
  { id: 'p7', clientId: 'cl1', weight: 92.3, bodyFat: 14.2, notes: 'Stagnating - adjust program', loggedAt: '2026-03-01' },
  { id: 'p8', clientId: 'cl2', weight: 64.0, notes: 'Starting', loggedAt: '2025-11-20' },
  { id: 'p9', clientId: 'cl2', weight: 63.2, notes: 'Running volume up', loggedAt: '2025-12-15' },
  { id: 'p10', clientId: 'cl2', weight: 62.5, bodyFat: 19.0, notes: 'Feeling strong', loggedAt: '2026-01-15' },
  { id: 'p11', clientId: 'cl2', weight: 62.1, bodyFat: 18.5, notes: 'Race pace improving', loggedAt: '2026-02-15' },
  { id: 'p12', clientId: 'cl9', weight: 90.0, bodyFat: 12.5, notes: 'Offseason start', loggedAt: '2025-07-10' },
  { id: 'p13', clientId: 'cl9', weight: 91.2, bodyFat: 12.0, notes: 'Good gains', loggedAt: '2025-09-01' },
  { id: 'p14', clientId: 'cl9', weight: 90.5, bodyFat: 11.2, notes: 'Cut starting', loggedAt: '2025-11-01' },
  { id: 'p15', clientId: 'cl9', weight: 89.0, bodyFat: 10.5, notes: 'Conditioning up', loggedAt: '2026-01-01' },
  { id: 'p16', clientId: 'cl9', weight: 88.5, bodyFat: 10.2, notes: 'On track for show', loggedAt: '2026-03-01' },
];

// Helpers
export function getClientsByCoach(coachId: string) {
  return clients.filter(c => c.coachId === coachId);
}

export function getBookingsByCoach(coachId: string) {
  return bookings.filter(b => b.coachId === coachId);
}

export function getAtRiskClients(coachId: string) {
  return clients.filter(c => c.coachId === coachId && c.status === 'at_risk');
}

export function getUpcomingBookings(coachId: string) {
  const now = new Date().toISOString();
  return bookings.filter(b => b.coachId === coachId && b.startTime >= now && b.status === 'booked')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function getPlansByCoach(coachId: string) {
  return workoutPlans.filter(p => p.coachId === coachId);
}

export function getProgressByClient(clientId: string) {
  return progressEntries.filter(p => p.clientId === clientId).sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
}

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
