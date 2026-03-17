import { Outlet, useLocation } from "react-router-dom";
import { SiteHeader } from "./SiteHeader";
import { useSessionApi } from "./useSession";

export function AppLayout() {
  const loc = useLocation();
  const isAdmin = loc.pathname.startsWith("/admin");
  const { cartCount } = useSessionApi();

  if (isAdmin) return <Outlet />;

  return (
    <div>
      <SiteHeader cartCount={cartCount} />
      <Outlet />
      <footer className="container">
        <div className="hr" />
        <div className="muted2">© {new Date().getFullYear()} Dawn Sogni</div>
      </footer>
    </div>
  );
}
