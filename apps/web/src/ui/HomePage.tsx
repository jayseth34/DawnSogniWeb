import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div style={{ paddingTop: 20 }}>
      <div className="h1">Dawn Sogni</div>
      <div className="muted" style={{ fontSize: 16, maxWidth: 820 }}>
        Dawn Sogni means <b>“the morning dream”</b> — a brand built on fresh ideas, clean silhouettes, and drops that feel
        like the first light of the day.
      </div>
      <div className="hr" />
      <div className="grid cards">
        <div className="card">
          <div className="p">
            <div className="h2">Design Drops</div>
            <div className="muted">Limited designs we release as drops. Choose your fit and place a COD order.</div>
            <div style={{ height: 12 }} />
            <Link className="btn primary" to="/drops">
              Explore drops
            </Link>
          </div>
        </div>
        <div className="card">
          <div className="p">
            <div className="h2">Custom Designs</div>
            <div className="muted">
              Want something personal? Request a custom design. We usually quote based on complexity (approx \u20B9600–\u20B9800 as a
              starting range).
            </div>
            <div style={{ height: 12 }} />
            <Link className="btn" to="/custom">
              Request custom
            </Link>
          </div>
        </div>
        <div className="card">
          <div className="p">
            <div className="h2">Bulk Orders</div>
            <div className="muted">Collar, round neck, oversized — bulk orders supported. COD only for now.</div>
            <div style={{ height: 12 }} />
            <Link className="btn" to="/bulk">
              Create bulk request
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}