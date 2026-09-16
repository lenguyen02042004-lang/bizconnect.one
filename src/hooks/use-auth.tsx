import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

let globalUser: User | null = null;
let globalSession: Session | null = null;
let globalAccountType: "personal" | "business" | null = null;
let globalLoading = true;
const listeners = new Set<() => void>();

let initialized = false;

function notify() {
  listeners.forEach((l) => l());
}

async function fetchAccountType(userId: string) {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", userId)
      .maybeSingle();
    globalAccountType = (data?.account_type as "personal" | "business" | null) ?? "personal";
  } catch {
    globalAccountType = "personal";
  }
  notify();
}

function initAuth() {
  if (initialized) return;
  initialized = true;

  try {
    const { data } = supabase.auth.onAuthStateChange((_evt, s) => {
      globalSession = s;
      globalUser = s?.user ?? null;
      if (s?.user) {
        fetchAccountType(s.user.id);
      } else {
        globalAccountType = null;
        globalLoading = false;
        notify();
      }
    });

    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        globalSession = s;
        globalUser = s?.user ?? null;
        if (s?.user) {
          fetchAccountType(s.user.id).then(() => {
            globalLoading = false;
            notify();
          });
        } else {
          globalAccountType = null;
          globalLoading = false;
          notify();
        }
      })
      .catch(() => {
        globalAccountType = null;
        globalLoading = false;
        notify();
      });
  } catch (err) {
    console.warn("[useAuth] Supabase not initialized, running unauthenticated:", err);
    globalAccountType = null;
    globalLoading = false;
    notify();
  }
}

export function useAuth() {
  const [state, setState] = useState({
    user: globalUser,
    session: globalSession,
    accountType: globalAccountType,
    loading: globalLoading,
  });

  useEffect(() => {
    initAuth();
    const listener = () => {
      setState({
        user: globalUser,
        session: globalSession,
        accountType: globalAccountType,
        loading: globalLoading,
      });
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return state;
}
