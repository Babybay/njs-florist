import sharp from "sharp";
import { writeFile } from "node:fs/promises";

// Use the supplied NJS Projects logo. The original stays untouched.
// At tab size, the floral symbol is legible; the complete logo is used on-page.
const original = "public/njs-projects-logo-transparent.png";
await sharp(original).extract({ left: 330, top: 210, width: 600, height: 750 })
  .resize(240, 300).webp({ quality: 90 }).toFile("public/njs-projects-logo-cutout.webp");
const symbol = await sharp(original).extract({ left: 350, top: 220, width: 550, height: 380 })
  .resize(160, 160, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
const source = symbol;
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><image width="160" height="160" href="data:image/png;base64,' + symbol.toString("base64") + '"/></svg>';
await writeFile("public/brand-mark.svg", svg);
const png = await sharp(source).resize(32, 32).ensureAlpha().png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = 32;
header[7] = 32;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18);
await writeFile("src/app/favicon.ico", Buffer.concat([header, png]));
await sharp(source).resize(64, 64).png().toFile("src/app/icon.png");
await sharp(source).resize(180, 180).png().toFile("src/app/apple-icon.png");
console.log("Generated matching favicon, tab icon, and Apple icon.");
