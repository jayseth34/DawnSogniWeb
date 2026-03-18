import { useState } from "react";
import { Link } from "react-router-dom";
import type { DropDesign } from "../api";
import { formatRupees } from "./money";

function dropHref(dropId: string) {
  return `/drops/${encodeURIComponent(dropId)}`;
}

export function DropProductCard(props: {
  drop: DropDesign;
  canShop: boolean;
  onAdd: () => void;
  onRequireLogin: () => void;
  showDescription?: boolean;
}) {
  const { drop, canShop, onAdd, onRequireLogin, showDescription = false } = props;
  const images = drop.images ?? [];
  const [activeIdx, setActiveIdx] = useState(0);
  const hasImages = images.length > 0;
  const activeImage = hasImages ? images[Math.min(activeIdx, images.length - 1)] : "";

  function prevImage() {
    if (!images.length) return;
    setActiveIdx((current) => (current - 1 + images.length) % images.length);
  }

  function nextImage() {
    if (!images.length) return;
    setActiveIdx((current) => (current + 1) % images.length);
  }

  return (
    <div className="productCard revealItem" key={drop.id}>
      <div className="productGallery">
        <Link to={dropHref(drop.id)} aria-label={drop.title}>
          {activeImage ? <img className="productImg" src={activeImage} alt={drop.title} /> : <div className="productImg" />}
        </Link>

        {images.length > 1 && (
          <>
            <button type="button" className="galleryNav galleryNavPrev" onClick={prevImage} aria-label="Previous image">
              <span>{"<"}</span>
            </button>
            <button type="button" className="galleryNav galleryNavNext" onClick={nextImage} aria-label="Next image">
              <span>{">"}</span>
            </button>
            <div className="galleryThumbs" aria-label="Product images">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={index === activeIdx ? "galleryThumb active" : "galleryThumb"}
                  onClick={() => setActiveIdx(index)}
                  aria-label={`Show image ${index + 1}`}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="productMeta">
        <div className="productNameRow">
          <div className="productName clamp2" title={drop.title}>
            {drop.title}
          </div>
        </div>
        {showDescription && (
          <div className="muted2 clamp2" style={{ marginTop: 6, fontSize: 13 }}>
            {drop.description || "-"}
          </div>
        )}
        <div className="productPrice">{drop.priceCents === 0 ? "Quote pending" : formatRupees(drop.priceCents)}</div>
        <div className="productActions">
          <button className="btn primary" onClick={() => (canShop ? onAdd() : onRequireLogin())}>
            Add
          </button>
          <Link className="btn" to={dropHref(drop.id)}>
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
