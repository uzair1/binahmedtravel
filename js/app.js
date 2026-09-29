import { createIcons, icons } from 'https://cdn.jsdelivr.net/npm/lucide@latest/+esm';

const PACKAGES = window.PACKAGES || [];
const UR = window.I18N_UR || {};
const WHATSAPP = '923212255342';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const renderIcons = () => createIcons({ icons });
const starStr = (n) => '★'.repeat(n);

const state = { type: 'all', star: 'all', lang: 'en', openPkg: null };
const T = () => window.UI[state.lang];
const L = (obj) => obj[state.lang] || obj.en;
const fmt = (n) => `${T().currency} ${n.toLocaleString('en-PK')}`;
const typeName = (t) => T()[t];

/* ---------- Language ---------- */
// Capture original English markup once
const EN = {};
$$('[data-i18n]').forEach(el => { const k = el.dataset.i18n; if (!(k in EN)) EN[k] = el.innerHTML; });
const EN_PH = {};
$$('[data-i18n-ph]').forEach(el => { EN_PH[el.dataset.i18nPh] = el.getAttribute('placeholder'); });

function applyLang(lang, persist = true) {
  state.lang = lang;
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === 'ur' ? 'rtl' : 'ltr';
  $$('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    el.innerHTML = lang === 'ur' && UR[k] ? UR[k] : EN[k];
  });
  $$('[data-i18n-ph]').forEach(el => {
    const k = el.dataset.i18nPh;
    el.setAttribute('placeholder', lang === 'ur' && UR[k] ? UR[k] : EN_PH[k]);
  });
  $$('[data-lang-label]').forEach(el => { el.textContent = T().langLabel; });
  document.title = lang === 'ur'
    ? 'بن احمد ٹریول اینڈ ٹور — حج و عمرہ پیکجز، کراچی'
    : 'Bin Ahmed Travel & Tour — Hajj & Umrah Packages, Karachi';
  if (persist) { try { localStorage.setItem('ba_lang', lang); } catch (e) {} }

  renderPackages();
  renderTestimonials();
  renderFaqs();
  renderPackageSelect();
  if (state.openPkg && !$('#pkgModal').classList.contains('hidden')) openPkg(state.openPkg);
  renderIcons();
}

document.addEventListener('click', e => {
  if (e.target.closest('[data-lang-toggle]')) applyLang(state.lang === 'en' ? 'ur' : 'en');
});

/* ---------- Packages ---------- */
function pkgCard(p) {
  const d = L(p), t = T();
  return `
  <article class="pkg-card reveal">
    <div class="pkg-head ${p.type}">
      <div class="pattern-bg"></div>
      <div class="relative flex items-start justify-between gap-3">
        <div>
          <div class="text-[11px] font-bold uppercase tracking-wider text-gold-500">${t.pkgLabel(typeName(p.type))}</div>
          <h3 class="mt-1 text-xl font-extrabold">${d.name}</h3>
        </div>
        <span class="text-[11px] font-semibold bg-brand-600 text-white rounded-md px-2 py-1 whitespace-nowrap">${d.tag}</span>
      </div>
      <div class="relative mt-4 flex items-center gap-4 text-xs text-navy-100">
        <span class="flex items-center gap-1.5"><i data-lucide="calendar-days" class="w-3.5 h-3.5"></i>${p.nights} ${t.nights}</span>
        <span class="flex items-center gap-1.5 text-gold-500"><span dir="ltr">${starStr(p.stars)}</span><span class="text-navy-100">${t.hotels}</span></span>
      </div>
    </div>
    <div class="p-5 flex-1 flex flex-col">
      <div class="grid grid-cols-2 gap-2 text-center">
        <div class="rounded-lg bg-sand-50 border border-slate-100 py-2.5">
          <div class="text-lg font-extrabold text-navy-800">${p.makkah}</div>
          <div class="text-[11px] text-slate-500">${t.nMakkah}</div>
        </div>
        <div class="rounded-lg bg-sand-50 border border-slate-100 py-2.5">
          <div class="text-lg font-extrabold text-navy-800">${p.madinah}</div>
          <div class="text-[11px] text-slate-500">${t.nMadinah}</div>
        </div>
      </div>
      <ul class="mt-4 space-y-2 text-sm text-slate-600">
        ${d.includes.slice(0, 4).map(i => `<li class="flex gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i>${i}</li>`).join('')}
      </ul>
      <div class="mt-auto pt-5 flex items-end justify-between gap-3 border-t border-slate-100">
        <div>
          <div class="text-[11px] text-slate-500">${t.from}</div>
          <div class="text-xl font-extrabold text-navy-800 whitespace-nowrap">${fmt(p.price)}</div>
          <div class="text-[11px] text-slate-500">${t.perPerson}</div>
        </div>
        <button class="btn-primary" data-open="${p.id}">${t.details} <i data-lucide="arrow-right" class="w-4 h-4 flip-rtl"></i></button>
      </div>
    </div>
  </article>`;
}

function renderPackages() {
  const list = PACKAGES.filter(p =>
    (state.type === 'all' || p.type === state.type) &&
    (state.star === 'all' || String(p.stars) === state.star));
  $('#pkgGrid').innerHTML = list.map(pkgCard).join('');
  $('#pkgEmpty').classList.toggle('hidden', list.length > 0);
  $('#pkgCount').textContent = T().count(list.length);
  renderIcons();
  observeReveal();
}

function setType(t) {
  state.type = t;
  $$('#pkgFilters .chip').forEach(b => b.classList.toggle('active', b.dataset.filter === t));
}
function setStar(s) {
  state.star = s;
  $$('#starFilters .mini-chip').forEach(b => b.classList.toggle('active', b.dataset.star === s));
}

$('#pkgFilters').addEventListener('click', e => {
  const b = e.target.closest('[data-filter]'); if (!b) return;
  setType(b.dataset.filter); renderPackages();
});
$('#starFilters').addEventListener('click', e => {
  const b = e.target.closest('[data-star]'); if (!b) return;
  setStar(b.dataset.star); renderPackages();
});

/* Finder */
let finderType = 'umrah';
$('#finderType').addEventListener('click', e => {
  const b = e.target.closest('[data-val]'); if (!b) return;
  finderType = b.dataset.val;
  $$('#finderType .seg-btn').forEach(x => x.classList.toggle('active', x === b));
});
$('#finderForm').addEventListener('submit', e => {
  e.preventDefault();
  setType(finderType);
  setStar($('#finderStay').value);
  renderPackages();
  $('#packages').scrollIntoView({ behavior: 'smooth' });
});

$$('[data-jump]').forEach(a => a.addEventListener('click', () => { setType(a.dataset.jump); setStar('all'); renderPackages(); }));

/* ---------- Package modal ---------- */
const pkgModal = $('#pkgModal');
function openPkg(id) {
  const p = PACKAGES.find(x => x.id === id); if (!p) return;
  const d = L(p), t = T();
  const activeTab = $('#tabs .tab-btn.active')?.dataset.tab && state.openPkg === id ? $('#tabs .tab-btn.active').dataset.tab : 'overview';
  state.openPkg = id;
  const waText = state.lang === 'ur'
    ? `السلام علیکم، مجھے ${d.name} پیکج (${p.nights} راتیں) میں دلچسپی ہے۔ براہِ کرم تفصیلات بھیجیں۔`
    : `Assalam o Alaikum, I am interested in the ${d.name} package (${p.nights} nights). Please share details.`;
  const tabBtn = (k) => `<button class="tab-btn ${activeTab === k ? 'active' : ''}" data-tab="${k}">${t[k]}</button>`;
  const hidden = (k) => activeTab === k ? '' : 'hidden';

  $('#pkgModalBody').innerHTML = `
    <div class="pkg-head ${p.type} !p-6 shrink-0">
      <div class="pattern-bg"></div>
      <div class="relative flex items-start justify-between gap-4">
        <div>
          <div class="text-[11px] font-bold uppercase tracking-wider text-gold-500">${t.pkgLabel(typeName(p.type))} · ${d.tag}</div>
          <h3 class="mt-1 text-2xl font-extrabold">${d.name}</h3>
          <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-100">
            <span class="flex items-center gap-1.5"><i data-lucide="calendar-days" class="w-3.5 h-3.5"></i>${p.nights} ${t.nights}</span>
            <span class="flex items-center gap-1.5"><i data-lucide="building-2" class="w-3.5 h-3.5"></i>${p.makkah} ${t.nMakkah} · ${p.madinah} ${t.nMadinah}</span>
            <span class="text-gold-500" dir="ltr">${starStr(p.stars)}</span>
          </div>
        </div>
        <button class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center shrink-0" data-close aria-label="Close"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
    </div>
    <div class="px-6 border-b border-slate-200 flex shrink-0" id="tabs">
      ${tabBtn('overview')}${tabBtn('itinerary')}${tabBtn('inclusions')}
    </div>
    <div class="p-6 overflow-y-auto flex-1">
      <div data-panel="overview" class="space-y-3 ${hidden('overview')}">
        ${[['building', t.makkahHotel, d.makkahHotel], ['landmark', t.madinahHotel, d.madinahHotel], ['plane', t.flights, d.flight], ['users', t.room, d.room || t.sharing]].map(([ic, l, v]) => `
          <div class="flex items-center gap-3 border border-slate-200 rounded-xl p-3.5">
            <span class="icon-chip"><i data-lucide="${ic}" class="w-5 h-5"></i></span>
            <div><div class="text-xs text-slate-500">${l}</div><div class="font-semibold text-navy-800 text-sm">${v}</div></div>
          </div>`).join('')}
        <div class="flex items-start gap-2 text-xs text-slate-600 bg-brand-50 border border-brand-100 rounded-xl p-3.5">
          <i data-lucide="syringe" class="w-4 h-4 text-brand-600 shrink-0"></i>
          <span>${t.vaxNote} <a href="#advisory" data-close class="font-semibold text-brand-600 underline">${t.readAdv}</a></span>
        </div>
      </div>
      <ol data-panel="itinerary" class="${hidden('itinerary')} relative border-s-2 border-navy-100 ms-2 space-y-5">
        ${d.itinerary.map(([day, txt]) => `
          <li class="ps-5 relative">
            <span class="absolute -start-[7px] top-1 w-3 h-3 rounded-full bg-brand-600"></span>
            <div class="text-xs font-bold text-brand-600">${day}</div>
            <div class="text-sm text-slate-700 mt-0.5">${txt}</div>
          </li>`).join('')}
      </ol>
      <div data-panel="inclusions" class="${hidden('inclusions')} grid sm:grid-cols-2 gap-6">
        <div>
          <h4 class="font-bold text-navy-800 text-sm mb-3">${t.included}</h4>
          <ul class="space-y-2 text-sm text-slate-600">${d.includes.map(i => `<li class="flex gap-2"><i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i>${i}</li>`).join('')}</ul>
        </div>
        <div>
          <h4 class="font-bold text-navy-800 text-sm mb-3">${t.notIncluded}</h4>
          <ul class="space-y-2 text-sm text-slate-600">${d.excludes.map(i => `<li class="flex gap-2"><i data-lucide="x-circle" class="w-4 h-4 text-slate-400 shrink-0 mt-0.5"></i>${i}</li>`).join('')}</ul>
        </div>
      </div>
    </div>
    <div class="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-sand-50">
      <div>
        <div class="text-[11px] text-slate-500">${t.fromPP}</div>
        <div class="text-2xl font-extrabold text-navy-800">${fmt(p.price)}</div>
      </div>
      <div class="flex gap-2">
        <a href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(waText)}" target="_blank" rel="noopener" class="btn-outline"><i data-lucide="message-circle" class="w-4 h-4"></i> ${t.whatsapp}</a>
        <button class="btn-primary" data-book="${p.id}">${t.book} <i data-lucide="arrow-right" class="w-4 h-4 flip-rtl"></i></button>
      </div>
    </div>`;
  pkgModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  renderIcons();
}
function closeModals() {
  pkgModal.classList.add('hidden');
  $('#flyerModal').classList.add('hidden');
  document.body.classList.remove('modal-open');
}

document.addEventListener('click', e => {
  const open = e.target.closest('[data-open]');
  if (open) { state.openPkg = null; return openPkg(open.dataset.open); }
  const tab = e.target.closest('[data-tab]');
  if (tab) {
    $$('#tabs .tab-btn').forEach(b => b.classList.toggle('active', b === tab));
    $$('[data-panel]').forEach(p => p.classList.toggle('hidden', p.dataset.panel !== tab.dataset.tab));
    return;
  }
  const book = e.target.closest('[data-book]');
  if (book) {
    $('#fPackage').value = book.dataset.book;
    closeModals();
    $('#contact').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => $('#fName').focus({ preventScroll: true }), 600);
    return;
  }
  if (e.target.closest('[data-close]')) closeModals();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModals(); });

$('#flyerBtn').addEventListener('click', () => {
  $('#flyerModal').classList.remove('hidden');
  document.body.classList.add('modal-open');
});
$('#flyerModal').addEventListener('click', e => { if (e.target.id === 'flyerModal') closeModals(); });

/* ---------- Testimonials & FAQ ---------- */
const starSvg = '<i data-lucide="star" class="w-4 h-4 fill-current"></i>';
$('#starsRow').innerHTML = starSvg.repeat(5);

function renderTestimonials() {
  $('#testimonials').innerHTML = (window.TESTIMONIALS || []).map(item => {
    const d = L(item);
    return `
    <figure class="reveal in rounded-2xl bg-white/5 border border-white/10 p-6 flex flex-col">
      <div class="flex text-gold-500">${starSvg.repeat(5)}</div>
      <blockquote class="mt-4 text-navy-50 leading-relaxed flex-1">“${d.text}”</blockquote>
      <figcaption class="mt-6 flex items-center gap-3">
        <span class="w-10 h-10 rounded-full bg-brand-600 grid place-items-center font-bold text-sm" dir="ltr">${item.initials}</span>
        <span><span class="block font-semibold">${d.name}</span><span class="block text-xs text-navy-200">${d.city} · ${d.trip}</span></span>
      </figcaption>
    </figure>`;
  }).join('');
}

function renderFaqs() {
  const openIdx = $$('#faqList .faq-item').map((el, i) => el.classList.contains('open') ? i : -1).filter(i => i >= 0);
  const list = window.FAQS[state.lang] || window.FAQS.en;
  $('#faqList').innerHTML = list.map(([q, a], i) => `
    <div class="faq-item ${(openIdx.length ? openIdx.includes(i) : i === 0) ? 'open' : ''}">
      <button class="faq-btn">${q}<i data-lucide="plus" class="w-5 h-5 text-brand-600"></i></button>
      <div class="faq-body"><div><p class="pb-5 text-sm text-slate-600 leading-relaxed">${a}</p></div></div>
    </div>`).join('');
}
$('#faqList').addEventListener('click', e => {
  const b = e.target.closest('.faq-btn'); if (!b) return;
  b.parentElement.classList.toggle('open');
});

/* ---------- Inquiry form ---------- */
function renderPackageSelect() {
  const sel = $('#fPackage'), cur = sel.value;
  sel.innerHTML = PACKAGES.map(p => `<option value="${p.id}">${L(p).name} — ${p.nights} ${T().nightsShort}</option>`).join('')
    + `<option value="custom">${T().custom}</option>`;
  if (cur) sel.value = cur;
}

function toast(msg) {
  const t = $('#toast');
  t.innerHTML = `<i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i>${msg}`;
  t.classList.remove('hidden'); renderIcons();
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.add('hidden'), 3500);
}

$('#inquiryForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#fName'), phone = $('#fPhone'), err = $('#formError');
  [name, phone].forEach(f => f.classList.remove('invalid'));
  let msg = '';
  if (!name.value.trim()) { name.classList.add('invalid'); msg = T().errName; }
  else if (!/^[+\d][\d\s-]{9,}$/.test(phone.value.trim())) { phone.classList.add('invalid'); msg = T().errPhone; }
  if (msg) { err.querySelector('span').textContent = msg; err.classList.remove('hidden'); return; }
  err.classList.add('hidden');

  const pkg = PACKAGES.find(p => p.id === $('#fPackage').value);
  const ur = state.lang === 'ur';
  const pkgName = pkg ? `${L(pkg).name} (${pkg.nights} ${T().nightsShort})` : T().custom;
  const lines = ur ? [
    'السلام علیکم، بن احمد ٹریول اینڈ ٹور۔',
    `نام: ${name.value.trim()}`,
    `فون: ${phone.value.trim()}`,
    `پیکج: ${pkgName}`,
    $('#fMonth').value ? `سفر کا مہینہ: ${$('#fMonth').value}` : '',
    `مسافر: ${$('#fAdults').value} بالغ، ${$('#fChildren').value} بچے`,
    $('#fMsg').value.trim() ? `پیغام: ${$('#fMsg').value.trim()}` : ''
  ] : [
    'Assalam o Alaikum, Bin Ahmed Travel & Tour.',
    `Name: ${name.value.trim()}`,
    `Phone: ${phone.value.trim()}`,
    `Package: ${pkgName}`,
    $('#fMonth').value ? `Travel month: ${$('#fMonth').value}` : '',
    `Travellers: ${$('#fAdults').value} adult(s), ${$('#fChildren').value} child(ren)`,
    $('#fMsg').value.trim() ? `Message: ${$('#fMsg').value.trim()}` : ''
  ];
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.filter(Boolean).join('\n'))}`, '_blank', 'noopener');
  toast(T().toast);
  e.target.reset();
});

/* ---------- Header / nav ---------- */
$('#menuBtn').addEventListener('click', () => $('#mobileMenu').classList.toggle('hidden'));
$$('#mobileMenu a').forEach(a => a.addEventListener('click', () => $('#mobileMenu').classList.add('hidden')));

const sections = ['packages', 'services', 'journey', 'advisory', 'faq', 'contact'].map(id => document.getElementById(id));
const navObs = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) $$('.nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => s && navObs.observe(s));

/* ---------- Reveal ---------- */
const revObs = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); revObs.unobserve(en.target); } });
}, { threshold: 0.1 });
function observeReveal() { $$('.reveal:not(.in)').forEach(el => revObs.observe(el)); }
$$('.service-card, .step-card, .vax-card').forEach(el => el.classList.add('reveal'));

/* ---------- Init ---------- */
$('#year').textContent = new Date().getFullYear();
let initial = 'en';
try {
  const q = new URLSearchParams(location.search).get('lang');
  initial = (q === 'ur' || q === 'en') ? q : (localStorage.getItem('ba_lang') || 'en');
} catch (e) {}
applyLang(initial === 'ur' ? 'ur' : 'en', false);
observeReveal();
