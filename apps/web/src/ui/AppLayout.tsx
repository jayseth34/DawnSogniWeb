import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SiteHeader } from "./SiteHeader";
import { useSessionApi } from "./useSession";

export function AppLayout() {
  const loc = useLocation();
  const isAdmin = loc.pathname.startsWith("/admin");
  const { cartCount } = useSessionApi();

  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<any>).detail;
      const msg = String(detail?.message || "").trim();
      if (!msg) return;
      setToast(msg);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(""), 1300);
    }

    window.addEventListener("dawnsogni:toast", onToast as EventListener);
    return () => {
      window.removeEventListener("dawnsogni:toast", onToast as EventListener);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  if (isAdmin) return <Outlet />;

  return (
    <div className="publicApp">
      <SiteHeader cartCount={cartCount} />
      {toast && (
        <div className="appToast" role="status" aria-live="polite">
          {toast} (Cart: {cartCount})
        </div>
      )}
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
