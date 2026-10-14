# Dawn Sogni — static site

Live at https://jayseth34.github.io/DawnSogniWeb/ (served from this `gh-pages` branch).

## Add or change designs
Everything lives in `products.js`:
- **drops** — newest first.
- **products** — name, drop, description, prices (`regular` / `oversized`), sizes, colour.
- Images: `tee` is the t-shirt cut-out (transparent .webp/.png, square). Optional `teeFront` adds the other side (cards swap to it on hover, product view gets Back/Front). Without it, hovering zooms into the print at `printFocus` (e.g. `"50% 40%"`).
- `print`: `front` or `back` (drives the filter pills).


Commit and push to `gh-pages`; GitHub Pages updates in about a minute.

## WhatsApp
Number is set in `products.js` (`whatsapp: "919920279905"`). Every "Order" button opens WhatsApp with the design, fit, size, colour, price and a link back to the piece filled in.
