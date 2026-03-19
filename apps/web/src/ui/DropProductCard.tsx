import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { DropDesign } from "../api";
import { formatRupees } from "./money";

function dropHref(dropId: string) {
  return `/drops/${encodeURIComponent(dropId)}`;
}

function dotsFor(imagesLen: number) {
  if (imagesLen <= 1) return 3;
  if (imagesLen === 2) return 2;
  return 3;
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

  const safeIdx = useMemo(() => {
    if (!images.length) return 0;
    return Math.min(Math.max(0, activeIdx), images.length - 1);
  }, [activeIdx, images.length]);

  const hasImages = images.length > 0;
  const activeImage = hasImages ? images[safeIdx] : "";
  const hasGallery = images.length > 1;

  function prevImage() {
    if (images.length <= 1) return;
    setActiveIdx((current) => (current - 1 + images.length) % images.length);
  }

  function nextImage() {
    if (images.length <= 1) return;
    setActiveIdx((current) => (current + 1) % images.length);
  }

  return (
    <article className="productCard premiumProductCard revealItem">
      <div className="productGallery premiumProductGallery">
        <div className="premiumCardBadgeRow">
          <span className="premiumCardBadge">{drop.category || "Drop"}</span>
          <span className="premiumCardBadge mutedBadge">{Math.max(1, images.length)} views</span>
        </div>

        <Link to={dropHref(drop.id)} aria-label={drop.title}>
          {activeImage ? (
            <img className="productImg premiumProductImg" src={activeImage} alt={drop.title} />
          ) : (
            <div className="productImg premiumProductImg" />
          )}
        </Link>

        {hasGallery && (
          <>
            <button
              type="button"
              className="galleryNav galleryNavPrev premiumGalleryNav"
              onClick={prevImage}
              aria-label="Previous image"
            >
              <span>{"<"}</span>
            </button>
            <button
              type="button"
              className="galleryNav galleryNavNext premiumGalleryNav"
              onClick={nextImage}
              aria-label="Next image"
            >
              <span>{">"}</span>
            </button>
          </>
        )}

        {/* Always render the gallery bar so cards stay aligned (even with 1 image). */}
        <div className="premiumGalleryBar" aria-label="Product images">
          {hasGallery ? (
            <div className="galleryThumbs premiumGalleryThumbs">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={index === safeIdx ? "galleryThumb active" : "galleryThumb"}
                  onClick={() => setActiveIdx(index)}
                  aria-label={`Show image ${index + 1}`}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          ) : images.length === 1 ? (
            <div className="galleryThumbs premiumGalleryThumbs" aria-hidden="true">
              <button type="button" className="galleryThumb active" disabled aria-label="Only image">
                <img src={images[0]} alt="" />
              </button>
            </div>
          ) : (
            <div className="premiumGalleryDots" aria-hidden="true">
              {Array.from({ length: dotsFor(images.length) }).map((_, index) => (
                <span key={index} className="premiumGalleryDot" />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="productMeta premiumProductMeta">
        <div className="productNameRow premiumProductNameRow">
          <div>
            <div className="productName clamp2 premiumProductName" title={drop.title}>
              {drop.title}
            </div>
            <div className="productPrice premiumProductPrice">
              {drop.priceCents === 0 ? "Quote pending" : formatRupees(drop.priceCents)}
            </div>
          </div>
        </div>

        {showDescription && (
          <div className="muted2 clamp2 premiumProductDesc">
            {drop.description || "Signature Dawn Sogni design language."}
          </div>
        )}

        <div className="productActions premiumProductActions">
          <button className="btn primary" onClick={() => (canShop ? onAdd() : onRequireLogin())}>
            Add to cart
          </button>
          <Link className="btn" to={dropHref(drop.id)}>
            View piece
          </Link>
        </div>
      </div>
    </article>
  );
}

