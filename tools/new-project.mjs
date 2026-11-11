// Add a new project: node tools/new-project.mjs "Title" /path/to/photos [--cover 3] [--label "short name"] [--slug my-slug]
// Copies the photos to source/work/<slug>/ (not committed), writes content/projects/<slug>.json and rebuilds the site.
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { ROOT } from './images.mjs';

const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf('--' + n); return i > -1 ? args.splice(i, 2)[1] : null; };
const cover = opt('cover'), label = opt('label'), slugOpt = opt('slug');
const [title, srcDir] = args;
if (!title || !srcDir) { console.error('Usage: node tools/new-project.mjs "Title" /path/to/photos [--cover N] [--label name] [--slug slug]'); process.exit(1); }

const slug = (slugOpt || title).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const projFile = path.join(ROOT, 'content/projects', slug + '.json');
if (fs.existsSync(projFile)) { console.error(`Project "${slug}" already exists.`); process.exit(1); }

const all = fs.readdirSync(srcDir).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const photos = all.filter(f => /\.(jpe?g|png|tiff?|webp)$/i.test(f));
const videos = all.filter(f => /\.(mp4|m4v)$/i.test(f));
if (!photos.length) { console.error('No photos found in ' + srcDir); process.exit(1); }

const destSrc = path.join(ROOT, 'source/work', slug);
fs.mkdirSync(destSrc, { recursive: true });
const pad = n => String(n).padStart(3, '0');
const prefix = 'BAD_' + title.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
const names = photos.map((f, i) => {
  const name = `${prefix}_${pad(i + 1)}${path.extname(f).toLowerCase().replace('.jpeg', '.jpg')}`;
  fs.copyFileSync(path.join(srcDir, f), path.join(destSrc, name));
  return name;
});
const vidNames = videos.map(v => {
  const d = path.join(ROOT, 'images/pictures/work', slug);
  fs.mkdirSync(d, { recursive: true });
  fs.copyFileSync(path.join(srcDir, v), path.join(d, v));
  return v;
});

const orders = fs.readdirSync(path.join(ROOT, 'content/projects')).filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(ROOT, 'content/projects', f), 'utf8')).order);
const coverFile = names[Math.max(0, (cover ? +cover : 1) - 1)];
fs.writeFileSync(projFile, JSON.stringify({
  title, label: label || title.toLowerCase(), slug,
  order: Math.min(...orders) - 1,          // newest project first
  imageDir: slug,
  cover: { dir: slug, file: coverFile },
  videos: vidNames, images: names,
}, null, 2) + '\n');

console.log(`Added "${title}" (${names.length} photos, ${vidNames.length} videos). Building...`);
const r = spawnSync('node', [path.join(ROOT, 'tools/build.mjs')], { stdio: 'inherit' });
process.exit(r.status ?? 0);
