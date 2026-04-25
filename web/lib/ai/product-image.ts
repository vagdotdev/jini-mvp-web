export type ProductImageVariant = "direct" | "generated";

export function buildProductImagePrompt(itemName: string) {
  return [
    "Create a natural UGC-style product image.",
    "Show a real-looking person wearing or holding the exact garment from the source image.",
    "Use outdoor daylight market styling, candid pose, and realistic fabric texture.",
    `Product name: ${itemName}.`,
    "Do not add logos, text, unrealistic body shapes, or alter the product beyond normal styling.",
  ].join(" ");
}
