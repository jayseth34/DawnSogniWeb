# Dawn Sogni — static site

Live at https://jayseth34.github.io/DawnSogniWeb/ (served from this `gh-pages` branch).

## Admin
Open https://jayseth34.github.io/DawnSogniWeb/admin.html, paste a GitHub fine-grained access key
(only this repository, permission **Contents: Read and write**), and you can:
- add, edit, reorder and delete products (name, code, description, colour, print side, prices per fit, sizes, T-shirt image, optional other side, zoom point),
- add, edit, reorder and delete gallery artworks (upload or image link, title, artist, year, credit, source link),
- change the WhatsApp number, Instagram handle and size charts.

Nothing goes live until you press **Publish to site**. Publishing commits the images and `products.js` to this branch and
refreshes the cache tag in `index.html`; GitHub Pages updates about a minute later.

T-shirt images: a cut-out with a transparent background (PNG/WebP) gives the floating look. The admin trims, centres and
compresses images automatically.

## Catalogue file
`products.js` is `window.DS = { ...JSON... };` — keep it valid JSON if you edit by hand.
- `products[]`: `id`, `name`, `description`, `colorName`, `print` (`back`/`front`), `prices` (`regular`/`oversized`), `sizes`,
  `tee` (image path), optional `teeFront`, optional `printFocus` (`"50% 45%"`), optional `drop`.
- `gallery[]`: `src`, `title`, `artist`, `year`, `credit`, `link`.
- `sizeCharts`, `drops`, `whatsapp`, `instagram`.

## WhatsApp
Every "Order" button and the bag open WhatsApp with the design, fit, size, colour, price (and total) filled in.

## Credits
Music: "Nocturne", an original track made for Dawn Sogni (audio/nocturne.mp3). Gallery: Art Institute of Chicago open access (CC0).
Fonts: Chakra Petch and Grenze Gotisch (SIL Open Font License).
