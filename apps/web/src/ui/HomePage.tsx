import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { useSessionApi } from "./useSession";
import { formatRupees } from "./money";

function dropHref(dropId: string) {
  return `/drops/${encodeURIComponent(dropId)}`;
}

export function HomePage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["drops"], queryFn: api.drops });
  const { addDropToCart, canShop, requireLogin } = useSessionApi();

  const drops = data ?? [];
  const newArrivals = drops.slice(0, 8);

  return (
    <div>
      <div className="heroWrap">
        <div className="heroSplit" role="banner" aria-label="Dawn Sogni">
          <div className="heroHalf heroHalfLeft" aria-hidden="true">
            <div className="heroWord">DAWN</div>
          </div>
          <div className="heroHalf heroHalfRight" aria-hidden="true">
            <div className="heroWord">SOGNI</div>
          </div>
          <div className="heroOverlay">
            <div className="heroSlogan">First thought in the morning</div>
            <div className="heroActions">
              <Link className="btn primary" to="/drops">
                Shop drops
              </Link>
              <Link className="btn" to="/custom">
                Custom order
              </Link>
              {/* <Link className="btn" to="/bulk">
                Bulk order
              </Link> */}
            </div>
          </div>
        </div>
      </div>

      <div className="marqueeBar" aria-hidden="true">
        <div className="marqueeTrack">
          {[
            // "Free Shipping Across India",
            "COD Available",
            // "Exchanges Available",
            "Premium Fabric",
            "Limited Drops",
            "Custom Designs"
          ]
            .concat([
              // "Free Shipping Across India",
              "COD Available",
              // "Exchanges Available",
              "Premium Fabric",
              "Limited Drops",
              "Custom Designs"
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

        {isLoading && (
          <div className="muted" style={{ textAlign: "center", padding: 18 }}>
            Loading...
          </div>
        )}
        {error && (
          <div className="muted" style={{ textAlign: "center", padding: 18 }}>
            Failed to load products.
          </div>
        )}

        <div className="productGrid">
          {newArrivals.map((d) => (
            <div className="productCard" key={d.id}>
              <Link to={dropHref(d.id)} aria-label={d.title}>
                {d.images?.[0] ? <img className="productImg" src={d.images[0]} alt={d.title} /> : <div className="productImg" />}
              </Link>
              <div className="productMeta">
                <div className="productNameRow">
                  <div className="productName clamp2" title={d.title}>
                    {d.title}
                  </div>
                </div>
                <div className="productPrice">{d.priceCents === 0 ? "Quote pending" : formatRupees(d.priceCents)}</div>
                <div className="productActions">
                  <button className="btn primary" onClick={() => (canShop ? addDropToCart(d) : requireLogin())}>
                    Add
                  </button>
                  <Link className="btn" to={dropHref(d.id)}>
                    View
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