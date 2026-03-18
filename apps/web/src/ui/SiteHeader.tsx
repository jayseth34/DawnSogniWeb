import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { IconBag, IconSearch, IconUser } from "./icons";
import { useCustomerAuth } from "./useCustomerAuth";

type LinkItem = { key: string; label: string; to: string };

const links: LinkItem[] = [
  { key: "home", label: "Home", to: "/" },
  { key: "tees", label: "Tees", to: "/drops?category=Tee" },
  { key: "shirts", label: "Shirts", to: "/drops?category=Shirt" },
  { key: "shop", label: "Shop", to: "/drops" },
  { key: "size", label: "Size Chart", to: "/size-chart" },
  { key: "custom", label: "Custom", to: "/custom" }
];

function activeKeyFromLocation(loc: ReturnType<typeof useLocation>) {
  const path = loc.pathname;
  if (path === "/") return "home";
  if (path === "/orders") return "orders";
  if (path === "/contact") return "contact";
  if (path === "/returns") return "returns";
  if (path === "/size-chart") return "size";
  if (path === "/custom") return "custom";
  if (path === "/drops") {
    const sp = new URLSearchParams(loc.search);
    const cat = (sp.get("category") || "").toLowerCase();
    if (cat === "tee") return "tees";
    if (cat === "shirt") return "shirts";
    return "shop";
  }
  return "";
}

export function SiteHeader(props: { cartCount: number }) {
  const { isAuthed } = useCustomerAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const [q, setQ] = useState("");

  const activeKey = useMemo(() => activeKeyFromLocation(loc), [loc.pathname, loc.search]);

  function submitSearch() {
    const query = q.trim();
    setShowSearch(false);
    if (!query) return nav("/drops");
    nav(`/drops?q=${encodeURIComponent(query)}`);
  }

  const accountLink = isAuthed ? "/orders" : `/login?next=${encodeURIComponent("/orders")}`;
  const cartLink = isAuthed ? "/checkout" : `/login?next=${encodeURIComponent("/checkout")}`;

  return (
    <header className="siteHeader premiumHeaderShell">
      <div className="siteHeaderInner premiumHeaderInner">
        <div className="topNotice premiumTopNotice">Dawn Sogni | Limited drops, custom design pieces, and bulk orders</div>

        <div className="headerMain premiumHeaderMain">
          <nav className="headerLinks premiumHeaderLinks" aria-label="Primary">
            {links.map((l) => (
              <Link key={l.key} className={l.key === activeKey ? "headerLink active" : "headerLink"} to={l.to}>
                {l.label}
              </Link>
            ))}
          </nav>

          <Link className="brandMark premiumBrandMark" to="/" aria-label="Dawn Sogni">
            <span className="premiumBrandTop">DAWN</span>
            <span className="premiumBrandBottom">SOGNI</span>
          </Link>

          <div className="headerRight premiumHeaderRight">
            <button className="iconBtn premiumIconBtn" aria-label="Search" onClick={() => setShowSearch((s) => !s)}>
              <IconSearch width={18} height={18} />
            </button>
            <Link className="iconBtn premiumIconBtn" aria-label={isAuthed ? "My orders" : "Sign in"} to={accountLink}>
              <IconUser width={18} height={18} />
            </Link>
            <Link className="iconBtn cartBadge premiumIconBtn" aria-label="Cart" to={cartLink}>
              <IconBag width={18} height={18} />
              {isAuthed && props.cartCount > 0 && <span className="cartBadgeDot">{Math.min(props.cartCount, 99)}</span>}
            </Link>
          </div>
        </div>

        {showSearch && (
          <div className="headerSearchRow premiumSearchRow">
            <input
              className="input"
              value={q}
              placeholder="Search products"
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch();
                if (e.key === "Escape") setShowSearch(false);
              }}
              autoFocus
            />
            <button className="btn" onClick={submitSearch}>
              Search
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
