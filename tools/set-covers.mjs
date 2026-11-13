// Apply cover choices. Usage: node tools/set-covers.mjs picks.txt   (lines like "ava: BAD_AVA_005.jpg")
import fs from 'fs';
import path from 'path';
import { ROOT } from './images.mjs';
const lines = fs.readFileSync(process.argv[2], 'utf8').split('\n').map(l => l.trim()).filter(Boolean);
for (const l of lines) {
  const [slug, file] = l.split(/:\s*/);
  const f = path.join(ROOT, 'content/projects', slug + '.json');
  if (!fs.existsSync(f)) { console.log('unknown project:', slug); continue; }
  const p = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (!p.images.includes(file)) { console.log('photo not in project:', slug, file); continue; }
  p.cover = { dir: p.imageDir, file };
  delete p.previews;
  fs.writeFileSync(f, JSON.stringify(p, null, 2) + '\n');
  console.log('cover set:', slug, file);
}
