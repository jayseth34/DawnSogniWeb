/*
  DAWN SOGNI — your catalogue lives here. Edit this file to add designs.

  WHATSAPP: country code + number, digits only.

  DROPS: newest first. 

  PRODUCTS — fields:
    id          short unique code, used in the WhatsApp message and share link
    name        design name
    drop        id of the drop it belongs to
    description one or two lines
    prices      { regular: 500, oversized: 600 }  (remove a fit to hide it)
    sizes       sizes offered
    color       tee colour (hex) + colorName
    photo       path to the product photo, e.g. "images/first-light.jpg" (portrait 4:5 looks best)
                 until a photo is added, the card shows the design name on its tee colour
*/

window.DS = {
  whatsapp: "919920279905",
  instagram: "dawn.sogni",

  drops: [
    {
      id: "first-light",
      name: "First Light",
      date: "October 2026",
      note: "Four prints about the hour before everyone else wakes up."
    },
    {
      id: "after-hours",
      name: "After Hours",
      date: "July 2026",
      note: "Late nights, monsoon static and a moon that keeps changing its mind."
    }
  ],

  products: [
    {
      id: "FL-01",
      name: "First Light",
      drop: "first-light",
      description: "A half-sun cresting a ruled horizon, printed across the chest. The piece the drop is named after.",
      prices: { regular: 500, oversized: 600 },
      sizes: ["S", "M", "L", "XL", "XXL"],
      color: "#EDE5D8", colorName: "Bone",
      photo: ""
    },
    {
      id: "FL-02",
      name: "Sogni Wordmark",
      drop: "first-light",
      description: "Our name, stretched wide across the chest in blush on midnight.",
      prices: { regular: 500, oversized: 600 },
      sizes: ["S", "M", "L", "XL", "XXL"],
      color: "#1F1C33", colorName: "Midnight",
      photo: ""
    },
    {
      id: "FL-03",
      name: "Six AM Chai",
      drop: "first-light",
      description: "One cutting chai, steam still rising. For people who are up before the city is.",
      prices: { regular: 500, oversized: 600 },
      sizes: ["S", "M", "L", "XL", "XXL"],
      color: "#CDBB9E", colorName: "Sand",
      photo: ""
    },
    {
      id: "FL-04",
      name: "Horizon Bands",
      drop: "first-light",
      description: "Sunrise reduced to six stacked bands. Oversized only, cut long and boxy.",
      prices: { oversized: 600 },
      sizes: ["M", "L", "XL", "XXL"],
      color: "#2D3949", colorName: "Slate",
      photo: ""
    },
    {
      id: "AH-01",
      name: "Moon Phases",
      drop: "after-hours",
      description: "Five phases of the moon in a single line, bone ink on washed black.",
      prices: { regular: 500, oversized: 600 },
      sizes: ["S", "M", "L", "XL", "XXL"],
      color: "#18171E", colorName: "Washed black",
      photo: ""
    },
    {
      id: "AH-02",
      name: "Night Shift",
      drop: "after-hours",
      description: "A crescent moon and a scatter of stars for everyone still awake at 3am.",
      prices: { regular: 500, oversized: 600 },
      sizes: ["S", "M", "L", "XL", "XXL"],
      color: "#3B2A4F", colorName: "Plum",
      photo: ""
    },
    {
      id: "AH-03",
      name: "Monsoon Static",
      drop: "after-hours",
      description: "A heavy cloud and slanted rain. Printed for the four months Mumbai stays wet.",
      prices: { regular: 500, oversized: 600 },
      sizes: ["S", "M", "L", "XL", "XXL"],
      color: "#E1E4E6", colorName: "Cloud",
      photo: ""
    }
  ]
};
