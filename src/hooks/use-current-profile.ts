import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "coach" | "client" | "admin";

export interface CurrentProfile {
  id: string;
  role: UserRole;
  onboarding_done: boolean;
  full_name: string;
  assigned_coach_id: string | null;
}

/** Supabase session, kept in sync with auth state changes. `undefined` while loading. */
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_OUT" || event === "SIGNED_IN" || event === "USER_UPDATED") {
        queryClient.invalidateQueries({ queryKey: ["current-profile"] });
      }
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  return session;
}

/** Profile of the signed-in user (role, onboarding state). */
export function useCurrentProfile() {
  const session = useSession();
  const userId = session?.user.id;

  const query = useQuery({
    queryKey: ["current-profile", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<CurrentProfile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, onboarding_done, full_name, assigned_coach_id")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data as CurrentProfile | null;
    },
  });

  return {
    session,
    profile: query.data ?? null,
    isLoading: session === undefined || (!!userId && query.isLoading),
    error: query.error,
  };
}

export function homePathForRole(role: UserRole | undefined) {
  return role === "client" ? "/klient" : "/dashboard";
}
