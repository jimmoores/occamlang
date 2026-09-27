/* occamlang.org — page behaviour: preferences, navigation, folds. */
(function () {
  "use strict";
  var root = document.documentElement;

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // colour theme
  var themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var dark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    store("occam.theme", root.dataset.theme);
  });

  // listing style: Inmos typescript vs hand-written lecture notes
  var listBtn = document.getElementById("listing-toggle");
  function syncListing() {
    if (listBtn) listBtn.setAttribute("aria-pressed", root.dataset.listing === "hand" ? "true" : "false");
  }
  if (listBtn) listBtn.addEventListener("click", function () {
    root.dataset.listing = root.dataset.listing === "hand" ? "inmos" : "hand";
    store("occam.listing", root.dataset.listing);
    syncListing();
  });
  syncListing();

  // mobile menu
  var navBtn = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (navBtn && nav) navBtn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    navBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // fold tools: [data-fold="open"|"close"] buttons act on every .fold in <main>
  document.querySelectorAll("[data-fold]").forEach(function (b) {
    b.addEventListener("click", function () {
      var open = b.getAttribute("data-fold") === "open";
      document.querySelectorAll("main details.fold").forEach(function (d) { d.open = open; });
      document.querySelectorAll("main pre.occam .cf").forEach(function (f) {
        f.classList.toggle("closed", !open);
      });
    });
  });

  // open any folds that enclose the target of a #link
  function reveal() {
    if (!location.hash) return;
    var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!t) return;
    for (var n = t; n; n = n.parentElement) if (n.tagName === "DETAILS") n.open = true;
    t.scrollIntoView();
  }
  window.addEventListener("hashchange", reveal);

  // table-of-contents highlighting
  var tocLinks = document.querySelectorAll(".toc a[href^='#']");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && map[e.target.id]) {
          tocLinks.forEach(function (a) { a.classList.remove("active"); });
          map[e.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
  }

  if (window.OccamListing) OccamListing.all();
  if (window.ProcNet) ProcNet.all();
  reveal();
})();
