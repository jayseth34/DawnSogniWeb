import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export function AdminLoginPage() {
  const nav = useNavigate();
  const [passcode, setPasscode] = useState("");
  const [status, setStatus] = useState("");

  async function login() {
    setStatus("");
    try {
      await api.admin.login(passcode);
      nav("/admin/orders");
    } catch (e: any) {
      setStatus(`Failed: ${String(e?.message ?? e)}`);
    }
  }

  return (
    <div style={{ paddingTop: 18, maxWidth: 520 }}>
      <div className="h2">Admin login</div>
      <div className="muted">
        No customer login yet. Admin route is unique: <b>/admin</b>.
      </div>
      <div className="hr" />
      <div className="label">Passcode</div>
      <input className="input" type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} />
      <div style={{ height: 14 }} />
      <button className="btn primary" onClick={login} disabled={!passcode}>
        Login
      </button>
      {status && (
        <div className="muted" style={{ marginTop: 12 }}>
          {status}
        </div>
      )}
    </div>
  );
}

