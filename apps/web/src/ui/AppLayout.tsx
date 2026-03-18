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
      <footer className="container siteFooter">
        <div className="hr" />
        <div className="siteFooterInner">
          <div className="muted2">Copyright {new Date().getFullYear()} Dawn Sogni</div>
          <a
            className="siteFooterLink"
            href="https://www.instagram.com/dawn.sogni?igsh=eHBxMDUyMWF5dXBo"
            target="_blank"
            rel="noreferrer"
          >
            Instagram: dawn.sogni
          </a>
        </div>
      </footer>
    </div>
  );
}
