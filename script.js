/* =============================
   Theme toggle (persisted)
============================= */
(function(){
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  if (saved === 'light') root.classList.add('light');
})();
function toggleTheme(){
  const root = document.documentElement;
  root.classList.toggle('light');
  localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
}

/* =============================
   Active nav + initial fade-in
============================= */
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('ready');
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#nav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === path);
  });
});

/* =============================
   Scroll reveal (cards/sections)
============================= */
window.io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
},{threshold:.08});
function attachReveals(scope=document){
  scope.querySelectorAll('.reveal').forEach(el=>io.observe(el));
}
document.addEventListener('DOMContentLoaded', ()=>attachReveals());

/* =============================
   Mobile nav toggle
============================= */
function toggleMenu(){
  const nav = document.getElementById('nav');
  if(getComputedStyle(nav).display==='none'){
    nav.style.display='block';
    requestAnimationFrame(()=>nav.classList.add('show'));
  } else {
    nav.classList.remove('show');
    setTimeout(()=>nav.style.display='none', 180);
  }
}

/* =============================
   Back to top
============================= */
window.addEventListener('scroll', () => {
  const btn = document.getElementById('toTop');
  if(!btn) return;
  if(window.scrollY > 400){ btn.classList.add('show'); } else { btn.classList.remove('show'); }
});

/* =============================
   Contact (local dev friendliness)
============================= */
function handleContactSubmit(e){
  const form = e.target;
  const status = document.getElementById('contact-status');
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1'){
    e.preventDefault();
    if (status) status.textContent = "Thanks! Locally captured. In production, this posts via Netlify.";
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const f = document.querySelector('form[name="contact"]');
  if (f) f.addEventListener('submit', handleContactSubmit);
});

/* =============================
   Prefetch next pages (hover/touch)
============================= */
(function () {
  const prefetched = new Set();
  function prefetch(url) {
    if (prefetched.has(url)) return;
    prefetched.add(url);
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }
  document.addEventListener('mouseover', (e) => {
    const a = e.target.closest('a[href$=".html"]');
    if (a) prefetch(a.getAttribute('href'));
  });
  document.addEventListener('touchstart', (e) => {
    const a = e.target.closest('a[href$=".html"]');
    if (a) prefetch(a.getAttribute('href'));
  }, { passive: true });
})();

/* =============================
   PJAX + View Transitions
============================= */
const supportsVT = 'startViewTransition' in document;
const getContent = () => document.getElementById('content');

async function swapContent(url, push = true) {
  // Fetch destination HTML
  const res = await fetch(url, { credentials: 'same-origin' });
  const html = await res.text();

  // Parse into a document fragment
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const newContent = tpl.content.querySelector('#content');
  const newTitle = tpl.content.querySelector('title')?.textContent || document.title;

  // No target found? fall back to full nav
  if (!newContent) { window.location.href = url; return; }

  // ... inside swapContent, after you do the DOM swap ...
  const doSwap = () => {
    const current = getContent();
    if (current) current.replaceWith(newContent);
    document.title = newTitle;

    // Update active nav
    const path = url.split('/').pop() || 'index.html';
    document.querySelectorAll('#nav a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === path);
    });

    // Re-bind reveal animations
    attachReveals(document);

    // ✅ Re-bind project filters for the newly injected Projects page
    initProjectFilters(newContent);

    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Use View Transitions if supported; otherwise fallback to CSS fade
  if (supportsVT) {
    // View Transition cross-fade (with browser-native smoothness)
    await document.startViewTransition(doSwap).finished;
  } else {
    // Fallback: quick fade out/in
    document.body.classList.add('fade-out');
    doSwap();
    requestAnimationFrame(() => document.body.classList.remove('fade-out'));
  }

  if (push) history.pushState({ url }, '', url);
}

// Intercept clicks on internal .html links
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href$=".html"]');
  if (!a) return;
  const url = a.getAttribute('href');
  if (url.startsWith('http') || url.startsWith('#')) return;
  e.preventDefault();
  swapContent(url, true).catch(err => {
    console.error('PJAX error, falling back to full navigation:', err);
    window.location.href = url;
  });
});

// Back/forward buttons
window.addEventListener('popstate', (e) => {
  const url = (e.state && e.state.url) || (location.pathname.split('/').pop() || 'index.html');
  swapContent(url, false).catch(()=>window.location.reload());
});

/* =============================
   Projects filter (still works after swaps)
============================= */
function initProjectFilters(scope = document) {
  const chips = scope.querySelector('#filters');
  if (!chips) return; // not on the Projects page

  const cards = Array.from(scope.querySelectorAll('article.card'));

  chips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;

    chips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    const tag = chip.dataset.filter;
    cards.forEach(card => {
      const tags = (card.dataset.tags || '').split(' ');
      const show = tag === 'all' || tags.includes(tag);
      card.style.display = show ? '' : 'none';
    });
  });

  // (Optional) allow keyboard activation
  chips.querySelectorAll('.chip').forEach(ch => {
    ch.setAttribute('role', 'button');
    ch.setAttribute('tabindex', '0');
    ch.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        ch.click();
      }
    });
  });
}
document.addEventListener('DOMContentLoaded', () => {
  attachReveals();
  initProjectFilters(document); // keep this
});