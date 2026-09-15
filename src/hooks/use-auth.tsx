import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [accountType, setAccountType] = useState<"personal" | "business" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | null = null;

    async function fetchAccountType(userId: string) {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("account_type")
          .eq("id", userId)
          .maybeSingle();
        if (active) {
          setAccountType((data?.account_type as "personal" | "business" | null) ?? "personal");
        }
      } catch {
        if (active) setAccountType("personal");
      }
    }

    try {
      // CRITICAL: set up the listener BEFORE getSession to avoid races.
      const { data } = supabase.auth.onAuthStateChange((_evt, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) fetchAccountType(s.user.id);
        else if (active) setAccountType(null);
      });
      subscription = data.subscription;

      supabase.auth
        .getSession()
        .then(({ data: { session: s } }) => {
          setSession(s);
          setUser(s?.user ?? null);
          if (s?.user)
            fetchAccountType(s.user.id).then(() => {
              if (active) setLoading(false);
            });
          else if (active) {
            setAccountType(null);
            setLoading(false);
          }
        })
        .catch(() => {
          if (active) {
            setAccountType(null);
            setLoading(false);
          }
        });
    } catch (err) {
      console.warn("[useAuth] Supabase not initialized, running unauthenticated:", err);
      if (active) {
        setAccountType(null);
        setLoading(false);
      }
    }

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  return { user, session, accountType, loading };
}
