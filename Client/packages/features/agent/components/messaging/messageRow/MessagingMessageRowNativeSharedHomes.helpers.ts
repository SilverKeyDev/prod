export function formatHomePrice(price: string | number | undefined): string {
  if (price === undefined || price === "") return "";
  if (typeof price === "number") return `$${price.toLocaleString()}`;
  if (typeof price === "string" && !price.startsWith("$")) return `$${price}`;
  return price;
}
