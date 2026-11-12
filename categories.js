/* Dawn Sogni product types, shared by the shop and the admin.
   A product without a "category" is a tee, so older products need no change.
   fits:    which fits the admin offers for this type (each fit gets its own price)
   sizes:   which sizes the admin offers; defaults: which are ticked for a new product
   prices:  starting prices filled in for a new product (blank = you type them)
   lead:    making time shown on the shop and in the WhatsApp order (a product can override it in the admin) */
window.DS_FITS = { regular: "Regular", oversized: "Oversized", relaxed: "Relaxed", baggy: "Baggy", slim: "Slim" };
window.DS_CATS = {
  tees: {
    name: "Tees", one: "Tee",
    fits: ["regular", "oversized"], prices: { regular: 999, oversized: 1099 },
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"], defaults: ["S", "M", "L", "XL", "XXL"]
  },
  shirts: {
    name: "Shirts", one: "Shirt",
    lead: "7–8 days", leadNote: "Made to order with embroidery",
    fits: ["regular", "oversized", "slim"], prices: {},
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"], defaults: ["S", "M", "L", "XL", "XXL"]
  },
  trousers: {
    name: "Trousers", one: "Trousers",
    fits: ["regular", "relaxed", "baggy", "slim"], prices: {},
    sizes: ["28", "30", "32", "34", "36", "38", "40", "S", "M", "L", "XL", "XXL"], defaults: ["28", "30", "32", "34", "36"]
  },
  trackpants: {
    name: "Trackpants", one: "Trackpants",
    fits: ["regular", "relaxed", "baggy"], prices: {},
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"], defaults: ["S", "M", "L", "XL", "XXL"]
  }
};
window.DS_CAT = p => (p && window.DS_CATS[p.category] ? p.category : "tees");
