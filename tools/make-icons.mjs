// Draws the app icons (five buildings under a night sky) into app/icons. Run once; output is committed.
import {deflateSync, crc32} from 'node:zlib';
import {mkdir, writeFile} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'icons');
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

function png(size, px){
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) px.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, {level: 9})), chunk('IEND', Buffer.alloc(0))]);
}

function draw(size, pad){
  const px = Buffer.alloc(size * size * 3);
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < size && y < size) px.set(c, (y * size + x) * 3); };
  const s = size * (1 - 2 * pad) / 100, o = size * pad, u = v => o + v * s;   // 100x100 units inside the safe zone
  const rect = (x0, y0, x1, y1, c) => { for (let y = Math.round(y0); y < Math.round(y1); y++) for (let x = Math.round(x0); x < Math.round(x1); x++) set(x, y, c); };
  const top = hex('#0b1d23'), bottom = hex('#2b5b5d');
  for (let y = 0; y < size; y++) rect(0, y, size, y + 1, mix(top, bottom, y / size));
  const [mx, my, mr] = [u(78.5), u(12.5), 6.5 * s];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if ((x + .5 - mx) ** 2 + (y + .5 - my) ** 2 <= mr * mr) set(x, y, hex('#f3e9c9'));
  const ground = u(86);
  rect(0, ground, size, size, hex('#17191a'));
  rect(0, ground, size, ground + 3 * s, hex('#3a4143'));
  const blds = [[2, 17, 46, '#bd5136'], [21, 21, 54, '#357f5e'], [44, 19, 30, '#3a6cab'], [65, 16, 40, '#9c4171'], [83, 15, 52, '#99701f']];
  blds.forEach(([bx, bw, bt, col], i) => {
    rect(u(bx), u(bt), u(bx + bw), ground, hex(col));
    const ww = bw / 5;
    for (let wy = bt + 5; wy < 80; wy += 8) for (let c = 0; c < 2; c++){
      const wx = bx + ww * (1 + 2 * c);
      rect(u(wx), u(wy), u(wx + ww), u(wy + 4), (i + c + wy) % 3 ? hex('#ffc45e') : hex('#4f4430'));
    }
  });
  return png(size, px);
}

await mkdir(out, {recursive: true});
for (const [name, size, pad] of [['icon-192.png', 192, .04], ['icon-512.png', 512, .04], ['icon-maskable-512.png', 512, .14], ['apple-touch-icon.png', 180, .08]])
  await writeFile(join(out, name), draw(size, pad));
console.log('icons written to', out);
