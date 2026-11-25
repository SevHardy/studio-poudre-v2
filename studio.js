const main = document.querySelector('main');
const query = new URLSearchParams(location.search);
const page = query.get('page') || 'home';
const categories = {swimwear:'Swimwear',lingerie:'Bodywear',kidswear:'Kidswear',prints:'Prints'};
const [portfolio, studio] = await Promise.all(['portfolio.json','studio.json'].map(async path => (await fetch(path)).json()));
const projects = portfolio.projects;
function node(tag, text, cls) {
  const el = document.createElement(tag);
  if (text) el.textContent = text;
  if (cls) el.className = cls;
  return el;
}
function photo(url, title, cls) {
  const img=node('img',null,cls); img.src=url; img.alt=title || ''; return img;
}
function link(text, url) { const el=node('a',text); el.href=url; return el; }
function view(cls) { const section=node('section',null,'view '+cls); main.replaceChildren(section); return section; }
const toggle=document.querySelector('header button');
const mobile=node('nav',null,'mobile-links');
mobile.hidden=true; mobile.setAttribute('aria-label','Navigation mobile');
document.querySelectorAll('header nav a').forEach(a=>mobile.append(a.cloneNode(true)));
document.querySelector('header').append(mobile);
toggle.onclick=()=>{mobile.hidden=!mobile.hidden;toggle.setAttribute('aria-expanded',String(!mobile.hidden));};
function showProject(p, origin) {
  const dialog=node('dialog',null,'detail'), close=node('button','Fermer ×');
  dialog.setAttribute('aria-label',p.title); close.onclick=()=>dialog.close();
  dialog.append(close,node('h2',p.title),node('p',p.description),photo(p.image,p.title));
  if(p.video) dialog.append(link('Voir le film',p.video));
  for(const src of p.gallery || []) {const img=photo(src,p.title);img.loading='lazy';dialog.append(img);}
  dialog.onclose=()=>{dialog.remove();origin.focus();};document.body.append(dialog);dialog.showModal();
}
if(page==='work'){
  const el=view(''),chosen=query.get('category'),nav=node('nav',null,'filter'),grid=node('div',null,'grid');
  document.title='Work | Studio Poudré';el.append(node('h1','Work'),nav,grid);
  for(const [key,label] of Object.entries({all:'Tout',...categories})){
    const a=link(label,key==='all'?'?page=work':'?page=work&category='+key);
    if(key===(chosen||'all'))a.setAttribute('aria-current','page');nav.append(a);
  }
  for(const p of projects.filter(p=>!chosen||p.category===chosen)){
    const b=node('button',null,'project'),img=photo(p.image,'');img.loading='lazy';b.append(img,node('span',p.title));b.onclick=()=>showProject(p,b);grid.append(b);
  }
}else if(page==='about'||page==='contact'){
  const about=page==='about',title=about?'About':'Contact';document.title=title+' | Studio Poudré';
  const el=view('split'),body=node('div');el.append(photo(about?'portrait.webp':'contact.webp',about?'Séverine Hardy':'Création bain'),body);body.append(node('h1',title));
  if(about)body.append(node('p',studio.bio_paragraph_1),node('p',studio.bio_paragraph_2),node('blockquote',studio.bio_highlight),node('p',studio.expertises));
  else body.append(node('p',studio.intro_text),link(studio.email,'mailto:'+studio.email));
}else{
  const covers={};for(const p of projects) covers[p.category]??=p.image;
  const hero=document.querySelector('main section');if(covers.swimwear)hero.prepend(photo(covers.swimwear,'','_heroImage_lpelg_13'));
  document.querySelector('._pitchTitle_lpelg_94').textContent=studio.pitch_subtitle;
  for(const a of main.querySelectorAll('a[href*="category="]')){
    const cat=new URL(a.href).searchParams.get('category');
    if(covers[cat])a.firstElementChild.replaceWith(photo(covers[cat],'','_categoryImage_lpelg_128'));
    a.querySelector('h2').textContent=categories[cat];
  }
}
