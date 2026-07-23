const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const VERT_SPOTIFY = [40, 225, 106];
const VERT_FONCE = [29, 185, 84];
const VERT_TRES_FONCE = [20, 130, 60];
const BLANC = [255, 255, 255];

function setPixel(pixels, size, x, y, r, g, b, a) {
  if (x < 0 || x >= size || y < 0 || y >= size) return;
  const i = (y * size + x) * 4;
  pixels[i] = r;
  pixels[i + 1] = g;
  pixels[i + 2] = b;
  pixels[i + 3] = a;
}

function createLeafIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.45;
  const cornerRadius = size * 0.15;

  // 1. Fond : carre arrondi vert Spotify
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      const distFromCenter = Math.max(dx, dy);

      if (distFromCenter > radius) continue;

      // Verifier si on est dans un coin arrondi
      const cornerX = cx - radius;
      const cornerY = cy - radius;
      const isCorner =
        (x < cx && y < cy) ||
        (x > cx && y < cy) ||
        (x < cx && y > cy) ||
        (x > cx && y > cy);

      if (isCorner) {
        const cxCorner = x < cx ? cx - radius : cx + radius;
        const cyCorner = y < cy ? cy - radius : cy + radius;
        const distToCorner = Math.sqrt((x - cxCorner) ** 2 + (y - cyCorner) ** 2);
        if (distToCorner > cornerRadius) continue;
      }

      setPixel(pixels, size, x, y, VERT_SPOTIFY[0], VERT_SPOTIFY[1], VERT_SPOTIFY[2]);
    }
  }

  // 2. Feuille verte stylisee (plus grande)
  const leafCenterX = cx;
  const leafCenterY = cy;
  const leafLength = size * 0.8;
  const leafWidth = size * 0.38;
  const angle = -Math.PI / 4.5;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xr = (x - leafCenterX) * Math.cos(-angle) - (y - leafCenterY) * Math.sin(-angle);
      const yr = (x - leafCenterX) * Math.sin(-angle) + (y - leafCenterY) * Math.cos(-angle);

      const t = yr / (leafLength / 2);
      if (Math.abs(t) > 1) continue;

      const widthAtT = leafWidth * Math.sin(t * Math.PI) * (1 - Math.abs(t) * 0.4);

      if (Math.abs(xr) > widthAtT) continue;

      setPixel(pixels, size, x, y, VERT_FONCE[0], VERT_FONCE[1], VERT_FONCE[2]);

      if (Math.abs(xr) < size * 0.008 && Math.abs(t) < 0.9) {
        setPixel(pixels, size, x, y, VERT_TRES_FONCE[0], VERT_TRES_FONCE[1], VERT_TRES_FONCE[2], 200);
      }

      if (Math.abs(t) < 0.85 && Math.abs(t) > 0.05) {
        const nervureX = widthAtT * 0.5 * Math.sign(xr);
        if (Math.abs(xr - nervureX) < size * 0.008) {
          setPixel(pixels, size, x, y, VERT_TRES_FONCE[0], VERT_TRES_FONCE[1], VERT_TRES_FONCE[2], 120);
        }
      }
    }
  }

  return pixels;
}

function createPNG(width, height, pixelBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const typeBuffer = Buffer.from(type, "ascii");
    const crcValue = crc32(Buffer.concat([typeBuffer, data]));
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crcValue, 0);
    return Buffer.concat([length, typeBuffer, data, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0;
    pixelBuffer.copy(rawData, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(rawData);

  return Buffer.concat([
    signature,
    createChunk("IHDR", ihdr),
    createChunk("IDAT", compressed),
    createChunk("IEND", Buffer.alloc(0)),
  ]);
}

const outputDir = path.join(__dirname, "..", "..", "resources");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const tailles = [
  { name: "icon.png", size: 256 },
  { name: "icon-128.png", size: 128 },
  { name: "icon-64.png", size: 64 },
  { name: "icon-48.png", size: 48 },
  { name: "icon-32.png", size: 32 },
  { name: "icon-16.png", size: 16 },
];

for (const { name, size } of tailles) {
  const pixels = createLeafIcon(size);
  const png = createPNG(size, size, pixels);
  const outPath = path.join(outputDir, name);
  fs.writeFileSync(outPath, png);
  console.log(`[icon] Genere ${outPath} (${size}x${size})`);
}

// Generer le .ico multi-tailles
console.log("[icon] Generation du .ico multi-tailles...");

const pngBuffers = tailles.map(({ name, size }) => {
  const buf = fs.readFileSync(path.join(outputDir, name));
  return { name: name, data: buf, size: size };
});

// Trier par taille decroissante
pngBuffers.sort((a, b) => b.size - a.size);

const nbImages = pngBuffers.length;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);    // reserved
header.writeUInt16LE(1, 2);    // type: ICO
header.writeUInt16LE(nbImages, 4); // count

const dirEntrySize = 16;
const dataStart = 6 + nbImages * dirEntrySize;
let currentOffset = dataStart;
const entries = [];

for (const { data, size } of pngBuffers) {
  const entry = Buffer.alloc(dirEntrySize);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);  // width
  entry.writeUInt8(size >= 256 ? 0 : size, 1);   // height
  entry.writeUInt8(0, 2);   // colors
  entry.writeUInt8(0, 3);   // reserved
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(data.length, 8);  // size
  entry.writeUInt32LE(currentOffset, 12); // offset
  entries.push(entry);
  currentOffset += data.length;
}

const icoPath = path.join(outputDir, "icon.ico");
const fd = fs.openSync(icoPath, "w");
fs.writeSync(fd, header);
for (const e of entries) fs.writeSync(fd, e);
for (const { data } of pngBuffers) fs.writeSync(fd, data);
fs.closeSync(fd);

console.log(`[icon] .ICO genere : ${icoPath}`);
console.log("[icon] Termine.");
