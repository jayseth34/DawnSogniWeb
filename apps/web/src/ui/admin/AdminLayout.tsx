import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../../api";

export function AdminLayout() {
  const loc = useLocation();
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await api.admin.me();
        if (!mounted) return;
        setAuthed(true);
        setReady(true);
      } catch {
        if (!mounted) return;
        setAuthed(false);
        setReady(true);
        if (!loc.pathname.endsWith("/login")) nav("/admin/login", { replace: true });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loc.pathname, nav]);

  if (!ready) return <div className="container"><div className="muted">Loading admin…</div></div>;
  if (!authed && !loc.pathname.endsWith("/login")) return null;

  const showNav = !loc.pathname.endsWith("/login");

  return (
    <div className="container">
      {showNav && (
        <div className="nav">
          <div className="brand">
            <span className="pill">Admin</span>
            <span className="muted">Dawn Sogni</span>
          </div>
          <div className="row">
            <Link className="pill" to="/admin/orders">
              Orders
            </Link>
            <Link className="pill" to="/admin/drops">
              Drops
            </Link>
            <Link className="pill" to="/admin/custom">
              Custom Requests
            </Link>
            <button
              className="btn"
              onClick={async () => {
                await api.admin.logout();
                nav("/admin/login");
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
      <Outlet />
    </div>
  );
}

