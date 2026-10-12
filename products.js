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

  // Size charts. Regular: chest in inches. Oversized: garment measurements in cm.
  sizeCharts: {
    regular: {
      title: "Regular fit",
      columns: ["Chest (in)"],
      rows: [["S", "36"], ["M", "38"], ["L", "40"], ["XL", "42"], ["XXL", "44"]]
    },
    oversized: {
      title: "Oversized fit",
      columns: ["Fits chest (in)", "Length (cm)", "Tee chest, flat (cm)"],
      rows: [["S", "37–38", "67", "51"], ["M", "39–40", "69", "54"], ["L", "41–42", "72", "56"], ["XL", "43–44", "75", "58"], ["XXL", "45–46", "77", "61"]]
    }
  },

  drops: [],

  products: [
    {
      id: "DS-01", name: "Mustang", photo: "images/ds-01.jpg", colorName: "Chocolate brown",
      description: "A galloping horse in sand, rust and rose tones across the chest, on a deep chocolate brown tee.",
      prices: { regular: 500, oversized: 600 }, sizes: ["S", "M", "L", "XL", "XXL"]
    },
    {
      id: "DS-02", name: "World Tour '26", photo: "images/ds-02.jpg", colorName: "Red",
      description: "Dawn Sogni in sky-blue block letters over a world map, with clouds drifting through and \"Twenty Twenty Six\" arched below. Big back print on bold red.",
      prices: { regular: 500, oversized: 600 }, sizes: ["S", "M", "L", "XL", "XXL"]
    },
    {
      id: "DS-03", name: "Music Is My Only Drug", photo: "images/ds-03.jpg", colorName: "Black",
      description: "Warped white lettering stacked down the back. For the ones whose headphones never come off.",
      prices: { regular: 500, oversized: 600 }, sizes: ["S", "M", "L", "XL", "XXL"]
    },
    {
      id: "DS-04", name: "Root of All Evil", photo: "images/ds-04.jpg", colorName: "Dusty blue",
      description: "\"For the love of money is the root of all evil\" in tall, warped white type down the back, with a small Dawn Sogni above it.",
      prices: { regular: 500, oversized: 600 }, sizes: ["S", "M", "L", "XL", "XXL"]
    },
    {
      id: "DS-05", name: "One Last Ride", photo: "images/ds-05.jpg", colorName: "Lavender",
      description: "A crouching black panther over \"One Last Ride\" in varsity letters, printed across the back of a soft lavender tee.",
      prices: { regular: 500, oversized: 600 }, sizes: ["S", "M", "L", "XL", "XXL"]
    },
    {
      id: "DS-06", name: "Signature Halftone", photo: "images/ds-06.jpg", colorName: "Black",
      description: "A halftone portrait in periwinkle across the back, signed with the Dawn Sogni script in white.",
      prices: { regular: 500, oversized: 600 }, sizes: ["S", "M", "L", "XL", "XXL"]
    },
    {
      id: "DS-07", name: "You Just Gotta Chill", photo: "images/ds-07.jpg", colorName: "White",
      description: "A bold black silhouette under hand-script lettering arched across the back. Clean white tee, loud message.",
      prices: { regular: 500, oversized: 600 }, sizes: ["S", "M", "L", "XL", "XXL"]
    },
    {
      id: "DS-08", name: "Praying Mantis", photo: "images/ds-08.jpg", colorName: "Black",
      description: "A silver-grey mantis climbing up the back, with \"Praying Mantis\" written beside it in gold script.",
      prices: { regular: 500, oversized: 600 }, sizes: ["S", "M", "L", "XL", "XXL"]
    },
    {
      id: "DS-09", name: "Gold Script", photo: "images/ds-09.jpg", colorName: "Black",
      description: "The Dawn Sogni name in gold script across the chest. The simplest piece in the line, made for everyday wear.",
      prices: { regular: 500, oversized: 600 }, sizes: ["S", "M", "L", "XL", "XXL"]
    }
  ]
};
