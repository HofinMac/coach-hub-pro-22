/**
 * Partner Module - Rule Engine
 * 
 * Reusable engine for evaluating campaign eligibility and challenge completion.
 * Supports multiple rule types with extensible architecture.
 */

import { supabase } from "@/integrations/supabase/client";
import { from } from "@/lib/db";

// ─── Types ───────────────────────────────────────────────────────────

export type RuleType =
  | "min_attendance"
  | "min_sessions_month"
  | "plan_completion"
  | "course_completion"
  | "manual_approval"
  | "streak_days"
  | "weight_goal"
  | "custom_metric";

export type Operator = "eq" | "gt" | "gte" | "lt" | "lte";

export interface CampaignRule {
  id: string;
  campaign_id: string;
  rule_type: RuleType;
  operator: Operator;
  threshold: number;
  metric_key: string;
  description: string;
}

export interface RuleResult {
  rule_id: string;
  rule_type: RuleType;
  passed: boolean;
  current_value: number;
  required_value: number;
  description: string;
}

export interface EligibilityResult {
  eligible: boolean;
  results: RuleResult[];
  evaluated_at: string;
}

// ─── Operator Evaluation ─────────────────────────────────────────────

function evaluateOperator(op: Operator, value: number, threshold: number): boolean {
  switch (op) {
    case "eq": return value === threshold;
    case "gt": return value > threshold;
    case "gte": return value >= threshold;
    case "lt": return value < threshold;
    case "lte": return value <= threshold;
    default: return false;
  }
}

// ─── Rule Evaluators ─────────────────────────────────────────────────

type RuleEvaluator = (
  userId: string,
  rule: CampaignRule
) => Promise<number>;

const monthRange = () => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
  };
};

/**
 * Count the user's completed bookings (attended sessions).
 */
const evaluateAttendance: RuleEvaluator = async (userId) => {
  const { count } = await supabase
    .from("slot_bookings")
    .select("id", { count: "exact", head: true })
    .eq("client_id", userId)
    .eq("status", "completed");
  return count || 0;
};

/**
 * Sessions in the current month: completed bookings whose slot starts this
 * month plus workouts the user logged this month.
 */
const evaluateSessionsMonth: RuleEvaluator = async (userId) => {
  const { start, end } = monthRange();
  const [bookings, logs] = await Promise.all([
    supabase
      .from("slot_bookings")
      .select("id, coach_slots!inner(start_time)")
      .eq("client_id", userId)
      .eq("status", "completed")
      .gte("coach_slots.start_time", start)
      .lt("coach_slots.start_time", end),
    from("workout_logs")
      .select("id", { count: "exact", head: true })
      .eq("client_id", userId)
      .gte("performed_at", start)
      .lt("performed_at", end),
  ]);
  return (bookings.data?.length || 0) + ((logs.count as number | null) || 0);
};

/**
 * Number of the user's training plans marked as completed.
 */
const evaluatePlanCompletion: RuleEvaluator = async (userId) => {
  const { count } = await from("workout_plans")
    .select("id", { count: "exact", head: true })
    .eq("client_id", userId)
    .eq("status", "completed");
  return (count as number | null) || 0;
};

/**
 * Check if coach has an approved certificate
 */
const evaluateCourseCompletion: RuleEvaluator = async (userId) => {
  const { count } = await supabase
    .from("coach_certificates")
    .select("*", { count: "exact", head: true })
    .eq("coach_id", userId)
    .eq("status", "approved");
  return count || 0;
};

/**
 * Manual approval - checks if admin has approved
 */
const evaluateManualApproval: RuleEvaluator = async (userId, rule) => {
  const { count } = await supabase
    .from("coach_benefits")
    .select("*", { count: "exact", head: true })
    .eq("coach_id", userId)
    .eq("campaign_id", rule.campaign_id)
    .eq("status", "approved");
  return count || 0;
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/**
 * Current streak of consecutive calendar days (local time) with at least one
 * workout log, ending today or yesterday.
 */
const evaluateStreakDays: RuleEvaluator = async (userId) => {
  const since = new Date();
  since.setDate(since.getDate() - 400);
  const { data } = await from("workout_logs")
    .select("performed_at")
    .eq("client_id", userId)
    .gte("performed_at", since.toISOString())
    .order("performed_at", { ascending: false });
  const days = new Set(((data ?? []) as { performed_at: string }[]).map(l => dayKey(new Date(l.performed_at))));

  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

/**
 * Custom metric - looks up from a generic metric store
 */
const evaluateCustomMetric: RuleEvaluator = async () => {
  // Extensible: can read from any custom metric source
  return 0;
};

const EVALUATORS: Record<RuleType, RuleEvaluator> = {
  min_attendance: evaluateAttendance,
  min_sessions_month: evaluateSessionsMonth,
  plan_completion: evaluatePlanCompletion,
  course_completion: evaluateCourseCompletion,
  manual_approval: evaluateManualApproval,
  streak_days: evaluateStreakDays,
  weight_goal: evaluateCustomMetric,
  custom_metric: evaluateCustomMetric,
};

// ─── Main Engine ─────────────────────────────────────────────────────

/**
 * Evaluate all rules for a campaign against a user.
 * Returns eligibility status and detailed results per rule.
 */
export async function evaluateEligibility(
  userId: string,
  campaignId: string
): Promise<EligibilityResult> {
  // Fetch rules for this campaign
  const { data: rules } = await supabase
    .from("campaign_rules")
    .select("*")
    .eq("campaign_id", campaignId);

  if (!rules || rules.length === 0) {
    return {
      eligible: true, // No rules = auto-eligible
      results: [],
      evaluated_at: new Date().toISOString(),
    };
  }

  const results: RuleResult[] = [];

  for (const rule of rules) {
    const evaluator = EVALUATORS[rule.rule_type as RuleType];
    if (!evaluator) {
      results.push({
        rule_id: rule.id,
        rule_type: rule.rule_type as RuleType,
        passed: false,
        current_value: 0,
        required_value: rule.threshold,
        description: rule.description || `Unknown rule type: ${rule.rule_type}`,
      });
      continue;
    }

    const currentValue = await evaluator(userId, rule as CampaignRule);
    const passed = evaluateOperator(rule.operator as Operator, currentValue, rule.threshold);

    results.push({
      rule_id: rule.id,
      rule_type: rule.rule_type as RuleType,
      passed,
      current_value: currentValue,
      required_value: rule.threshold,
      description: rule.description || "",
    });
  }

  const eligible = results.every((r) => r.passed);
  const evaluated_at = new Date().toISOString();

  // Persist eligibility result. Writes are admin-only (RLS), so for other
  // users this fails silently and the result is only returned.
  try {
    await supabase.from("eligibility").upsert([{
      user_id: userId,
      campaign_id: campaignId,
      eligible,
      evaluated_at,
      rule_results: JSON.parse(JSON.stringify(results)),
    }], { onConflict: "user_id,campaign_id" });
  } catch {
    // ignore
  }

  return { eligible, results, evaluated_at };
}

/**
 * Log an action to the partner audit trail
 */
export async function logAuditEvent(params: {
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  await supabase.from("partner_audit_log").insert([{
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    actor_id: params.actorId,
    old_values: JSON.parse(JSON.stringify(params.oldValues || {})),
    new_values: JSON.parse(JSON.stringify(params.newValues || {})),
    metadata: JSON.parse(JSON.stringify(params.metadata || {})),
  }]);
}

/**
 * Redeem a promo code for a user
 */
export async function redeemCode(params: {
  userId: string;
  codeId: string;
  campaignId: string;
  source?: "app" | "manual" | "api";
}): Promise<{ success: boolean; error?: string }> {
  // Check code is valid
  const { data: code } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("id", params.codeId)
    .single();

  if (!code) return { success: false, error: "Kód nenalezen" };
  if (!code.active) return { success: false, error: "Kód není aktivní" };
  if (code.expires_at && new Date(code.expires_at) < new Date()) return { success: false, error: "Kód expiroval" };
  if (code.max_uses && code.current_uses >= code.max_uses) return { success: false, error: "Kód byl již využit" };
  if (code.is_personal && code.assigned_to !== params.userId) return { success: false, error: "Kód je přidělen jinému uživateli" };

  // Insert redemption
  const { error: redErr } = await supabase.from("redemptions").insert({
    promo_code_id: params.codeId,
    user_id: params.userId,
    campaign_id: params.campaignId,
    source: params.source || "app",
  });

  if (redErr) return { success: false, error: "Chyba při uplatnění" };

  // Increment usage count
  await supabase.from("promo_codes").update({
    current_uses: (code.current_uses || 0) + 1,
    active: (code.max_uses && (code.current_uses || 0) + 1 >= code.max_uses) ? false : true,
  }).eq("id", params.codeId);

  // Update reward history
  await supabase.from("reward_history").update({
    redeemed: true,
    redeemed_at: new Date().toISOString(),
  }).eq("user_id", params.userId).eq("campaign_id", params.campaignId).eq("redeemed", false);

  // Audit
  await logAuditEvent({
    entityType: "redemption",
    entityId: params.codeId,
    action: "redeemed",
    actorId: params.userId,
    newValues: { code: code.code, campaign_id: params.campaignId },
  });

  return { success: true };
}

// ─── Rule Type Labels (for UI) ───────────────────────────────────────

export const RULE_TYPE_LABELS: Record<RuleType, string> = {
  min_attendance: "Minimální docházka",
  min_sessions_month: "Tréninků za měsíc",
  plan_completion: "Dokončení plánu",
  course_completion: "Dokončení kurzu",
  manual_approval: "Ruční schválení",
  streak_days: "Série po sobě jdoucích dnů",
  weight_goal: "Váhový cíl",
  custom_metric: "Vlastní metrika",
};

export const OPERATOR_LABELS: Record<Operator, string> = {
  eq: "=",
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
};