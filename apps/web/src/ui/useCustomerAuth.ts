import { useEffect, useState } from "react";
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
  const [cached, setCached] = useState(() => loadCachedPhoneDigits());

  const me = useQuery({
    queryKey: ["customerMe"],
    queryFn: api.customer.me,
    retry: false,
    staleTime: 30_000
  });

  useEffect(() => {
    // Keep the cached value in sync so the UI doesn't keep thinking you're signed in.
    if (me.data?.phoneDigits) {
      saveCachedPhoneDigits(me.data.phoneDigits);
      setCached(me.data.phoneDigits);
    }
    if (me.isError) {
      saveCachedPhoneDigits("");
      setCached("");
    }
  }, [me.data?.phoneDigits, me.isError]);

  const phoneDigits = me.data?.phoneDigits || cached;
  const isAuthed = Boolean(phoneDigits);
  const ready = me.isFetched || me.isError;

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["customerMe"] });
  }

  async function logout() {
    try {
      await api.customer.logout();
    } finally {
      saveCachedPhoneDigits("");
      setCached("");
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
