import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

// Calculate CRC32
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    for (let j = 0; j < 8; j++) {
      let bit = (crc ^ byte) & 1;
      crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
      byte >>>= 1;
    }
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crcBuf]);
}

function generatePNG(width, height, isMaskable = false) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // no interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with scanline filter byte 0
  const rowStride = width * 4 + 1;
  const rawData = Buffer.alloc(height * rowStride);

  // Theme: Workshop Slate Blue #1e293b & Blue #2563eb, Amber #f59e0b
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.40 : 0.44);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Main circle gradient
        const t = (x + y) / (width + height);
        // Slate-900 #0f172a to Blue-700 #1d4ed8
        rawData[pxOffset] = Math.round(15 + t * 20);     // R
        rawData[pxOffset + 1] = Math.round(23 + t * 60); // G
        rawData[pxOffset + 2] = Math.round(42 + t * 180);// B
        rawData[pxOffset + 3] = 255;                     // A

        // Draw a golden/amber wrench/window motif in the center
        const innerX = Math.abs(dx) / radius;
        const innerY = Math.abs(dy) / radius;
        if ((innerX < 0.5 && Math.abs(dy) < radius * 0.08) || (innerY < 0.5 && Math.abs(dx) < radius * 0.08)) {
          // Cross / Window frame
          rawData[pxOffset] = 245;     // Amber-500
          rawData[pxOffset + 1] = 158;
          rawData[pxOffset + 2] = 11;
          rawData[pxOffset + 3] = 255;
        } else if (Math.abs(dx) < radius * 0.5 && Math.abs(dy) < radius * 0.5) {
          // Window panes
          rawData[pxOffset] = 59;      // Blue-500
          rawData[pxOffset + 1] = 130;
          rawData[pxOffset + 2] = 246;
          rawData[pxOffset + 3] = 255;
        }
      } else {
        if (isMaskable) {
          // Background for maskable
          rawData[pxOffset] = 15;     // #0f172a
          rawData[pxOffset + 1] = 23;
          rawData[pxOffset + 2] = 42;
          rawData[pxOffset + 3] = 255;
        } else {
          // Transparent
          rawData[pxOffset] = 0;
          rawData[pxOffset + 1] = 0;
          rawData[pxOffset + 2] = 0;
          rawData[pxOffset + 3] = 0;
        }
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePNG(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-192x192.png'), generatePNG(192, 192, true));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePNG(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePNG(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePNG(180, 180, true));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePNG(48, 48, false));

console.log('PWA icons generated successfully in public/');
