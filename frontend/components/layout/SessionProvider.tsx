"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { clearToken, readToken, writeToken } from "@/lib/session";
import type { User } from "@/lib/types";

export type Provider = "google" | "microsoft" | "sso" | "demo";

interface SessionApi {
  user: User | null;
  loading: boolean;
  signIn: (provider: Provider) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionApi>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const useSession = () => useContext(SessionContext);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolve whatever token the cookie holds on mount. A token the server no
  // longer recognises (revoked, expired, database reseeded) is cleared rather
  // than left to fail every subsequent request.
  useEffect(() => {
    let cancelled = false;
    const token = readToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .readSession()
      .then((session) => {
        if (!cancelled) setUser(session.user);
      })
      .catch(() => {
        clearToken();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(
    async (provider: Provider) => {
      const result = await api.signIn(provider);
      writeToken(result.token, result.expires_at);
      setUser(result.user);
      queryClient.clear();
      router.push("/home");
    },
    [queryClient, router],
  );

  const signOut = useCallback(async () => {
    try {
      await api.signOut();
    } catch {
      // A failed revoke must not trap someone in a signed-in UI; the local
      // token is cleared either way.
    }
    clearToken();
    setUser(null);
    queryClient.clear();
    router.push("/login");
  }, [queryClient, router]);

  const value = useMemo<SessionApi>(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
