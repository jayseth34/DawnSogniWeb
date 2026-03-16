import { useEffect, useMemo } from "react";
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

export function useCustomerAuth() {
  const qc = useQueryClient();

  const me = useQuery({
    queryKey: ["customerMe"],
    queryFn: api.customer.me,
    retry: false,
    staleTime: 30_000
  });

  const cached = useMemo(() => loadCachedPhoneDigits(), []);
  const phoneDigits = me.data?.phoneDigits || cached;
  const isAuthed = Boolean(phoneDigits);
  const ready = me.isFetched || me.isError;

  useEffect(() => {
    if (me.data?.phoneDigits) saveCachedPhoneDigits(me.data.phoneDigits);
    if (me.isError) saveCachedPhoneDigits("");
  }, [me.data?.phoneDigits, me.isError]);

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["customerMe"] });
  }

  async function logout() {
    try {
      await api.customer.logout();
    } finally {
      saveCachedPhoneDigits("");
      qc.removeQueries({ queryKey: ["customerMe"] });
    }
  }

  return {
    isAuthed,
    phoneDigits,
    ready,
    me,
    refresh,
    logout
  };
}
