/* Agromet 1.0.0 | Pinky Creative Studio */
import { I18N } from './i18n.js';

const html = document.documentElement;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const LANGS = ['nl', 'pl', 'en', 'de'];
const MOTION_URL = 'https://cdn.jsdelivr.net/npm/motion@12.23.12/+esm';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- jezyk ---------- */
let lang = 'nl';
try {
  const q = new URLSearchParams(location.search).get('lang');
  const s = localStorage.getItem('agromet-lang');
  lang = LANGS.includes(q) ? q : LANGS.includes(s) ? s : 'nl';
} catch (e) {}
const t = (k) => (I18N[lang] && I18N[lang][k]) || I18N.nl[k] || k;
let CFG = {};
let DATA = null;
const hooks = [];

function applyCfg() {
  const k = CFG.kontakt || {};
  $$('[data-cfg]').forEach((el) => {
    const v = (k[el.dataset.cfg] || '').trim();
    el.textContent = v || `[${t('k.ph')}]`;
    el.classList.toggle('ph', !v);
    el.classList.toggle('ph-set', !!v);
  });
  $$('[data-cfg-href]').forEach((el) => { const v = k[el.dataset.cfgHref]; if (v) el.href = v; });
  const mail = $('#kmail');
  if (mail) mail.dataset.base = k.email || '';
  setMail();
  const tel = $('#ktel');
  if (tel) {
    if (k.telefon) { tel.href = 'tel:' + k.telefon.replace(/[^+\d]/g, ''); tel.removeAttribute('aria-disabled'); }
  }
  const v = $('.ver'); if (v && CFG.wersja) v.textContent = 'v' + CFG.wersja;
}
function setMail(body) {
  const mail = $('#kmail');
  if (!mail) return;
  const to = mail.dataset.base || '';
  mail.href = `mailto:${to}?subject=${encodeURIComponent(t('k.mail.subj'))}` + (body ? `&body=${encodeURIComponent(body)}` : '');
}

function applyLang() {
  html.lang = lang;
  $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((p) => { const [a, k] = p.split(':'); if (a && k) el.setAttribute(a, t(k)); });
  });
  const tk = html.dataset.tk, dk = html.dataset.dk;
  if (tk) document.title = html.dataset.home ? `Agromet | ${t(tk)}` : `${t(tk)} | Agromet`;
  const md = $('meta[name=description]'); if (md && dk) md.content = t(dk);
  $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  applyCfg();
  hooks.forEach((h) => h());
}
function setLang(l) {
  if (!LANGS.includes(l)) return;
  lang = l;
  try { localStorage.setItem('agromet-lang', l); } catch (e) {}
  applyLang();
}
$$('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

/* ---------- naglowek ---------- */
const hdr = $('#hdr'), burger = $('#burger'), nav = $('#nav');
const onScroll = () => hdr.classList.toggle('is-top', scrollY < 24);
addEventListener('scroll', onScroll, { passive: true }); onScroll();
function closeNav() { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
burger.addEventListener('click', () => {
  const o = nav.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(o));
});
nav.addEventListener('click', (e) => { if (e.target.closest('a')) closeNav(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
addEventListener('resize', () => { if (innerWidth > 960) closeNav(); });

/* ---------- karty maszyn ---------- */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const brandLabel = (b) => (b === 'neutraal' ? t('b.neutral') : b);
function card(it) {
  const name = it.name[lang] || it.name.nl;
  const specs = it.specs.map((s) => `<li>${esc(t('s.' + s))}</li>`).join('');
  return `<article class="mc" data-rv data-id="${esc(it.id)}">
<div class="mc-img"><img src="assets/img/${esc(it.img)}-sm.webp" alt="" loading="lazy" decoding="async" width="720" height="540">
<div class="badges"><span class="bdg ${it.cond === 'nieuw' ? 'bdg-y' : ''}">${esc(t('c.' + it.cond))}</span>${DATA && DATA.voorbeeld ? `<span class="bdg bdg-s">${esc(t('card.sample'))}</span>` : ''}</div></div>
<div class="mc-b"><span class="mc-brand">${esc(brandLabel(it.brand))}</span><h3>${esc(name)}</h3>
<ul class="specs">${specs}</ul>${it.fits ? `<p class="fits">${esc(t('spec.fits'))} ${esc(it.fits)}</p>` : ''}
<div class="mc-f"><span class="pill">${esc(t('card.ask'))}</span><a class="link" href="kontakt.html?item=${esc(it.id)}">${esc(t('card.btn'))}</a></div></div></article>`;
}
function tilt(root) {
  if (!FINE || RM) return;
  $$('.mc', root).forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = `perspective(900px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateY(-3px)`;
    });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });
}

/* ---------- ruch (Motion One / motion) ---------- */
let M = null;
const queue = [];
function reveal(els) { if (M) doReveal(els); else queue.push(...els); }
function doReveal(els) {
  const { animate, inView } = M;
  const dist = RM ? 0 : 36, dur = RM ? .45 : .85;
  els.forEach((el) => {
    if (!el.hasAttribute('data-rv')) return;
    const sib = el.parentElement ? [...el.parentElement.children].filter((c) => c.hasAttribute('data-rv') || c.dataset.rvDone) : [el];
    const delay = RM ? 0 : Math.min(Math.max(sib.indexOf(el), 0), 5) * .08;
    inView(el, () => {
      animate(el, { opacity: [0, 1], transform: [`translateY(${dist}px)`, 'translateY(0px)'] }, { duration: dur, delay, ease: [.22, 1, .36, 1] })
        .then(() => { el.dataset.rvDone = '1'; el.removeAttribute('data-rv'); el.style.opacity = ''; el.style.transform = ''; });
    }, { amount: .12, margin: '0px 0px -6% 0px' });
  });
}
function heroIntro() {
  const { animate, stagger, scroll } = M;
  const media = $('.hero-media');
  if (!media) return;
  const hero = $('.hero');
  animate(media, { opacity: [0, 1] }, { duration: 1.4 }).then(() => { media.style.opacity = ''; });
  const ease = [.22, 1, .36, 1];
  $$('.ln-i').forEach((l, i) => {
    animate(l, RM ? { opacity: [0, 1], transform: ['translateY(0%)', 'translateY(0%)'] } : { transform: ['translateY(112%)', 'translateY(0%)'] }, { duration: RM ? .5 : 1, delay: .2 + i * .14, ease })
      .then(() => { l.style.transform = ''; l.style.opacity = ''; l.classList.add('in'); });
  });
  $$('[data-hero]').forEach((e, i) => {
    animate(e, { opacity: [0, 1], transform: [`translateY(${RM ? 0 : 24}px)`, 'translateY(0px)'] }, { duration: RM ? .45 : .8, delay: .5 + i * .12, ease })
      .then(() => { e.removeAttribute('data-hero'); e.style.opacity = ''; e.style.transform = ''; });
  });
  /* parallax: wolniej na telefonie, lagodniej przy reduced-motion */
  const amt = RM ? 3 : innerWidth < 700 ? 8 : 14;
  try {
    scroll(animate(media, { transform: [`translateY(0%) scale(1.03)`, `translateY(${amt}%) scale(${RM ? 1.03 : 1.1})`] }, { ease: 'linear' }), { target: hero, offset: ['start start', 'end start'] });
  } catch (e) {}
}
function counters() {
  const { animate, inView } = M;
  $$('[data-count]').forEach((el) => {
    const to = +el.dataset.count;
    el.textContent = '0';
    inView(el, () => { animate(0, to, { duration: RM ? .6 : 1.6, ease: [.22, 1, .36, 1], onUpdate: (v) => { el.textContent = Math.round(v); } }); }, { amount: .6 });
  });
}
async function loadMotion() {
  try {
    M = await Promise.race([import(MOTION_URL), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))]);
    if (!M || !M.animate || !M.inView) throw new Error('bad motion');
  } catch (e) {
    M = null; html.classList.add('mo-off'); return;
  }
  heroIntro(); counters();
  doReveal($$('[data-rv]'));
  queue.splice(0).forEach((el) => doReveal([el]));
  if (!document.querySelector('.hero')) return;
}
setTimeout(() => { if (!M) html.classList.add('mo-off'); }, 6000);

/* ---------- wideo ---------- */
const vid = $('#herovid');
if (vid) {
  vid.muted = true; vid.defaultMuted = true;
  if (RM) vid.playbackRate = .5;
  const tryPlay = () => { const p = vid.play(); if (p && p.catch) p.catch(() => {}); };
  tryPlay();
  document.addEventListener('touchstart', tryPlay, { once: true, passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? tryPlay() : vid.pause())), { threshold: 0 }).observe(vid);
}

/* ---------- dane + katalog ---------- */
async function loadData() {
  try { const r = await fetch('data/maszyny.json'); DATA = await r.json(); } catch (e) { DATA = { items: [], voorbeeld: true }; }
}
function initFeatured() {
  const g = $('#featgrid'); if (!g) return;
  const ids = ['w-4070', 'g-1', 'a-pallet'];
  const draw = () => { g.innerHTML = ids.map((id) => DATA.items.find((i) => i.id === id)).filter(Boolean).map(card).join(''); tilt(g); reveal($$('[data-rv]', g)); };
  draw(); hooks.push(draw);
}
function initCatalog() {
  const g = $('#catgrid'); if (!g) return;
  const st = { cat: '', brand: '', cond: '' };
  const qs = new URLSearchParams(location.search);
  ['cat', 'brand', 'cond'].forEach((k) => { if (qs.get(k)) st[k] = qs.get(k); });
  const labels = {
    cat: (v) => t('cat.' + v), brand: (v) => brandLabel(v), cond: (v) => t('c.' + v),
  };
  const vals = (k) => [...new Set(DATA.items.map((i) => i[k]))];
  function chips() {
    $$('.fgroup').forEach((grp) => {
      const k = grp.dataset.f, box = $('.fchips', grp);
      const all = [''].concat(vals(k));
      box.innerHTML = all.map((v) => `<button type="button" class="fchip" data-v="${esc(v)}" aria-pressed="${st[k] === v}">${esc(v ? labels[k](v) : t('f.all'))}</button>`).join('');
      $$('.fchip', box).forEach((b) => b.addEventListener('click', () => { st[k] = b.dataset.v; render(true); }));
    });
  }
  function render(anim) {
    const list = DATA.items.filter((i) => (!st.cat || i.cat === st.cat) && (!st.brand || i.brand === st.brand) && (!st.cond || i.cond === st.cond));
    g.innerHTML = list.map(card).join('');
    $('#fnum').textContent = list.length;
    $('#fempty').hidden = list.length > 0;
    $$('.fgroup').forEach((grp) => { const k = grp.dataset.f; $$('.fchip', grp).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === st[k]))); });
    tilt(g);
    const els = $$('[data-rv]', g);
    if (anim && M) {
      const { animate } = M;
      els.forEach((el, i) => {
        el.removeAttribute('data-rv');
        animate(el, { opacity: [0, 1], transform: [`translateY(${RM ? 0 : 18}px) scale(${RM ? 1 : .98})`, 'translateY(0px) scale(1)'] }, { duration: RM ? .3 : .55, delay: Math.min(i, 8) * (RM ? 0 : .05), ease: [.22, 1, .36, 1] })
          .then(() => { el.style.opacity = ''; el.style.transform = ''; });
      });
    } else reveal(els);
    const u = new URL(location.href);
    ['cat', 'brand', 'cond'].forEach((k) => (st[k] ? u.searchParams.set(k, st[k]) : u.searchParams.delete(k)));
    try { history.replaceState(null, '', u); } catch (e) {}
  }
  $('#freset').addEventListener('click', () => { st.cat = st.brand = st.cond = ''; render(true); });
  chips(); render(false);
  hooks.push(() => { chips(); render(false); });
}

/* ---------- kontakt ---------- */
function initContact() {
  const f = $('#kform'); if (!f) return;
  const item = new URLSearchParams(location.search).get('item');
  const prefill = () => {
    if (!item || !DATA) return;
    let name = '';
    const it = DATA.items.find((i) => i.id === item);
    if (it) name = it.name[lang] || it.name.nl;
    else { const m = /^a-(\w+)$/.exec(item); if (m && I18N.nl['a.' + m[1]]) name = t('a.' + m[1]); }
    if (name && !f.msg.dataset.touched) { f.msg.value = name + ': '; f.topic.value = item.startsWith('a-') ? 'attach' : 'machine'; }
  };
  f.msg.addEventListener('input', () => { f.msg.dataset.touched = '1'; });
  prefill();
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!f.reportValidity()) return;
    const topic = f.topic.options[f.topic.selectedIndex].text;
    const body = `${t('k.f.name')}: ${f.name.value}\n${t('k.f.email')}: ${f.email.value}\n${t('k.f.topic')} ${topic}\n\n${f.msg.value}`;
    setMail(body);
    location.href = $('#kmail').href;
  });
}

/* ---------- start ---------- */
(async () => {
  const [cfg] = await Promise.all([window.__CFGP || Promise.resolve({}), loadData()]);
  CFG = cfg || {};
  applyLang();
  initFeatured(); initCatalog(); initContact();
  tilt(document);
  loadMotion();
})();
