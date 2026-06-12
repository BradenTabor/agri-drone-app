import path from "node:path";

export function getBrandLogoPath(): string {
  return path.join(process.cwd(), "public", "brand", "logo.png");
}
