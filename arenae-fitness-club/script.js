/* Arenae Fitness Club : interactions
   Source unique du planning : le HTML de la section #planning. */
(function () {
  "use strict";

  /* ---------- Menu mobile ---------- */
  var burger = document.querySelector(".top__burger");
  var nav = document.getElementById("menu");
  function fermerMenu() {
    nav.classList.remove("is-ouvert");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  burger.addEventListener("click", function () {
    var ouvert = burger.getAttribute("aria-expanded") === "true";
    if (ouvert) { fermerMenu(); return; }
    nav.classList.add("is-ouvert");
    burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) fermerMenu(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") { fermerMenu(); burger.focus(); }
  });
  window.matchMedia("(min-width: 1100px)").addEventListener("change", fermerMenu);

  /* ---------- Heure de Paris ---------- */
  function maintenantParis() {
    var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    var jours = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { jour: jours[o.weekday], minutes: parseInt(o.hour, 10) * 60 + parseInt(o.minute, 10) };
  }
  var NOMS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  function enMinutes(hhmm) { var p = hhmm.split(":"); return +p[0] * 60 + +p[1]; }
  function quand(decalage, jour) {
    if (decalage === 0) return "aujourd'hui";
    if (decalage === 1) return "demain";
    return NOMS[jour];
  }

  var now = maintenantParis();

  /* ---------- Statuts (hero) ---------- */
  var elSalle = document.querySelector("[data-statut-salle]");
  var elAccueil = document.querySelector("[data-statut-accueil]");
  var elProchain = document.querySelector("[data-prochain-cours]");

  var salleOuverte = now.minutes >= 360 && now.minutes < 1380;
  elSalle.innerHTML = salleOuverte
    ? '<span class="point" aria-hidden="true"></span>Ouverte, jusqu\'à 23\u00a0h'
    : '<span class="point point--ferme" aria-hidden="true"></span>Fermée, ouvre à 6\u00a0h';

  // Accueil : lundi au vendredi, 10:00-12:30 et 16:00-19:30
  var plages = [[600, 750], [960, 1170]];
  function texteAccueil() {
    var ouvre = now.jour >= 1 && now.jour <= 5;
    if (ouvre) {
      for (var i = 0; i < plages.length; i++) {
        if (now.minutes >= plages[i][0] && now.minutes < plages[i][1]) {
          return '<span class="point" aria-hidden="true"></span>Ouvert, jusqu\'à ' + (i === 0 ? "12\u00a0h\u00a030" : "19\u00a0h\u00a030");
        }
        if (now.minutes < plages[i][0]) {
          return '<span class="point point--ferme" aria-hidden="true"></span>Fermé, rouvre à ' + (i === 0 ? "10\u00a0h" : "16\u00a0h");
        }
      }
    }
    for (var d = 1; d <= 7; d++) {
      var j = (now.jour + d) % 7;
      if (j >= 1 && j <= 5) return '<span class="point point--ferme" aria-hidden="true"></span>Fermé, rouvre ' + quand(d, j) + " à 10\u00a0h";
    }
    return "";
  }
  elAccueil.innerHTML = texteAccueil();

  /* ---------- Planning ---------- */
  var jours = Array.prototype.slice.call(document.querySelectorAll(".jour"));
  var onglets = Array.prototype.slice.call(document.querySelectorAll(".jours__btn"));
  var filtres = Array.prototype.slice.call(document.querySelectorAll(".filtre"));
  var vide = document.querySelector(".planning__vide");
  var filtreActif = "tous";

  function jourEl(n) { return document.getElementById("jour-" + n); }
  function ongletEl(n) { return document.getElementById("tab-" + n); }

  // Aujourd'hui
  jourEl(now.jour).classList.add("is-aujourdhui");
  ongletEl(now.jour).classList.add("is-aujourdhui");
  ongletEl(now.jour).setAttribute("aria-label", NOMS[now.jour] + ", aujourd'hui");

  // Cours passés du jour + prochain cours (sur 7 jours)
  var prochain = null;
  jourEl(now.jour).querySelectorAll("li").forEach(function (li) {
    if (enMinutes(li.querySelector("time").textContent) < now.minutes) li.classList.add("is-passe");
  });
  for (var d = 0; d < 7 && !prochain; d++) {
    var j = (now.jour + d) % 7;
    var items = jourEl(j).querySelectorAll("li");
    for (var k = 0; k < items.length; k++) {
      if (d > 0 || enMinutes(items[k].querySelector("time").textContent) >= now.minutes) {
        prochain = { li: items[k], decalage: d, jour: j };
        break;
      }
    }
  }
  if (prochain) {
    prochain.li.classList.add("is-prochain");
    var nom = prochain.li.querySelector("span").textContent;
    var heure = prochain.li.querySelector("time").textContent;
    elProchain.textContent = nom + ", " + quand(prochain.decalage, prochain.jour) + " à " + heure;
  }

  // Onglets (mobile)
  function choisirJour(n, focus) {
    onglets.forEach(function (b) {
      var actif = b.id === "tab-" + n;
      b.setAttribute("aria-selected", actif ? "true" : "false");
      b.tabIndex = actif ? 0 : -1;
      if (actif && focus) b.focus();
    });
    jours.forEach(function (a) { a.classList.toggle("is-actif", a.id === "jour-" + n); });
    majVide();
  }
  onglets.forEach(function (b, i) {
    b.addEventListener("click", function () { choisirJour(b.id.slice(4)); });
    b.addEventListener("keydown", function (e) {
      var cible = null;
      if (e.key === "ArrowRight") cible = onglets[(i + 1) % onglets.length];
      if (e.key === "ArrowLeft") cible = onglets[(i - 1 + onglets.length) % onglets.length];
      if (e.key === "Home") cible = onglets[0];
      if (e.key === "End") cible = onglets[onglets.length - 1];
      if (cible) { e.preventDefault(); choisirJour(cible.id.slice(4), true); }
    });
  });
  choisirJour(prochain ? prochain.jour : now.jour);

  // Filtres
  function majVide() {
    var actif = document.querySelector(".jour.is-actif");
    var reste = actif && actif.querySelectorAll("li:not(.is-cache)").length;
    vide.hidden = !!reste || filtreActif === "tous";
  }
  function appliquerFiltre(f) {
    filtreActif = f;
    filtres.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-filtre") === f ? "true" : "false"); });
    jours.forEach(function (a) {
      var n = 0;
      a.querySelectorAll("li").forEach(function (li) {
        var garde = f === "tous" || li.getAttribute("data-cours") === f;
        li.classList.toggle("is-cache", !garde);
        if (garde) n++;
      });
      var msg = a.querySelector(".jour__vide");
      if (!n && !msg) {
        msg = document.createElement("p");
        msg.className = "jour__vide";
        msg.textContent = "Pas de cours";
        a.appendChild(msg);
      }
      if (msg) msg.hidden = n > 0;
    });
    // Sur mobile : si le jour affiché n'a plus de cours, aller au prochain jour qui en a un
    var actif = document.querySelector(".jour.is-actif");
    if (f !== "tous" && actif && !actif.querySelector("li:not(.is-cache)")) {
      var depart = +actif.getAttribute("data-jour");
      for (var s = 1; s < 7; s++) {
        var jj = (depart + s) % 7;
        if (jourEl(jj).querySelector("li:not(.is-cache)")) { choisirJour(jj); break; }
      }
    }
    majVide();
  }
  filtres.forEach(function (b) {
    b.addEventListener("click", function () { appliquerFiltre(b.getAttribute("data-filtre")); });
  });

  /* ---------- Cours : créneaux lus dans le planning ---------- */
  var ordre = [1, 2, 3, 4, 5, 6, 0];
  document.querySelectorAll(".c").forEach(function (c) {
    var code = c.getAttribute("data-cours");
    var morceaux = [];
    ordre.forEach(function (n) {
      var heures = [];
      jourEl(n).querySelectorAll('li[data-cours="' + code + '"] time').forEach(function (t) { heures.push(t.textContent); });
      if (heures.length) morceaux.push(NOMS[n] + " " + heures.join(" et "));
    });
    var cible = c.querySelector("[data-creneaux]");
    if (cible && morceaux.length) {
      var txt = morceaux.join(", ");
      cible.textContent = "Au planning : " + txt.charAt(0).toUpperCase() + txt.slice(1) + ".";
    }
  });
  document.querySelectorAll(".lien-planning").forEach(function (b) {
    b.addEventListener("click", function () {
      appliquerFiltre(b.getAttribute("data-voir"));
      document.getElementById("planning").scrollIntoView();
      var f = document.querySelector('.filtre[data-filtre="' + b.getAttribute("data-voir") + '"]');
      if (f) f.focus({ preventScroll: true });
    });
  });

  /* ---------- Coachs : fiches ---------- */
  document.querySelectorAll(".membre").forEach(function (b) {
    var dlg = document.getElementById(b.getAttribute("data-dialog"));
    b.setAttribute("aria-haspopup", "dialog");
    b.addEventListener("click", function () {
      if (typeof dlg.showModal === "function") dlg.showModal();
      else dlg.setAttribute("open", "");
    });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("close", function () { b.focus(); });
  });

  /* ---------- Formulaire ---------- */
  var form = document.getElementById("form-contact");
  var retour = form.querySelector(".form__retour");
  var regles = [
    { champ: "f-nom", err: "e-nom", ok: function (el) { return el.value.trim().length > 1; } },
    { champ: "f-mail", err: "e-mail", ok: function (el) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()); } },
    { champ: "f-msg", err: "e-msg", ok: function (el) { return el.value.trim().length > 0; } },
    { champ: "f-rgpd", err: "e-rgpd", ok: function (el) { return el.checked; } }
  ];
  function verifier(r) {
    var el = document.getElementById(r.champ);
    var err = document.getElementById(r.err);
    var ok = r.ok(el);
    el.setAttribute("aria-invalid", ok ? "false" : "true");
    if (ok) el.removeAttribute("aria-describedby"); else el.setAttribute("aria-describedby", r.err);
    err.hidden = ok;
    return ok;
  }
  regles.forEach(function (r) {
    var el = document.getElementById(r.champ);
    // Pendant la frappe (et pas au blur) : sinon l'erreur disparaît au moment du clic suivant,
    // la mise en page remonte et le clic tombe à côté.
    el.addEventListener(el.type === "checkbox" ? "change" : "input", function () {
      if (el.getAttribute("aria-invalid") !== null) verifier(r);
    });
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var premier = null;
    regles.forEach(function (r) { if (!verifier(r) && !premier) premier = document.getElementById(r.champ); });
    if (premier) { premier.focus(); retour.hidden = true; return; }
    // Maquette : aucun envoi réel. À brancher (Netlify Forms ou Formspree) avant la mise en ligne.
    retour.innerHTML = 'Maquette de démonstration : le message n\'a pas été envoyé. Pour joindre le club, appelez le <a href="tel:+33966825226">09 66 82 52 26</a>.';
    retour.hidden = false;
    retour.focus();
  });
})();
