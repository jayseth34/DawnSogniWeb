export function ReturnsPage() {
  return (
    <div className="container page" style={{ maxWidth: 820 }}>
      <div className="h2">Returns & Exchanges</div>
      <div className="muted">For returns/exchanges, contact support with your order number and photos (if needed).</div>
      <div className="hr" />

      <div className="card">
        <div className="p">
          <div style={{ fontWeight: 800 }}>Eligibility</div>
          <div className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
            Unused items in original condition can be exchanged within 7 days of delivery. Custom designs and bulk orders
            may have different eligibility.
          </div>
          <div className="hr" />
          <div style={{ fontWeight: 800 }}>How to request</div>
          <div className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
            Go to “Contact” and submit your request with your order number and photos, if applicable.
          </div>
          <div className="hr" />
          <div style={{ fontWeight: 800 }}>Notes</div>
          <div className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
            Shipping fees and timelines may apply depending on the case.
          </div>
        </div>
      </div>
    </div>
  );
}

