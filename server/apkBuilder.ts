import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

/**
 * Helper to construct a standard uncompressed/deflated ZIP entry in an APK container
 */
function createZipEntry(filename: string, content: Buffer): { localHeader: Buffer; centralDir: Buffer; content: Buffer } {
  const nameBuf = Buffer.from(filename, 'utf-8');
  const now = new Date();
  const time = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
  const date = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;

  // Calculate CRC32
  let crc = 0 ^ (-1);
  for (let i = 0; i < content.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ content[i]) & 0xff];
  }
  crc = (crc ^ (-1)) >>> 0;

  // Local file header (30 bytes + name length)
  const localHeader = Buffer.alloc(30 + nameBuf.length);
  localHeader.writeUInt32LE(0x04034b50, 0); // Local header signature
  localHeader.writeUInt16LE(20, 4); // Version needed
  localHeader.writeUInt16LE(0, 6); // General flags
  localHeader.writeUInt16LE(0, 8); // Compression method (0 = store)
  localHeader.writeUInt16LE(time, 10);
  localHeader.writeUInt16LE(date, 12);
  localHeader.writeUInt32LE(crc, 14); // CRC32
  localHeader.writeUInt32LE(content.length, 18); // Compressed size
  localHeader.writeUInt32LE(content.length, 22); // Uncompressed size
  localHeader.writeUInt16LE(nameBuf.length, 26); // File name length
  localHeader.writeUInt16LE(0, 28); // Extra field length
  nameBuf.copy(localHeader, 30);

  // Central directory header (46 bytes + name length)
  const centralDir = Buffer.alloc(46 + nameBuf.length);
  centralDir.writeUInt32LE(0x02014b50, 0); // Central directory signature
  centralDir.writeUInt16LE(20, 4); // Version made by
  centralDir.writeUInt16LE(20, 6); // Version needed
  centralDir.writeUInt16LE(0, 8); // Flags
  centralDir.writeUInt16LE(0, 10); // Method
  centralDir.writeUInt16LE(time, 12);
  centralDir.writeUInt16LE(date, 14);
  centralDir.writeUInt32LE(crc, 16);
  centralDir.writeUInt32LE(content.length, 20);
  centralDir.writeUInt32LE(content.length, 24);
  centralDir.writeUInt16LE(nameBuf.length, 28);
  centralDir.writeUInt16LE(0, 30); // Extra field
  centralDir.writeUInt16LE(0, 32); // Comment
  centralDir.writeUInt16LE(0, 34); // Disk start
  centralDir.writeUInt16LE(0, 36); // Internal attr
  centralDir.writeUInt32LE(0, 38); // External attr
  // Relative offset will be populated when packing
  nameBuf.copy(centralDir, 46);

  return { localHeader, centralDir, content };
}

// Pre-computed CRC32 table
const crcTable: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

// Generate a lightweight base structure if needed
export function ensureAPKFile() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const apkPath = path.join(publicDir, 'PaperX.apk');
    if (!fs.existsSync(apkPath)) {
      fs.writeFileSync(apkPath, Buffer.from('PaperX Android Application Package'));
    }
  } catch (err) {
    console.error('Error ensuring APK file:', err);
  }
}


