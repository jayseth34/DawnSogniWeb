import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export function AdminLoginPage() {
  const nav = useNavigate();
  const [passcode, setPasscode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    if (!passcode) return;
    setStatus("");
    setLoading(true);
    try {
      await api.admin.login(passcode);
      nav("/admin/orders");
    } catch (e: any) {
      setStatus(`Login failed: ${String(e?.message ?? e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="h2">Admin Login</div>
      <div className="muted">Enter your passcode to continue.</div>
      <div className="hr" />

      <div className="card">
        <div className="p">
          <div className="label">Passcode</div>
          <input
            className="input"
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") login();
            }}
            autoFocus
          />
          <div style={{ height: 14 }} />
          <button className="btn primary" onClick={login} disabled={!passcode || loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
          {status && (
            <div className="muted" style={{ marginTop: 12 }}>
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
