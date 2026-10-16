/**
 * Static concept of the visual editor (PRD section 2 lists the full visual
 * editor as out of v1; this is a sales preview only, Epic 30). Injected into
 * the demo page when the Editor frames it: dashed outlines and labels on
 * the content a client could edit in place, one price shown mid-edit, and
 * every click swallowed. It changes nothing and saves nothing.
 */
export const EDITOR_MOCKUP = `<style>
#intro-overlay{display:none!important}.amp-logo,.header-logo-slot{opacity:1!important}
html,body,a,button{cursor:default!important}
.cm-layer{position:absolute;left:0;top:0;width:100%;pointer-events:none;z-index:2147483646}
.cm-box{position:absolute;pointer-events:auto;cursor:pointer!important;border:1.5px dashed rgba(0,95,106,.9);border-radius:4px;box-shadow:0 0 0 1px rgba(255,255,255,.55);transition:background-color .15s ease,border-color .15s ease}
.cm-box:hover{border:2px solid #005f6a;background:rgba(95,212,140,.18)}
.cm-box:hover .cm-tag{background:#004a53}
.cm-box.cm-active{border:2px solid #005f6a;background:rgba(95,212,140,.14)}
.cm-tag.cm-below{top:auto;bottom:-21px;border-radius:0 0 4px 4px}
.cm-tag{position:absolute;left:-2px;top:-21px;background:#005f6a;color:#fff;font:600 11px/19px system-ui,-apple-system,sans-serif;padding:0 7px;border-radius:4px 4px 0 0;white-space:nowrap;letter-spacing:.02em}
.cm-pop{position:absolute;z-index:2;width:272px;background:#fff;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.28);padding:14px;font:14px/1.45 system-ui,-apple-system,sans-serif;color:#1f2933}
.cm-pop b{display:block;font-size:12px;color:#52606d;font-weight:600;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em}
.cm-input{border:2px solid #005f6a;border-radius:6px;padding:7px 10px;font-size:16px;display:flex;align-items:center}
.cm-caret{display:inline-block;width:1.5px;height:18px;background:#005f6a;margin-left:2px;animation:cmblink 1s steps(1) infinite}
@keyframes cmblink{50%{opacity:0}}
@media (prefers-reduced-motion:reduce){.cm-caret{animation:none}}
.cm-note{margin:8px 0 10px;font-size:12.5px;color:#52606d}
.cm-actions{display:flex;justify-content:flex-end;gap:8px}
.cm-btn{font:600 13px/1 system-ui,sans-serif;padding:8px 12px;border-radius:6px;border:1px solid #cbd2d9;background:#fff;color:#1f2933}
.cm-btn.cm-primary{background:#005f6a;border-color:#005f6a;color:#fff}
.cm-chip{position:absolute;background:#fff;color:#005f6a;border:1.5px dashed #005f6a;border-radius:999px;font:600 12px/1 system-ui,sans-serif;padding:7px 12px;white-space:nowrap}
</style>
<script>
(function () {
  ["click", "submit", "auxclick"].forEach(function (t) {
    document.addEventListener(t, function (e) { e.preventDefault(); e.stopPropagation(); }, true);
  });
  var layer = document.createElement("div");
  layer.className = "cm-layer";
  document.body.appendChild(layer);
  function targets() {
    var list = [];
    function add(el, label, opts) { if (el) list.push({ el: el, label: label, opts: opts || {} }); }
    var bar = document.getElementById("announcement-bar");
    if (bar) add(bar.querySelector("p"), "Announcement");
    var hero = document.querySelector("section.hero");
    if (hero) {
      add(hero.querySelector("p"), "Text");
      hero.querySelectorAll("a").forEach(function (a) { add(a, "Button"); });
    }
    var services = document.getElementById("services");
    if (services) {
      add(services.querySelector("h2"), "Heading");
      services.querySelectorAll(".price-warm").forEach(function (p, i) { add(p, "Price", i === 0 ? { active: true } : {}); });
    }
    var gallery = document.getElementById("gallery");
    if (gallery) add(gallery.querySelector(".gallery-thumb"), "Photo", { chip: "Replace photo" });
    var about = document.getElementById("about");
    if (about) add(about.querySelector("p.italic"), "Quote");
    var reviews = document.getElementById("reviews");
    if (reviews) {
      var cards = reviews.querySelectorAll(".grid > div");
      cards.forEach(function (c) { add(c, "Review"); });
      if (cards.length) list.push({ el: cards[cards.length - 1], label: null, opts: { after: "+ Add review" } });
    }
    return list;
  }
  function draw() {
    layer.innerHTML = "";
    var pops = [];
    layer.style.height = document.documentElement.scrollHeight + "px";
    targets().forEach(function (t) {
      var r = t.el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var x = r.left + window.scrollX, y = r.top + window.scrollY;
      if (t.opts.after) {
        var add = document.createElement("div");
        add.className = "cm-chip";
        add.textContent = t.opts.after;
        add.style.left = x + "px";
        add.style.top = (y + r.height + 18) + "px";
        layer.appendChild(add);
        return;
      }
      var box = document.createElement("div");
      box.className = "cm-box" + (t.opts.active ? " cm-active" : "");
      box.style.left = (x - 6) + "px";
      box.style.top = (y - 6) + "px";
      box.style.width = (r.width + 12) + "px";
      box.style.height = (r.height + 12) + "px";
      var tag = document.createElement("span");
      tag.className = "cm-tag";
      tag.textContent = t.label + (t.opts.active ? " \\u00b7 editing" : "");
      box.title = t.opts.active ? "" : "Click to edit";
      if (y < 60) tag.className += " cm-below";
      box.appendChild(tag);
      layer.appendChild(box);
      if (t.opts.chip) {
        var chip = document.createElement("div");
        chip.className = "cm-chip";
        chip.textContent = t.opts.chip;
        chip.style.left = (x + 12) + "px";
        chip.style.top = (y + r.height - 42) + "px";
        layer.appendChild(chip);
      }
      if (t.opts.active) {
        var pop = document.createElement("div");
        pop.className = "cm-pop";
        pop.innerHTML = '<b>Price</b><div class="cm-input"><span class="cm-val"></span><span class="cm-caret"></span></div>' +
          '<p class="cm-note">Also updates the full menu. Nothing goes live until you publish.</p>' +
          '<div class="cm-actions"><span class="cm-btn">Cancel</span><span class="cm-btn cm-primary">Done</span></div>';
        pop.querySelector(".cm-val").textContent = (t.el.textContent || "").trim();
        pop.style.left = Math.max(8, x + r.width - 272) + "px";
        pop.style.top = (y + r.height + 14) + "px";
        pops.push(pop);
      }
    });
    // Editors go last so they sit above the outlines they overlap.
    pops.forEach(function (p) { layer.appendChild(p); });
  }
  draw();
  // Open on the price being edited, which the inspector beside it
  // describes, until the viewer scrolls for themselves.
  var userScrolled = false;
  ["wheel", "touchstart", "keydown"].forEach(function (t) { window.addEventListener(t, function () { userScrolled = true; }, { passive: true }); });
  function focusPrice() {
    var heading = document.querySelector("#services h2");
    if (!heading || userScrolled) return;
    window.scrollTo(0, heading.getBoundingClientRect().top + window.scrollY - 140);
  }
  focusPrice();
  window.addEventListener("load", function () { focusPrice(); draw(); });
  setTimeout(focusPrice, 600);
  window.addEventListener("load", draw);
  window.addEventListener("resize", draw);
  setTimeout(draw, 600);
  setTimeout(draw, 2000);
})();
</script>`;
