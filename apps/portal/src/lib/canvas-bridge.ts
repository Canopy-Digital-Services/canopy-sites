/**
 * The canvas bridge (Epic 33, PRD D35, D43, D47), injected into a page of the
 * site when the Editor's canvas or the preview page loads it. It runs inside
 * a sandboxed srcdoc frame (an opaque origin) and talks to the portal only by
 * postMessage:
 *
 * - a link click becomes a navigation request, so the portal owns navigation
 *   (an in-page anchor scrolls here instead);
 * - it reports the scroll position, and when the portal swaps in a newer
 *   build of the page it restores the scroll (and on the canvas the
 *   selection) there, so an update lands in place instead of reloading;
 * - every other click behaves as on the live site (menus, accordions).
 *
 * In "edit" mode (the canvas) it also marks every element carrying
 * `data-canopy-field`, reports a click on one as a selection, and edits its
 * text in place when the Editor asks, copying each keystroke to the field's
 * other appearances on the page and marking any text past the limit the
 * Editor sends. In
 * "view" mode (the preview page) nothing is marked or selectable.
 *
 * Nothing the page sends can write: the portal saves and publishes through
 * server actions, which check everything again.
 */
const MARKS = `<style>
[data-canopy-field]{cursor:pointer!important;text-decoration:underline dotted rgba(95,212,140,.95)!important;text-decoration-thickness:2px!important;text-underline-offset:4px!important;border-radius:2px;transition:background-color .15s ease,outline-color .15s ease}
[data-canopy-field]:hover{outline:2px solid #005f6a;outline-offset:3px;background-color:rgba(95,212,140,.16)}
[data-canopy-field].canopy-selected,[data-canopy-field].canopy-editing{outline:2px solid #005f6a;outline-offset:3px;background-color:rgba(95,212,140,.12);text-decoration:none!important}
[data-canopy-field].canopy-editing{cursor:text!important}
::highlight(canopy-over){color:oklch(0.5 0.2 25);background-color:oklch(0.68 0.21 25 / .2)}
@media (prefers-reduced-motion:reduce){[data-canopy-field]{transition:none}}
</style>`;

export function canvasBridge(mode: "edit" | "view"): string {
  return `${mode === "edit" ? MARKS : ""}<script>
(function () {
  if (window.parent === window) return;
  var VIEW = ${mode === "view"};
  var FIELD = "[data-canopy-field]";
  var selected = null;
  var editing = null;

  function post(msg) {
    msg.source = "canopy-canvas";
    window.parent.postMessage(msg, "*");
  }
  function rectOf(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  }
  function fieldsAt(address) {
    return document.querySelectorAll('[data-canopy-field="' + CSS.escape(address) + '"]');
  }
  function select(el) {
    if (selected) selected.classList.remove("canopy-selected");
    selected = el;
    if (el) el.classList.add("canopy-selected");
  }
  function finish(value) {
    if (!editing) return;
    var e = editing;
    editing = null;
    markOver();
    e.el.removeAttribute("contenteditable");
    e.el.classList.remove("canopy-editing");
    var text = typeof value === "string" ? value : e.original;
    fieldsAt(e.address).forEach(function (o) { o.textContent = text; });
  }

  // A marked field selects; a link asks the Editor to navigate; anything else is the site's own.
  document.addEventListener("click", function (e) {
    var t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    if (editing && editing.el.contains(t)) return;
    var field = VIEW ? null : t.closest(FIELD);
    if (field) {
      e.preventDefault();
      e.stopPropagation();
      if (editing) return;
      select(field);
      var address = field.getAttribute("data-canopy-field");
      var index = Array.prototype.indexOf.call(fieldsAt(address), field);
      post({ type: "select", address: address, index: index, value: field.textContent, rect: rectOf(field) });
      return;
    }
    var a = t.closest("a[href]");
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    var url;
    try { url = new URL(a.getAttribute("href"), document.baseURI); } catch (err) { return; }
    var here = new URL(document.baseURI);
    if (url.origin !== here.origin) { post({ type: "external", href: url.href }); return; }
    if (url.pathname === here.pathname) {
      var target = url.hash ? document.getElementById(decodeURIComponent(url.hash.slice(1))) : null;
      if (target) target.scrollIntoView({ block: "start" }); else window.scrollTo(0, 0);
      return;
    }
    post({ type: "navigate", path: url.pathname + url.hash });
  }, true);
  document.addEventListener("submit", function (e) { e.preventDefault(); }, true);

  // Where the text passes the limit, counted as the Editor counts it: each run
  // of whitespace as one space, none at either end. -1 while it fits.
  function overflowStart(text, limit) {
    var count = 0;
    var space = -1;
    for (var i = 0; i < text.length; i++) {
      if (/\\s/.test(text[i])) {
        if (count > 0 && space < 0) space = i;
        continue;
      }
      if (space >= 0) {
        count++;
        if (count > limit) return space;
        space = -1;
      }
      count++;
      if (count > limit) return i;
    }
    return -1;
  }
  // Marks the text past the limit in the field itself, where the owner is typing.
  function markOver() {
    if (!window.CSS || !CSS.highlights || typeof Highlight === "undefined") return;
    CSS.highlights.delete("canopy-over");
    if (!editing || !editing.limit) return;
    var start = overflowStart(editing.el.textContent, editing.limit);
    if (start < 0) return;
    var range = document.createRange();
    var walker = document.createTreeWalker(editing.el, NodeFilter.SHOW_TEXT);
    var seen = 0;
    var placed = false;
    var last = null;
    var node;
    while ((node = walker.nextNode())) {
      if (!placed && start < seen + node.data.length) {
        range.setStart(node, start - seen);
        placed = true;
      }
      seen += node.data.length;
      last = node;
    }
    if (!placed) return;
    range.setEnd(last, last.data.length);
    CSS.highlights.set("canopy-over", new Highlight(range));
  }

  // In-place editing: plain text, one line. Typing past a limit is allowed, so
  // text can be written first and trimmed after; the overflow shows marked.
  document.addEventListener("beforeinput", function (e) {
    if (!editing || e.target !== editing.el) return;
    if (e.inputType === "insertParagraph" || e.inputType === "insertLineBreak") {
      e.preventDefault();
      post({ type: "commit" });
    }
  }, true);
  document.addEventListener("input", function (e) {
    if (!editing || e.target !== editing.el) return;
    var value = editing.el.textContent;
    fieldsAt(editing.address).forEach(function (o) { if (o !== editing.el) o.textContent = value; });
    markOver();
    post({ type: "input", address: editing.address, value: value, rect: rectOf(editing.el) });
  }, true);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") post({ type: editing ? "cancel" : "deselect" });
  }, true);

  // Keep the Editor's panel beside the field as the page scrolls or reflows.
  var queued = false;
  function report() {
    queued = false;
    var el = editing ? editing.el : selected;
    if (el) post({ type: "rect", rect: rectOf(el) });
    post({ type: "scroll", y: window.scrollY });
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(report); } }
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue, { passive: true });

  window.addEventListener("message", function (e) {
    if (e.source !== window.parent || !e.data || typeof e.data !== "object") return;
    var m = e.data;
    if (m.type === "edit" && !VIEW && selected && selected.getAttribute("data-canopy-field") === m.address) {
      editing = { el: selected, address: m.address, original: selected.textContent, limit: m.limit || 0 };
      markOver();
      selected.setAttribute("contenteditable", "plaintext-only");
      selected.classList.add("canopy-editing");
      selected.focus();
      var range = document.createRange();
      range.selectNodeContents(selected);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (m.type === "finish") {
      finish(m.value);
    } else if (m.type === "patch" && typeof m.value === "string") {
      fieldsAt(m.address).forEach(function (o) { o.textContent = m.value; });
    } else if (m.type === "deselect") {
      finish();
      select(null);
    } else if (m.type === "scroll-to") {
      var to = fieldsAt(m.address)[0];
      if (to) to.scrollIntoView({ block: "center" });
    } else if (m.type === "restore") {
      // A newer build of the same page, about to replace the one on screen.
      var done = false;
      var apply = function () {
        if (done) return;
        done = true;
        window.scrollTo(0, m.y || 0);
        var rect = null;
        if (typeof m.address === "string") {
          var all = fieldsAt(m.address);
          var el = all[m.index || 0] || all[0];
          if (el) {
            select(el);
            // Keep the field where the owner last saw it, whatever changed above it.
            if (typeof m.top === "number") window.scrollBy(0, el.getBoundingClientRect().top - m.top);
            rect = rectOf(el);
          }
        }
        post({ type: "restored", rect: rect });
      };
      if (document.readyState === "complete") apply();
      else {
        window.addEventListener("load", apply, { once: true });
        setTimeout(apply, 1500);
      }
    } else if (m.type === "scroll-hash" && typeof m.hash === "string") {
      var anchor = document.getElementById(decodeURIComponent(m.hash));
      if (anchor) anchor.scrollIntoView({ block: "start" });
    }
  });

  post({ type: "ready", path: new URL(document.baseURI).pathname, title: document.title, fields: document.querySelectorAll(FIELD).length });
})();
</script>`;
}
