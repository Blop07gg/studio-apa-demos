/* Orvo Studio — JS vanilla, aucune librairie */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = window.matchMedia('(min-width: 900px)');
  var root = document.documentElement;

  /* ---------- En-tête : bordure, barre de lecture, se cache en descendant ---------- */
  var header = document.querySelector('[data-header]');
  var progress = document.querySelector('[data-progress]');
  var hero = document.querySelector('[data-hero]');
  var heroMark = hero && hero.querySelector('.hero__mark');
  var lastY = window.scrollY;
  var ticking = false;
  var menuOpen = false;

  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle('is-scrolled', y > 8);
      // On cache l'en-tête quand on descend, il revient dès qu'on remonte
      var goingDown = y > lastY + 4;
      var goingUp = y < lastY - 4;
      if (!menuOpen && goingDown && y > 480) header.classList.add('is-hidden');
      if (goingUp || y < 480) header.classList.remove('is-hidden');
    }
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty('--p', max > 0 ? Math.min(y / max, 1).toFixed(4) : 0);
    }
    if (heroMark && !reduceMotion && y < window.innerHeight * 1.2) {
      heroMark.style.setProperty('--sy', Math.round(y));
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // Un lien d'ancre ou le focus clavier dans l'en-tête le fait réapparaître
  if (header) {
    header.addEventListener('focusin', function () { header.classList.remove('is-hidden'); });
  }

  /* ---------- Hero : le grand « O » suit doucement la souris ---------- */
  if (hero && heroMark && !reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      heroMark.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      heroMark.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    hero.addEventListener('pointerleave', function () {
      heroMark.style.setProperty('--mx', 0);
      heroMark.style.setProperty('--my', 0);
    });
  }

  /* ---------- Menu burger ---------- */
  var burger = document.querySelector('[data-burger]');
  var menu = document.querySelector('[data-menu]');

  function setMenu(open) {
    if (!burger || !menu) return;
    menuOpen = open;
    burger.setAttribute('aria-expanded', String(open));
    burger.querySelector('.visually-hidden').textContent = open ? 'Fermer le menu' : 'Menu';
    menu.classList.toggle('is-open', open);
    if (open && header) header.classList.remove('is-hidden');
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a') && !desktop.matches) setMenu(false);
    });
    // Toucher en dehors du menu le referme
    document.addEventListener('click', function (e) {
      if (menuOpen && !e.target.closest('[data-header]')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) {
        setMenu(false);
        burger.focus();
      }
    });
    desktop.addEventListener('change', function () { setMenu(false); });
  }

  /* ---------- Menu : le lien de la section en cours est souligné ---------- */
  var navLinks = document.querySelectorAll('.nav__link');
  if ('IntersectionObserver' in window && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = byId[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.remove('is-current'); a.removeAttribute('aria-current'); });
          link.classList.add('is-current');
          link.setAttribute('aria-current', 'true');
        } else if (link.classList.contains('is-current')) {
          link.classList.remove('is-current');
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* ---------- Apparition au scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Services : un seul ouvert à la fois, la scène bleue suit ---------- */
  var svc = document.querySelector('[data-svc]');
  if (svc) {
    var items = svc.querySelectorAll('.svc__item');
    var scenes = svc.querySelectorAll('[data-scene]');
    function openSvc(i) {
      items.forEach(function (it, j) {
        var on = j === i;
        it.classList.toggle('is-active', on);
        it.querySelector('[data-svc-btn]').setAttribute('aria-expanded', String(on));
      });
      scenes.forEach(function (sc, j) { sc.classList.toggle('is-active', j === i); });
    }
    // Clic seulement : l'ouverture au survol faisait bouger la liste sous la souris
    items.forEach(function (it, i) {
      it.querySelector('[data-svc-btn]').addEventListener('click', function () {
        // Un deuxième clic referme le service (sauf sur ordinateur, où la scène a besoin d'un service ouvert)
        if (it.classList.contains('is-active') && !desktop.matches) {
          it.classList.remove('is-active');
          it.querySelector('[data-svc-btn]').setAttribute('aria-expanded', 'false');
        } else {
          openSvc(i);
        }
      });
    });
    // Sur téléphone, tout est fermé au départ : on lit les titres, on ouvre ce qui intéresse
    if (!desktop.matches) {
      items.forEach(function (it) {
        it.classList.remove('is-active');
        it.querySelector('[data-svc-btn]').setAttribute('aria-expanded', 'false');
      });
    }
    // Les scènes se jouent quand on arrive sur la section, et se rejouent à chaque retour
    if (reduceMotion || !('IntersectionObserver' in window)) {
      svc.classList.add('is-playing');
    } else {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) svc.classList.add('is-playing');
          else if (entry.intersectionRatio === 0) svc.classList.remove('is-playing');
        });
      }, { threshold: [0, 0.35] }).observe(svc.querySelector('.svc__stage'));
    }
  }

  /* ---------- Tarifs : formule, options, estimation, simulation dans le formulaire ---------- */
  var offers = document.querySelector('[data-offers]');
  var extras = document.querySelector('[data-extras]');
  if (offers) {
    var offerEls = offers.querySelectorAll('.offer');
    var current = offers.querySelector('.offer.is-selected') || offerEls[0];
    var totalOut = document.querySelector('[data-total]');
    var monthlyOut = document.querySelector('[data-monthly-out]');
    var recapOut = document.querySelector('[data-recap]');
    var optionInputs = extras ? extras.querySelectorAll('.extra__input') : [];
    var maintInputs = document.querySelectorAll('[data-maint] input');
    var typeSelect = document.getElementById('f-type');
    var simBox = document.querySelector('[data-sim]');
    var simField = document.getElementById('f-sim');
    var shownTotal = Number(current.dataset.price);
    var imported = false;

    function fr(n) { return n.toLocaleString('fr-FR').replace(/\s/g, '\u00a0'); } // espace normale (l'espace fine passe mal)
    function euros(n) { return fr(n) + '\u00a0€'; }
    function summary() {
      var s = { total: Number(current.dataset.price), monthly: 0, hasMonthly: false, options: [], monthlyItems: [] };
      optionInputs.forEach(function (o) {
        if (!o.checked) return;
        var v = Number(o.value);
        if (o.hasAttribute('data-monthly')) { s.hasMonthly = true; s.monthly += v; s.monthlyItems.push(o.dataset.name + ' (' + v + ' €/mois)'); }
        else { s.total += v; s.options.push(o.dataset.name + ' (+' + v + ' €)'); }
      });
      // Niveau de maintenance choisi
      maintInputs.forEach(function (m) {
        if (!m.checked) return;
        s.maint = m.dataset.name + ' (' + m.value + ' €/mois)';
        var v = Number(m.value);
        if (v > 0) { s.hasMonthly = true; s.monthly += v; s.monthlyItems.push('Maintenance ' + m.dataset.name + ' (' + v + ' €/mois)'); }
      });
      return s;
    }
    // Texte de la simulation envoyé avec le formulaire
    function simulationText(s) {
      var pad = function (k) { return k + ' : '; };
      var lines = ['SIMULATION DE DEVIS · ORVO STUDIO', ''];
      lines.push(pad('Formule') + current.dataset.name + ' (' + euros(Number(current.dataset.price)) + ')');
      if (s.options.length) { lines.push('Options :'); s.options.forEach(function (o) { lines.push('• ' + o); }); }
      else lines.push(pad('Options') + 'aucune');
      lines.push(pad('Maintenance') + (s.maint || 'Sans maintenance (0 €/mois)'));
      lines.push('');
      lines.push(pad('TOTAL ESTIMÉ') + euros(s.total) + (s.hasMonthly ? ' + ' + s.monthly + ' €/mois' : ''));
      return lines.join('\n');
    }
    // Le total défile jusqu'au nouveau montant
    var anim = null;
    function animateTotal(to) {
      if (anim) cancelAnimationFrame(anim);
      var from = shownTotal; shownTotal = to;
      if (reduceMotion || from === to) { totalOut.textContent = fr(to); return; }
      var start = performance.now();
      (function step(now) {
        var t = Math.min((now - start) / 450, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        totalOut.textContent = fr(Math.round(from + (to - from) * eased));
        if (t < 1) anim = requestAnimationFrame(step);
      })(start);
    }
    function render() {
      var s = summary();
      if (totalOut) animateTotal(s.total);
      if (monthlyOut) { monthlyOut.hidden = !s.hasMonthly; monthlyOut.textContent = ' + ' + s.monthly + ' €/mois'; }
      if (recapOut) recapOut.textContent = [current.dataset.name].concat(s.options, s.monthlyItems).map(function (p) { return p.replace(/ \(.*\)$/, ''); }).join(' · ');
      if (imported && simField) { simField.value = simulationText(s); fitSim(); } // la simulation reste à jour
    }
    function selectOffer(el) {
      current = el;
      offerEls.forEach(function (o) {
        var on = o === el;
        o.classList.toggle('is-selected', on);
        var pick = o.querySelector('.offer__pick');
        if (pick) { pick.textContent = on ? 'Formule choisie' : 'Choisir'; pick.setAttribute('aria-pressed', String(on)); }
      });
      if (typeSelect) typeSelect.value = el.dataset.name;
      render();
    }
    function fitSim() { simField.style.height = 'auto'; simField.style.height = simField.scrollHeight + 4 + 'px'; }
    // La simulation arrive dans le formulaire dès le premier choix du client
    function showSimulation() {
      if (!simBox || !simField) return;
      imported = true;
      simField.value = simulationText(summary());
      if (simBox.hidden) {
        simBox.hidden = false;
        simBox.classList.remove('is-in'); void simBox.offsetWidth; simBox.classList.add('is-in');
      }
      fitSim();
    }
    // « Demander ce devis » : on descend au formulaire et on place le curseur sur « Nom »
    function importSimulation() {
      if (!simBox || !simField) return;
      showSimulation();
      if (typeSelect) typeSelect.value = current.dataset.name;
      setTimeout(function () { var nom = document.getElementById('f-nom'); if (nom) nom.focus({ preventScroll: true }); }, reduceMotion ? 0 : 700);
    }

    offerEls.forEach(function (o) {
      o.addEventListener('click', function () { selectOffer(o); showSimulation(); });
      o.addEventListener('focusin', function () { selectOffer(o); });
      var pick = o.querySelector('.offer__pick');
      if (pick) pick.addEventListener('click', function (e) {
        e.stopPropagation();
        selectOffer(o);
        showSimulation();
        if (extras) extras.scrollIntoView({ block: 'start' });
      });
    });
    optionInputs.forEach(function (o) { o.addEventListener('change', function () { render(); showSimulation(); }); });
    maintInputs.forEach(function (m) { m.addEventListener('change', function () { render(); showSimulation(); }); });
    if (typeSelect) typeSelect.addEventListener('change', function () {
      offerEls.forEach(function (o) { if (o.dataset.name === typeSelect.value) { selectOffer(o); showSimulation(); } });
    });
    var quoteBtn = document.querySelector('[data-quote]');
    if (quoteBtn) quoteBtn.addEventListener('click', importSimulation);
    // « Modifier » : on remonte aux tarifs
    var simEdit = document.querySelector('[data-sim-edit]');
    if (simEdit) simEdit.addEventListener('click', function () { (extras || offers).scrollIntoView({ block: 'start' }); });
    selectOffer(current);
  }

  /* ---------- Formulaire : messages d'erreur clairs ---------- */
  var form = document.querySelector('[data-form]');
  if (form) {
    var submitBtn = form.querySelector('[data-submit]');
    var checks = [
      { id: 'f-nom', ok: function (el) { return el.value.trim() !== ''; } },
      { id: 'f-email', ok: function (el) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()); } },
      { id: 'f-msg', ok: function (el) { return el.value.trim() !== ''; } },
      { id: 'f-rgpd', ok: function (el) { return el.checked; } }
    ];
    function validate(c) {
      var el = document.getElementById(c.id);
      var err = document.getElementById(c.id + '-err');
      var valid = c.ok(el);
      el.setAttribute('aria-invalid', valid ? 'false' : 'true');
      if (valid) { el.removeAttribute('aria-describedby'); } else { el.setAttribute('aria-describedby', c.id + '-err'); }
      err.hidden = valid;
      return valid;
    }
    form.addEventListener('submit', function (e) {
      var firstInvalid = null;
      checks.forEach(function (c) {
        if (!validate(c) && !firstInvalid) firstInvalid = document.getElementById(c.id);
      });
      if (firstInvalid) {
        e.preventDefault();
        firstInvalid.focus();
        if (!reduceMotion && submitBtn) {
          submitBtn.classList.remove('is-shaking');
          void submitBtn.offsetWidth; // relance l'animation
          submitBtn.classList.add('is-shaking');
        }
        return;
      }
      // DÉMO (GitHub Pages) : pas d'envoi réel
      e.preventDefault();
      var note = form.querySelector('.demo-note');
      if (!note) { note = document.createElement('p'); note.className = 'demo-note'; note.setAttribute('role', 'status'); form.appendChild(note); }
      note.textContent = "Ceci est une démo : le formulaire n'envoie rien. Il fonctionnera sur le vrai site.";
      return;
      if (submitBtn) {
        submitBtn.setAttribute('disabled', '');
        submitBtn.firstChild.textContent = 'Envoi en cours…';
      }
    });
    // Si le visiteur revient en arrière depuis la page « merci », le bouton redevient utilisable
    window.addEventListener('pageshow', function () {
      if (submitBtn) {
        submitBtn.removeAttribute('disabled');
        submitBtn.firstChild.textContent = 'Envoyer ma demande';
      }
    });
    checks.forEach(function (c) {
      var el = document.getElementById(c.id);
      // Re-vérifie pendant la saisie (et non au blur) : sinon le message qui disparaît
      // décale la page au moment où l'on clique sur le champ suivant.
      el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', function () {
        if (el.getAttribute('aria-invalid') === 'true') validate(c);
      });
    });
  }
})();
