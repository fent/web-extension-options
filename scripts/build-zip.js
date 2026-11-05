const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

class ZipEntry {
  constructor(filePath, zipPath) {
    this.filePath = filePath;
    this.zipPath = zipPath.replace(/\\/g, '/');
    this.nameBuf = Buffer.from(this.zipPath, 'utf8');
    this.data = fs.readFileSync(filePath);
    this.stat = fs.statSync(filePath);
    this.compressed = zlib.deflateRawSync(this.data);
    this.crc = zlib.crc32(this.data);

    const mtimeDate = new Date(this.stat.mtime);
    this.dosTime =
      (mtimeDate.getHours() << 11) |
      (mtimeDate.getMinutes() << 5) |
      Math.floor(mtimeDate.getSeconds() / 2);
    this.dosDate =
      ((mtimeDate.getFullYear() - 1980) << 9) |
      ((mtimeDate.getMonth() + 1) << 5) |
      mtimeDate.getDate();
  }

  get totalLocalLength() {
    return 30 + this.nameBuf.length + this.compressed.length;
  }

  writeCommonFields(buffer, offset) {
    buffer.writeUInt16LE(this.dosTime, offset);
    buffer.writeUInt16LE(this.dosDate, offset + 2);
    buffer.writeUInt32LE(this.crc, offset + 4);
    buffer.writeUInt32LE(this.compressed.length, offset + 8);
    buffer.writeUInt32LE(this.data.length, offset + 12);
    buffer.writeUInt16LE(this.nameBuf.length, offset + 16);
  }

  createLocalHeader() {
    const header = Buffer.alloc(30 + this.nameBuf.length);
    header.writeUInt32LE(0x04034b50, 0); // Local file header signature
    header.writeUInt16LE(20, 4); // Version needed (2.0)
    header.writeUInt16LE(0, 6); // General purpose bit flag
    header.writeUInt16LE(8, 8); // Compression method (deflate)
    this.writeCommonFields(header, 10);
    header.writeUInt16LE(0, 28); // Extra field length
    this.nameBuf.copy(header, 30);
    return Buffer.concat([header, this.compressed]);
  }

  createCentralHeader(localHeaderOffset) {
    const header = Buffer.alloc(46 + this.nameBuf.length);
    header.writeUInt32LE(0x02014b50, 0); // Central directory file header signature
    header.writeUInt16LE(20, 4); // Version made by
    header.writeUInt16LE(20, 6); // Version needed to extract
    header.writeUInt16LE(0, 8); // General purpose bit flag
    header.writeUInt16LE(8, 10); // Compression method (deflate)
    this.writeCommonFields(header, 12);
    header.writeUInt16LE(0, 30); // Extra field length
    header.writeUInt16LE(0, 32); // File comment length
    header.writeUInt16LE(0, 34); // Disk number start
    header.writeUInt16LE(0, 36); // Internal file attributes
    header.writeUInt32LE(0, 38); // External file attributes
    header.writeUInt32LE(localHeaderOffset, 42);
    this.nameBuf.copy(header, 46);
    return header;
  }
}

function collectFiles(dir, base = '') {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results = results.concat(collectFiles(full, rel));
    } else if (!entry.name.endsWith('.zip')) {
      results.push({ filePath: full, zipPath: rel });
    }
  }
  return results;
}

function createZip(files, outPath) {
  const entries = files.map(
    ({ filePath, zipPath }) => new ZipEntry(filePath, zipPath),
  );
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;

  for (const entry of entries) {
    localChunks.push(entry.createLocalHeader());
    centralChunks.push(entry.createCentralHeader(offset));
    offset += entry.totalLocalLength;
  }

  let centralDirSize = 0;
  for (const chunk of centralChunks) {
    centralDirSize += chunk.length;
  }

  // End of central directory record: 22 bytes
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  fs.writeFileSync(
    outPath,
    Buffer.concat([...localChunks, ...centralChunks, eocd]),
  );
}

const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const soundsDir = path.resolve(rootDir, 'sounds');
const optionsHtml = path.resolve(rootDir, 'options.html');

const files = [
  ...collectFiles(distDir, 'dist'),
  ...(fs.existsSync(soundsDir) ? collectFiles(soundsDir, 'sounds') : []),
  { filePath: optionsHtml, zipPath: 'options.html' },
];

const pkg = require('../package.json');
createZip(files, path.resolve(rootDir, `${pkg.name}.zip`));

console.log(`Release zip created successfully: ${pkg.name}.zip`);
