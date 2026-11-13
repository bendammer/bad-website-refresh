// Static site generator for benaarondammer.studio
// Usage: node tools/build.mjs
import fs from 'fs';
import path from 'path';
import { ROOT, optimize } from './images.mjs';
import * as T from './templates.mjs';

const readJson = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), s); };

const site = readJson('content/site.json');
const portfolio = readJson('content/portfolio.json');
const projects = fs.readdirSync(path.join(ROOT, 'content/projects')).filter(f => f.endsWith('.json'))
  .map(f => readJson('content/projects/' + f)).sort((a, b) => a.order - b.order);
const imgCfg = site.image;
const generated = [];
const emit = (f, html) => { write(f, html); generated.push(f); };

// ---------- portfolio images
// hero: portfolio.json "hero" (file name) or else the first landscape image; it is shown first and large on desktop
const pfInfoAll = await Promise.all(portfolio.images.map(f => optimize('portfolio', '', f, imgCfg)));
let heroIdx = portfolio.hero ? portfolio.images.indexOf(portfolio.hero) : pfInfoAll.findIndex(i => i.w > i.h * 1.2);
if (heroIdx < 0) heroIdx = 0;
const pfOrder = [heroIdx, ...pfInfoAll.map((_, i) => i).filter(i => i !== heroIdx)];
const pfInfo = pfOrder.map(i => pfInfoAll[i]);
const pfFiles = pfOrder.map(i => portfolio.images[i]);
console.log('Hero image:', pfFiles[0]);
const pfAlt = i => `BAD Photography portfolio, photo ${i + 1}`;
const pfImgs = (prefix) => pfInfo.map((info, i) =>
  '                        ' + T.img(info, { prefix, alt: portfolio.alts?.[pfFiles[i]] || pfAlt(i), cls: i === 0 ? 'hochkant hero' : 'hochkant', eager: i === 0, sizes: i === 0 ? '(max-width: 770px) 92vw, 1000px' : undefined })).join('\n');

// ---------- project images
const projData = [];
for (const p of projects) {
  const infos = await Promise.all(p.images.map(f => optimize('work', p.imageDir, f, imgCfg)));
  let cover;
  if (p.cover.legacy) cover = await optimize('banner', '', path.basename(p.cover.legacy), imgCfg);
  else cover = infos[p.images.indexOf(p.cover.file)] || await optimize('work', p.cover.dir, p.cover.file, imgCfg);
  projData.push({ p, infos, cover });
}

// ---------- pages
const pageHead = (o) => T.head({ site, ...o });

// home
emit('index.html', T.page({
  prefix: '', current: 'portfolio',
  headHtml: pageHead({ title: 'BAD Photography – Ben Aaron Dammer, Photographer in Düsseldorf', description: site.descriptions.home, path: 'index.html', prefix: '', ogImage: pfInfo[0].full }),
  body: T.homeBody({ portfolioImgs: pfImgs('') }),
}));

// portfolio.html: the portfolio is the home page now; keep old links working
emit('portfolio.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Portfolio – BAD Photography</title>
  <meta name="robots" content="noindex">
  <link rel="canonical" href="${site.url}/">
  <meta http-equiv="refresh" content="0; url=index.html">
</head>
<body><a href="index.html">Portfolio</a></body>
</html>
`);

// work overview
const pickPreviews = ({ p, infos }) => {
  if (p.previews) return p.previews.map(f => infos[p.images.indexOf(f)]).filter(Boolean);
  const pool = p.images.map((f, i) => i).filter(i => p.images[i] !== p.cover.file);
  const want = Math.min(3, pool.length);
  const picks = new Set();
  for (let k = 0; k < want; k++) picks.add(pool[Math.floor((k + 0.5) * pool.length / want)]);
  return [...picks].map(i => infos[i]);
};
const workItems = projData.map(d => {
  const { p, cover } = d;
  const previews = [cover, ...pickPreviews(d)];
  return {
    slug: p.slug, title: p.title, category: p.category || '',
    coverTile: T.img(cover, { prefix: '', alt: `${p.title} – cover photo`, cls: 'no-lightbox', sizes: '(max-width: 770px) 90vw, 450px' }),
    thumbs: previews.map(inf => T.img(inf, { prefix: '', alt: '', cls: 'no-lightbox', sizes: '280px' })),
  };
});
emit('work.html', T.page({
  prefix: '', current: 'work',
  headHtml: pageHead({ title: 'Work – BAD Photography', description: site.descriptions.work, path: 'work.html', prefix: '', ogImage: projData[0].cover.full }),
  body: T.workBody({ items: workItems }),
}));

// about / contact
const aboutHtml = fs.readFileSync(path.join(ROOT, 'content/about.html'), 'utf8').trim().replace(/\{\{age\}\}/g, site.age);
emit('about.html', T.page({
  prefix: '', current: 'about',
  headHtml: pageHead({ title: 'About – BAD Photography', description: site.descriptions.about, path: 'about.html', prefix: '' }),
  body: T.aboutBody({ html: aboutHtml }),
}));
const contactHtml = fs.readFileSync(path.join(ROOT, 'content/contact.html'), 'utf8').trim();
emit('contact.html', T.page({
  prefix: '', current: 'contact',
  headHtml: pageHead({ title: 'Contact – BAD Photography', description: site.descriptions.contact, path: 'contact.html', prefix: '' }),
  body: T.contactBody({ html: contactHtml }),
}));

// project pages
for (const [pi, { p, infos, cover }] of projData.entries()) {
  const nextP = projData[(pi + 1) % projData.length].p;
  const prefix = '../';
  const alt = i => `${p.title} – photo ${i + 1}`;
  const videos = (p.videos || []).map(v => {
    const src = `${prefix}images/pictures/work/${p.imageDir}/${v}#t=0.5`;
    return `                        <video controls loop playsinline preload="metadata" src="${src}">\n                            <source src="${src}">\n                        </video>`;
  });
  const pics = infos.map((info, i) => '                        ' + T.img(info, { prefix, alt: p.alts?.[p.images[i]] || alt(i), cls: 'hochkant' }));
  const desc = p.description || `Photography project "${p.title}" by Ben Aaron Dammer (BAD Photography), ${p.images.length} photos.`;
  emit(`work/${p.slug}.html`, T.page({
    prefix, current: 'work',
    headHtml: pageHead({ title: `${p.title} – BAD Photography`, description: desc, path: `work/${p.slug}.html`, prefix, ogImage: cover.full }),
    body: T.projectBody({ title: p.title, category: p.category, description: p.description, items: [...videos, ...pics].map(x => x.trim()), next: projData.length > 1 ? { slug: nextP.slug, title: nextP.title } : null }),
  }));
}

// legal pages (German text lives in content/legal/*.html)
for (const [kind, file, title, pageTitle] of [['imprint', 'imprint.html', 'IMPRINT', 'Imprint'], ['data-protection', 'data-protection.html', 'DATA PROTECTION', 'Data Protection']]) {
  const html = fs.readFileSync(path.join(ROOT, 'content/legal', file), 'utf8').trim();
  emit(file, T.page({
    prefix: '',
    headHtml: pageHead({ title: `${pageTitle} – BAD Photography`, description: `${pageTitle} (${kind === 'imprint' ? 'Impressum' : 'Datenschutzerklärung'}) of BAD Photography, Ben Aaron Dammer.`, path: file, prefix: '' }),
    body: T.legalBody({ kind, title, html }),
  }));
}

// ---------- sitemap + robots
const urls = ['', 'work.html', 'about.html', 'contact.html', ...projects.map(p => `work/${p.slug}.html`), 'imprint.html', 'data-protection.html']
  .map(u => `  <url><loc>${site.url}/${u}</loc></url>`).join('\n');
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);

console.log(`Built ${generated.length} pages, ${projects.length} projects, ${pfInfo.length} portfolio images.`);
