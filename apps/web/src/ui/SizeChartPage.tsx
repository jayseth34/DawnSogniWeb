export function SizeChartPage() {
  return (
    <div className="container page" style={{ maxWidth: 820 }}>
      <div className="h2">Size Chart</div>
      <div className="muted">Refer to the measurements below before ordering. If you’re between sizes, size up for a relaxed fit.</div>
      <div className="hr" />

      <div className="card">
        <div className="p">
          <div style={{ fontWeight: 800 }}>Tee (Slim Fit)</div>
          <div className="muted" style={{ marginTop: 10 }}>
            <div className="row" style={{ gap: 10 }}>
              <div className="pill">S: Chest 38 · Length 26</div>
              <div className="pill">M: Chest 40 · Length 27</div>
              <div className="pill">L: Chest 42 · Length 28</div>
              <div className="pill">XL: Chest 44 · Length 29</div>
            </div>
          </div>
          <div className="hr" />
          <div style={{ fontWeight: 800 }}>Oversized</div>
          <div className="muted" style={{ marginTop: 10 }}>
            <div className="row" style={{ gap: 10 }}>
              <div className="pill">S: Chest 42 · Length 28</div>
              <div className="pill">M: Chest 44 · Length 29</div>
              <div className="pill">L: Chest 46 · Length 30</div>
              <div className="pill">XL: Chest 48 · Length 31</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
