/**
 * Generate app icons for CreatorTank (zero dependencies)
 * Creates a 512x512 PNG icon and wraps it in an ICO file
 * Run: node scripts/generate-icons.js
 */

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// CRC32 implementation
function crc32(buf) {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c;
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF);
}

function createPNGChunk(type, data) {
    const typeBuffer = Buffer.from(type, 'ascii');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData) >>> 0);
    return Buffer.concat([length, typeBuffer, data, crc]);
}

function generateIcon() {
    const size = 512;
    const pixels = Buffer.alloc(size * size * 4);

    const cx = size / 2;
    const cy = size / 2;
    const outerR = size * 0.44;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4;
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Rounded-square shape via superellipse
            const n = 5; // roundness factor
            const sdist = Math.pow(Math.pow(Math.abs(dx / outerR), n) + Math.pow(Math.abs(dy / outerR), n), 1 / n);
            const edge = 4;

            if (sdist <= 1 + edge / outerR) {
                const alpha = sdist > 1 ? Math.max(0, 1 - (sdist - 1) * outerR / edge) : 1;

                // Gradient: deep purple to electric blue (diagonal)
                const t = (x + y) / (2 * size);
                let r = Math.round(108 * (1 - t) + 59 * t);
                let g = Math.round(43 * (1 - t) + 130 * t);
                let b = Math.round(217 * (1 - t) + 246 * t);

                // Central glow effect
                const glowDist = dist / (size * 0.35);
                if (glowDist < 1) {
                    const glow = Math.pow(1 - glowDist, 3) * 0.55;
                    r = Math.min(255, Math.round(r + (255 - r) * glow));
                    g = Math.min(255, Math.round(g + (255 - g) * glow));
                    b = Math.min(255, Math.round(b + (255 - b) * glow));
                }

                // Subtle accent ring
                const ringDist = Math.abs(dist - size * 0.30);
                if (ringDist < 2.5) {
                    const ringAlpha = (1 - ringDist / 2.5) * 0.25;
                    r = Math.min(255, Math.round(r + (255 - r) * ringAlpha));
                    g = Math.min(255, Math.round(g + (255 - g) * ringAlpha));
                    b = Math.min(255, Math.round(b + (255 - b) * ringAlpha));
                }

                // Draw a stylized "CT" in the center
                const relX = (x - cx) / (size * 0.22);
                const relY = (y - cy) / (size * 0.22);

                let isLetter = false;

                // Letter "C" — arc shape
                const cCenterX = -0.55;
                const cDist = Math.sqrt(Math.pow(relX - cCenterX, 2) + Math.pow(relY, 2));
                if (cDist > 0.55 && cDist < 0.85 && (relX - cCenterX < 0.15 || Math.abs(relY) > 0.35)) {
                    isLetter = true;
                }

                // Letter "T" — vertical bar + top bar
                const tCenterX = 0.55;
                if (relY > -0.8 && relY < -0.5 && Math.abs(relX - tCenterX) < 0.5) {
                    isLetter = true; // top bar
                }
                if (relY >= -0.5 && relY < 0.85 && Math.abs(relX - tCenterX) < 0.15) {
                    isLetter = true; // vertical bar
                }

                if (isLetter) {
                    r = Math.min(255, r + Math.round((255 - r) * 0.9));
                    g = Math.min(255, g + Math.round((255 - g) * 0.9));
                    b = Math.min(255, b + Math.round((255 - b) * 0.9));
                }

                pixels[idx] = r;
                pixels[idx + 1] = g;
                pixels[idx + 2] = b;
                pixels[idx + 3] = Math.round(alpha * 255);
            } else {
                pixels[idx] = 0;
                pixels[idx + 1] = 0;
                pixels[idx + 2] = 0;
                pixels[idx + 3] = 0;
            }
        }
    }

    return { pixels, size };
}

function encodePNG(pixels, size) {
    // Add filter byte (0 = None) to each row
    const rawData = Buffer.alloc(size * (1 + size * 4));
    for (let y = 0; y < size; y++) {
        rawData[y * (1 + size * 4)] = 0;
        pixels.copy(rawData, y * (1 + size * 4) + 1, y * size * 4, (y + 1) * size * 4);
    }

    const compressed = zlib.deflateSync(rawData, { level: 9 });

    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0);
    ihdr.writeUInt32BE(size, 4);
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 6;  // RGBA
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    return Buffer.concat([
        signature,
        createPNGChunk('IHDR', ihdr),
        createPNGChunk('IDAT', compressed),
        createPNGChunk('IEND', Buffer.alloc(0))
    ]);
}

function createICO(pngBuffer) {
    const iconDir = Buffer.alloc(6);
    iconDir.writeUInt16LE(0, 0);
    iconDir.writeUInt16LE(1, 2);
    iconDir.writeUInt16LE(1, 4);

    const entry = Buffer.alloc(16);
    entry[0] = 0;    // width 256+
    entry[1] = 0;    // height 256+
    entry[2] = 0;
    entry[3] = 0;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(pngBuffer.length, 8);
    entry.writeUInt32LE(22, 12); // offset = 6 + 16

    return Buffer.concat([iconDir, entry, pngBuffer]);
}

// --- Main ---
const resourcesDir = path.join(__dirname, '..', 'resources');
if (!fs.existsSync(resourcesDir)) {
    fs.mkdirSync(resourcesDir, { recursive: true });
}

console.log('Generating CreatorTank app icons...');

const { pixels, size } = generateIcon();
const pngBuffer = encodePNG(pixels, size);

const pngPath = path.join(resourcesDir, 'icon.png');
fs.writeFileSync(pngPath, pngBuffer);
console.log(`  ✓ icon.png (${(pngBuffer.length / 1024).toFixed(1)} KB)`);

const icoBuffer = createICO(pngBuffer);
const icoPath = path.join(resourcesDir, 'icon.ico');
fs.writeFileSync(icoPath, icoBuffer);
console.log(`  ✓ icon.ico (${(icoBuffer.length / 1024).toFixed(1)} KB)`);

console.log('Done! Icons saved to resources/');
