import { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { IconBag, IconSearch, IconUser } from "./icons";

type LinkItem = { label: string; to: string };

const links: LinkItem[] = [
  { label: "Home", to: "/" },
  { label: "Tees", to: "/drops?category=Tee" },
  { label: "Shirts", to: "/drops?category=Shirt" },
  { label: "Shop", to: "/drops" },
  { label: "Contact", to: "/contact" },
  { label: "Returns & Exchanges", to: "/returns" },
  { label: "Size Chart", to: "/size-chart" }
];

export function SiteHeader(props: { cartCount: number }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const [q, setQ] = useState("");

  const activePath = useMemo(() => loc.pathname, [loc.pathname]);

  function submitSearch() {
    const query = q.trim();
    setShowSearch(false);
    if (!query) return nav("/drops");
    nav(`/drops?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="siteHeader">
      <div className="siteHeaderInner">
        <div className="topNotice">Shop our latest arrivals!</div>

        <div className="headerMain">
          <nav className="headerLinks" aria-label="Primary">
            {links.map((l) => (
              <NavLink
                key={l.label}
                className={({ isActive }) =>
                  isActive || (l.to === "/" ? activePath === "/" : false) ? "headerLink active" : "headerLink"
                }
                to={l.to}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <NavLink className="brandMark" to="/" aria-label="Dawn Sogni">
            DAWN SOGNI
          </NavLink>

          <div className="headerRight">
            <button className="iconBtn" aria-label="Search" onClick={() => setShowSearch((s) => !s)}>
              <IconSearch width={20} height={20} />
            </button>
            <NavLink className="iconBtn" aria-label="Your orders" to="/orders">
              <IconUser width={20} height={20} />
            </NavLink>
            <NavLink className="iconBtn cartBadge" aria-label="Cart" to="/checkout">
              <IconBag width={20} height={20} />
              {props.cartCount > 0 && <span className="cartBadgeDot">{Math.min(props.cartCount, 99)}</span>}
            </NavLink>
          </div>
        </div>

        {showSearch && (
          <div className="headerSearchRow">
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
