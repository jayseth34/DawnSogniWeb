import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { useSessionApi } from "./useSession";
import { DropProductCard } from "./DropProductCard";

const moodWords = ["Morning dream", "Limited drop language", "Custom-built graphics", "Oversized | Round neck | Collar"];

export function HomePage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["drops"], queryFn: api.drops });
  const { addDropToCart, canShop, requireLogin } = useSessionApi();

  const drops = data ?? [];
  const newArrivals = drops.slice(0, 5);

  return (
    <div className="premiumHome">
      <section className="heroWrap revealSection">
        <div className="premiumHero">
          <div className="premiumHeroBackdrop premiumBackdropLeft" aria-hidden="true" />
          <div className="premiumHeroBackdrop premiumBackdropRight" aria-hidden="true" />

          <div className="premiumHeroGrid">
            <div className="premiumHeroLead">
              <div className="heroPillRow">
                <span className="heroPill">First thought in the morning</span>
              </div>

              <div className="premiumHeroTitleWrap">
                <div className="premiumHeroTitleLine">DAWN</div>
                <div className="premiumHeroTitleLine premiumHeroTitleShift">SOGNI</div>
              </div>

              <p className="premiumHeroText">
                Dawn Sogni is a premium streetwear label built around the feeling of a morning dream ? original drops,
                custom-designed pieces, and bulk apparel produced with a sharper visual identity.
              </p>

              <div className="premiumHeroActions">
                <Link className="btn primary premiumBtn" to="/drops">
                  Explore the drop
                </Link>
                <Link className="btn premiumBtnGhost" to="/custom">
                  Start custom work
                </Link>
              </div>

              <div className="premiumHeroStats">
                <div className="premiumStatCard revealItem">
                  <div className="premiumStatValue">Drops</div>
                  <div className="premiumStatLabel">Original Dawn Sogni releases with ready-to-order pricing.</div>
                </div>
                <div className="premiumStatCard revealItem">
                  <div className="premiumStatValue">Custom</div>
                  <div className="premiumStatLabel">Reference-led design work with admin updates and quoted pricing.</div>
                </div>
                <div className="premiumStatCard revealItem">
                  <div className="premiumStatValue">Bulk</div>
                  <div className="premiumStatLabel">Oversized, collar, and round neck orders for teams and brands.</div>
                </div>
              </div>
            </div>

            <div className="premiumHeroVisual">
              <div className="premiumEditorialCard premiumEditorialMain revealItem">
                <div className="premiumEditorialKicker">Brand language</div>
                <div className="premiumEditorialTitle">A darker luxury mood with graphic streetwear energy.</div>
                <div className="premiumEditorialText">
                  We are shaping every page around contrast, texture, atmosphere, and a more premium editorial rhythm.
                </div>
              </div>

              <div className="premiumEditorialStack">
                <div className="premiumEditorialMini premiumMiniOne revealItem">
                  <span className="premiumMiniIndex">01</span>
                  <div>
                    <div className="premiumMiniTitle">COD-first orders</div>
                    <div className="premiumMiniText">Admin can accept, request partial payment, update, or cancel with notes.</div>
                  </div>
                </div>
                <div className="premiumEditorialMini premiumMiniTwo revealItem">
                  <span className="premiumMiniIndex">02</span>
                  <div>
                    <div className="premiumMiniTitle">Image-led custom flow</div>
                    <div className="premiumMiniText">Upload references, receive design previews, and track progress in one place.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="premiumTicker" aria-hidden="true">
            <div className="premiumTickerTrack">
              {moodWords.concat(moodWords).map((word, index) => (
                <span key={`${word}-${index}`} className="premiumTickerItem">
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section revealSection premiumSectionShell">
        <div className="premiumSplitStory">
          <article className="premiumStoryCard premiumStoryLarge revealItem">
            <div className="infoEyebrow">The concept</div>
            <h2 className="premiumSectionTitle">We are not building a generic tee store. We are building a label mood.</h2>
            <p className="premiumSectionText">
              The name Dawn Sogni translates to morning dream, so the interface should feel cinematic, layered, and
              intentional. That same idea extends into your drops, custom artwork, and bulk production requests.
            </p>
          </article>

          <article className="premiumStoryCard premiumStoryQuote revealItem">
            <div className="premiumQuoteMark">?</div>
            <p className="premiumQuoteText">
              Premium is not only fabric or price. It is the way the brand feels before the first order is placed.
            </p>
          </article>
        </div>
      </section>

      <section className="section revealSection premiumSectionShell">
        <div className="premiumCollectionHeader">
          <div>
            <div className="infoEyebrow">Offerings</div>
            <div className="sectionTitle premiumSectionHeading">Three ways to order</div>
          </div>
          <Link className="btn premiumBtnGhost" to="/orders">
            Track your order
          </Link>
        </div>

        <div className="premiumOfferGrid">
          <article className="premiumOfferCard revealItem">
            <div className="premiumOfferNumber">01</div>
            <div className="premiumOfferTitle">Own drops</div>
            <div className="premiumOfferText">Ready pieces from the Dawn Sogni catalogue with direct checkout and saved cart flow.</div>
            <Link className="premiumInlineLink" to="/drops">
              Browse drops
            </Link>
          </article>
          <article className="premiumOfferCard revealItem">
            <div className="premiumOfferNumber">02</div>
            <div className="premiumOfferTitle">Custom design orders</div>
            <div className="premiumOfferText">Upload reference images, receive previews, and get a personal quote based on the brief.</div>
            <Link className="premiumInlineLink" to="/custom">
              Start custom
            </Link>
          </article>
          <article className="premiumOfferCard revealItem">
            <div className="premiumOfferNumber">03</div>
            <div className="premiumOfferTitle">Bulk apparel</div>
            <div className="premiumOfferText">Round neck, collar, and oversized runs for creators, events, communities, and labels.</div>
            <Link className="premiumInlineLink" to="/bulk">
              Request bulk
            </Link>
          </article>
        </div>
      </section>

      <section className="section revealSection premiumSectionShell">
        <div className="premiumCollectionHeader">
          <div>
            <div className="infoEyebrow">Live now</div>
            <div className="sectionTitle premiumSectionHeading">Selected arrivals</div>
          </div>
          <Link className="btn premiumBtnGhost" to="/drops">
            View full catalog
          </Link>
        </div>

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

        <div className="productGrid premiumProductGrid">
          {newArrivals.map((drop) => (
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

        {!isLoading && drops.length === 0 && (
          <div className="muted" style={{ textAlign: "center", padding: 18 }}>
            No products available right now. Check back soon.
          </div>
        )}
      </section>
    </div>
  );
}

