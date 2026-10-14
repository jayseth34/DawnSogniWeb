/*
  DAWN SOGNI — your catalogue. Add your designs to the `products` list below.

  Each design:
    {
      id: "DS-01",                         // short unique code (shows in the WhatsApp order)
      name: "Design name",
      description: "One or two lines about the design.",
      tee: "images/tee-01.webp",           // t-shirt cut-out (transparent, square) — the back, or whichever side has the print
      teeFront: "images/tee-01-front.webp",// OPTIONAL other side; cards swap to it on hover. Without it, hover zooms into the print
      printFocus: "50% 45%",               // OPTIONAL where the print sits (x% y%), used for the zoom
      prices: { regular: 1000, oversized: 1100 },   // remove a fit if you don't offer it
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


  // Size charts. Regular: chest in inches. Oversized: garment measurements in cm.
  sizeCharts: {
    regular: {
      title: "Regular fit · 180 GSM",
      columns: ["Chest (in)"],
      rows: [["S", "36"], ["M", "38"], ["L", "40"], ["XL", "42"], ["XXL", "44"]]
    },
    oversized: {
      title: "Oversized fit · 240 GSM",
      columns: ["Fits chest (in)", "Length (cm)", "Tee chest, flat (cm)"],
      rows: [["S", "37–38", "67", "51"], ["M", "39–40", "69", "54"], ["L", "41–42", "72", "56"], ["XL", "43–44", "75", "58"], ["XXL", "45–46", "77", "61"]]
    }
  },

  drops: [],

  products: [
    {
      id: "DS-05", name: "One Last Ride", tee: "images/tee-05.webp", printFocus: "50% 38%", print: "back", colorName: "Lavender",
      description: "A crouching black panther over \"One Last Ride\" in varsity letters, printed across the back of a soft lavender tee.",
      prices: { regular: 1000, oversized: 1100 }, sizes: ["S", "M", "L", "XL", "XXL"]
    },
    {
      id: "DS-07", name: "You Just Gotta Chill", tee: "images/tee-07.webp", printFocus: "50% 50%", print: "back", colorName: "White",
      description: "A bold black silhouette under hand-script lettering arched across the back. Clean white tee, loud message.",
      prices: { regular: 1000, oversized: 1100 }, sizes: ["S", "M", "L", "XL", "XXL"]
    }
  ]
};
