/*
  DAWN SOGNI — your catalogue. Add your designs to the `products` list below.

  Each design:
    {
      id: "DS-01",                         // short unique code (shows in the WhatsApp order)
      name: "Design name",
      description: "One or two lines about the design.",
      photo: "images/ds-01.jpg",           // put the photo in the images/ folder (portrait 4:5 looks best)
      prices: { regular: 500, oversized: 600 },   // remove a fit if you don't offer it
      sizes: ["S", "M", "L", "XL", "XXL"],
      colorName: "Black",                  // optional
      drop: "drop-01"                      // optional — only if you use drops below
    },

  Drops are optional. If you add them, designs are grouped by drop and a filter appears:
    drops: [{ id: "drop-01", name: "Drop 01", date: "October 2026" }]
*/

window.DS = {
  whatsapp: "919920279905",
  instagram: "dawn.sogni",

  drops: [],

  products: []
};
