(function () {
  "use strict";
  var S = window.SITE;
  var root = document.documentElement;
  var LANG = root.lang === "en" ? "en" : "ar";
  var T = S.i18n[LANG];
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $$(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }
  function L(o) { return o == null ? "" : (typeof o === "string" ? o : (o[LANG] != null ? o[LANG] : o.ar)); }
  function t(k) { return T[k] != null ? T[k] : ""; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function waLink(text) { return "https://wa.me/" + S.contact.whatsapp + (text ? "?text=" + encodeURIComponent(text) : ""); }
  function storeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // ---------- Text ----------
  function applyText() {
    var brand = L(S.brand.name);
    document.title = t("title").replace("{brand}", brand);
    $$("[data-i18n]").forEach(function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
    $$("[data-i18n-aria]").forEach(function (el) { el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria"))); });
    $$("[data-i18n-ph]").forEach(function (el) { el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"))); });
    $$(".js-brand").forEach(function (el) { el.textContent = brand; });
    $$(".js-tagline").forEach(function (el) { el.textContent = L(S.brand.tagline); });
    $(".brand").setAttribute("aria-label", brand);
    $(".nav").setAttribute("aria-label", t("menu"));
    $(".founder-photo").alt = t("founder_name");
    $(".prod-shot img").alt = t("prod_title");

    var lang = $("#lang-btn");
    lang.href = LANG === "en" ? location.pathname : "?lang=en";
    lang.setAttribute("lang", LANG === "en" ? "ar" : "en");

    var c = S.contact;
    $$(".js-wa").forEach(function (a) { a.href = waLink(a.getAttribute("data-wa") ? t(a.getAttribute("data-wa")) : t("wa_hello")); });
    $$(".js-phone").forEach(function (a) { a.textContent = c.phoneDisplay; });
    $$(".js-email").forEach(function (a) { a.href = "mailto:" + c.email; a.textContent = c.email; });
    $$(".js-linkedin").forEach(function (a) { a.href = c.linkedin; });
    $$(".js-founder-site").forEach(function (a) { a.href = c.founderSite + (LANG === "en" ? "/?lang=en" : ""); });
    $$(".js-city").forEach(function (el) { el.textContent = L(c.city); });
    if (c.bookingUrl) { $("#book-direct").hidden = false; $("#booking-url").href = c.bookingUrl; }
    $("#year").textContent = new Date().getFullYear();
  }

  // ---------- Sections ----------
  function renderProof() {
    $("#proof").innerHTML = S.proof.map(function (p) {
      return "<div><dt>" + esc(L(p.value)) + "</dt><dd>" + esc(L(p.text)) + "</dd></div>";
    }).join("");
  }

  function renderSituations() {
    var head = '<div class="sit-row sit-head" role="row"><span role="columnheader">' + esc(t("sit_now")) + '</span><span role="columnheader">' + esc(t("sit_after")) + "</span></div>";
    $("#sit").innerHTML = head + S.situations.map(function (s) {
      return '<div class="sit-row" role="row">' +
        '<p class="sit-now" role="cell"><span class="sit-label">' + esc(t("sit_now")) + "</span>" + esc(L(s.now)) + "</p>" +
        '<p class="sit-after" role="cell"><span class="sit-label">' + esc(t("sit_after")) + "</span>" + esc(L(s.after)) + "</p></div>";
    }).join("");
  }

  function renderServices() {
    $("#svc").innerHTML = S.services.map(function (s) {
      return '<article class="svc" id="svc-' + s.id + '"><div><h3>' + esc(L(s.title)) + '</h3><p class="svc-desc">' + esc(L(s.desc)) + "</p></div>" +
        '<div class="svc-side"><h4>' + esc(t("svc_deliver")) + "</h4><ul>" +
        L(s.deliver).map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul>" +
        '<p class="svc-ex"><span>' + esc(t("svc_example")) + ':</span><a href="#case-' + s.exampleRef + '">' + esc(L(s.example)) + "</a></p></div></article>";
    }).join("");
  }

  function renderWork() {
    $("#work-list").innerHTML = S.work.map(function (w) {
      var link = w.link ? '<a class="case-link" href="' + esc(w.link.href) + '" target="_blank" rel="noopener">' + esc(t(w.link.label)) + "</a>" : "";
      if (!w.img) {
        return '<article class="case case-wide" id="case-' + w.id + '"><div class="case-head"><p class="case-client">' + esc(L(w.client)) + "</p><h3>" + esc(L(w.title)) +
          '</h3><p class="case-result">' + esc(L(w.result)) + '</p></div><div class="case-body"><p class="case-text">' + esc(L(w.text)) + "</p>" + link + "</div></article>";
      }
      return '<article class="case" id="case-' + w.id + '"><figure class="case-shot"><img src="' + esc(w.img) + '" alt="' + esc(L(w.alt)) + '" loading="lazy" decoding="async" width="1400" height="760"></figure>' +
        '<p class="case-client">' + esc(L(w.client)) + "</p><h3>" + esc(L(w.title)) + '</h3><p class="case-result">' + esc(L(w.result)) + "</p>" +
        '<p class="case-text">' + esc(L(w.text)) + "</p>" + link + "</article>";
    }).join("");
  }

  // ---------- Journey map (how we work) ----------
  // Desktop: phases on top, a numbered track with sign-off gates, then one row per lane (what we do / your part / what you receive).
  // Narrow screens: the same stages as a vertical timeline.
  var I_CYCLE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 6.2A5.2 5.2 0 0 0 3.6 4.6M3 9.8a5.2 5.2 0 0 0 9.4 1.6"/><path d="M3.3 2.2v2.6h2.6M12.7 13.8v-2.6h-2.6"/></svg>';
  function phaseName(i) { return t("j_phase") + " " + (t("j_phase_n")[i] || (i + 1)); }

  function renderJourney() {
    var J = S.journey, P = S.phases;
    var phases = '<div class="j-phases" aria-hidden="true">' + P.map(function (p, i) {
      var span = J.filter(function (s) { return s.phase === i; }).length;
      return '<div class="j-phase" style="grid-column: span ' + span + '"><b>' + esc(L(p)) + "</b><small>" + esc(phaseName(i)) + "</small></div>";
    }).join("") + "</div>";
    var lanes = '<div class="j-lanehead" aria-hidden="true"><span></span><span></span><span>' + esc(t("j_we")) + "</span><span>" +
      esc(t("j_you")) + "</span><span>" + esc(t("j_get")) + "</span><span>" + esc(t("j_gate")) + "</span></div>";

    var prev = -1;
    var items = J.map(function (s, i) {
      var first = s.phase !== prev; prev = s.phase;
      var ptag = first ? '<p class="j-ptag"><b>' + esc(L(P[s.phase])) + "</b><span>" + esc(phaseName(s.phase)) + "</span></p>" : "";
      var track = '<div class="j-track" aria-hidden="true"><span class="j-num">' + (i + 1) + "</span>" +
        (s.loop ? '<span class="j-loop"><span>' + esc(t("j_loop")) + "</span></span>" : "") +
        (s.gate ? '<span class="j-diamond j-diamond-track"></span>' : "") +
        (s.ongoing ? '<span class="j-ongoing">' + I_CYCLE + esc(t("j_ongoing")) + "</span>" : "") + "</div>";
      var tag = s.loop ? '<p class="j-mtag j-mtag-loop">' + I_CYCLE + esc(t("j_loop")) + "</p>" :
        s.ongoing ? '<p class="j-mtag">' + I_CYCLE + esc(t("j_ongoing")) + "</p>" : "";
      function cell(cls, key, val) {
        return '<div class="j-cell ' + cls + '"><span class="j-lab">' + esc(t(key)) + "</span><p>" + esc(L(val)) + "</p></div>";
      }
      var gate = s.gate ? '<p class="j-gate"><span class="j-diamond" aria-hidden="true"></span><span><b>' + esc(t("j_gate")) + "</b>" + esc(L(s.gate)) + "</span></p>" :
        '<span class="j-gate j-gate-empty" aria-hidden="true"></span>';
      return '<li class="j-stage' + (first ? " j-first" : "") + '">' + ptag + track +
        '<h3><span class="sr-only">' + esc(t("j_stage")) + " " + (i + 1) + ": </span>" + esc(L(s.title)) + "</h3>" + tag +
        cell("j-we", "j_we", s.we) + cell("j-you", "j_you", s.you) + cell("j-get", "j_get", s.get) + gate + "</li>";
    }).join("");
    $("#journey").innerHTML = phases + lanes + '<ol class="j-stages">' + items + "</ol>";

    $("#eng").innerHTML = S.engagements.map(function (e) {
      return '<div class="eng-item"><h4>' + esc(L(e.title)) + '</h4><span class="eng-terms">' + esc(L(e.terms)) + "</span><p>" + esc(L(e.text)) + "</p></div>";
    }).join("");
  }

  function renderFaq() {
    $("#faq-list").innerHTML = S.faq.map(function (f) {
      return "<details><summary>" + esc(L(f.q)) + "</summary><p>" + esc(L(f.a)) + "</p></details>";
    }).join("");
  }

  // ---------- System map (hero) ----------
  // Scattered inputs (dashed, tilted) flow into one system (the hub lists what it does), which produces ready outputs.
  var NS = "http://www.w3.org/2000/svg";
  var mapMode = null;
  var ICONS = {
    chat: ["M8 1.9a6.1 6.1 0 0 0-5.3 9.1L1.9 14.1l3.2-.8A6.1 6.1 0 1 0 8 1.9Z"],
    sheet: ["M2.5 2.5h11v11h-11Z", "M2.5 6.2h11", "M2.5 9.8h11", "M6.2 2.5v11"],
    receipt: ["M3.5 1.8h9v12.4l-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1Z", "M6 5.2h4", "M6 7.8h4", "M6 10.4h2.4"],
    mail: ["M2 3.5h12v9H2Z", "M2.4 4 8 8.4 13.6 4"],
    bars: ["M2.5 13.5h11", "M4.8 11V8.2", "M8 11V4.8", "M11.2 11V6.6"],
    doc: ["M4 1.6h5.4l3 3v9.8H4Z", "M9.2 1.8v3h3", "M6 9.6l1.6 1.6 2.8-3"],
    bell: ["M8 2.2a3.9 3.9 0 0 0-3.9 3.9v2.8L2.6 11.4h10.8L11.9 8.9V6.1A3.9 3.9 0 0 0 8 2.2Z", "M6.5 13.4a1.5 1.5 0 0 0 3 0"]
  };
  var ICON_IN = ["chat", "sheet", "receipt", "mail"], ICON_OUT = ["bars", "doc", "bell"];

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function chip(parent, cls, label, icon, s) {
    var g = el("g", { "class": cls }, parent);
    var r = el("rect", { rx: s.r, ry: s.r, height: s.h }, g);
    var ig = el("g", { "class": "m-ico" }, g);
    (ICONS[icon] || []).forEach(function (d) { el("path", { d: d }, ig); });
    if (icon === "bell") el("circle", { cx: 12.4, cy: 3.6, r: 2.3, "class": "m-ico-dot" }, ig);
    var tx = el("text", { "class": "m-text", "font-size": s.f, "text-anchor": "middle", "dominant-baseline": "central" }, g);
    tx.textContent = label;
    var tw = Math.ceil(tx.getComputedTextLength());
    var w = s.pad * 2 + s.ico + s.gap + tw;
    r.setAttribute("width", w);
    return { g: g, r: r, tx: tx, ig: ig, tw: tw, w: w, h: s.h, s: s };
  }
  // The icon sits at the reading start of the chip, the label after it
  function place(c, cx, cy, rtl) {
    var s = c.s, left = cx - c.w / 2, right = cx + c.w / 2;
    c.r.setAttribute("x", left); c.r.setAttribute("y", cy - c.h / 2);
    var ix = rtl ? right - s.pad - s.ico : left + s.pad;
    var tc = rtl ? left + s.pad + c.tw / 2 : right - s.pad - c.tw / 2;
    c.ig.setAttribute("transform", "translate(" + ix + " " + (cy - s.ico / 2) + ") scale(" + (s.ico / 16) + ")");
    c.tx.setAttribute("x", tc); c.tx.setAttribute("y", cy + 1);
    c.cx = cx; c.cy = cy;
  }

  function drawMap() {
    var fig = $("#map"), svg = $("#map-svg");
    var narrow = fig.clientWidth < 500;
    var mode = (narrow ? "n" : "w") + LANG;
    if (mode === mapMode) return;
    mapMode = mode;
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var rtl = root.dir === "rtl";
    svg.setAttribute("direction", rtl ? "rtl" : "ltr");
    var ins = t("map_in"), outs = t("map_out"), core = t("map_core");
    var W = narrow ? 360 : 600;
    var s = narrow ? { h: 34, f: 12.5, pad: 10, ico: 14, gap: 6, r: 10 } : { h: 44, f: 16, pad: 15, ico: 18, gap: 9, r: 12 };
    var hs = narrow ? { title: 16, f: 11.5, pad: 14, row: 21, head: 40 } : { title: 21, f: 14.5, pad: 18, row: 27, head: 52 };

    var wires = el("g", {}, svg), dots = el("g", {}, svg), nodes = el("g", {}, svg);

    // Column captions
    var capIn = el("text", { "class": "m-cap", "font-size": narrow ? 12 : 14.5, "dominant-baseline": "central" }, svg);
    capIn.textContent = t("map_cap_in");
    var capOut = el("text", { "class": "m-cap m-cap-out", "font-size": narrow ? 12 : 14.5, "dominant-baseline": "central" }, svg);
    capOut.textContent = t("map_cap_out");

    // Hub: the system, with what it does inside
    var hub = el("g", { "class": "m-hub" }, nodes);
    var ring = el("rect", { "class": "m-hub-ring", rx: 22 }, hub);
    var body = el("rect", { "class": "m-hub-body", rx: 16 }, hub);
    var ht = el("text", { "class": "m-hub-title", "text-anchor": "middle", "dominant-baseline": "central", "font-size": hs.title }, hub);
    ht.textContent = t("map_hub");
    var rule = el("line", { "class": "m-hub-rule" }, hub);
    var rows = core.map(function (label) {
      var ck = el("path", { "class": "m-hub-check", d: "M-3.6 .2-1 2.8 3.8-2.4" }, hub);
      var tx = el("text", { "class": "m-hub-row", "font-size": hs.f, "text-anchor": "start", "dominant-baseline": "central" }, hub);
      tx.textContent = label;
      return { ck: ck, tx: tx, w: tx.getComputedTextLength() };
    });
    var maxRow = Math.max.apply(null, rows.map(function (r) { return r.w; }));
    var hubW = Math.ceil(Math.max(ht.getComputedTextLength() + 48, maxRow + 22 + hs.pad * 2));
    var hubH = hs.head + 8 + core.length * hs.row + 12;

    var inChips = ins.map(function (label, i) { return chip(nodes, "m-chip-in", label, ICON_IN[i], s); });
    var outChips = outs.map(function (label, i) { return chip(nodes, "m-chip-out", label, ICON_OUT[i], s); });

    var paths = [];
    function wire(d, out, delay) {
      var p = el("path", { d: d, "class": "m-wire" + (out ? " m-wire-out" : "") }, wires);
      p.style.setProperty("--delay", delay + "s");
      paths.push({ p: p, out: out });
    }
    // Reading start / end x for a chip hugging the outer edge
    function atStart(c) { return rtl ? W - 6 - c.w / 2 : 6 + c.w / 2; }
    function atEnd(c) { return rtl ? 6 + c.w / 2 : W - 6 - c.w / 2; }
    function innerEdge(c) { return c.cx > W / 2 ? c.cx - c.w / 2 : c.cx + c.w / 2; }

    var hx = W / 2, hy, hubTop, H;

    if (!narrow) {
      // Wide: inputs | hub | outputs, read in the page direction
      H = 392;
      hy = 214; hubTop = hy - hubH / 2;
      capIn.setAttribute("x", rtl ? W - 6 : 6); capIn.setAttribute("y", 14); capIn.setAttribute("text-anchor", "start");
      capOut.setAttribute("x", rtl ? 6 : W - 6); capOut.setAttribute("y", 14); capOut.setAttribute("text-anchor", "end");
      inChips.forEach(function (c, i) { place(c, atStart(c), hy + (i - 1.5) * 92, rtl); });
      outChips.forEach(function (c, i) { place(c, atEnd(c), hy + (i - 1) * 108, rtl); });
      inChips.forEach(function (c, i) {
        var sx = innerEdge(c), ex = rtl ? hx + hubW / 2 : hx - hubW / 2, ey = hubTop + 18 + (hubH - 36) * i / (ins.length - 1), mx = (sx + ex) / 2;
        wire("M" + sx + " " + c.cy + " C" + mx + " " + c.cy + " " + mx + " " + ey + " " + ex + " " + ey, false, i * .12);
      });
      outChips.forEach(function (c, i) {
        var sx = rtl ? hx - hubW / 2 : hx + hubW / 2, sy = hubTop + 24 + (hubH - 48) * i / (outs.length - 1), ex = innerEdge(c), mx = (sx + ex) / 2;
        wire("M" + sx + " " + sy + " C" + mx + " " + sy + " " + mx + " " + c.cy + " " + ex + " " + c.cy, true, 1.05 + i * .12);
      });
    } else {
      // Narrow: inputs in two columns on top, the hub in the middle, outputs below
      capIn.setAttribute("x", hx); capIn.setAttribute("y", 12); capIn.setAttribute("text-anchor", "middle");
      inChips.forEach(function (c, i) {
        var row = Math.floor(i / 2);
        place(c, i % 2 === 0 ? atStart(c) : atEnd(c), 48 + row * 50, rtl);
      });
      var rowsBottom = 48 + 50 + s.h / 2;
      hubTop = rowsBottom + 66; hy = hubTop + hubH / 2;
      // Wires leave each chip's inner side into the gap between the columns, run down, then fan into the hub.
      // Upper chips take the lanes nearer the middle so no wire passes behind a chip.
      var rightIn = Math.min.apply(null, inChips.filter(function (c) { return c.cx > hx; }).map(innerEdge));
      var leftIn = Math.max.apply(null, inChips.filter(function (c) { return c.cx < hx; }).map(innerEdge));
      var gx = (leftIn + rightIn) / 2, gw = rightIn - leftIn;
      inChips.forEach(function (c, i) {
        var right = c.cx > hx, row = Math.floor(i / 2), sgn = right ? 1 : -1;
        var lane = gx + sgn * gw * (row === 0 ? .12 : .32);
        var entry = hx + sgn * hubW * (row === 0 ? .1 : .3);
        var sx = innerEdge(c), rr = 8, down = rowsBottom + 14;
        var d = "M" + sx + " " + c.cy + " H" + (lane + sgn * rr) + " Q" + lane + " " + c.cy + " " + lane + " " + (c.cy + rr) +
          " V" + down + " C" + lane + " " + (down + 30) + " " + entry + " " + (hubTop - 30) + " " + entry + " " + hubTop;
        wire(d, false, i * .12);
      });
      var hubBottom = hubTop + hubH, gap = 8;
      var total = outChips.reduce(function (a, c) { return a + c.w; }, 0) + gap * 2;
      var oy = hubBottom + 66, lastY;
      if (total <= W - 12) {
        place(outChips[0], atStart(outChips[0]), oy, rtl);
        place(outChips[1], hx, oy, rtl);
        place(outChips[2], atEnd(outChips[2]), oy, rtl);
        lastY = oy;
      } else {
        place(outChips[0], atStart(outChips[0]), oy, rtl);
        place(outChips[1], atEnd(outChips[1]), oy, rtl);
        place(outChips[2], hx, oy + 50, rtl);
        lastY = oy + 50;
      }
      outChips.forEach(function (c, i) {
        var sx = c.cx === hx ? hx : hx + (c.cx > hx ? 1 : -1) * hubW * .3;
        var top = c.cy - c.h / 2;
        var d = c.cx === hx ? "M" + sx + " " + hubBottom + " V" + top :
          "M" + sx + " " + hubBottom + " C" + sx + " " + (hubBottom + 34) + " " + c.cx + " " + (top - 30) + " " + c.cx + " " + top;
        wire(d, true, 1.05 + i * .12);
      });
      capOut.setAttribute("x", hx); capOut.setAttribute("y", lastY + s.h / 2 + 22); capOut.setAttribute("text-anchor", "middle");
      H = lastY + s.h / 2 + 38;
    }

    // Lay out the hub now that its centre is known
    var hl = hx - hubW / 2, hr = hx + hubW / 2;
    hubTop = hy - hubH / 2;
    ring.setAttribute("x", hl - 7); ring.setAttribute("y", hubTop - 7); ring.setAttribute("width", hubW + 14); ring.setAttribute("height", hubH + 14);
    body.setAttribute("x", hl); body.setAttribute("y", hubTop); body.setAttribute("width", hubW); body.setAttribute("height", hubH);
    ht.setAttribute("x", hx); ht.setAttribute("y", hubTop + hs.head / 2 + 1);
    rule.setAttribute("x1", hl + hs.pad); rule.setAttribute("x2", hr - hs.pad);
    rule.setAttribute("y1", hubTop + hs.head); rule.setAttribute("y2", hubTop + hs.head);
    rows.forEach(function (r, i) {
      var y = hubTop + hs.head + 8 + hs.row * (i + .5);
      var cx = rtl ? hr - hs.pad - 6 : hl + hs.pad + 6;
      r.ck.setAttribute("transform", "translate(" + cx + " " + y + ")");
      r.tx.setAttribute("x", rtl ? hr - hs.pad - 20 : hl + hs.pad + 20); r.tx.setAttribute("y", y + 1);
    });

    // Gentle disorder on the inputs, order on the outputs
    inChips.forEach(function (c, i) {
      var tilt = [-2.2, 1.6, -1.2, 2][i % 4];
      c.g.setAttribute("transform", "rotate(" + tilt + " " + c.cx + " " + c.cy + ")");
    });
    outChips.forEach(function (c, i) { c.g.style.setProperty("--delay", (1.45 + i * .12) + "s"); });
    hub.style.setProperty("--delay", ".75s");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);

    paths.forEach(function (o) { o.p.style.setProperty("--len", Math.ceil(o.p.getTotalLength())); });

    if (!reduceMotion) {
      fig.classList.remove("drawing"); void fig.offsetWidth; fig.classList.add("drawing");
      // Signal dots: inputs travel into the hub, then results travel out
      paths.forEach(function (o, i) {
        if (!o.p.id) o.p.id = "w" + i + mode;
        var dot = el("circle", { r: narrow ? 3.4 : 3.8, "class": "m-dot", opacity: 0 }, dots);
        var dur = (o.out ? 2.4 : 2.8) + (i % 3) * .35;
        var begin = (o.out ? 2.2 : 1.6) + i * .45;
        var am = el("animateMotion", { dur: dur + "s", begin: begin + "s", repeatCount: "indefinite", rotate: "auto" }, dot);
        el("mpath", { href: "#" + o.p.id }, am);
        el("set", { attributeName: "opacity", to: 1, begin: begin + "s" }, dot);
      });
    }
  }

  // ---------- Booking ----------
  function fmtTime(hm) {
    var p = hm.split(":"), h = +p[0], m = p[1];
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return LANG === "en" ? h12 + ":" + m + (h < 12 ? " AM" : " PM") : h12 + ":" + m + (h < 12 ? " ص" : " م");
  }
  function renderBooking() {
    var locale = LANG === "en" ? "en-GB" : "ar-SA-u-ca-gregory-nu-latn";
    var wd = new Intl.DateTimeFormat(locale, { weekday: "long" });
    var dm = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" });
    var days = [], d = new Date();
    d.setHours(12, 0, 0, 0);
    while (days.length < S.daysAhead) {
      d.setDate(d.getDate() + 1);
      if (S.workDays.indexOf(d.getDay()) !== -1) days.push(new Date(d));
    }
    $("#days").innerHTML = days.map(function (x, i) {
      var iso = x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
      return '<label class="choice"><input type="radio" name="day" id="day-' + i + '" value="' + iso + '" data-label="' + esc(wd.format(x) + " " + dm.format(x)) + '"><span><b>' + esc(wd.format(x)) + "</b><small>" + esc(dm.format(x)) + "</small></span></label>";
    }).join("");
    $("#times").innerHTML = S.slots.map(function (s, i) {
      return '<label class="choice"><input type="radio" name="time" id="time-' + i + '" value="' + s + '" data-label="' + esc(fmtTime(s)) + '"><span><b>' + esc(fmtTime(s)) + "</b></span></label>";
    }).join("");
    var opts = S.services.map(function (s) { return { v: s.id, label: L(s.title) }; }).concat([{ v: "unsure", label: t("f_service_none") }]);
    $("#services-pick").innerHTML = opts.map(function (o, i) {
      return '<label class="choice"><input type="radio" name="service" id="svc-pick-' + i + '" value="' + esc(o.v) + '" data-label="' + esc(o.label) + '"><span><b>' + esc(o.label) + "</b></span></label>";
    }).join("");
    $("#send-note").textContent = S.contact.formKey ? t("send_note") : t("send_note_mail");
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // Email is required for the main (email) path; WhatsApp only needs the name and the time
  function collect(needEmail) {
    var f = $("#book-form");
    var day = $("input[name=day]:checked", f), time = $("input[name=time]:checked", f), type = $("input[name=type]:checked", f);
    var service = $("input[name=service]:checked", f);
    var name = $("#f-name").value.trim(), email = $("#f-email").value.trim();
    var emailBad = needEmail ? !EMAIL_RE.test(email) : (email !== "" && !EMAIL_RE.test(email));
    $("#err-day").hidden = !!day;
    $("#err-time").hidden = !!time;
    $("#err-name").hidden = !!name; $("#f-name").classList.toggle("invalid", !name);
    $("#err-email").hidden = !emailBad; $("#f-email").classList.toggle("invalid", emailBad);
    if (!day || !time || !name || emailBad) {
      var first = !day ? $("#days input") : !time ? $("#times input") : !name ? $("#f-name") : $("#f-email");
      first.focus();
      return null;
    }
    var typeLabel = type.value === "visit" ? t("f_type_visit") + " (" + t("f_type_visit_sub") + ")" : t("f_type_remote") + " (" + t("f_type_remote_sub") + ")";
    var lines = [t("msg_head"), "", t("msg_name") + ": " + name];
    var company = $("#f-company").value.trim(), phone = $("#f-phone").value.trim(), topic = $("#f-topic").value.trim();
    if (email) lines.push(t("msg_email") + ": " + email);
    if (company) lines.push(t("msg_company") + ": " + company);
    if (service) lines.push(t("msg_service") + ": " + service.getAttribute("data-label"));
    lines.push(t("msg_type") + ": " + typeLabel);
    lines.push(t("msg_when") + ": " + day.getAttribute("data-label") + (LANG === "en" ? ", " : "، ") + time.getAttribute("data-label"));
    if (phone) lines.push(t("msg_phone") + ": " + phone);
    if (topic) lines.push(t("msg_topic") + ": " + topic);
    return { text: lines.join("\n"), name: name, email: email };
  }

  function showSent(text) {
    $("#book-form").hidden = true;
    $("#sent-summary").textContent = text;
    var box = $("#sent");
    box.hidden = false;
    box.focus();
  }

  function sendForm(data) {
    var btn = $("#send-main"), label = $("#send-main-label"), status = $("#form-status");
    btn.disabled = true; btn.setAttribute("aria-busy", "true"); label.textContent = t("sending"); status.hidden = true;
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        access_key: S.contact.formKey,
        subject: t("mail_subject") + ": " + data.name,
        from_name: L(S.brand.name),
        name: data.name,
        email: data.email,
        replyto: data.email,
        message: data.text
      })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.success) throw new Error(j.message || String(r.status)); });
    }).then(function () {
      showSent(data.text);
    }).catch(function () {
      status.textContent = t("send_fail"); status.hidden = false;
    }).then(function () {
      btn.disabled = false; btn.removeAttribute("aria-busy"); label.textContent = t("send_main");
    });
  }

  function bindBooking() {
    var f = $("#book-form");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if ($("#f-botcheck").checked) return;
      var data = collect(true); if (!data) return;
      if (S.contact.formKey) { sendForm(data); return; }
      // No form service configured yet: hand the ready message to the visitor's email app
      location.href = "mailto:" + S.contact.email + "?subject=" + encodeURIComponent(t("mail_subject")) + "&body=" + encodeURIComponent(data.text);
    });
    $("#send-wa").addEventListener("click", function () {
      var data = collect(false); if (!data) return;
      var url = waLink(data.text);
      // "noopener" would make window.open return null and trigger the fallback too
      var w = window.open(url, "_blank");
      if (w) { try { w.opener = null; } catch (err) {} } else location.href = url;
    });
    $("#sent-again").addEventListener("click", function () {
      f.reset();
      $("#sent").hidden = true; f.hidden = false;
      $("#f-name").focus();
    });
    f.addEventListener("change", function (e) {
      if (e.target.name === "day") $("#err-day").hidden = true;
      if (e.target.name === "time") $("#err-time").hidden = true;
    });
    $("#f-name").addEventListener("input", function () {
      if (this.value.trim()) { $("#err-name").hidden = true; this.classList.remove("invalid"); }
    });
    $("#f-email").addEventListener("input", function () {
      if (EMAIL_RE.test(this.value.trim())) { $("#err-email").hidden = true; this.classList.remove("invalid"); }
    });
    $("#copy-email").addEventListener("click", function () {
      var btn = this, done = function () { btn.textContent = t("copied"); setTimeout(function () { btn.textContent = t("copy"); }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(S.contact.email).then(done, function () { selectText($(".js-email")); });
      } else selectText($(".js-email"));
    });
  }
  function selectText(node) {
    var r = document.createRange(); r.selectNodeContents(node);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  // ---------- Chrome ----------
  function bindChrome() {
    var btn = $("#menu-btn"), menu = $("#menu");
    function setMenu(open) {
      menu.hidden = !open; btn.setAttribute("aria-expanded", String(open)); root.classList.toggle("menu-open", open);
    }
    btn.addEventListener("click", function () { setMenu(menu.hidden); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { setMenu(false); btn.focus(); } });

    $("#theme-btn").addEventListener("click", function () {
      var cur = root.getAttribute("data-theme");
      if (!cur) cur = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      var next = cur === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next); storeSet("theme", next);
    });

    // Floating WhatsApp: shown after the hero, hidden over the booking panel
    var fab = $("#wa-float");
    if ("IntersectionObserver" in window) {
      var heroIn = true, bookIn = false;
      var update = function () { fab.hidden = heroIn || bookIn; };
      new IntersectionObserver(function (en) { heroIn = en[0].isIntersecting; update(); }).observe($(".hero"));
      new IntersectionObserver(function (en) { bookIn = en[0].isIntersecting; update(); }, { rootMargin: "0px 0px -30% 0px" }).observe($("#book"));
    }

    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(drawMap, 150); });
  }

  // ---------- Boot ----------
  applyText();
  renderProof();
  renderSituations();
  renderServices();
  renderWork();
  renderJourney();
  renderFaq();
  renderBooking();
  bindBooking();
  bindChrome();
  drawMap();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { mapMode = null; drawMap(); });
})();
