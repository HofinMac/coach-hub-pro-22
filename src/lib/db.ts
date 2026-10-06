/**
 * Row types and a query helper for tables that are not yet in the generated
 * `src/integrations/supabase/types.ts` (see supabase/migrations/20260929100000_core_domain.sql).
 * Once Lovable regenerates the types, callers can switch back to `supabase.from(...)`.
 */
import { supabase } from "@/integrations/supabase/client";
import type { PlanExercise, PlanStatus, ClientStatus, ExerciseCategory } from "@/lib/domain";

type UntypedTable =
  | "client_intake"
  | "coach_client_records"
  | "workout_plans"
  | "workout_logs"
  | "progress_entries"
  | "messages"
  | "client_packages"
  | "payments"
  | "coach_gyms"
  | "gym_reviews"
  | "coach_exercises"
  | "push_subscriptions"
  | "client_invites"
  | "gyms";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const from = (table: UntypedTable) => (supabase as any).from(table);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rpc = (fn: string, args?: Record<string, unknown>) => (supabase as any).rpc(fn, args);

export async function requireUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nejste přihlášeni");
  return user.id;
}

export interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profile_photo_url: string | null;
  role: "coach" | "client" | "admin";
  assigned_coach_id: string | null;
  created_at: string;
}

export interface ClientIntakeRow {
  client_id: string;
  age: number | null;
  gender: string;
  height_cm: number | null;
  experience: string;
  injuries: string[];
  injury_detail: string;
  current_activity: string;
  goals: string[];
  goal_detail: string;
  preferred_days: string;
  preferred_time: string;
  updated_at: string;
}

export interface CoachClientRecordRow {
  coach_id: string;
  client_id: string;
  status: ClientStatus;
  tags: string[];
  notes: string;
}

export interface WorkoutPlanRow {
  id: string;
  coach_id: string;
  client_id: string | null;
  title: string;
  description: string;
  status: PlanStatus;
  exercises: PlanExercise[];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutLogRow {
  id: string;
  client_id: string;
  plan_id: string | null;
  performed_at: string;
  duration_min: number | null;
  rpe: number | null;
  notes: string;
}

export interface ProgressEntryRow {
  id: string;
  client_id: string;
  logged_at: string; // yyyy-MM-dd
  weight: number | null;
  body_fat: number | null;
  notes: string;
  created_by: string | null;
}

export interface MessageRow {
  id: string;
  coach_id: string;
  client_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export type PackageStatus = "active" | "used" | "expired" | "cancelled";

export interface ClientPackageRow {
  id: string;
  coach_id: string;
  client_id: string;
  name: string;
  total_credits: number;
  remaining_credits: number;
  price_czk: number;
  status: PackageStatus;
  expires_at: string | null;
  created_at: string;
}

export type PaymentStatus = "pending" | "paid" | "cancelled";

export interface PaymentRow {
  id: string;
  coach_id: string;
  client_id: string;
  package_id: string | null;
  description: string;
  amount_czk: number;
  status: PaymentStatus;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface GymRow {
  id: string;
  name: string;
  address: string;
  city: string;
  website: string | null;
  equipment: string[];
  description: string;
  opening_hours: string;
  created_by: string | null;
  created_at: string;
}

export interface CoachExerciseRow {
  id: string;
  coach_id: string;
  name: string;
  category: ExerciseCategory;
  default_notes: string;
  video_url: string | null;
}

export interface GymReviewRow {
  id: string;
  gym_id: string;
  author_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

/** Clients assigned to the given coach (profiles.assigned_coach_id). */
export async function fetchCoachClients(coachId: string): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, profile_photo_url, role, assigned_coach_id, created_at")
    .eq("assigned_coach_id", coachId)
    .order("full_name");
  if (error) throw error;
  return (data ?? []) as unknown as ProfileRow[];
}

export const initialsOf = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("") || "?";

export const formatCzk = (amount: number) => `${amount.toLocaleString("cs-CZ")} Kč`;
