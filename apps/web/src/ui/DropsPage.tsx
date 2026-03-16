import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { useSessionApi } from "./useSession";
import { formatRupees } from "./money";

const categories = ["All", "Tee", "Shirt", "Oversized"] as const;

type Category = (typeof categories)[number];

function categoryFromParams(params: URLSearchParams): Category {
  const raw = (params.get("category") || "All").trim();
  return (categories.includes(raw as any) ? (raw as Category) : "All");
}

export function DropsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["drops"], queryFn: api.drops });
  const { cartCount, addDropToCart } = useSessionApi();
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
    <div className="container page">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="h2">Shop</div>
          <div className="muted">Drops are limited. Cart is saved on this device.</div>
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

      <div style={{ height: 14 }} />

      {isLoading && <div className="muted">Loading...</div>}
      {error && <div className="muted">Failed to load drops.</div>}

      <div className="productGrid">
        {filtered.map((d) => (
          <div className="productCard" key={d.id}>
            {d.images?.[0] ? <img className="productImg" src={d.images[0]} alt={d.title} /> : <div className="productImg" />}
            <div className="productMeta">
              <div className="productNameRow">
                <div className="productName clamp2" title={d.title}>
                  {d.title}
                </div>
              </div>
              <div className="muted2 clamp2" style={{ marginTop: 6, fontSize: 13 }}>
                {d.description ?? "—"}
              </div>
              <div className="productPrice">{d.priceCents === 0 ? "Quote pending" : formatRupees(d.priceCents)}</div>
              <div className="productActions">
                <button className="btn primary" onClick={() => addDropToCart(d)}>
                  Add
                </button>
                <Link className="btn" to="/checkout">
                  Checkout
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !isLoading && <div className="muted" style={{ paddingTop: 14 }}>No matching products.</div>}
    </div>
  );
}
