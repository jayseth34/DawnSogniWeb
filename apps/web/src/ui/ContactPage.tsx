import { Link } from "react-router-dom";

export function ContactPage() {
  return (
    <div className="container page publicPageShell" style={{ maxWidth: 760 }}>
      <div className="publicPageIntro revealSection">
        <div className="h2">Contact</div>
        <div className="muted">For quick support, place a custom request with your query and we will reach out.</div>
      </div>
      <div className="hr" />
      <div className="card revealSection">
        <div className="p">
          <div style={{ fontWeight: 800 }}>Need help with an order?</div>
          <div className="muted" style={{ marginTop: 8 }}>
            If you already placed an order, open <Link to="/orders">Your Orders</Link> to see the latest status.
          </div>
          <div style={{ height: 12 }} />
          <Link className="btn primary" to="/custom">
            Message via Custom Request
          </Link>
        </div>
      </div>
    </div>
  );
}
