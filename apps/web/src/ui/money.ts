export function formatRupees(cents: number): string {
  const rupees = Math.round((Number.isFinite(cents) ? cents : 0) / 100);
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(rupees);
  } catch {
    return `₹${rupees}`;
  }
}
