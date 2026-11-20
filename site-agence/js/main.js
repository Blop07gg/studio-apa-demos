/* Studio APA — scripts du site (vanilla, sans dépendance) */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var euro = function (n) {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' €';
  };

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('menu');
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ---------- Année du pied de page ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Apparition au scroll ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Calculateur de devis ---------- */
  var calc = document.getElementById('calc-form');
  if (calc) {
    var linesEl = document.getElementById('quote-lines');
    var totalEl = document.getElementById('quote-total');
    var depositEl = document.getElementById('quote-deposit');
    var monthlyRow = document.getElementById('quote-monthly-row');
    var monthlyEl = document.getElementById('quote-monthly');
    var dateEl = document.getElementById('quote-date');
    var sendBtn = document.getElementById('quote-send');
    var shownTotal = 0;
    var rafId = null;

    if (dateEl) {
      dateEl.textContent = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    }

    var selection = function () {
      var items = [];
      calc.querySelectorAll('input[name="pack"]:checked, input[name="option"]:checked').forEach(function (input) {
        items.push({ key: input.value, label: input.dataset.label, price: Number(input.dataset.price) });
      });
      var m = calc.querySelector('input[name="maintenance"]');
      return { items: items, monthly: m && m.checked ? Number(m.dataset.price) : 0 };
    };

    var renderLines = function (items) {
      var wanted = items.map(function (i) { return i.key; });
      // retire les lignes décochées (avec une courte animation)
      linesEl.querySelectorAll('.quote-line').forEach(function (li) {
        if (wanted.indexOf(li.dataset.key) === -1 && !li.classList.contains('is-leaving')) {
          if (reduceMotion) { li.remove(); return; }
          li.classList.add('is-leaving');
          li.addEventListener('animationend', function () { li.remove(); }, { once: true });
        }
      });
      // ajoute les nouvelles lignes, dans l'ordre du formulaire
      items.forEach(function (item, index) {
        var existing = linesEl.querySelector('.quote-line[data-key="' + item.key + '"]:not(.is-leaving)');
        if (existing) return;
        var li = document.createElement('li');
        li.className = 'quote-line';
        li.dataset.key = item.key;
        li.innerHTML = '<span class="label"></span><span class="leader" aria-hidden="true"></span><span class="amount"></span>';
        li.querySelector('.label').textContent = item.label;
        li.querySelector('.amount').textContent = euro(item.price);
        // les formules remplacent la formule précédente en tête de liste
        var current = linesEl.querySelectorAll('.quote-line:not(.is-leaving)');
        var before = current[index] || null;
        linesEl.insertBefore(li, before);
      });
    };

    var animateTotal = function (target) {
      if (rafId) cancelAnimationFrame(rafId);
      if (reduceMotion) { shownTotal = target; totalEl.textContent = euro(target); return; }
      var start = shownTotal;
      var t0 = performance.now();
      var dur = 450;
      var step = function (now) {
        var p = Math.min(1, (now - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        shownTotal = Math.round(start + (target - start) * eased);
        totalEl.textContent = euro(shownTotal);
        if (p < 1) rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
      totalEl.classList.remove('bump');
      void totalEl.offsetWidth; // relance l'animation
      totalEl.classList.add('bump');
    };

    var update = function (animate) {
      var sel = selection();
      var total = sel.items.reduce(function (sum, i) { return sum + i.price; }, 0);
      renderLines(sel.items);
      if (animate) {
        animateTotal(total);
      } else {
        shownTotal = total;
        totalEl.textContent = euro(total);
      }
      depositEl.textContent = euro(Math.ceil(total / 2));
      monthlyRow.hidden = !sel.monthly;
      monthlyEl.textContent = euro(sel.monthly) + ' / mois';
      calc.dataset.summary = sel.items.map(function (i) { return '- ' + i.label + ' : ' + euro(i.price); }).join('\n') +
        (sel.monthly ? '\n- Maintenance : ' + euro(sel.monthly) + ' / mois' : '') +
        '\nTotal estimé : ' + euro(total);
    };

    calc.addEventListener('change', function () { update(true); });
    update(false);

    // « Envoyer cette demande » : pré-remplit le message du formulaire de contact
    if (sendBtn) {
      sendBtn.addEventListener('click', function () {
        var msg = document.getElementById('message');
        if (msg) {
          var intro = 'Bonjour, je souhaite un devis pour :\n' + calc.dataset.summary + '\n\nMon activité : ';
          if (!msg.value.trim() || msg.value.indexOf('Bonjour, je souhaite un devis pour') === 0) {
            msg.value = intro;
          }
          setTimeout(function () { msg.focus({ preventScroll: true }); }, reduceMotion ? 0 : 600);
        }
      });
    }
  }

  /* ---------- Formulaire de contact (Netlify Forms) ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('form-status');
    var rules = [
      { id: 'nom', test: function (v) { return v.trim().length > 1; }, msg: 'Indiquez votre nom.' },
      { id: 'email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'Indiquez une adresse email valide, par exemple nom@domaine.fr.' },
      { id: 'message', test: function (v) { return v.trim().length > 9; }, msg: 'Écrivez quelques mots sur votre projet (10 caractères minimum).' },
      { id: 'rgpd', check: true, msg: 'Cochez cette case pour que nous puissions vous répondre.' }
    ];

    var validate = function () {
      var firstInvalid = null;
      rules.forEach(function (r) {
        var el = document.getElementById(r.id);
        var ok = r.check ? el.checked : r.test(el.value);
        el.setAttribute('aria-invalid', String(!ok));
        document.getElementById(r.id + '-err').textContent = ok ? '' : r.msg;
        if (!ok && !firstInvalid) firstInvalid = el;
      });
      return firstInvalid;
    };

    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true') validate();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var invalid = validate();
      if (invalid) { invalid.focus(); return; }

      if (form.dataset.demo === 'true') {
        status.className = 'form-status is-ok';
        status.textContent = 'Version de démonstration : le formulaire est valide, mais l’envoi ne sera actif qu’une fois le site en ligne sur Netlify.';
        status.hidden = false;
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Envoi en cours…';
      status.hidden = true;

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        status.className = 'form-status is-ok';
        status.textContent = 'Message envoyé. On vous répond rapidement, par email ou par téléphone.';
      }).catch(function () {
        status.className = 'form-status is-error';
        status.textContent = 'Le message n’a pas pu être envoyé. Réessayez dans un instant, ou écrivez-nous directement par email.';
      }).then(function () {
        status.hidden = false;
        btn.disabled = false;
        btn.textContent = 'Envoyer ma demande';
      });
    });
  }
})();
