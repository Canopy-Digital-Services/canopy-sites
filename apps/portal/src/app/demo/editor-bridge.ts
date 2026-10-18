/**
 * The visual editor's bridge (Epic 33, PRD D35, D43), injected into a page of
 * the site when the Editor's canvas loads it. It runs inside the sandboxed
 * canvas (an opaque origin) and talks to the Editor only by postMessage:
 *
 * - every element carrying `data-canopy-field` is marked, and a click on one
 *   is reported as a selection;
 * - a link click becomes a navigation request, so the Editor owns navigation
 *   (an in-page anchor scrolls here instead);
 * - when the Editor asks, a field's text is edited in place, kept within the
 *   limit the Editor sends, and every keystroke is reported and copied to the
 *   field's other appearances on the page;
 * - every other click behaves as on the live site (menus, accordions).
 *
 * Nothing the page sends can write: the Editor saves through server actions,
 * which check everything again.
 */
export const EDITOR_BRIDGE = `<style>
[data-canopy-field]{cursor:pointer!important;text-decoration:underline dotted rgba(95,212,140,.95)!important;text-decoration-thickness:2px!important;text-underline-offset:4px!important;border-radius:2px;transition:background-color .15s ease,outline-color .15s ease}
[data-canopy-field]:hover{outline:2px solid #005f6a;outline-offset:3px;background-color:rgba(95,212,140,.16)}
[data-canopy-field].canopy-selected,[data-canopy-field].canopy-editing{outline:2px solid #005f6a;outline-offset:3px;background-color:rgba(95,212,140,.12);text-decoration:none!important}
[data-canopy-field].canopy-editing{cursor:text!important}
@media (prefers-reduced-motion:reduce){[data-canopy-field]{transition:none}}
</style>
<script>
(function () {
  if (window.parent === window) return;
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
    var field = t.closest(FIELD);
    if (field) {
      e.preventDefault();
      e.stopPropagation();
      if (editing) return;
      select(field);
      post({ type: "select", address: field.getAttribute("data-canopy-field"), value: field.textContent, rect: rectOf(field) });
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

  // In-place editing: plain text, one line, within the limit the Editor sent.
  document.addEventListener("beforeinput", function (e) {
    if (!editing || e.target !== editing.el) return;
    if (e.inputType === "insertParagraph" || e.inputType === "insertLineBreak") {
      e.preventDefault();
      post({ type: "commit" });
      return;
    }
    if (editing.limit && e.inputType.indexOf("insert") === 0) {
      var data = e.data || (e.dataTransfer && e.dataTransfer.getData("text/plain")) || "";
      var sel = window.getSelection();
      var replaced = sel && sel.rangeCount ? sel.toString().length : 0;
      if (editing.el.textContent.length - replaced + data.length > editing.limit) e.preventDefault();
    }
  }, true);
  document.addEventListener("input", function (e) {
    if (!editing || e.target !== editing.el) return;
    var value = editing.el.textContent;
    fieldsAt(editing.address).forEach(function (o) { if (o !== editing.el) o.textContent = value; });
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
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(report); } }
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue, { passive: true });

  window.addEventListener("message", function (e) {
    if (e.source !== window.parent || !e.data || typeof e.data !== "object") return;
    var m = e.data;
    if (m.type === "edit" && selected && selected.getAttribute("data-canopy-field") === m.address) {
      editing = { el: selected, address: m.address, original: selected.textContent, limit: m.limit || 0 };
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
    } else if (m.type === "scroll-hash" && typeof m.hash === "string") {
      var anchor = document.getElementById(decodeURIComponent(m.hash));
      if (anchor) anchor.scrollIntoView({ block: "start" });
    }
  });

  post({ type: "ready", path: new URL(document.baseURI).pathname, title: document.title, fields: document.querySelectorAll(FIELD).length });
})();
</script>`;
