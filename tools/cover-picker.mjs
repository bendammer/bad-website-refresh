// Generates tools/cover-picker.html: a local page to choose the cover photo for every project.
// Usage: node tools/cover-picker.mjs   then   python3 -m http.server   ->  http://localhost:8000/tools/cover-picker.html
import fs from 'fs';
import path from 'path';
import { ROOT, optimize } from './images.mjs';

const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.json'), 'utf8'));
const projects = fs.readdirSync(path.join(ROOT, 'content/projects')).filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(ROOT, 'content/projects', f), 'utf8'))).sort((a, b) => a.order - b.order);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

let sections = '';
for (const p of projects) {
  const infos = await Promise.all(p.images.map(f => optimize('work', p.imageDir, f, site.image)));
  const legacy = !!p.cover.legacy;
  const current = legacy ? null : p.cover.file;
  let currentHtml = '';
  if (legacy) {
    const b = await optimize('banner', '', path.basename(p.cover.legacy), site.image);
    currentHtml = `<div class="cur"><span>aktuell (altes Banner)</span><img src="../${b.variants[0].src}" alt=""></div>`;
  }
  const thumbs = p.images.map((f, i) => {
    const v = infos[i].variants[0];
    return `<button type="button" class="th${f === current ? ' current' : ''}" data-file="${esc(f)}" title="${esc(f)}"><img loading="lazy" src="../${v.src}" alt=""><span>${i + 1}</span></button>`;
  }).join('');
  sections += `<section data-slug="${esc(p.slug)}"><h2>${esc(p.title)} <small>${esc(p.category || '')} · ${p.images.length} fotos${legacy ? ' · <b>braucht neues titelbild</b>' : ''}</small></h2>${currentHtml}<div class="grid">${thumbs}</div></section>`;
}

const html = `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Titelbild-Auswahl</title>
<style>
body{font-family:Saira,system-ui,sans-serif;margin:0;color:#000;background:#fff}
header{position:sticky;top:0;background:rgba(255,255,255,.96);border-bottom:1px solid #e3e3e3;padding:14px 24px;display:flex;gap:16px;align-items:center;z-index:5;flex-wrap:wrap}
header button{font:inherit;border:1px solid #cfcfcf;border-radius:999px;background:#fff;padding:8px 18px;cursor:pointer}
header button.primary{border-color:rgb(82,235,59);background:rgba(82,235,59,.14)}
#count{color:#444}
main{padding:10px 24px 120px}
section{margin:34px 0}
h2{font-weight:400;font-size:22px;margin:0 0 12px;text-transform:lowercase}
h2 small{font-size:14px;color:#6b6b6b;margin-left:10px}
h2 small b{color:#000;font-weight:500;border-bottom:2px solid rgb(82,235,59)}
.cur{display:flex;align-items:center;gap:12px;margin:0 0 12px;font-size:13px;color:#6b6b6b}
.cur img{height:70px;border-radius:8px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.th{position:relative;padding:0;border:3px solid transparent;border-radius:12px;background:#eee;aspect-ratio:4/3;overflow:hidden;cursor:pointer}
.th img{width:100%;height:100%;object-fit:cover;display:block}
.th span{position:absolute;left:6px;top:6px;background:rgba(255,255,255,.9);border-radius:999px;font-size:11px;padding:2px 8px}
.th.current{border-color:#999}
.th.selected{border-color:rgb(82,235,59)}
.th:hover{opacity:.9}
.contain .th img{object-fit:contain}
#out{width:100%;height:120px;font:13px monospace;display:none}
</style></head><body>
<header>
  <strong>Titelbilder wählen</strong>
  <span id="count">0 gewählt</span>
  <button type="button" id="crop">Ausschnitt 4:3 / ganzes Bild</button>
  <button type="button" class="primary" id="copy">Auswahl kopieren</button>
  <button type="button" id="reset">zurücksetzen</button>
  <textarea id="out" readonly></textarea>
</header>
<main>${sections}</main>
<script>
const KEY='bad-cover-picks';
let picks={};try{picks=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const secs=[...document.querySelectorAll('section')];
function paint(){secs.forEach(s=>{const sel=picks[s.dataset.slug];s.querySelectorAll('.th').forEach(b=>b.classList.toggle('selected',b.dataset.file===sel))});
document.getElementById('count').textContent=Object.keys(picks).length+' von '+secs.length+' gewählt';}
document.addEventListener('click',e=>{const b=e.target.closest('.th');if(!b)return;const slug=b.closest('section').dataset.slug;
if(picks[slug]===b.dataset.file)delete picks[slug];else picks[slug]=b.dataset.file;
try{localStorage.setItem(KEY,JSON.stringify(picks))}catch(e){}paint();});
document.getElementById('crop').onclick=()=>document.body.classList.toggle('contain');
document.getElementById('reset').onclick=()=>{if(confirm('Auswahl löschen?')){picks={};try{localStorage.removeItem(KEY)}catch(e){}paint();}};
document.getElementById('copy').onclick=async()=>{const t=Object.entries(picks).map(([k,v])=>k+': '+v).join('\\n');const o=document.getElementById('out');o.style.display='block';o.value=t;o.select();
try{await navigator.clipboard.writeText(t);document.getElementById('copy').textContent='kopiert ✓'}catch(e){document.getElementById('copy').textContent='bitte Text markieren und kopieren'}};
paint();
</script></body></html>`;
fs.writeFileSync(path.join(ROOT, 'tools/cover-picker.html'), html);
console.log('tools/cover-picker.html written,', projects.length, 'projects');
