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
  const spotlightDrops = drops.slice(0, 3);

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
            {/* <div className="heroKicker">Dawn Sogni</div> */}
            <div className="heroSlogan">First thought in the morning</div>
            <div className="heroDesc">
              Dawn Sogni means the morning dream. We release original drop designs, take custom design requests,
              and handle bulk t-shirt orders in round neck, collar, and oversized fits.
            </div>
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
          {["COD Available", "Premium Fabric", "Limited Drops", "Custom Designs"]
            .concat(["COD Available", "Premium Fabric", "Limited Drops", "Custom Designs"])
            .map((t, idx) => (
              <div key={`${t}-${idx}`} className="marqueeItem">
                {t}
              </div>
            ))}
        </div>
      </div>

      <section className="section">
        <div className="homeInfoGrid">
          <article className="infoCard infoCardStory">
            <div className="infoEyebrow">About the brand</div>
            <h2 className="infoTitle">Streetwear drops, custom design work, and bulk orders under one label.</h2>
            <p className="infoText">
              Dawn Sogni is built for people who want wearable pieces with a distinct identity. Some orders come from
              our own drop collections, some begin from your idea, and some are produced in quantity for events,
              teams, or brands.
            </p>
          </article>

          <article className="infoCard">
            <div className="infoEyebrow">What we offer</div>
            <div className="offerList">
              <div className="offerItem">
                <div className="offerTitle">Drop designs</div>
                <div className="offerText">Ready-to-order releases from Dawn Sogni collections.</div>
              </div>
              <div className="offerItem">
                <div className="offerTitle">Custom designs</div>
                <div className="offerText">Share your brief and references, and we will create and quote it personally.</div>
              </div>
              <div className="offerItem">
                <div className="offerTitle">Bulk t-shirts</div>
                <div className="offerText">Round neck, collar, and oversized options for larger order quantities.</div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="sectionTitle">How It Works</div>
        <div className="stepsGrid">
          <article className="stepCard">
            <div className="stepNumber">01</div>
            <div className="stepTitle">Choose your order type</div>
            <div className="stepText">Shop a live drop, request a custom design, or place a bulk apparel requirement.</div>
          </article>
          <article className="stepCard">
            <div className="stepNumber">02</div>
            <div className="stepTitle">Confirm and approve</div>
            <div className="stepText">Orders begin on COD. Custom orders get a personal quote before the final approval step.</div>
          </article>
          <article className="stepCard">
            <div className="stepNumber">03</div>
            <div className="stepTitle">Track every update</div>
            <div className="stepText">Acceptance, partial payment, shipping, delivery, and notes stay visible in order history.</div>
          </article>
        </div>
      </section>

      {spotlightDrops.length > 0 && (
        <section className="section">
          <div className="sectionTitle">Dawn Sogni Promise</div>
          <div className="benefitGrid">
            {spotlightDrops.map((drop, index) => (
              <article key={drop.id} className="benefitCard">
                <div className="benefitCount">{`0${index + 1}`}</div>
                <div className="benefitTitle">{drop.title}</div>
                <div className="benefitText">
                  {drop.description || "A limited Dawn Sogni design built to feel collectible and wearable."}
                </div>
                <Link className="btn" to={dropHref(drop.id)}>
                  View product
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

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
