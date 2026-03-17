import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../api";

function AdminNavLink(props: { to: string; label: string; active: boolean }) {
  return (
    <Link className={props.active ? "adminNavLink active" : "adminNavLink"} to={props.to}>
      <span>{props.label}</span>
      <span style={{ opacity: 0.55 }}>›</span>
    </Link>
  );
}

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

  const isLogin = loc.pathname.endsWith("/login");
  const showNav = !isLogin;

  const activeKey = useMemo(() => {
    const p = loc.pathname;
    if (p.startsWith("/admin/orders")) return "orders";
    if (p.startsWith("/admin/drops")) return "drops";
    if (p.startsWith("/admin/custom")) return "custom";
    return "";
  }, [loc.pathname]);

  if (!ready)
    return (
      <div className="adminRoot">
        <div className="container page">
          <div className="muted">Loading…</div>
        </div>
      </div>
    );

  if (!authed && !isLogin) return null;

  return (
    <div className="adminRoot">
      <div className="adminTopBar">
        <div className="adminTopInner">
          <div className="adminBrand">
            <div className="adminBrandTitle">Admin</div>
            <div className="adminBrandSub">Dawn Sogni</div>
          </div>

          <div className="row" style={{ gap: 10 }}>
            <a className="btn" href="/" target="_blank" rel="noreferrer">
              View store
            </a>
            {showNav && (
              <button
                className="btn"
                onClick={async () => {
                  await api.admin.logout();
                  nav("/admin/login");
                }}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>

      {showNav ? (
        <div className="adminShell">
          <aside className="adminSide">
            <div className="adminSideInner">
              <AdminNavLink to="/admin/orders" label="Orders" active={activeKey === "orders"} />
              <AdminNavLink to="/admin/drops" label="Products (Drops)" active={activeKey === "drops"} />
              <AdminNavLink to="/admin/custom" label="Custom Requests" active={activeKey === "custom"} />
            </div>
          </aside>
          <main className="adminMain">
            <Outlet />
          </main>
        </div>
      ) : (
        <div className="container page" style={{ maxWidth: 560 }}>
          <Outlet />
        </div>
      )}
    </div>
  );
}
