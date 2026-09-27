/* Process-network diagrams in the style Peter Welch used to teach occam:
 * boxes are processes, labelled arrows are channels. A process that is itself
 * a network can be opened in place — the diagram equivalent of opening a fold.
 *
 * Markup:
 *   <div class="procnet"><script type="application/json">{ ...net... }</script></div>
 *
 * Net:
 *   { "title": "numbers", "w": 640, "h": 280, "boundary": true, "animate": true,
 *     "caption": "optional text under the diagram",
 *     "nodes": [ { "id": "d", "label": "delta", "sub": "optional", "x": 320, "y": 140,
 *                  "w": 120, "h": 56, "shape": "rect|circle", "href": "page.html",
 *                  "net": { ...nested net... } } ],
 *     "chans": [ { "from": "d" | [x, y], "to": "s" | [x, y], "label": "b",
 *                  "via": [[x, y], ...], "at": [x, y] } ] }
 * Coordinates are node centres in the net's own w × h space.
 */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var uid = 0;

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // Point where the ray from a node's centre towards (tx, ty) leaves its outline.
  function clip(node, tx, ty) {
    var dx = tx - node.x, dy = ty - node.y;
    if (!dx && !dy) return [node.x, node.y];
    if (node.shape === "circle") {
      var r = (node.w || 60) / 2, d = Math.hypot(dx, dy);
      return [node.x + (dx / d) * r, node.y + (dy / d) * r];
    }
    var hw = (node.w || 120) / 2, hh = (node.h || 56) / 2;
    var s = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
    return [node.x + dx * s, node.y + dy * s];
  }

  function draw(net, svg, arrowId) {
    var byId = {};
    net.nodes.forEach(function (n) { byId[n.id] = n; });
    var g = el("g", { class: "stage" }, svg);

    if (net.boundary) {
      el("rect", { class: "boundary", x: 8, y: 8, width: net.w - 16, height: net.h - 16, rx: 6 }, g);
      var bl = el("text", { class: "boundary-label", x: 20, y: 28 }, g);
      bl.textContent = "PROC " + (net.title || "");
    }

    var chanLayer = el("g", {}, g);
    var nodeLayer = el("g", {}, g);

    (net.chans || []).forEach(function (c, i) {
      var pts = (c.via || []).slice();
      var a = typeof c.from === "string" ? byId[c.from] : null;
      var b = typeof c.to === "string" ? byId[c.to] : null;
      var first = pts[0] || (b ? [b.x, b.y] : c.to);
      var start = a ? clip(a, first[0], first[1]) : c.from;
      var lastP = pts[pts.length - 1] || start;
      var end = b ? clip(b, lastP[0], lastP[1]) : c.to;
      // pull the arrow tip back slightly from the box edge
      var all = [start].concat(pts, [end]);
      var p = all[all.length - 2], q = all[all.length - 1];
      var L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
      all[all.length - 1] = [q[0] - ((q[0] - p[0]) / L) * 2, q[1] - ((q[1] - p[1]) / L) * 2];

      var d = "M" + all.map(function (pt) { return pt[0].toFixed(1) + " " + pt[1].toFixed(1); }).join(" L");
      var cg = el("g", { class: "chan" }, chanLayer);
      var path = el("path", { d: d, "marker-end": "url(#" + arrowId + ")" }, cg);

      if (c.label) {
        var lp = c.at, anchor = null;
        if (!lp) {
          // midpoint of the longest segment, nudged off the line
          var best = 0, bi = 0;
          for (var k = 0; k < all.length - 1; k++) {
            var len = Math.hypot(all[k + 1][0] - all[k][0], all[k + 1][1] - all[k][1]);
            if (len > best) { best = len; bi = k; }
          }
          var s0 = all[bi], s1 = all[bi + 1];
          var mx = (s0[0] + s1[0]) / 2, my = (s0[1] + s1[1]) / 2;
          var nx = -(s1[1] - s0[1]) / (best || 1), ny = (s1[0] - s0[0]) / (best || 1);
          if (ny > 0 || (ny === 0 && nx > 0)) { nx = -nx; ny = -ny; } // prefer above / left
          lp = [mx + nx * 12, my + ny * 12];
          // on steep segments the label sits beside the line, not across it
          if (Math.abs(nx) > Math.abs(ny)) { anchor = nx < 0 ? "end" : "start"; lp[0] = mx + nx * 7; }
        }
        var t = el("text", { x: lp[0], y: lp[1], "text-anchor": anchor || "middle" }, cg);
        t.textContent = c.label;
      }

      if (net.animate && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        // hidden until its motion starts, so it never sits at the origin
        var dot = el("circle", { r: 3.5, class: "pulse", visibility: "hidden" }, cg);
        var dur = (2.2 + ((i * 0.37) % 1.4)).toFixed(2) + "s";
        var begin = (i * 0.45).toFixed(2) + "s";
        el("set", { attributeName: "visibility", to: "visible", begin: begin }, dot);
        el("animateMotion", { dur: dur, repeatCount: "indefinite", path: d, begin: begin,
          keyPoints: "0;1;1", keyTimes: "0;0.6;1", calcMode: "linear" }, dot);
      }
      path.setAttribute("data-i", i);
    });

    net.nodes.forEach(function (n) {
      var cls = "proc" + (n.net ? " nested clickable" : "") + (n.href && !n.net ? " clickable" : "");
      var ng = el("g", { class: cls, "data-id": n.id }, nodeLayer);
      var w = n.w || 120, h = n.h || 56;
      if (n.shape === "circle") el("circle", { cx: n.x, cy: n.y, r: w / 2 }, ng);
      else el("rect", { x: n.x - w / 2, y: n.y - h / 2, width: w, height: h, rx: 2 }, ng);

      var ty = n.sub ? n.y - 8 : n.y;
      var t = el("text", { x: n.x, y: ty }, ng);
      t.textContent = n.label;
      if (n.sub) {
        var st = el("text", { x: n.x, y: n.y + 11, class: "sub" }, ng);
        st.textContent = n.sub;
      }
      if (n.net || n.href) {
        var fm = el("text", { x: n.x + w / 2 - 6, y: n.y - h / 2 + 12, class: "fold-mark" }, ng);
        fm.textContent = n.net ? "..." : "↗";
        ng.setAttribute("tabindex", "0");
        ng.setAttribute("role", n.net ? "button" : "link");
        ng.setAttribute("aria-label", (n.net ? "Open process " : "Go to ") + n.label);
        var title = el("title", {}, ng);
        title.textContent = n.net ? "Open " + n.label + " to see its internal network" : "Go to " + n.label;
      }
    });
    return g;
  }

  function mount(host) {
    var src = host.querySelector('script[type="application/json"]');
    if (!src || host._mounted) return;
    host._mounted = true;
    var root = JSON.parse(src.textContent);
    var stack = [root];
    var arrowId = "pn-arrow-" + ++uid;

    var bar = document.createElement("div");
    bar.className = "procnet-bar";
    var svg = el("svg", { role: "img" });
    svg.style.color = "var(--chan)";
    var cap = document.createElement("div");
    cap.className = "procnet-caption";
    host.appendChild(bar);
    host.appendChild(svg);
    host.appendChild(cap);

    function renderBar() {
      bar.innerHTML = "";
      stack.forEach(function (n, i) {
        if (i) {
          var s = document.createElement("span");
          s.className = "sep";
          s.textContent = "›";
          bar.appendChild(s);
        }
        var label = "{{{ " + (n.title || "network");
        if (i < stack.length - 1) {
          var b = document.createElement("button");
          b.type = "button";
          b.textContent = label;
          b.addEventListener("click", function () { go(i); });
          bar.appendChild(b);
        } else {
          var h = document.createElement("span");
          h.className = "here";
          h.textContent = label;
          bar.appendChild(h);
        }
      });
      var cur = stack[stack.length - 1];
      var nested = cur.nodes.some(function (n) { return n.net; });
      var hint;
      if (!nested && stack.length > 1) {
        hint = document.createElement("button");
        hint.type = "button";
        hint.textContent = "}}} close";
        hint.addEventListener("click", function () { go(stack.length - 2); });
      } else {
        hint = document.createElement("span");
        hint.textContent = nested ? "open a  ...  process to look inside" : "";
      }
      hint.className = "hint";
      bar.appendChild(hint);
    }

    function show(dir) {
      var net = stack[stack.length - 1];
      var old = svg.querySelector(".stage");
      svg.setAttribute("viewBox", "0 0 " + net.w + " " + net.h);
      svg.setAttribute("aria-label", "Process diagram: " + (net.title || "") + ". " + (net.caption || ""));
      var defs = svg.querySelector("defs") || el("defs", {}, svg);
      if (!defs.firstChild) {
        var m = el("marker", { id: arrowId, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
        el("path", { d: "M0 0 L10 5 L0 10 z", fill: "currentColor" }, m);
      }
      if (old) old.remove();
      var g = draw(net, svg, arrowId);
      if (dir) {
        g.classList.add(dir > 0 ? "enter" : "leave");
        requestAnimationFrame(function () { requestAnimationFrame(function () { g.classList.remove("enter", "leave"); }); });
      }
      cap.textContent = net.caption || "";
      cap.hidden = !net.caption;
      renderBar();
    }

    function go(depth) {
      stack = stack.slice(0, depth + 1);
      show(-1);
    }

    function activate(id) {
      var net = stack[stack.length - 1];
      var n = net.nodes.filter(function (x) { return x.id === id; })[0];
      if (!n) return;
      if (n.net) {
        if (!n.net.title) n.net.title = n.label;
        var hadFocus = host.contains(document.activeElement);
        stack.push(n.net);
        show(1);
        var first = svg.querySelector(".proc.clickable");
        if (first && hadFocus) first.focus();
      } else if (n.href) {
        location.href = n.href;
      }
    }

    svg.addEventListener("click", function (e) {
      var p = e.target.closest(".proc.clickable");
      if (p) activate(p.getAttribute("data-id"));
    });
    svg.addEventListener("keydown", function (e) {
      var p = e.target.closest && e.target.closest(".proc.clickable");
      if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); activate(p.getAttribute("data-id")); }
      if (e.key === "Escape" && stack.length > 1) go(stack.length - 2);
    });

    show(0);
  }

  window.ProcNet = {
    mount: mount,
    all: function (root) { (root || document).querySelectorAll(".procnet").forEach(mount); }
  };
})();
