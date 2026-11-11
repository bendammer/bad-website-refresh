/* ---------- Mobile menu (hamburger) ---------- */
(function () {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  function setOpen(open) {
    document.documentElement.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
  }
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
  });
  // leaving the mobile layout (e.g. rotating a tablet) closes the menu
  window.matchMedia('(min-width: 771px)').addEventListener('change', e => { if (e.matches) setOpen(false); });
})();

/* ---------- Lightbox ---------- */
(function () {
  const ICON = {
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l-8 8 8 8"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8"/></svg>',
  };

  const lightbox = document.createElement('div');
  lightbox.id = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.tabIndex = -1;
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Image viewer');
  lightbox.innerHTML =
    '<div class="lb-stage">' +
    '<button type="button" class="lb-btn lb-close" aria-label="Close">' + ICON.close + '</button>' +
    '<img class="lb-image" alt="">' +
    '<div class="lb-counter" aria-live="polite"></div>' +
    '</div>' +
    '<button type="button" class="lb-btn lb-prev" aria-label="Previous image">' + ICON.prev + '</button>' +
    '<button type="button" class="lb-btn lb-next" aria-label="Next image">' + ICON.next + '</button>';
  document.body.appendChild(lightbox);

  const imgEl = lightbox.querySelector('.lb-image');
  const prevBtn = lightbox.querySelector('.lb-prev');
  const nextBtn = lightbox.querySelector('.lb-next');
  const counter = lightbox.querySelector('.lb-counter');
  let gallery = [], index = 0, opener = null;

  const isOpen = () => lightbox.classList.contains('active');
  const fullSrc = el => el.dataset.full || el.currentSrc || el.src;

  // only the images that are actually visible on this page (pages contain a mobile and a desktop copy)
  const collect = () => Array.from(document.querySelectorAll('img:not(.no-lightbox)')).filter(i => i.offsetParent !== null && i.closest('#lightbox') === null);

  function show(i) {
    index = (i + gallery.length) % gallery.length;
    const el = gallery[index];
    imgEl.src = fullSrc(el);
    imgEl.alt = el.alt || '';
    counter.textContent = (index + 1) + ' / ' + gallery.length;
    // preload neighbours so browsing feels instant
    [index - 1, index + 1].forEach(n => { if (gallery.length > 1) new Image().src = fullSrc(gallery[(n + gallery.length) % gallery.length]); });
  }

  function open(el) {
    gallery = collect();
    index = Math.max(0, gallery.indexOf(el));
    opener = el;
    const multi = gallery.length > 1;
    prevBtn.hidden = nextBtn.hidden = counter.hidden = !multi;
    show(index);
    lightbox.classList.add('active');
    document.documentElement.classList.add('lightbox-open');
    lightbox.focus({ preventScroll: true });
  }

  function close() {
    lightbox.classList.remove('active');
    document.documentElement.classList.remove('lightbox-open');
    imgEl.removeAttribute('src');
    const last = gallery[index] || opener;
    if (last) last.scrollIntoView({ block: "center" });
  }

  document.addEventListener('click', e => {
    const el = e.target.closest && e.target.closest('img:not(.no-lightbox)');
    if (el && !lightbox.contains(el)) open(el);
  });

  lightbox.addEventListener('click', e => {
    if (e.target.closest('.lb-close')) return close();
    if (e.target.closest('.lb-prev')) return show(index - 1);
    if (e.target.closest('.lb-next')) return show(index + 1);
    if (e.target === imgEl) return;       // clicking the photo itself keeps it open
    close();                              // backdrop
  });

  document.addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
  });

  // swipe left/right on touch screens
  let startX = 0, startY = 0;
  lightbox.addEventListener('touchstart', e => { startX = e.changedTouches[0].clientX; startY = e.changedTouches[0].clientY; }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX, dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
