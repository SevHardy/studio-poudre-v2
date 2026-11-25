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
const toggle = document.querySelector('header button');
const header = document.querySelector('header');
const mobile = node('nav', null, 'mobile-links');
mobile.id = 'mobile-navigation';
mobile.hidden = true;
mobile.setAttribute('aria-label', 'Navigation mobile');
toggle.setAttribute('aria-controls', mobile.id);
const menuGroup = node('div', null, 'menu-group');
for (const a of header.querySelectorAll('nav a')) {
  menuGroup.append(a.cloneNode(true));
  if (a.search === '?page=work') {
    const sections = node('div', null, 'menu-sections');
    for (const [key, label] of Object.entries(categories)) {
      sections.append(link(label, '?page=work&category=' + key));
    }
    menuGroup.append(sections);
  }
}
mobile.append(menuGroup);
header.append(mobile);
function openMenu(open) {
  mobile.hidden = !open;
  document.body.classList.toggle('menu-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  main.inert = open;
  document.querySelector('footer').inert = open;
}
toggle.onclick = () => openMenu(mobile.hidden);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !mobile.hidden) { openMenu(false); toggle.focus(); }
});
matchMedia('(max-width:768px)').addEventListener('change', () => openMenu(false));
window.addEventListener('pageshow', () => openMenu(false));

const chosen = Object.hasOwn(categories, query.get('category')) ? query.get('category') : '';
const workURL = chosen ? '?page=work&category=' + chosen : '?page=work';
const projectKeys = new Map();
const used = new Set();
for (const p of projects) {
  const base = (p.category + '-' + p.title).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
  let key = base;
  for (let n = 2; used.has(key); n++) key = base + '-' + n;
  used.add(key);
  projectKeys.set(p, key);
}
const selected = projects.find(p => projectKeys.get(p) === query.get('project'));
if (page === 'project' && selected) {
  const p = selected;
  const article = view('collection-story');
  document.title = p.title + ' | Studio Poudré';
  const heading = node('div', null, 'story-heading');
  heading.append(link(categories[p.category], '?page=work&category=' + p.category), node('h1', p.title));
  article.append(heading);
  const filmId = p.video?.match(/^https:\/\/(?:youtu\.be\/|(?:www\.)?youtube\.com\/watch\?v=)([\w-]{11})(?:[?&#]|$)/)?.[1];
  if (filmId) {
    const player = node('iframe', null, 'story-film');
    player.title = p.title;
    player.src = 'https://www.youtube-nocookie.com/embed/' + filmId;
    player.allow = 'encrypted-media; picture-in-picture; fullscreen';
    player.allowFullscreen = true;
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    article.append(player);
  }
  const images = [...new Set([p.image, ...(p.gallery || [])].filter(Boolean))];
  for (const [i, src] of images.entries()) {
    const img = photo(src, p.title + ' — planche ' + (i + 1), 'story-image');
    img.loading = i === 0 ? 'eager' : 'lazy';
    if (!(filmId && i === 0)) article.append(img);
    if (i === 0) {
      const copy = node('div', null, 'story-copy');
      for (const paragraph of (p.description || '').trim().split(/\n\s*\n/).filter(Boolean)) {
        copy.append(node('p', paragraph));
      }
      if (p.video) copy.append(link(filmId ? 'Voir sur YouTube' : 'Voir le film', p.video));
      if (copy.childElementCount) article.append(copy);
    }
  }
  article.append(link('← Retour au portfolio', workURL + '#'+projectKeys.get(p)));
} else if (page === 'work' || page === 'project') {
  const el = view('work-index'), nav = node('nav', null, 'filter'), grid = node('div', null, 'grid');
  document.title = (categories[chosen] || 'Work') + ' | Studio Poudré';
  el.append(node('h1', categories[chosen] || 'Work'), nav, grid);
  nav.setAttribute('aria-label', 'Rubriques du portfolio');
  for (const [key, label] of Object.entries({all:'Tout', ...categories})) {
    const a = link(label, key === 'all' ? '?page=work' : '?page=work&category=' + key);
    if (key === (chosen || 'all')) a.setAttribute('aria-current', 'page');
    nav.append(a);
  }
  for (const p of projects.filter(p => !chosen || p.category === chosen)) {
    const key = projectKeys.get(p);
    const a = link('', '?page=project&project=' + key + (chosen ? '&category=' + chosen : ''));
    a.id = key;
    a.className = 'project';
    const img = photo(p.image, '');
    img.loading = 'lazy';
    a.append(img, node('span', p.title));
    grid.append(a);
  }
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}else if(page==='about'||page==='contact'){
  const about=page==='about',title=about?'About':'Contact';document.title=title+' | Studio Poudré';
  const el = view(about ? 'split about' : 'split');
  const body = node('div');
  const image = photo(about ? 'portrait.webp' : 'contact.webp', about ? 'Séverine Hardy' : 'Création bain');
  if (about) {
    const frame = node('div', null, 'about-portrait');
    frame.append(image);
    const heading = node('div', null, 'about-heading');
    heading.append(node('h1', 'Séverine Hardy'), node('p', 'Styliste & Directrice Artistique'));
    el.append(heading, frame);
  } else {
    el.append(image);
  }
  el.append(body);
  if (!about) body.append(node('h1', title));
  if(about)body.append(node('p',studio.bio_paragraph_1),node('p',studio.bio_paragraph_2),node('blockquote',studio.bio_highlight),node('p',studio.expertises));
  else body.append(node('p',studio.intro_text),link(studio.email,'mailto:'+studio.email));
}else{
  const covers={};for(const p of projects) covers[p.category]??=p.image;
  const hero=document.querySelector('main section');if(covers.swimwear)hero.prepend(photo(covers.swimwear,'','_heroImage_lpelg_13'));
  for(const a of main.querySelectorAll('a[href*="category="]')){
    const cat=new URL(a.href).searchParams.get('category');
    if(covers[cat])a.firstElementChild.replaceWith(photo(covers[cat],'','_categoryImage_lpelg_128'));
    a.querySelector('h2').textContent=categories[cat];
  }
}
