import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export function useCustomerAuth() {
  const qc = useQueryClient();

  const me = useQuery({
    queryKey: ["customerMe"],
    queryFn: api.customer.me,
    retry: false,
    staleTime: 30_000
  });

  const phoneDigits = me.data?.phoneDigits || "";
  const isAuthed = Boolean(phoneDigits);

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["customerMe"] });
  }

  async function logout() {
    try {
      await api.customer.logout();
    } finally {
      qc.removeQueries({ queryKey: ["customerMe"] });
    }
  }

  return {
    isAuthed,
    phoneDigits,
    me,
    refresh,
    logout
  };
}
