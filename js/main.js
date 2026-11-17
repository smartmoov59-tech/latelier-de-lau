/* ==========================================================
   L’atelier de Lau — animations (GSAP + ScrollTrigger + Lenis)
   Site 100 % statique : aucun serveur, aucun service tiers requis.
   ========================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var PLANITY = 'https://www.planity.com/latelier-de-lau-54130-essey-les-nancy';
  var PHONE = '+33749305439';

  /* Une erreur dans un module ne doit jamais bloquer le reste du site */
  function safe(name, fn) {
    try { fn(); } catch (e) { if (window.console) console.error('[atelier] ' + name, e); }
  }

  if (!window.gsap || !window.ScrollTrigger) {
    var l = document.getElementById('loader'); if (l) l.remove();
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  var lenis = null;
  var menuOpen = false;
  var mm = gsap.matchMedia();

  /* ---------- Smooth scroll (Lenis) ---------- */
  safe('lenis', function () {
    if (reduce || !window.Lenis) return;
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  });

  /* ---------- Découpage du texte (mots / lettres) ---------- */
  function splitNode(node, mode) {
    var frag = document.createDocumentFragment();
    Array.prototype.forEach.call(node.childNodes, function (child) {
      if (child.nodeType === 3) {
        child.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'); w.className = 'w';
          var wi = document.createElement('span'); wi.className = 'wi';
          if (mode === 'chars') {
            Array.from(part).forEach(function (chr) {
              var c = document.createElement('span'); c.className = 'ch'; c.textContent = chr; wi.appendChild(c);
            });
          } else { wi.textContent = part; }
          w.appendChild(wi); frag.appendChild(w);
        });
      } else if (child.nodeType === 1) {
        var clone = child.cloneNode(false);
        clone.appendChild(splitNode(child, mode));
        frag.appendChild(clone);
      }
    });
    return frag;
  }
  safe('split', function () {
    $$('[data-split]').forEach(function (el) {
      var label = el.textContent.replace(/\s+/g, ' ').trim();
      var inner = document.createElement('span');
      inner.setAttribute('aria-hidden', 'true');
      inner.appendChild(splitNode(el, el.getAttribute('data-split')));
      var needsLabel = !el.closest('[aria-label],[aria-hidden="true"]');
      el.textContent = '';
      el.appendChild(inner);
      if (needsLabel) {
        var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = label; el.appendChild(sr);
      }
    });
  });

  /* ---------- Vidéos (chargées à la demande, en pause hors écran) ---------- */
  function lazyVideo(video, src) {
    if (!video || reduce) return;
    var loaded = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          if (!loaded) { video.src = src; video.preload = 'auto'; loaded = true; }
          var p = video.play(); if (p && p.catch) p.catch(function () {});
        } else if (loaded) { video.pause(); }
      });
    }, { rootMargin: '150px' });
    io.observe(video);
  }
  safe('videos', function () {
    var small = window.innerWidth < 901;
    lazyVideo($('.hero__video'), small ? 'img/video/hero-720.mp4' : 'img/video/hero.mp4');
    var cta = $('.cta__video'); if (cta) lazyVideo(cta, cta.getAttribute('data-src'));
  });

  /* ---------- Etat initial de l’intro (sous le préchargeur) ---------- */
  var heroChars = $$('.hero__line .ch');
  if (!reduce) {
    gsap.set('.hero__media', { scale: 1.3 });
    gsap.set(heroChars, { yPercent: 118, rotate: 5 });
    gsap.set(['.hero__eyebrow', '.hero__lead', '.hero__cta'], { autoAlpha: 0, y: 34 });
    gsap.set('.float', { autoAlpha: 0, scale: 0.6 });
    gsap.set('.hero__badge', { autoAlpha: 0, scale: 0.4, rotate: -60 });
    gsap.set('.hero__scroll', { autoAlpha: 0 });
    gsap.set('.nav > *', { autoAlpha: 0, y: -30 });
  }

  /* ---------- Préchargeur + entrée spectaculaire ---------- */
  function playIntro() {
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('.hero__media', { scale: 1, duration: 2.6, ease: 'power3.out' }, 0)
      .to(heroChars, { yPercent: 0, rotate: 0, duration: 1.5, stagger: 0.04 }, 0.15)
      .to('.hero__eyebrow', { autoAlpha: 1, y: 0, duration: 1.1 }, 0.5)
      .to('.hero__lead', { autoAlpha: 1, y: 0, duration: 1.2 }, 0.85)
      .to('.hero__cta', { autoAlpha: 1, y: 0, duration: 1.2 }, 1.0)
      .to('.float', { autoAlpha: 1, scale: 1, duration: 1.5, stagger: 0.16, ease: 'back.out(1.5)' }, 0.55)
      .to('.hero__badge', { autoAlpha: 1, scale: 1, rotate: 0, duration: 1.4, ease: 'back.out(1.5)' }, 1.1)
      .to('.nav > *', { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08 }, 0.8)
      .to('.hero__scroll', { autoAlpha: 1, duration: 1 }, 1.5);
  }

  function runLoader() {
    var loader = $('#loader');
    if (!loader) return;
    if (reduce) {
      loader.remove();
      document.body.classList.remove('is-locked');
      return;
    }
    document.body.classList.add('is-locked');
    var hole = $('#loaderHole');
    var countEl = $('#loaderCount');
    var fill = $('.loader__fill');
    var center = $('.loader__center');
    var o = { v: 0 };

    gsap.set(hole, { svgOrigin: '50 50', scale: 0.001 });
    gsap.set('.loader__fill', { attr: { y: 52 } });
    gsap.set('.loader__brand', { autoAlpha: 0, y: 16 });
    gsap.set('.loader__stroke', { autoAlpha: 0 });
    gsap.set('.loader__almond', { y: 14, autoAlpha: 0 });

    var tl = gsap.timeline({
      onComplete: function () {
        loader.remove();
        document.body.classList.remove('is-locked');
        if (lenis) lenis.start();
        ScrollTrigger.refresh();
      }
    });
    tl.to('.loader__almond', { y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out' }, 0.1)
      .to('.loader__stroke', { autoAlpha: 1, duration: 0.6 }, 0.2)
      .to('.loader__brand', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.3)
      .to(o, {
        v: 100, duration: 1.9, ease: 'power2.inOut',
        onUpdate: function () {
          var v = Math.round(o.v);
          countEl.textContent = v;
          fill.setAttribute('y', String(52 * (1 - o.v / 100)));
        }
      }, 0.3)
      .to(center, { autoAlpha: 0, scale: 0.92, duration: 0.5, ease: 'power2.in' }, 2.25)
      /* l’« ongle » s’ouvre comme une fenêtre sur la vidéo, puis grandit jusqu’à remplir l’écran */
      .to(hole, { scale: 1.15, duration: 0.8, ease: 'expo.out' }, 2.45)
      .add(playIntro, 3.0)
      .to(hole, { scale: 9, duration: 1.25, ease: 'expo.in' }, 3.15);
  }

  /* ---------- Navigation ---------- */
  safe('nav', function () {
    var nav = $('#nav');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        var y = self.scroll();
        nav.classList.toggle('is-solid', y > 60);
        nav.classList.toggle('is-hidden', self.direction === 1 && y > 500 && !menuOpen);
      }
    });
    var bar = $('.progress span');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) { gsap.set(bar, { scaleX: self.progress }); }
    });
  });

  /* Menu mobile plein écran */
  safe('menu', function () {
    var burger = $('#burger'), menu = $('#menu'), nav = $('#nav');
    var links = $$('.menu__links a, .menu__foot a');
    function open() {
      menuOpen = true;
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Fermer le menu');
      nav.classList.add('menu-open'); nav.classList.remove('is-hidden');
      menu.setAttribute('aria-hidden', 'false');
      if (lenis) lenis.stop(); document.body.classList.add('is-locked');
      gsap.set(menu, { visibility: 'visible' });
      gsap.fromTo(menu, { clipPath: 'circle(0px at calc(100% - 2.6rem) 2.6rem)' }, { clipPath: 'circle(2400px at calc(100% - 2.6rem) 2.6rem)', duration: 1, ease: 'expo.inOut' });
      gsap.fromTo(links, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.9, stagger: 0.06, delay: 0.3, ease: 'expo.out' });
    }
    function close(instant) {
      if (!menuOpen) return;
      menuOpen = false;
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Ouvrir le menu');
      nav.classList.remove('menu-open');
      menu.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked'); if (lenis) lenis.start();
      gsap.to(menu, {
        clipPath: 'circle(0px at calc(100% - 2.6rem) 2.6rem)', duration: instant ? 0.01 : 0.7, ease: 'expo.inOut',
        onComplete: function () { gsap.set(menu, { visibility: 'hidden' }); }
      });
    }
    burger.addEventListener('click', function () { menuOpen ? close() : open(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    window.__closeMenu = close;
  });
  /* menu-open : barre transparente, texte clair */
  (function () {
    var st = document.createElement('style');
    st.textContent = '.nav.menu-open{background:transparent!important;color:var(--cream)!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}';
    document.head.appendChild(st);
  })();

  /* ---------- Ancres : défilement fluide ---------- */
  safe('anchors', function () {
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id === '#') return;
        if (a.hasAttribute('data-cat')) return; // géré par le module Prestations
        var target = id === '#top' ? document.body : $(id);
        if (!target) return;
        e.preventDefault();
        if (window.__closeMenu) window.__closeMenu(true);
        var pinned = id === '#atelier' || id === '#prestations';
        if (lenis) {
          if (id === '#top') lenis.scrollTo(0, { duration: 1.6 });
          else lenis.scrollTo(target, { offset: pinned ? 0 : -70, duration: 1.7, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
        } else {
          target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
        }
      });
    });
  });

  /* ---------- Curseur personnalisé (souris uniquement) ---------- */
  safe('cursor', function () {
    if (!fine || reduce) return;
    var cur = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring'), label = $('.cursor__label');
    document.body.classList.add('has-cursor');
    var dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' }), dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    var rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
    gsap.set([dot, ring], { x: -100, y: -100 });
    window.addEventListener('mousemove', function (e) { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    var labels = [['.g-card', 'Voir'], ['.reviews__deck', 'Glisser'], ['.cta__phone', 'Appeler']];
    document.addEventListener('mouseover', function (e) {
      var t = e.target; var lab = '';
      for (var i = 0; i < labels.length; i++) { if (t.closest && t.closest(labels[i][0])) { lab = labels[i][1]; break; } }
      var isLink = t.closest && t.closest('a,button,label,input,select,summary');
      label.textContent = lab;
      cur.classList.toggle('is-label', !!lab);
      cur.classList.toggle('is-link', !lab && !!isLink);
    });
    document.addEventListener('mouseleave', function () { gsap.to([dot, ring], { autoAlpha: 0, duration: 0.2 }); });
    document.addEventListener('mouseenter', function () { gsap.to([dot, ring], { autoAlpha: 1, duration: 0.2 }); });
  });

  /* ---------- Boutons magnétiques ---------- */
  safe('magnetic', function () {
    if (!fine || reduce) return;
    $$('[data-magnetic]').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' }), yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      var lab = $('.btn__label', el);
      var lx = lab ? gsap.quickTo(lab, 'x', { duration: 0.6, ease: 'power3' }) : null;
      var ly = lab ? gsap.quickTo(lab, 'y', { duration: 0.6, ease: 'power3' }) : null;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) * 0.32, y = (e.clientY - (r.top + r.height / 2)) * 0.45;
        xTo(x); yTo(y); if (lx) { lx(x * 0.35); ly(y * 0.35); }
      });
      el.addEventListener('mouseleave', function () { xTo(0); yTo(0); if (lx) { lx(0); ly(0); } });
    });
  });

  /* ---------- Cartes inclinées 3D + reflet qui suit la souris ---------- */
  safe('tilt', function () {
    if (!fine || reduce) return;
    $$('[data-tilt]').forEach(function (el) {
      gsap.set(el, { transformPerspective: 900 });
      var rxTo = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
      var ryTo = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        rxTo((py - 0.5) * -12); ryTo((px - 0.5) * 14);
        el.style.setProperty('--mx', (px * 100) + '%'); el.style.setProperty('--my', (py * 100) + '%');
      });
      el.addEventListener('mouseleave', function () { rxTo(0); ryTo(0); });
    });
  });

  /* ---------- HERO : parallax multicouche ---------- */
  safe('hero', function () {
    if (reduce) return;
    var st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.hero__media', { yPercent: 16, ease: 'none', scrollTrigger: st });
    gsap.to('.hero__dots', { yPercent: -28, ease: 'none', scrollTrigger: st });
    gsap.to('.hero__content', { yPercent: -16, ease: 'none', scrollTrigger: st });
    $$('.float').forEach(function (f) {
      gsap.to(f, { yPercent: -(parseFloat(f.getAttribute('data-depth')) || 0.5) * 55, ease: 'none', scrollTrigger: st });
    });
    if (fine) {
      var hero = $('.hero');
      var floats = $$('.float').map(function (f) {
        return { d: parseFloat(f.getAttribute('data-depth')) || 0.5, x: gsap.quickTo(f, 'x', { duration: 1.2, ease: 'power3' }), y: gsap.quickTo(f, 'y', { duration: 1.2, ease: 'power3' }) };
      });
      var dots = $('.hero__dots');
      var dX = gsap.quickTo(dots, 'x', { duration: 1.6, ease: 'power3' });
      hero.addEventListener('mousemove', function (e) {
        var nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
        floats.forEach(function (f) { f.x(-nx * 60 * f.d); f.y(-ny * 40 * f.d); });
        dX(nx * 30);
      });
    }
  });

  /* ---------- MARQUEE : vitesse et sens qui réagissent au scroll ---------- */
  safe('marquee', function () {
    var rows = $$('.marquee__row');
    if (!rows.length) return;
    var items = rows.map(function (row) {
      var track = $('.marquee__track', row), group = $('.marquee__group', row);
      var original = group.innerHTML;
      var guard = 0;
      while (group.scrollWidth < window.innerWidth * 1.1 && guard++ < 8) { group.insertAdjacentHTML('beforeend', original); }
      var clone = group.cloneNode(true); clone.setAttribute('aria-hidden', 'true'); track.appendChild(clone);
      return { track: track, w: group.scrollWidth, dir: parseInt(row.getAttribute('data-dir'), 10) || -1, x: -group.scrollWidth * 0.5, set: gsap.quickSetter(track, 'x', 'px') };
    });
    if (reduce) return;
    var boost = 0, boostTarget = 0, sdir = 1;
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        boostTarget = Math.min(Math.abs(self.getVelocity()) / 220, 9);
        sdir = self.direction || 1;
      }
    });
    window.addEventListener('resize', function () { items.forEach(function (it) { it.w = $('.marquee__group', it.track).scrollWidth; }); });
    gsap.ticker.add(function (t, dt) {
      boost += (boostTarget - boost) * 0.08; boostTarget *= 0.93;
      var s = dt / 1000;
      items.forEach(function (it) {
        var speed = (70 + boost * 90) * it.dir * sdir;
        it.x += speed * s;
        if (it.x <= -it.w) it.x += it.w; else if (it.x > 0) it.x -= it.w;
        it.set(it.x);
      });
    });
  });

  /* ---------- Révélations génériques ---------- */
  function revealOnScroll() {
    if (reduce) return;
    $$('[data-split="words"]').forEach(function (el) {
      var words = $$('.wi', el); if (!words.length) return;
      var id = el.id || '';
      var from = { yPercent: 118, duration: 1.2, ease: 'expo.out', stagger: 0.07 };
      if (id === 'gallery-title') { from.rotate = 9; from.transformOrigin = '0% 100%'; from.stagger = 0.09; }
      else if (id === 'services-title') { from.skewY = 8; from.stagger = 0.1; }
      else if (id === 'booking-title') { from.yPercent = 0; from.scale = 0.5; from.autoAlpha = 0; from.ease = 'back.out(1.7)'; from.duration = 1; }
      else if (id === 'reviews-title') { from.yPercent = 0; from.x = -80; from.autoAlpha = 0; from.stagger = 0.12; }
      else if (id === 'cta-title') { from.stagger = { each: 0.06, from: 'center' }; from.rotate = -6; }
      else if (id === 'faq-title') { from.yPercent = 0; from.y = 40; from.autoAlpha = 0; from.stagger = 0.08; }
      gsap.from(words, Object.assign({ scrollTrigger: { trigger: el, start: 'top 88%', once: true } }, from));
    });
    var sels = ['.story__text .eyebrow', '.numbers .eyebrow', '.gallery .eyebrow', '.booking .eyebrow', '.reviews .eyebrow', '.faq .eyebrow', '.find .eyebrow', '.cta .eyebrow',
      '.gallery__intro', '.booking__intro', '.reviews__score', '.reviews__sub', '.reviews__ctrl', '.reviews__links', '.faq__sub', '.find__addr', '.find__contacts li', '.hours', '.find__btns', '.cta__buttons', '.cta__hint', '.qa', '.gallery__more'];
    var els = $$(sels.join(','));
    gsap.set(els, { autoAlpha: 0, y: 36 });
    ScrollTrigger.batch(els, {
      start: 'top 92%', once: true,
      onEnter: function (b) { gsap.to(b, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out', overwrite: true }); }
    });
    // téléphone géant : lettres qui montent
    var ph = $$('.cta__phone .ch');
    if (ph.length) gsap.from(ph, { yPercent: 110, rotate: 6, duration: 1.3, ease: 'expo.out', stagger: 0.045, scrollTrigger: { trigger: '.cta__phone', start: 'top 90%', once: true } });
    // footer : nom géant
    var fg = $$('.footer__giant .ch');
    if (fg.length) gsap.from(fg, { yPercent: 115, duration: 1.5, ease: 'expo.out', stagger: { each: 0.05, from: 'random' }, scrollTrigger: { trigger: '.footer__giant', start: 'top 95%', once: true } });
  }

  /* ---------- Lettres géantes : survol (GSAP, sans transition CSS) ---------- */
  safe('letters', function () {
    if (!fine || reduce) return;
    $$('.cta__phone .ch, .footer__giant .ch').forEach(function (ch) {
      ch.addEventListener('mouseenter', function () { gsap.to(ch, { y: function () { return -ch.offsetHeight * 0.1; }, rotate: -4, duration: 0.45, ease: 'power3.out', overwrite: 'auto' }); });
      ch.addEventListener('mouseleave', function () { gsap.to(ch, { y: 0, rotate: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' }); });
    });
  });

  /* ---------- STORY : section pinnée, storytelling étape par étape ---------- */
  safe('story', function () {
    mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', function () {
      var steps = $$('.story__step'), imgs = $$('.story__img');
      var count = $('.story__count'), bgnum = $('.story__bgnum'), fill = $('.story__rail-fill'), bead = $('.story__bead'), rail = $('.story__rail');
      var n = steps.length;
      steps.forEach(function (s) { s.classList.remove('is-active'); });
      gsap.set(steps, { autoAlpha: 0 }); gsap.set(steps[0], { autoAlpha: 1 });
      gsap.set(imgs, { autoAlpha: 0, scale: 0.8, yPercent: 10, rotate: -4 });
      gsap.set(imgs[0], { autoAlpha: 1, scale: 1, yPercent: 0, rotate: 0 });
      $$('img', imgs[0]).forEach(function (im) { gsap.set(im, { scale: 1.12 }); });
      var current = 0;
      var tl = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
        scrollTrigger: {
          trigger: '.story__pin', start: 'top top',
          end: function () { return '+=' + Math.round(window.innerHeight * n * 0.95); },
          pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: function (self) {
            var idx = Math.min(n - 1, Math.round(self.progress * (n - 1)));
            if (idx !== current) {
              current = idx;
              var label = '0' + (idx + 1);
              count.textContent = label;
              gsap.fromTo(bgnum, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, ease: 'expo.out', onStart: function () { bgnum.textContent = label; } });
            }
          }
        }
      });
      tl.to(imgs[0].querySelector('img'), { scale: 1, duration: 1, ease: 'none' }, 0);
      for (var i = 1; i < n; i++) {
        (function (i) {
          var at = 'step' + i;
          tl.addLabel(at, i * 1.5 - 0.3)
            .to(steps[i - 1], { autoAlpha: 0, y: -60, duration: 0.55 }, at)
            .to(imgs[i - 1], { autoAlpha: 0, scale: 1.18, yPercent: -9, rotate: 6, duration: 0.7 }, at)
            .fromTo(steps[i], { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: 0.7 }, at + '+=0.3')
            .fromTo(imgs[i], { autoAlpha: 0, scale: 0.8, yPercent: 10, rotate: -4 }, { autoAlpha: 1, scale: 1, yPercent: 0, rotate: 0, duration: 0.9 }, at + '+=0.2')
            .fromTo(imgs[i].querySelector('img'), { scale: 1.3 }, { scale: 1, duration: 1.4, ease: 'none' }, at + '+=0.2');
        })(i);
      }
      tl.to({}, { duration: 0.5 });
      var dur = tl.duration();
      tl.to(fill, { scaleY: 1, ease: 'none', duration: dur }, 0);
      tl.to(bead, { y: function () { return rail.clientHeight; }, ease: 'none', duration: dur }, 0);
    });
  });

  /* ---------- PRESTATIONS : défilement horizontal piloté par le scroll vertical ---------- */
  safe('services', function () {
    var track = $('#servicesTrack'); if (!track) return;
    var panels = $$('.panel', track);
    var navLinks = $$('.services__nav a');
    var bar = $('.services__progress span');
    var tweenRef = null;

    mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', function () {
      var pin = $('.services__pin');
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var offsets = [];
      function measure() {
        var tr = track.getBoundingClientRect().left; var pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
        offsets = panels.map(function (p) { return p.getBoundingClientRect().left - tr - pad; });
      }
      var active = -1;
      var tween = gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: {
          trigger: pin, start: 'top top', end: function () { return '+=' + dist(); },
          pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
          onRefresh: measure,
          onUpdate: function (self) {
            gsap.set(bar, { scaleX: self.progress });
            var x = self.progress * dist();
            var idx = 0;
            for (var i = 0; i < 4; i++) { if (offsets[i] - window.innerWidth * 0.3 <= x) idx = i; }
            if (idx !== active) { active = idx; navLinks.forEach(function (a, k) { a.classList.toggle('is-on', k === idx); }); }
          }
        }
      });
      tweenRef = tween;
      panels.forEach(function (p, i) {
        var rows = $$('.price-row', p);
        if (!rows.length) return;
        var photo = $('.panel__photo', p);
        gsap.set(rows, { autoAlpha: 0, x: 50 });
        if (photo) gsap.set(photo, { scale: 0.8, autoAlpha: 0 });
        var st = i === 0
          ? { trigger: '.services', start: 'top 60%', once: true }
          : { trigger: p, containerAnimation: tween, start: 'left 88%', once: true };
        gsap.timeline({ scrollTrigger: st })
          .to(photo || {}, { scale: 1, autoAlpha: 1, duration: 1, ease: 'back.out(1.4)' }, 0)
          .to(rows, { autoAlpha: 1, x: 0, stagger: 0.07, duration: 0.9, ease: 'expo.out' }, 0.1);
      });
      navLinks.forEach(function (a, i) {
        a._h = function (e) {
          e.preventDefault();
          measure();
          var s = tween.scrollTrigger;
          var y = s.start + (offsets[i] / dist()) * (s.end - s.start);
          if (lenis) lenis.scrollTo(y, { duration: 1.6, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
          else window.scrollTo({ top: y, behavior: 'smooth' });
        };
        a.addEventListener('click', a._h);
      });
      return function () {
        navLinks.forEach(function (a) { if (a._h) a.removeEventListener('click', a._h); });
      };
    });
    /* mobile / mouvement réduit : lignes qui apparaissent simplement */
    mm.add('(max-width: 900px), (prefers-reduced-motion: reduce)', function () {
      navLinks.forEach(function (a, i) {
        a.addEventListener('click', function (e) { e.preventDefault(); panels[i].scrollIntoView({ behavior: 'smooth' }); });
      });
      if (reduce) return;
      panels.forEach(function (p) {
        var rows = $$('.price-row', p);
        if (!rows.length) return;
        gsap.set(rows, { autoAlpha: 0, y: 24 });
        ScrollTrigger.create({ trigger: p, start: 'top 80%', once: true, onEnter: function () { gsap.to(rows, { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.8, ease: 'expo.out' }); } });
      });
    });
  });

  /* ---------- CHIFFRES CLÉS ---------- */
  safe('numbers', function () {
    var C = 339.3;
    $$('.stat').forEach(function (stat) {
      var span = $('[data-count]', stat), ring = $('.stat__ring-fg', stat);
      var target = parseFloat(span.getAttribute('data-count')), dec = parseInt(span.getAttribute('data-decimals') || '0', 10);
      var pct = parseFloat(ring.getAttribute('data-pct')) || 1;
      var fmt = function (v) { return v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }); };
      if (reduce) { ring.style.strokeDashoffset = C * (1 - pct); span.textContent = fmt(target); return; }
      var o = { v: 0 }; span.textContent = fmt(0);
      gsap.set(stat, { autoAlpha: 0, y: 50 });
      ScrollTrigger.create({
        trigger: stat, start: 'top 88%', once: true,
        onEnter: function () {
          gsap.to(o, { v: target, duration: 2.4, ease: 'power2.out', onUpdate: function () { span.textContent = fmt(o.v); } });
          gsap.to(ring, { strokeDashoffset: C * (1 - pct), duration: 2.4, ease: 'power2.out' });
          gsap.to(stat, { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out' });
        }
      });
    });
    if (!reduce) gsap.to('.numbers__bg', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.numbers', start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- GALERIE ---------- */
  safe('gallery', function () {
    if (reduce) return;
    var cards = $$('.g-card');
    gsap.set(cards, { clipPath: 'inset(100% 0% 0% 0% round 20px)' });
    ScrollTrigger.batch(cards, {
      start: 'top 94%', once: true,
      onEnter: function (b) {
        gsap.fromTo(b, { clipPath: 'inset(100% 0% 0% 0% round 20px)', y: 60 }, { clipPath: 'inset(0% 0% 0% 0% round 20px)', y: 0, duration: 1.4, ease: 'expo.out', stagger: 0.12, clearProps: 'clipPath' });
      }
    });
    /* les images bougent légèrement dans leur cadre */
    $$('.g-card__media img').forEach(function (img) {
      gsap.set(img, { scale: 1.18 });
      gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: img.closest('.g-card'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    mm.add('(min-width: 901px)', function () {
      $$('.gallery__col').forEach(function (col) {
        var sp = parseFloat(col.getAttribute('data-speed')) || 0.5;
        gsap.fromTo(col, { y: sp * 80 }, { y: sp * -80, ease: 'none', scrollTrigger: { trigger: '.gallery__cols', start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    });
  });

  /* ---------- LIGHTBOX ---------- */
  safe('lightbox', function () {
    var box = $('#lightbox'), img = $('#lbImg'), cap = $('#lbCap');
    var triggers = $$('[data-lightbox]'); var idx = 0; var lastFocus = null;
    function show(i) {
      idx = (i + triggers.length) % triggers.length;
      var t = triggers[idx], thumb = $('img', t);
      img.src = t.getAttribute('data-lightbox'); img.alt = thumb ? thumb.alt : '';
      cap.innerHTML = t.getAttribute('data-caption') || '';
    }
    function open(i) {
      lastFocus = document.activeElement; show(i);
      box.hidden = false; document.body.classList.add('is-locked'); if (lenis) lenis.stop();
      if (!reduce) gsap.fromTo(box, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 });
      if (!reduce) gsap.fromTo('.lightbox__fig', { scale: 0.9, y: 30 }, { scale: 1, y: 0, duration: 0.7, ease: 'expo.out' });
      $('#lbClose').focus();
    }
    function close() {
      if (box.hidden) return;
      box.hidden = true; document.body.classList.remove('is-locked'); if (lenis && !menuOpen) lenis.start();
      if (lastFocus) lastFocus.focus();
    }
    triggers.forEach(function (t, i) { t.addEventListener('click', function () { open(i); }); });
    $('#lbClose').addEventListener('click', close);
    $('#lbPrev').addEventListener('click', function () { show(idx - 1); });
    $('#lbNext').addEventListener('click', function () { show(idx + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'Tab') {
        var f = $$('button', box); var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  });

  /* ---------- COMPOSER MA SÉANCE ---------- */
  safe('booking', function () {
    var host = $('#choices'); if (!host) return;
    var linesEl = $('#ticketLines'), emptyEl = $('#ticketEmpty'), durEl = $('#ticketDur'), totalEl = $('#ticketTotal'), noteEl = $('#ticketNote');
    var btnSms = $('#btnSms'), fName = $('#fName');
    var dayEls = $$('input[name="day"]'), whenEls = $$('input[name="when"]');
    var picked = function (list) { var c = list.filter(function (i) { return i.checked; })[0]; return c ? c.value : ''; };
    var defaultNote = noteEl.textContent;
    var sel = new Map();
    var shownTotal = { v: 0 };

    var fmtDur = function (m) {
      if (m < 60) return m + ' min';
      var h = Math.floor(m / 60), r = m % 60;
      return h + 'h' + (r ? String(r).padStart(2, '0') : '');
    };
    var fmtEur = function (n) { return n.toLocaleString('fr-FR') + ' €'; };

    host.innerHTML = '';
    $$('.panel[data-group]').forEach(function (panel) {
      var group = document.createElement('div'); group.className = 'choice-group';
      var h = document.createElement('h3'); h.textContent = panel.getAttribute('data-group'); group.appendChild(h);
      var chips = document.createElement('div'); chips.className = 'chips'; group.appendChild(chips);
      $$('.price-row', panel).forEach(function (row) {
        var id = row.getAttribute('data-id'), name = row.getAttribute('data-name');
        var eurRaw = row.getAttribute('data-eur'), min = parseInt(row.getAttribute('data-min'), 10) || 0;
        var eur = eurRaw === '' ? null : parseFloat(eurRaw);
        var label = document.createElement('label'); label.className = 'chip';
        label.innerHTML = '<input type="checkbox" value="' + id + '"><span class="chip__box"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.500l2.600 2.600L10 3"/></svg></span>' +
          '<span class="chip__name"></span><span class="chip__meta"></span>';
        $('.chip__name', label).textContent = name;
        $('.chip__meta', label).textContent = fmtDur(min) + ' · ' + (eur === null ? 'sur place' : fmtEur(eur));
        var input = $('input', label);
        input.addEventListener('change', function () {
          label.classList.toggle('is-on', input.checked);
          if (input.checked) sel.set(id, { id: id, name: name, eur: eur, min: min }); else sel.delete(id);
          render(id, input.checked);
        });
        chips.appendChild(label);
      });
      host.appendChild(group);
    });
    var made = $$('.choice-group', host);
    if (!reduce) {
      gsap.set(made, { autoAlpha: 0, y: 36 });
      ScrollTrigger.batch(made, { start: 'top 92%', once: true, onEnter: function (b) { gsap.to(b, { autoAlpha: 1, y: 0, stagger: 0.12, duration: 1, ease: 'expo.out' }); } });
    }

    var lis = {};
    function render(changedId, added) {
      var total = 0, mins = 0, ask = false;
      sel.forEach(function (s) { if (s.eur === null) ask = true; else total += s.eur; mins += s.min; });
      // lignes du ticket
      if (changedId) {
        if (added) {
          var s = sel.get(changedId);
          var li = document.createElement('li');
          li.innerHTML = '<span></span><span></span>';
          li.children[0].textContent = s.name; li.children[1].textContent = s.eur === null ? 'sur place' : fmtEur(s.eur);
          linesEl.appendChild(li); lis[changedId] = li;
          if (!reduce) gsap.from(li, { y: -26, autoAlpha: 0, duration: 0.6, ease: 'expo.out' });
        } else if (lis[changedId]) {
          var gone = lis[changedId]; delete lis[changedId];
          if (reduce) gone.remove(); else gsap.to(gone, { autoAlpha: 0, x: 40, height: 0, paddingBlock: 0, duration: 0.4, ease: 'power3.in', onComplete: function () { gone.remove(); } });
        }
      }
      emptyEl.style.display = sel.size ? 'none' : '';
      durEl.textContent = sel.size ? fmtDur(mins) : '—';
      noteEl.textContent = ask ? 'Réparation d’ongle : tarif à confirmer sur place. Estimation indicative, Lauriane confirme le créneau.' : defaultNote;
      if (reduce) totalEl.textContent = fmtEur(total);
      else gsap.to(shownTotal, { v: total, duration: 0.6, ease: 'power3.out', onUpdate: function () { totalEl.textContent = fmtEur(Math.round(shownTotal.v)); } });
      smsUpdate(total, mins, ask);
    }

    function smsUpdate(total, mins, ask) {
      if (!sel.size) {
        btnSms.setAttribute('aria-disabled', 'true'); btnSms.setAttribute('tabindex', '-1');
        btnSms.setAttribute('href', 'sms:' + PHONE); return;
      }
      var name = fName.value.trim();
      var list = []; sel.forEach(function (s) { list.push(s.name); });
      var parts = [];
      parts.push('Bonjour Lauriane, ' + (name ? 'c’est ' + name + '. Je' : 'je') + ' souhaiterais prendre rendez-vous pour : ' + list.join(', ') + '.');
      parts.push('Total estimé : ' + total + ' €' + (ask ? ' (+ réparation à confirmer)' : '') + ', durée ' + fmtDur(mins) + '.');
      var when = [picked(dayEls), picked(whenEls)].filter(Boolean).join(' ');
      if (when) parts.push('Je serais disponible ' + when + '.');
      parts.push('Merci !');
      btnSms.setAttribute('href', 'sms:' + PHONE + '?&body=' + encodeURIComponent(parts.join(' ')));
      btnSms.removeAttribute('aria-disabled'); btnSms.removeAttribute('tabindex');
    }
    /* le samedi, l'atelier n'ouvre que le matin : on grise « Après-midi » */
    function syncMoment() {
      var sat = picked(dayEls) === 'samedi matin';
      whenEls.forEach(function (w) {
        if (w.value === 'l’après-midi') {
          w.disabled = sat;
          if (sat && w.checked) whenEls.filter(function (x) { return x.value === ''; })[0].checked = true;
        }
      });
    }
    [fName].concat(dayEls, whenEls).forEach(function (f) {
      f.addEventListener('input', function () { syncMoment(); render(null); });
      f.addEventListener('change', function () { syncMoment(); render(null); });
    });
    render(null);
  });

  /* ---------- AVIS : pile de cartes ---------- */
  safe('reviews', function () {
    var deck = $('#deck'); if (!deck) return;
    var cards = $$('.r-card', deck), N = cards.length, cur = 0, timer = null, hovering = false;
    var idxEl = $('#revIdx');
    function pose(i) {
      var pos = (i - cur + N) % N;
      if (pos === 0) return { x: 0, y: 0, rotate: 0, scale: 1, autoAlpha: 1, zIndex: N };
      if (pos === 1) return { x: 30, y: -18, rotate: 3, scale: 0.955, autoAlpha: 1, zIndex: N - 1 };
      if (pos === 2) return { x: 60, y: -36, rotate: 6, scale: 0.91, autoAlpha: 1, zIndex: N - 2 };
      return { x: 70, y: -44, rotate: 8, scale: 0.88, autoAlpha: 0, zIndex: N - pos };
    }
    function layout(animate, dir, prev) {
      cards.forEach(function (c, i) {
        var p = pose(i);
        if (!animate || reduce) { gsap.set(c, p); return; }
        if (dir === 1 && i === prev) {
          gsap.timeline().set(c, { zIndex: N + 1 }).to(c, { x: -170, rotate: -11, autoAlpha: 0, duration: 0.5, ease: 'power3.in' }).set(c, p);
        } else if (dir === -1 && i === cur) {
          gsap.fromTo(c, { x: -170, rotate: -11, autoAlpha: 0, zIndex: N + 1 }, Object.assign({}, p, { zIndex: N, duration: 0.7, ease: 'expo.out' }));
        } else {
          gsap.to(c, Object.assign({}, p, { duration: 0.8, ease: 'expo.out', overwrite: true }));
        }
      });
      idxEl.textContent = String(cur + 1);
    }
    function go(dir) { var prev = cur; cur = (cur + dir + N) % N; layout(true, dir, prev); }
    layout(false);
    $('#revNext').addEventListener('click', function () { go(1); restart(); });
    $('#revPrev').addEventListener('click', function () { go(-1); restart(); });
    var sx = 0, down = false;
    deck.addEventListener('pointerdown', function (e) { down = true; sx = e.clientX; });
    window.addEventListener('pointerup', function (e) {
      if (!down) return; down = false;
      var dx = e.clientX - sx; if (Math.abs(dx) > 60) { go(dx < 0 ? 1 : -1); restart(); }
    });
    deck.addEventListener('mouseenter', function () { hovering = true; });
    deck.addEventListener('mouseleave', function () { hovering = false; });
    function restart() { clearInterval(timer); if (!reduce) timer = setInterval(function () { if (!hovering && !document.hidden) go(1); }, 7000); }
    var io = new IntersectionObserver(function (en) { en[0].isIntersecting ? restart() : clearInterval(timer); }, { threshold: 0.3 });
    io.observe(deck);
    if (!reduce) gsap.from(cards[0], { y: 80, autoAlpha: 0, rotate: 4, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: deck, start: 'top 85%', once: true } });
  });

  /* ---------- FAQ ---------- */
  safe('faq', function () {
    $$('.qa').forEach(function (qa) {
      var btn = $('.qa__q', qa);
      btn.addEventListener('click', function () {
        var open = qa.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        setTimeout(function () { ScrollTrigger.refresh(); }, 700);
      });
    });
  });

  /* ---------- Horaires : jour en cours + statut ---------- */
  safe('hours', function () {
    var H = { 1: [[540, 750], [810, 1140]], 2: [[540, 750], [810, 1140]], 3: [[540, 750], [810, 1140]], 4: [[540, 750], [810, 1140]], 5: [[540, 750], [810, 1140]], 6: [[510, 750]], 0: [] };
    var names = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    var map = { dim: 0, lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6 };
    var parts = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    var get = function (t) { return parts.filter(function (p) { return p.type === t; })[0].value; };
    var day = map[get('weekday').toLowerCase().slice(0, 3)];
    var now = parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10);
    var t = function (m) { var h = Math.floor(m / 60), r = m % 60; return h + 'h' + (r ? String(r).padStart(2, '0') : ''); };
    var li = $('.hours__list li[data-d="' + day + '"]'); if (li) li.classList.add('is-today');
    var status = $('#hoursStatus');
    var openNow = H[day].filter(function (r) { return now >= r[0] && now < r[1]; })[0];
    if (openNow) { status.textContent = 'Ouvert · jusqu’à ' + t(openNow[1]); status.classList.add('is-open'); return; }
    for (var i = 0; i < 8; i++) {
      var d = (day + i) % 7;
      var next = H[d].filter(function (r) { return i > 0 || r[0] > now; })[0];
      if (next) {
        status.textContent = 'Fermé · ouvre ' + (i === 0 ? 'à ' + t(next[0]) : i === 1 ? 'demain à ' + t(next[0]) : names[d] + ' à ' + t(next[0]));
        return;
      }
    }
  });

  /* ---------- Barre flottante mobile ---------- */
  safe('fab', function () {
    var fab = $('#fab'); if (!fab) return;
    ScrollTrigger.create({ trigger: '.hero', start: 'bottom 35%', endTrigger: '.footer', end: 'top 85%', onToggle: function (s) { fab.classList.toggle('is-on', s.isActive); } });
  });

  /* ---------- Démarrage ---------- */
  safe('reveals', revealOnScroll);

  function start() {
    safe('loader', runLoader);
    ScrollTrigger.refresh();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
