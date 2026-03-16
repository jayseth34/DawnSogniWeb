import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

const CACHE_KEY = "dawnsogni.customer.phoneDigits";

function loadCachedPhoneDigits() {
  try {
    return String(localStorage.getItem(CACHE_KEY) || "");
  } catch {
    return "";
  }
}

function saveCachedPhoneDigits(v: string) {
  try {
    if (v) localStorage.setItem(CACHE_KEY, v);
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

export function cacheCustomerPhoneDigits(phoneDigits: string) {
  saveCachedPhoneDigits(phoneDigits);
}

export type CustomerAuthStatus = "loading" | "authed" | "anon";

export function useCustomerAuth() {
  const qc = useQueryClient();
  const [cachedPhoneDigits, setCachedPhoneDigits] = useState(() => loadCachedPhoneDigits());

  const me = useQuery({
    queryKey: ["customerMe"],
    queryFn: api.customer.me,
    retry: false,
    staleTime: 30_000
  });

  useEffect(() => {
    if (me.data?.phoneDigits) {
      saveCachedPhoneDigits(me.data.phoneDigits);
      setCachedPhoneDigits(me.data.phoneDigits);
    }
    if (me.data && !me.data.phoneDigits) {
      saveCachedPhoneDigits("");
      setCachedPhoneDigits("");
    }
  }, [me.data?.phoneDigits, me.data]);

  const status: CustomerAuthStatus = useMemo(() => {
    if (me.isPending) return "loading";
    if (me.data?.phoneDigits) return "authed";
    return "anon";
  }, [me.isPending, me.data?.phoneDigits]);

  const phoneDigits = me.data?.phoneDigits || "";

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["customerMe"] });
  }

  async function logout() {
    try {
      await api.customer.logout();
    } finally {
      saveCachedPhoneDigits("");
      setCachedPhoneDigits("");
      qc.removeQueries({ queryKey: ["customerMe"] });
    }
  }

  return {
    status,
    isAuthed: status === "authed",
    phoneDigits,
    cachedPhoneDigits,
    me,
    refresh,
    logout
  };
}
