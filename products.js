/*
  DAWN SOGNI — your catalogue. Add your designs to the `products` list below.

  Each design:
    {
      id: "DS-01",                         // short unique code (shows in the WhatsApp order)
      name: "Design name",
      description: "One or two lines about the design.",
      photo: "images/ds-01.jpg",           // put the photo in the images/ folder (portrait 4:5 looks best)
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
      id: "DS-05", name: "One Last Ride", tee: "images/tee-05.webp", print: "back", colorName: "Lavender",
      description: "A crouching black panther over \"One Last Ride\" in varsity letters, printed across the back of a soft lavender tee.",
      prices: { regular: 1000, oversized: 1100 }, sizes: ["S", "M", "L", "XL", "XXL"]
    },
    {
      id: "DS-07", name: "You Just Gotta Chill", tee: "images/tee-07.webp", print: "back", colorName: "White",
      description: "A bold black silhouette under hand-script lettering arched across the back. Clean white tee, loud message.",
      prices: { regular: 1000, oversized: 1100 }, sizes: ["S", "M", "L", "XL", "XXL"]
    }
  ]
};
