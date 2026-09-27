/* occam listing renderer for occamlang.org
 *
 * Turns <pre class="occam"> blocks into highlighted, foldable listings.
 *
 * Fold markers follow the Inmos TDS / origami convention:
 *   {{{ title      opens a fold (shown open)
 *   {{{! title     opens a fold that starts closed
 *   }}}            closes the innermost fold
 * A closed fold renders as "... title"; click it to open.
 *
 * All occam reserved words are upper case, so keyword detection is exact.
 * In "hand" listing mode the CSS lower-cases and underlines them, as in
 * hand-written lecture notes.
 */
(function () {
  "use strict";

  var KEYWORDS = (
    "AFTER ALT AND ANY AT BITAND BITNOT BITOR BOOL BYTE CASE CHAN DATA ELSE FALSE FOR FROM " +
    "FUNCTION IF INLINE INT INT16 INT32 INT64 IS MINUS MOSTNEG MOSTPOS NOT OF OR PACKED PAR " +
    "PLACE PLACED PLUS PORT PRI PROC PROCESSOR PROTOCOL REAL32 REAL64 RECORD REM RESHAPES RESULT " +
    "RETYPES ROUND SEQ SIZE SKIP STOP TIMER TIMES TRUE TRUNC TYPE VAL VALOF WHILE WORKSPACE VECSPACE " +
    // occam-pi / KRoC extensions
    "BARRIER CLAIM DYNAMIC EXTENDS FORK FORKING MOBILE REC RECURSIVE SHARED SYNC INITIAL RESIGN " +
    "ENROLL CLONE DEFINED BYTESIN OFFSETOF"
  ).split(" ");
  var KW = Object.create(null);
  KEYWORDS.forEach(function (k) { KW[k] = true; });

  var TOKEN = new RegExp(
    [
      "(--.*$)",                                   // 1 comment
      '("(?:[^"*]|\\*.)*"?)',                        // 2 string
      "('(?:[^'*]|\\*.)')",                          // 3 character
      "(#[0-9A-F]+\\b|\\b\\d+(?:\\.\\d+(?:E[+-]?\\d+)?)?\\b)", // 4 number
      "(#[A-Z]+\\b)",                                // 5 pre-processor directive
      "([A-Za-z][A-Za-z0-9.]*)",                     // 6 identifier / keyword
      "(:=|!|\\?)"                                   // 7 communication / assignment
    ].join("|"),
    "g"
  );

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlightLine(line) {
    var out = "", last = 0, m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(line))) {
      out += esc(line.slice(last, m.index));
      var t = esc(m[0]), cls = null;
      if (m[1]) cls = "com";
      else if (m[2] || m[3]) cls = "str";
      else if (m[4]) cls = "num";
      else if (m[5]) cls = "pp";
      else if (m[6]) cls = KW[m[6]] ? "kw" : null;
      else if (m[7]) cls = "op";
      out += cls ? '<span class="' + cls + '">' + t + "</span>" : t;
      last = TOKEN.lastIndex;
      if (m[0].length === 0) TOKEN.lastIndex++;
    }
    return out + esc(line.slice(last));
  }

  function dedent(lines) {
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    var min = Infinity;
    lines.forEach(function (l) {
      if (l.trim()) min = Math.min(min, l.match(/^ */)[0].length);
    });
    if (!isFinite(min)) min = 0;
    return lines.map(function (l) { return l.slice(min); });
  }

  var OPEN = /^(\s*)\{\{\{(!?)\s?(.*)$/;
  var CLOSE = /^\s*\}\}\}\s*$/;

  // Render lines to HTML, returning also the plain source (fold markers removed)
  function render(lines) {
    var html = "", plain = [], depth = 0;
    lines.forEach(function (line) {
      var o = line.match(OPEN);
      if (o) {
        depth++;
        html +=
          '<span class="cf' + (o[2] ? " closed" : "") + '">' +
          '<span class="cf-head" role="button" tabindex="0" aria-expanded="' + (o[2] ? "false" : "true") + '">' +
          o[1] + '<span class="cf-mark"></span>' + esc(o[3]) + "\n</span>" +
          '<span class="cf-body">';
        if (o[3]) plain.push(o[1] + "-- " + o[3]);
        return;
      }
      if (CLOSE.test(line) && depth > 0) {
        depth--;
        html += '</span><span class="cf-tail">' + line.replace(/\S.*/, "") + "}}}\n</span></span>";
        return;
      }
      html += highlightLine(line) + "\n";
      plain.push(line);
    });
    while (depth-- > 0) html += "</span></span>";
    return { html: html.replace(/\n$/, ""), plain: plain.join("\n") };
  }

  function toggle(head) {
    var f = head.parentNode;
    var closed = f.classList.toggle("closed");
    head.setAttribute("aria-expanded", closed ? "false" : "true");
  }

  function enhance(pre) {
    if (pre.dataset.rendered) return;
    var lines = dedent(pre.textContent.replace(/\r/g, "").replace(/\t/g, "  ").split("\n"));
    var r = render(lines);
    pre.innerHTML = r.html;
    pre.dataset.rendered = "1";
    pre._plain = r.plain;
    pre.setAttribute("tabindex", "0");

    pre.addEventListener("click", function (e) {
      var h = e.target.closest(".cf-head");
      if (h && pre.contains(h)) toggle(h);
    });
    pre.addEventListener("keydown", function (e) {
      var h = e.target.closest && e.target.closest(".cf-head");
      if (h && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggle(h); }
    });

    if (navigator.clipboard && !pre.hasAttribute("data-nocopy")) {
      var b = document.createElement("button");
      b.className = "btn small ghost copy-btn";
      b.type = "button";
      b.textContent = "copy";
      b.addEventListener("click", function () {
        navigator.clipboard.writeText(pre._plain).then(function () {
          b.textContent = "copied";
          setTimeout(function () { b.textContent = "copy"; }, 1400);
        });
      });
      var holder = document.createElement("div");
      holder.className = "copy-holder";
      pre.parentNode.insertBefore(holder, pre);
      holder.appendChild(b);
      holder.appendChild(pre);
    }
  }

  window.OccamListing = {
    enhance: enhance,
    highlightLine: highlightLine,
    all: function (root) {
      (root || document).querySelectorAll("pre.occam").forEach(enhance);
    }
  };
})();
