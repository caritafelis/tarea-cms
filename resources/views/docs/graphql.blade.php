<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GraphQL API Docs</title>
@verbatim
<style>
:root{--bg:#fff;--fg:#111827;--mut:#6b7280;--bd:#e5e7eb;--card:#f8fafc;--acc:#db2777;--ok:#16a34a;--warn:#d97706}
@media (prefers-color-scheme:dark){:root{--bg:#0b0f14;--fg:#e5e7eb;--mut:#9ca3af;--bd:#1f2937;--card:#111827;--acc:#f472b6;--ok:#4ade80;--warn:#fbbf24}}
*{box-sizing:border-box}body{margin:0;font:14px/1.5 system-ui,sans-serif;background:var(--bg);color:var(--fg);display:flex;min-height:100vh}
nav{width:290px;flex:none;border-right:1px solid var(--bd);height:100vh;position:sticky;top:0;overflow:auto;padding:12px}
nav input{width:100%;padding:8px;border:1px solid var(--bd);border-radius:6px;background:var(--bg);color:var(--fg);margin-bottom:8px}
nav h4{margin:14px 0 4px;color:var(--mut);font-size:11px;text-transform:uppercase;letter-spacing:.06em}
nav a{display:block;padding:3px 8px;border-radius:4px;color:var(--fg);text-decoration:none;font-family:ui-monospace,monospace;font-size:13px}
nav a:hover,nav a.on{background:var(--card);color:var(--acc)}
main{flex:1;min-width:0;padding:24px 32px;max-width:980px}
h1,h2{margin:.2em 0}code,pre{font-family:ui-monospace,monospace}
pre{background:var(--card);border:1px solid var(--bd);border-radius:6px;padding:12px;overflow:auto;font-size:12.5px}
table{border-collapse:collapse;width:100%;margin:8px 0;display:block;overflow-x:auto}
th,td{border-bottom:1px solid var(--bd);padding:6px 10px;text-align:left;vertical-align:top}th{color:var(--mut);font-weight:600}
.b{display:inline-block;padding:1px 8px;border-radius:99px;font-size:12px;border:1px solid var(--bd);margin-right:4px}
.b.auth{color:var(--warn)}.b.pub{color:var(--ok)}a{color:var(--acc)}.mut{color:var(--mut)}
@media(max-width:760px){body{display:block}nav{width:auto;height:auto;position:static;border:0;border-bottom:1px solid var(--bd)}main{padding:16px}}
</style>
</head>
<body data-src="@endverbatim{{ $src }}@verbatim">
<nav><input id="q" placeholder="Search…" autocomplete="off"><div id="menu"></div></nav>
<main id="out">Loading…</main>
<script>
const src=document.body.dataset.src;let D;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const base=t=>t.replace(/[\[\]!]/g,'');
const tlink=t=>D.names.has(base(t))?`<a href="#type/${base(t)}">${esc(t)}</a>`:esc(t);
const auth=o=>o.requiresAuth?`<span class="b auth">auth${o.abilities.length?': '+esc(o.abilities.join(', ')):''}</span>`:`<span class="b pub">public</span>`;
const argsTable=a=>a.length?`<table><tr><th>Argument</th><th>Type</th><th>Req</th><th>Description</th></tr>${a.map(x=>`<tr><td><code>${esc(x.name)}</code></td><td><code>${tlink(x.type)}</code></td><td>${x.required?'yes':''}</td><td>${esc(x.description)}${x.default!==null?` <span class="mut">default: ${esc(JSON.stringify(x.default))}</span>`:''}</td></tr>`).join('')}</table>`:'<p class="mut">No arguments.</p>';
function op(o,kind){
  const body=JSON.stringify({query:o.example}).replace(/'/g,"'\\''");
  return `<h1><code>${esc(o.name)}</code></h1><p><span class="b">${kind}</span>${auth(o)}</p><p>${esc(o.description)}</p>
  <p>Returns <code>${tlink(o.returns)}</code></p><h2>Arguments</h2>${argsTable(o.args)}
  <h2>Example</h2><pre>${esc(o.example)}</pre>
  <pre>curl -X POST ${esc(D.endpoint)} \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '${esc(body)}'</pre>`;
}
function type(t){
  let h=`<h1><code>${esc(t.name)}</code></h1><p><span class="b">${t.kind}</span></p><p>${esc(t.description)}</p>`;
  if(t.kind==='enum')h+=`<table><tr><th>Value</th><th>Description</th></tr>${t.values.map(v=>`<tr><td><code>${esc(v.name)}</code></td><td>${esc(v.description)}</td></tr>`).join('')}</table>`;
  if(t.fields)h+=`<table><tr><th>Field</th><th>Type</th><th>Description</th></tr>${t.fields.map(f=>`<tr><td><code>${esc(f.name)}</code>${f.args&&f.args.length?`<br><span class="mut">(${f.args.map(a=>esc(a.name)).join(', ')})</span>`:''}</td><td><code>${tlink(f.type)}</code></td><td>${esc(f.description)}${f.deprecated?` <span class="b auth">deprecated</span>`:''}</td></tr>`).join('')}</table>`;
  return h;
}
function home(){return `<h1>${esc(D.title)}</h1><p>Endpoint: <code>POST ${esc(D.endpoint)}</code> · <a href="${esc(D.playground)}" target="_blank" rel="noopener">GraphiQL</a></p>
<pre>Authorization: Bearer &lt;token&gt;
Content-Type: application/json
X-Locale: es</pre><p>${D.queries.length} queries · ${D.mutations.length} mutations · ${D.types.length} types</p>
<p class="mut">API keys <code>cms_*</code> and Sanctum tokens are both accepted. Mutations require the <code>write</code> ability.</p>`}
function route(){
  const [k,n]=decodeURIComponent(location.hash.slice(1)).split('/');
  const o=k==='query'?D.queries.find(x=>x.name===n):k==='mutation'?D.mutations.find(x=>x.name===n):null;
  const t=k==='type'?D.types.find(x=>x.name===n):null;
  out.innerHTML=o?op(o,k):t?type(t):home();
  document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+k+'/'+n));
  scrollTo(0,0);
}
function menu(){
  const f=q.value.toLowerCase();const sec=(t,k,l)=>{const r=l.filter(x=>x.name.toLowerCase().includes(f));return r.length?`<h4>${t}</h4>`+r.map(x=>`<a href="#${k}/${x.name}">${esc(x.name)}</a>`).join(''):''};
  document.getElementById('menu').innerHTML=sec('Queries','query',D.queries)+sec('Mutations','mutation',D.mutations)+sec('Types','type',D.types);
  route();
}
fetch(src,{headers:{Accept:'application/json'}}).then(r=>r.json()).then(d=>{D=d;D.names=new Set(d.types.map(t=>t.name));q.oninput=menu;addEventListener('hashchange',route);menu()}).catch(e=>out.textContent='Failed to load: '+e);
</script>
</body>
</html>
@endverbatim