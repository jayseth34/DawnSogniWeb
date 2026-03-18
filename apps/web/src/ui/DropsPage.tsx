import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { useSessionApi } from "./useSession";
import { DropProductCard } from "./DropProductCard";

const categories = ["All", "Tee", "Shirt", "Oversized"] as const;

type Category = (typeof categories)[number];

function categoryFromParams(params: URLSearchParams): Category {
  const raw = (params.get("category") || "All").trim();
  return categories.includes(raw as Category) ? (raw as Category) : "All";
}

export function DropsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["drops"], queryFn: api.drops });
  const { cartCount, addDropToCart, canShop, requireLogin } = useSessionApi();
  const [params, setParams] = useSearchParams();

  const category = categoryFromParams(params);
  const q = (params.get("q") || "").trim();
  const drops = data ?? [];

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    return drops.filter((d) => {
      const matchesCategory =
        category === "All" ||
        (d.category || "").toLowerCase() === category.toLowerCase() ||
        d.title.toLowerCase().includes(category.toLowerCase());

      const matchesQuery =
        !query || d.title.toLowerCase().includes(query) || (d.description || "").toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [drops, category, q]);

  function setQuery(next: string) {
    const nextParams = new URLSearchParams(params);
    if (next.trim()) nextParams.set("q", next.trim());
    else nextParams.delete("q");
    setParams(nextParams, { replace: true });
  }

  function setCategory(next: Category) {
    const nextParams = new URLSearchParams(params);
    if (next !== "All") nextParams.set("category", next);
    else nextParams.delete("category");
    setParams(nextParams, { replace: true });
  }

  return (
    <div className="container page publicPageShell">
      <div className="publicPageIntro revealSection">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="h2">Shop</div>
            <div className="muted">Limited drops, saved cart on this device, and a fuller gallery right from the grid.</div>
          </div>
          <Link className="pill" to="/checkout">
            Cart items: {cartCount}
          </Link>
        </div>

        <div style={{ height: 12 }} />

        <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
          <div className="row" style={{ gap: 10 }}>
            {categories.map((c) => (
              <button key={c} className={c === category ? "btn primary" : "btn"} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>

          <input
            className="input"
            style={{ width: 320, maxWidth: "100%" }}
            placeholder="Search"
            value={q}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={{ height: 14 }} />

      {isLoading && <div className="muted">Loading...</div>}
      {error && <div className="muted">Failed to load drops.</div>}

      <div className="productGrid revealSection">
        {filtered.map((drop) => (
          <DropProductCard
            key={drop.id}
            drop={drop}
            canShop={canShop}
            onAdd={() => addDropToCart(drop)}
            onRequireLogin={requireLogin}
            showDescription
          />
        ))}
      </div>

      {filtered.length === 0 && !isLoading && <div className="muted" style={{ paddingTop: 14 }}>No matching products.</div>}
    </div>
  );
}
