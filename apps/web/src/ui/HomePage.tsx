import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, type DropDesign } from "../api";
import { useSessionApi } from "./useSession";
import { formatRupees } from "./money";

function pickImages(drops: DropDesign[], count: number): Array<string | null> {
  const imgs = drops.flatMap((d) => (d.images?.length ? [d.images[0]] : []));
  if (imgs.length === 0) return Array.from({ length: count }, () => null);
  const out: Array<string | null> = [];
  for (let i = 0; i < count; i++) out.push(imgs[i % imgs.length] ?? null);
  return out;
}

export function HomePage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["drops"], queryFn: api.drops });
  const { addDropToCart, canShop, requireLogin } = useSessionApi();

  const drops = data ?? [];
  const hero = useMemo(() => pickImages(drops, 4), [drops]);
  const newArrivals = drops.slice(0, 8);

  return (
    <div>
      <div className="heroWrap">
        <div className="heroGrid">
          <div className="heroTile heroLeft">{hero[0] ? <img src={hero[0]} alt="" /> : null}</div>
          <div className="heroTile heroMid">{hero[1] ? <img src={hero[1]} alt="" /> : null}</div>
          <div className="heroTile heroRight">{hero[2] ? <img src={hero[2]} alt="" /> : null}</div>
          <div className="heroTile heroBottom">{hero[3] ? <img src={hero[3]} alt="" /> : null}</div>
        </div>
      </div>

      <div className="marqueeBar" aria-hidden="true">
        <div className="marqueeTrack">
          {[
            "Free Shipping Across India",
            "COD Available",
            "Exchanges Available",
            "5000+ Trusted Customers",
            "Premium Fabric",
            "Limited Drops"
          ]
            .concat([
              "Free Shipping Across India",
              "COD Available",
              "Exchanges Available",
              "5000+ Trusted Customers",
              "Premium Fabric",
              "Limited Drops"
            ])
            .map((t, idx) => (
              <div key={`${t}-${idx}`} className="marqueeItem">
                {t}
              </div>
            ))}
        </div>
      </div>

      <section className="section">
        <div className="sectionTitle">New Arrivals</div>

        {isLoading && <div className="muted" style={{ textAlign: "center", padding: 18 }}>Loading...</div>}
        {error && (
          <div className="muted" style={{ textAlign: "center", padding: 18 }}>
            Failed to load products.
          </div>
        )}

        <div className="productGrid">
          {newArrivals.map((d) => (
            <div className="productCard" key={d.id}>
              {d.images?.[0] ? <img className="productImg" src={d.images[0]} alt={d.title} /> : <div className="productImg" />}
              <div className="productMeta">
                <div className="productNameRow">
                  <div className="productName clamp2" title={d.title}>
                    {d.title}
                  </div>
                </div>
                <div className="productPrice">{d.priceCents === 0 ? "Quote pending" : formatRupees(d.priceCents)}</div>
                <div className="productActions">
                  <button className="btn primary" onClick={() => (canShop ? addDropToCart(d) : requireLogin())}>Add</button>
                  <Link className="btn" to="/checkout">
                    Checkout
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!isLoading && drops.length === 0 && (
          <div className="muted" style={{ textAlign: "center", padding: 18 }}>
            No products available right now. Check back soon.
          </div>
        )}

        <div style={{ height: 22 }} />
        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn primary" to="/drops">
            Shop all
          </Link>
          <Link className="btn" to="/custom">
            Request custom
          </Link>
        </div>
      </section>
    </div>
  );
}



