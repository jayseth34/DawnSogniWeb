import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { useSessionApi } from "./useSession";
import { formatRupees } from "./money";

export function DropDetailPage() {
  const params = useParams();
  const id = String(params.id || "");
  const { addDropToCart, canShop, requireLogin } = useSessionApi();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["drop", id],
    queryFn: () => api.drop(id),
    enabled: Boolean(id)
  });

  const drop = data;
  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState<string>("");

  useEffect(() => {
    const first = drop?.images?.[0] ?? "";
    setSelectedImg((cur) => {
      if (!cur) return first;
      if (!drop?.images?.includes(cur)) return first;
      return cur;
    });
  }, [drop?.images]);

  const mainImg = selectedImg;

  return (
    <div className="container page" style={{ maxWidth: 1100 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row" style={{ gap: 10 }}>
          <Link className="pill" to="/drops">
            Back
          </Link>
          {drop?.category ? <span className="tag">{drop.category}</span> : null}
        </div>
        <button className="btn" onClick={() => refetch()}>
          Refresh
        </button>
      </div>

      <div className="hr" />

      {isLoading && <div className="muted">Loading...</div>}
      {error && (
        <div className="muted">
          Failed to load product.{' '}
          <button className="btn" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      )}

      {drop && (
        <div className="grid productDetailGrid">
          <div className="card">
            {mainImg ? (
              <img className="productImg productImgDetail" src={mainImg} alt={drop.title} />
            ) : (
              <div className="productImg productImgDetail" />
            )}
            {drop.images?.length > 1 && (
              <div className="p" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {drop.images.map((u) => (
                  <button
                    key={u}
                    type="button"
                    className={"thumbBtn" + (u === mainImg ? " active" : "")}
                    onClick={() => setSelectedImg(u)}
                    aria-label="View image"
                  >
                    <img className="adminThumbSm" src={u} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="p">
              <div className="h2" style={{ marginTop: 0 }}>
                {drop.title}
              </div>
              <div className="muted" style={{ marginTop: 8 }}>
                {drop.description || "-"}
              </div>
              <div style={{ height: 14 }} />
              <div className="tag">
                {drop.priceCents === 0 ? "Quote pending" : formatRupees(drop.priceCents)}
              </div>

              <div style={{ height: 16 }} />
              <div className="label">Quantity</div>
              <div className="row">
                <button className="btn" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  -
                </button>
                <div className="pill">{qty}</div>
                <button className="btn" onClick={() => setQty((q) => q + 1)}>
                  +
                </button>
              </div>

              <div style={{ height: 16 }} />
              <button
                className="btn primary"
                onClick={() => (canShop ? addDropToCart(drop, { quantity: qty }) : requireLogin())}
              >
                Add to cart
              </button>
              <div style={{ height: 10 }} />
              <Link className="btn" to="/checkout">
                Go to checkout
              </Link>
              {!canShop && (
                <div className="muted2" style={{ marginTop: 10, fontSize: 12 }}>
                  Login is required to add to cart.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}