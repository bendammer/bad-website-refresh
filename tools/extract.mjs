// One-off: extract existing content from the hand-written pages into JSON data files.
import fs from 'fs';
import path from 'path';
const read = f => fs.readFileSync(f, 'utf8');
const decode = s => s.replace(/&amp;/g, '&');

// --- work.html: order, label, slug, cover from desktop list
const workHtml = read('work.html');
const desktop = workHtml.slice(workHtml.indexOf('<div class="desktop">'));
const re = /<img class="banner-img no-lightbox"[^>]*src="([^"]+)"[^>]*>\s*<a class="banner-text"[^>]*href="work\/([^"]+)\.html">([^<]+)<\/a>/g;
let m, order = 0;
const entries = [];
while ((m = re.exec(desktop))) entries.push({ cover: m[1], file: m[2], label: decode(m[3]) });

for (const e of entries) {
  order++;
  const page = read(`work/${e.file}.html`);
  const title = decode(page.match(/id="mobile-portrait-title">([^<]*)</)[1]);
  const mobileBlock = page.slice(page.indexOf('mobile-portrait-images'), page.indexOf('mobile-footer-subpage'));
  const dir = page.match(/images\/pictures\/work\/([^/"]+)\//)[1];
  const images = [...mobileBlock.matchAll(/data-src="[^"]*\/([^"/]+\.jpg)"/g)].map(x => x[1]);
  const videos = [...mobileBlock.matchAll(/<video[^>]*src="[^"]*\/([^"/]+\.(?:mp4|m4v))"/g)].map(x => x[1]);
  const slug = e.file;
  const coverRel = e.cover.startsWith('images/pictures/work/') ? e.cover.replace('images/pictures/work/', '') : null;
  const project = {
    title, label: e.label, slug, order,
    imageDir: dir,
    cover: coverRel ? { dir: coverRel.split('/')[0], file: coverRel.split('/')[1] } : { legacy: e.cover },
    videos, images,
  };
  fs.writeFileSync(`content/projects/${slug}.json`, JSON.stringify(project, null, 2) + '\n');
  console.log(slug, '|', title, '|', images.length, 'imgs |', videos.length, 'videos |', dir);
}

// --- portfolio list (index.html desktop)
const idx = read('index.html');
const pf = [...idx.matchAll(/images\/pictures\/portfolio\/([^"]+\.jpg)/g)].map(x => x[1]);
const pfPage = [...read('portfolio.html').matchAll(/images\/pictures\/portfolio\/([^"]+\.jpg)/g)].map(x => x[1]);
fs.writeFileSync('content/portfolio.json', JSON.stringify({ images: [...new Set(pf)] }, null, 2) + '\n');
console.log('portfolio index:', new Set(pf).size, 'portfolio.html:', new Set(pfPage).size, 'diff:', [...new Set(pf)].filter(x => !pfPage.includes(x)), [...new Set(pfPage)].filter(x => !pf.includes(x)));
