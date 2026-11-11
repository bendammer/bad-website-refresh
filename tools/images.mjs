// Image pipeline: source image -> responsive WebP files + dimension info.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const sharp = createRequire(import.meta.url)('sharp');

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

/** Find a source file: prefers full-resolution originals in source/, falls back to the images already in the repo. */
export function findSource(group, dir, file) {
  const candidates = [
    path.join(ROOT, 'source', group, dir, file),
    path.join(ROOT, 'images', 'pictures', group === 'banner' ? '' : group, dir, file),
  ];
  if (group === 'banner') candidates.push(path.join(ROOT, 'images', 'banner', file));
  if (group === 'portfolio') candidates.push(path.join(ROOT, 'images', 'pictures', 'portfolio', file));
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error(`Source image not found: ${group}/${dir}/${file}`);
}

/**
 * Create <width>.webp variants (never upscaling). Returns {w,h,variants:[{w,src}],full}.
 * Output goes to images/optimized/<group>/<dir>/<name>-<w>.webp (paths relative to site root).
 */
export async function optimize(group, dir, file, cfg) {
  const src = findSource(group, dir, file);
  const srcStat = fs.statSync(src);
  const meta = await sharp(src).rotate().metadata();
  const orient = meta.orientation && meta.orientation >= 5;
  const W = orient ? meta.height : meta.width, H = orient ? meta.width : meta.height;
  const base = path.basename(file, path.extname(file)).replace(/[^A-Za-z0-9._+-]+/g, '_');
  const outDir = path.join(ROOT, 'images', 'optimized', group, dir || '');
  fs.mkdirSync(outDir, { recursive: true });
  const widths = [...new Set(cfg.widths.map(w => Math.min(w, W)))].sort((a, b) => a - b);
  const variants = [];
  for (const w of widths) {
    const out = path.join(outDir, `${base}-${w}.webp`);
    const rel = path.relative(ROOT, out).split(path.sep).join('/');
    if (!fs.existsSync(out) || fs.statSync(out).mtimeMs < srcStat.mtimeMs) {
      await sharp(src).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: cfg.quality }).toFile(out);
    }
    variants.push({ w, src: rel });
  }
  return { w: W, h: H, variants, full: variants[variants.length - 1].src };
}
