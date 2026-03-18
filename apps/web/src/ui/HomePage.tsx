import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { useSessionApi } from "./useSession";
import { DropProductCard } from "./DropProductCard";

export function HomePage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["drops"], queryFn: api.drops });
  const { addDropToCart, canShop, requireLogin } = useSessionApi();

  const drops = data ?? [];
  const newArrivals = drops.slice(0, 8);

  return (
    <div>
      <div className="heroWrap revealSection">
        <div className="heroSplit" role="banner" aria-label="Dawn Sogni">
          <div className="heroHalf heroHalfLeft" aria-hidden="true">
            <div className="heroWord">DAWN</div>
          </div>
          <div className="heroHalf heroHalfRight" aria-hidden="true">
            <div className="heroWord">SOGNI</div>
          </div>
          <div className="heroOverlay">
            <div className="heroKicker">Morning dreamwear</div>
            <div className="heroSlogan">First thought in the morning</div>
            <div className="heroDesc">
              Dawn Sogni means the morning dream. We release original drops, create custom design pieces, and handle
              bulk t-shirt orders in round neck, collar, and oversized fits.
            </div>
            <div className="heroActions">
              <Link className="btn primary" to="/drops">
                Shop drops
              </Link>
              <Link className="btn" to="/custom">
                Custom order
              </Link>
              <Link className="btn" to="/bulk">
                Bulk order
              </Link>
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

      <section className="section revealSection">
        <div className="homeInfoGrid">
          <article className="infoCard infoCardStory revealItem">
            <div className="infoEyebrow">About the brand</div>
            <h2 className="infoTitle">Streetwear drops, custom design work, and bulk apparel under one label.</h2>
            <p className="infoText">
              Dawn Sogni is for people who want clothing with a point of view. Some pieces come from our own drop
              language, some begin from your references and ideas, and some are produced in quantity for events,
              creators, communities, or teams.
            </p>
          </article>

          <article className="infoCard infoCardOfferings revealItem">
            <div className="infoEyebrow">What we offer</div>
            <div className="offerList">
              <div className="offerItem">
                <div className="offerTitle">Drop designs</div>
                <div className="offerText">Ready-to-order releases from Dawn Sogni collections.</div>
              </div>
              <div className="offerItem">
                <div className="offerTitle">Custom designs</div>
                <div className="offerText">Share your brief and references, and we quote the design personally.</div>
              </div>
              <div className="offerItem">
                <div className="offerTitle">Bulk t-shirts</div>
                <div className="offerText">Round neck, collar, and oversized options for larger quantities.</div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="section editorialSection revealSection">
        <div className="sectionTitle">How It Works</div>
        <div className="stepsGrid">
          <article className="stepCard stepCardOne revealItem">
            <div className="stepNumber">01</div>
            <div className="stepTitle">Choose your path</div>
            <div className="stepText">Pick a live drop, request a custom piece, or place a bulk apparel requirement.</div>
          </article>
          <article className="stepCard stepCardTwo revealItem">
            <div className="stepNumber">02</div>
            <div className="stepTitle">Approve the order</div>
            <div className="stepText">Orders begin on COD. Custom work gets a personal quote before the final yes.</div>
          </article>
          <article className="stepCard stepCardThree revealItem">
            <div className="stepNumber">03</div>
            <div className="stepTitle">Track every update</div>
            <div className="stepText">Acceptance, partial payment, shipping, delivery, and notes remain visible.</div>
          </article>
        </div>
      </section>

      <section className="section revealSection">
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
          {newArrivals.map((drop) => (
            <DropProductCard
              key={drop.id}
              drop={drop}
              canShop={canShop}
              onAdd={() => addDropToCart(drop)}
              onRequireLogin={requireLogin}
            />
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
