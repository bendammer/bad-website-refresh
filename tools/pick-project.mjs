// Builds a local selection page for a folder of high-res photos.
// Usage: node tools/pick-project.mjs "<photo folder>" <slug> "<Project title>"
// Then:  python3 -m http.server   ->  http://localhost:8000/tools/picker/<slug>.html
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { ROOT } from './images.mjs';
const sharp = createRequire(import.meta.url)('sharp');

const [dir, slug, title = slug] = process.argv.slice(2);
if (!dir || !slug) { console.error('usage: node tools/pick-project.mjs "<folder>" <slug> "<title>"'); process.exit(1); }
const out = path.join(ROOT, 'tools/picker', slug);
fs.mkdirSync(path.join(out, 't'), { recursive: true });
fs.mkdirSync(path.join(out, 'p'), { recursive: true });

const files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|tiff?)$/i.test(f) && !f.startsWith('.')).sort();
const meta = [];
let next = 0;
async function worker() {
  while (next < files.length) {
    const f = files[next++];
    const base = f.replace(/\.[^.]+$/, '');
    const t = path.join(out, 't', base + '.webp'), p = path.join(out, 'p', base + '.webp');
    const input = () => sharp(path.join(dir, f), { failOn: 'none' }).rotate();
    let info;
    if (!fs.existsSync(t)) info = await input().resize({ height: 440, withoutEnlargement: true }).webp({ quality: 68 }).toFile(t);
    if (!fs.existsSync(p)) await input().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 74 }).toFile(p);
    const m = await sharp(t).metadata();
    meta[files.indexOf(f)] = { f, base, w: m.width, h: m.height };
    if (next % 20 === 0) console.log(next + '/' + files.length);
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const thumbs = meta.map((m, i) => `<div class="th" data-i="${i}" data-file="${esc(m.f)}" style="width:${Math.round(220 * m.w / m.h)}px"><img loading="lazy" src="${esc(slug)}/t/${esc(m.base)}.webp" alt="" width="${m.w}" height="${m.h}"><b class="ord"></b><i class="cov">★ cover</i><span class="nm">${i + 1}</span><button class="zm" type="button" aria-label="zoom">⤢</button></div>`).join('');
const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Select photos – ${esc(title)}</title>
<style>
body{font-family:Saira,system-ui,sans-serif;margin:0;color:#000;background:#fff}
header{position:sticky;top:0;z-index:5;background:rgba(255,255,255,.96);border-bottom:1px solid #e3e3e3;padding:12px 20px;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
header strong{font-weight:500}
header button{font:inherit;border:1px solid #cfcfcf;border-radius:999px;background:#fff;padding:7px 16px;cursor:pointer}
header button.primary{border-color:rgb(82,235,59);background:rgba(82,235,59,.14)}
#count{color:#444}
#hint{color:#6b6b6b;font-size:13px}
main{display:flex;flex-wrap:wrap;gap:8px;padding:16px 20px 120px}
.th{position:relative;height:220px;border:3px solid transparent;border-radius:10px;overflow:hidden;background:#eee;cursor:pointer;box-sizing:border-box}
.th img{width:100%;height:100%;object-fit:cover;display:block}
.th.sel{border-color:rgb(82,235,59)}
.th .ord{display:none;position:absolute;right:6px;top:6px;min-width:24px;height:24px;border-radius:12px;background:rgb(82,235,59);color:#000;font-size:12px;font-weight:500;line-height:24px;text-align:center;padding:0 6px;box-sizing:border-box}
.th.sel .ord{display:block}
.th .cov{display:none;position:absolute;left:6px;bottom:6px;background:#000;color:#fff;font-style:normal;font-size:12px;border-radius:999px;padding:3px 10px}
.th.cover .cov{display:block}
.th .nm{position:absolute;left:6px;top:6px;background:rgba(255,255,255,.9);border-radius:999px;font-size:11px;padding:2px 8px}
.th .zm{position:absolute;right:6px;bottom:6px;width:28px;height:28px;border:0;border-radius:50%;background:rgba(255,255,255,.9);cursor:pointer;opacity:0;transition:opacity .15s}
.th:hover .zm{opacity:1}
#viewer{position:fixed;inset:0;background:rgba(255,255,255,.97);z-index:50;display:none;flex-direction:column;align-items:center;justify-content:center}
#viewer.on{display:flex}
#viewer img{max-width:94vw;max-height:84vh;object-fit:contain}
#vbar{margin-top:12px;display:flex;gap:10px;align-items:center;font-size:14px;color:#444}
#vbar button{font:inherit;border:1px solid #cfcfcf;border-radius:999px;background:#fff;padding:6px 14px;cursor:pointer}
#vbar button.on{border-color:rgb(82,235,59);background:rgba(82,235,59,.14)}
#out{width:100%;height:140px;font:13px monospace;display:none}
</style></head><body>
<header>
<strong>${esc(title)}</strong> <span id="count"></span>
<button type="button" id="sort">order by file name</button>
<button type="button" id="clear">clear</button>
<button type="button" class="primary" id="copy">copy selection</button>
<span id="hint">click = select · ⤢ or double-click = large view (← → move, space = select, C = cover, Esc = close)</span>
<textarea id="out" readonly></textarea>
</header>
<main id="grid">${thumbs}</main>
<div id="viewer"><img alt=""><div id="vbar"><button type="button" id="vprev">←</button><span id="vname"></span><button type="button" id="vsel">select</button><button type="button" id="vcov">cover</button><button type="button" id="vnext">→</button><button type="button" id="vclose">close</button></div></div>
<script>
const SLUG=${JSON.stringify(slug)},TITLE=${JSON.stringify(title)},KEY='bad-pick-'+SLUG;
const files=${JSON.stringify(meta.map(m => m.f))},bases=${JSON.stringify(meta.map(m => m.base))};
let st={sel:[],cover:null};try{st=Object.assign(st,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
const els=[...document.querySelectorAll('.th')];
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}};
function paint(){els.forEach((el,i)=>{const f=files[i],k=st.sel.indexOf(f);el.classList.toggle('sel',k>=0);el.querySelector('.ord').textContent=k>=0?k+1:'';el.classList.toggle('cover',st.cover===f)});
document.getElementById('count').textContent=st.sel.length+' of '+files.length+' selected'+(st.cover?' · cover set':'');
if(viewer.classList.contains('on'))vpaint();save();}
function toggle(i){const f=files[i],k=st.sel.indexOf(f);if(k>=0){st.sel.splice(k,1);if(st.cover===f)st.cover=null}else st.sel.push(f);paint()}
function setCover(i){const f=files[i];if(!st.sel.includes(f))st.sel.push(f);st.cover=st.cover===f?null:f;paint()}
document.getElementById('grid').addEventListener('click',e=>{const el=e.target.closest('.th');if(!el)return;const i=+el.dataset.i;if(e.target.closest('.zm'))return openV(i);toggle(i)});
document.getElementById('grid').addEventListener('dblclick',e=>{const el=e.target.closest('.th');if(el)openV(+el.dataset.i)});
document.getElementById('sort').onclick=()=>{st.sel.sort((a,b)=>files.indexOf(a)-files.indexOf(b));paint()};
document.getElementById('clear').onclick=()=>{if(confirm('Clear selection?')){st={sel:[],cover:null};paint()}};
document.getElementById('copy').onclick=async()=>{const t='project: '+SLUG+'\\ntitle: '+TITLE+'\\ncover: '+(st.cover||st.sel[0]||'')+'\\nimages:\\n'+st.sel.join('\\n');const o=document.getElementById('out');o.style.display='block';o.value=t;o.select();
try{await navigator.clipboard.writeText(t);document.getElementById('copy').textContent='copied ✓'}catch(e){document.getElementById('copy').textContent='select the text and copy it'}};
const viewer=document.getElementById('viewer');let vi=0;
function vpaint(){viewer.querySelector('img').src=${JSON.stringify(slug)}+'/p/'+bases[vi]+'.webp';document.getElementById('vname').textContent=(vi+1)+' / '+files.length+' · '+files[vi];
document.getElementById('vsel').classList.toggle('on',st.sel.includes(files[vi]));document.getElementById('vsel').textContent=st.sel.includes(files[vi])?'selected ✓':'select';document.getElementById('vcov').classList.toggle('on',st.cover===files[vi])}
function openV(i){vi=i;viewer.classList.add('on');vpaint()}
function step(d){vi=(vi+d+files.length)%files.length;vpaint()}
document.getElementById('vprev').onclick=()=>step(-1);document.getElementById('vnext').onclick=()=>step(1);document.getElementById('vclose').onclick=()=>viewer.classList.remove('on');
document.getElementById('vsel').onclick=()=>toggle(vi);document.getElementById('vcov').onclick=()=>setCover(vi);
document.addEventListener('keydown',e=>{if(!viewer.classList.contains('on'))return;if(e.key==='Escape')viewer.classList.remove('on');else if(e.key==='ArrowLeft')step(-1);else if(e.key==='ArrowRight')step(1);else if(e.key===' '||e.key==='Enter'){e.preventDefault();toggle(vi)}else if(e.key==='c'||e.key==='C')setCover(vi)});
paint();
</script></body></html>`;
fs.writeFileSync(path.join(ROOT, 'tools/picker', slug + '.html'), html);
console.log('done:', files.length, 'photos -> tools/picker/' + slug + '.html');
