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
    <div className="container page publicPageShell" style={{ maxWidth: 1180 }}>
      <div className="publicPageIntro revealSection sectionGlow">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="infoEyebrow">Product view</div>
            <div className="h2" style={{ marginBottom: 0 }}>{drop?.title ?? "View product"}</div>
            <div className="muted">Browse the full artwork, switch between images, and add your quantity directly from here.</div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <Link className="pill" to="/drops">
              Back to drops
            </Link>
            {drop?.category ? <span className="tag">{drop.category}</span> : null}
          </div>
        </div>
      </div>

      <div className="hr" />

      {isLoading && <div className="muted">Loading...</div>}
      {error && (
        <div className="muted">
          Failed to load product.{" "}
          <button className="btn" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      )}

      {drop && (
        <div className="grid productDetailGrid">
          <div className="card revealSection detailFrame">
            {mainImg ? (
              <img className="productImg productImgDetail" src={mainImg} alt={drop.title} />
            ) : (
              <div className="productImg productImgDetail" />
            )}
            {drop.images?.length > 1 && (
              <div className="galleryThumbs detailThumbRow" aria-label="Product images">
                {drop.images.map((u, index) => (
                  <button
                    key={u}
                    type="button"
                    className={u === mainImg ? "galleryThumb active" : "galleryThumb"}
                    onClick={() => setSelectedImg(u)}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img src={u} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card revealSection productDetailPanel">
            <div className="p">
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="h2" style={{ marginTop: 0 }}>{drop.title}</div>
                  <div className="muted" style={{ marginTop: 8 }}>{drop.description || "Fresh Dawn Sogni drop."}</div>
                </div>
                <span className="glassBadge active">{drop.priceCents === 0 ? "Quote pending" : formatRupees(drop.priceCents)}</span>
              </div>

              <div className="hr" />
              <div className="label">Quantity</div>
              <div className="row productDetailQty">
                <button className="btn" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  -
                </button>
                <div className="pill">{qty}</div>
                <button className="btn" onClick={() => setQty((q) => q + 1)}>
                  +
                </button>
              </div>

              <div style={{ height: 16 }} />
              <div className="productDetailCtas">
                <button
                  className="btn primary"
                  onClick={() => (canShop ? addDropToCart(drop, { quantity: qty }) : requireLogin())}
                >
                  Add to cart
                </button>
                <Link className="btn" to="/checkout">
                  Go to checkout
                </Link>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
