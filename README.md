# Dawn Sogni — static site

Live at https://jayseth34.github.io/DawnSogniWeb/ (served from this `gh-pages` branch).

## Add or change designs
Everything lives in `products.js`:
- **drops** — newest first; the first one is shown on the swinging rail.
- **products** — name, drop, description, prices (`regular` / `oversized`), sizes, colour.
- Real images: put files in `images/` and set either
  - `photo: "images/name.png"` — a photo of the garment (transparent PNG on a hanger looks best), or
  - `art: "images/name.png"` — your artwork only; it gets printed onto the drawn tee.

Commit and push to `gh-pages`; GitHub Pages updates in about a minute.

## WhatsApp
Number is set in `products.js` (`whatsapp: "919920279905"`). Every "Order" button opens WhatsApp with the design, fit, size, colour, price and a link back to the piece filled in.
