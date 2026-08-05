import {mkdirSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import sharp from "sharp";

// Brand tokens, hand-synced with app/globals.css (.dark) and the menu bar
// app's "on" state: the amber sun on near-black is awake's whole identity.
const BG = "#0d0d0d";
const AMBER = "#F8BC31";

const ROOT = join(import.meta.dirname, "..");

// The mark: the menu bar sun, square-cornered rays, zero-radius brand.
function sunSvg(size: number): string {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315]
    .map(
      (deg) =>
        `<rect x="242" y="52" width="28" height="64" fill="${AMBER}" transform="rotate(${deg} 256 256)"/>`,
    )
    .join("");
  return `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="${BG}"/>
  <circle cx="256" cy="256" r="112" fill="${AMBER}"/>
  ${rays}
</svg>`;
}

async function renderPng(size: number): Promise<Buffer> {
  return sharp(Buffer.from(sunSvg(size))).resize(size, size).png().toBuffer();
}

// Minimal ICO container with embedded PNGs (valid in all modern browsers).
function buildIco(images: Array<{size: number; data: Buffer}>): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  const entries: Buffer[] = [];
  let offset = 6 + images.length * 16;
  for (const {size, data} of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const icoSizes = [16, 32, 48];
const icoImages = await Promise.all(
  icoSizes.map(async (size) => ({size, data: await renderPng(size)})),
);

mkdirSync(join(ROOT, "public"), {recursive: true});
writeFileSync(join(ROOT, "public", "favicon.ico"), buildIco(icoImages));
console.log("wrote public/favicon.ico (16, 32, 48)");

// app/icon.png is auto-wired by Next as the modern favicon.
writeFileSync(join(ROOT, "app", "icon.png"), await renderPng(512));
console.log("wrote app/icon.png (512)");
