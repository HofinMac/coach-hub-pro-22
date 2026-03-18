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
    email: 'alex@apex.app',
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
    email: 'sarah@apex.app',
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
    email: 'mike@apex.app',
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
  { id: 'e1', name: 'Back Squat', category: 'knee_dominant', defaultNotes: 'Full depth. Brace core.' },
  { id: 'e2', name: 'Front Squat', category: 'knee_dominant', defaultNotes: 'Elbows high. Upright torso.' },
  { id: 'e3', name: 'Bulgarian Split Squat', category: 'knee_dominant', defaultNotes: 'Control the eccentric.' },
  { id: 'e4', name: 'Leg Press', category: 'knee_dominant', defaultNotes: 'Feet shoulder width.' },
  { id: 'e5', name: 'Romanian Deadlift', category: 'hip_dominant', defaultNotes: 'Hinge at hips. Slight knee bend.' },
  { id: 'e6', name: 'Conventional Deadlift', category: 'hip_dominant', defaultNotes: 'Flat back. Drive through floor.' },
  { id: 'e7', name: 'Hip Thrust', category: 'hip_dominant', defaultNotes: 'Pause at top. Full lockout.' },
  { id: 'e8', name: 'Good Morning', category: 'hip_dominant', defaultNotes: 'Light load. Feel hamstrings.' },
  { id: 'e9', name: 'Bench Press', category: 'push', defaultNotes: 'Retract scapulae. Arch back.' },
  { id: 'e10', name: 'Overhead Press', category: 'push', defaultNotes: 'Strict. No leg drive.' },
  { id: 'e11', name: 'Incline DB Press', category: 'push', defaultNotes: '30-45° angle.' },
  { id: 'e12', name: 'Dips', category: 'push', defaultNotes: 'Slight forward lean for chest.' },
  { id: 'e13', name: 'Barbell Row', category: 'pull', defaultNotes: '45° torso. Pull to lower chest.' },
  { id: 'e14', name: 'Pull-Up', category: 'pull', defaultNotes: 'Full ROM. Dead hang to chin over.' },
  { id: 'e15', name: 'Face Pulls', category: 'pull', defaultNotes: 'External rotate at top.' },
  { id: 'e16', name: 'Cable Row', category: 'pull', defaultNotes: 'Squeeze shoulder blades.' },
  { id: 'e17', name: 'Plank', category: 'core', defaultNotes: 'Neutral spine. Breathe.' },
  { id: 'e18', name: 'Pallof Press', category: 'core', defaultNotes: 'Anti-rotation. Brace hard.' },
  { id: 'e19', name: 'Assault Bike Intervals', category: 'conditioning', defaultNotes: '30s on / 30s off.' },
  { id: 'e20', name: 'Hip 90/90 Stretch', category: 'mobility', defaultNotes: 'Hold 30s each side.' },
];

export const workoutPlans: WorkoutPlan[] = [
  {
    id: 'wp1', coachId: 'c1', clientId: 'cl1', clientName: 'Marcus Aurelius', title: 'Squat Peaking - Week 6', status: 'active',
    createdAt: '2026-03-10',
    exercises: [
      { exerciseId: 'e1', exerciseName: 'Back Squat', sets: 5, reps: '3', rpe: 9, rest: 180 },
      { exerciseId: 'e3', exerciseName: 'Bulgarian Split Squat', sets: 3, reps: '8', rpe: 7, rest: 120 },
      { exerciseId: 'e5', exerciseName: 'Romanian Deadlift', sets: 3, reps: '10', rpe: 7, rest: 120 },
      { exerciseId: 'e18', exerciseName: 'Pallof Press', sets: 3, reps: '12', rpe: 6, rest: 60 },
    ],
  },
  {
    id: 'wp2', coachId: 'c1', clientId: 'cl2', clientName: 'Elena Voss', title: 'Endurance Base - Phase 2', status: 'active',
    createdAt: '2026-03-12',
    exercises: [
      { exerciseId: 'e1', exerciseName: 'Back Squat', sets: 3, reps: '12', rpe: 6, rest: 90 },
      { exerciseId: 'e7', exerciseName: 'Hip Thrust', sets: 3, reps: '12', rpe: 7, rest: 90 },
      { exerciseId: 'e17', exerciseName: 'Plank', sets: 3, reps: '45s', rpe: 6, rest: 60 },
      { exerciseId: 'e19', exerciseName: 'Assault Bike Intervals', sets: 8, reps: '30s', rpe: 8, rest: 30 },
    ],
  },
  {
    id: 'wp3', coachId: 'c3', clientId: 'cl9', clientName: 'Ryan Brooks', title: 'Contest Prep - Push Day', status: 'active',
    createdAt: '2026-03-14',
    exercises: [
      { exerciseId: 'e9', exerciseName: 'Bench Press', sets: 4, reps: '8', rpe: 8, rest: 120 },
      { exerciseId: 'e11', exerciseName: 'Incline DB Press', sets: 4, reps: '10', rpe: 8, rest: 90 },
      { exerciseId: 'e10', exerciseName: 'Overhead Press', sets: 3, reps: '10', rpe: 7, rest: 90 },
      { exerciseId: 'e12', exerciseName: 'Dips', sets: 3, reps: '12', rpe: 7, rest: 60 },
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
  booked: 'bg-primary/10 text-primary',
  cancelled: 'bg-muted text-muted-foreground',
  no_show: 'bg-destructive/10 text-destructive',
};
