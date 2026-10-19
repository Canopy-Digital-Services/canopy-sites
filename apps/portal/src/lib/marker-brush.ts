/**
 * The Canopy marker brush: one scanned marker stroke swept along any path, so
 * every coral mark on the site (underlines, circles, strikethroughs) reads as
 * the same pen on the same page.
 *
 * The texture, public/images/marker-brush.png, is the original hero underline
 * (public/images/svg/underline.svg) rasterized and straightened: the stroke
 * runs horizontally through the middle of the image, white with alpha, with
 * its dry edges and slanted chisel ends intact. The ends are always laid down
 * as scanned; the middle is mirror-tiled, so edge texture keeps the same
 * physical scale at any length.
 *
 * Rendering maps the texture onto the path per device pixel: each pixel near
 * the path finds its nearest point on it and reads the texture at (distance
 * along, distance across). The prototype stamped rotated 1px slices instead,
 * which fan into gaps on the outside of curves and point-sample a texture
 * several times larger than the screen, so edges shimmered. Here the texture
 * is box-filtered down to screen scale once per pen width and pixel ratio, and
 * every pixel is read exactly once per pass.
 *
 * Ported from the canopyds-website repo (lib/markerBrush.ts, with
 * public/images/marker-brush.png); its docs/scribble-animations.md
 * ("Marker brush") has the design notes. The "box" shape is portal-only.
 */

export type Point = [number, number];
export type Stroke = Point[];
export type MarkKind = "underline" | "circle" | "strike" | "box";

export const BRUSH_SRC = "/images/marker-brush.png";

// The numbers below are tied to that exact PNG. Regenerate them with it.
/** Thickness of the stroke's solid body, in texture px. */
const CORE = 39;
/** Share of the texture at each end laid down as scanned: the chisel caps. */
const CAP_FRAC = 0.1;
/** The original hand gesture, which straightening took out of the texture:
    [position along the stroke 0..1, vertical offset in core thicknesses]. A
    gentle rise left to right with a flick up at the end. */
const GESTURE: Point[] = [
  [0, 0], [0.0833, 0.0392], [0.1667, -0.0146], [0.25, -0.0945],
  [0.3333, -0.1924], [0.4167, -0.2689], [0.5, -0.3385], [0.5833, -0.4121],
  [0.6667, -0.4695], [0.75, -0.506], [0.8333, -0.5608], [0.9167, -0.6314],
  [1, -0.8916],
];

type Alpha = { data: Float32Array; w: number; h: number };

export type Brush = {
  tex: Alpha;
  /** Copies box-filtered to screen scale, keyed by device px per texture px. */
  levels: Map<string, Level>;
};

/** A texture at one scale. `px` is device px per texel: 1 for a filtered
    copy, the scale itself when the original is used as-is (magnifying). */
type Level = { tex: Alpha; px: number };

let brushLoad: Promise<Brush> | null = null;

/** Loads and decodes the brush once per page; later calls share it. */
export function loadBrush(src = BRUSH_SRC): Promise<Brush> {
  brushLoad ??= new Promise<Brush>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const g = c.getContext("2d", { willReadFrequently: true });
      if (!g) return reject(new Error("marker brush: no 2d context"));
      g.drawImage(img, 0, 0);
      const px = g.getImageData(0, 0, c.width, c.height).data;
      const data = new Float32Array(c.width * c.height);
      for (let i = 0; i < data.length; i++) data[i] = px[i * 4 + 3] / 255;
      resolve({ tex: { data, w: c.width, h: c.height }, levels: new Map() });
    };
    img.onerror = () => {
      brushLoad = null;
      reject(new Error(`marker brush: failed to load ${src}`));
    };
    img.src = src;
  });
  return brushLoad;
}

function level(brush: Brush, scale: number): Level {
  const key = scale.toFixed(4);
  let l = brush.levels.get(key);
  if (!l) {
    l = scale < 1 ? { tex: shrink(brush.tex, scale), px: 1 } : { tex: brush.tex, px: scale };
    brush.levels.set(key, l);
  }
  return l;
}

/** Area-average resample to `scale`, one axis at a time. */
function shrink(src: Alpha, scale: number): Alpha {
  const w = Math.ceil(src.w * scale);
  const h = Math.ceil(src.h * scale);
  const rows = new Float32Array(w * src.h);
  for (let y = 0; y < src.h; y++) boxFilter(src.data, y * src.w, 1, src.w, rows, y * w, 1, w, scale);
  const data = new Float32Array(w * h);
  for (let x = 0; x < w; x++) boxFilter(rows, x, w, src.h, data, x, w, h, scale);
  return { data, w, h };
}

/** Output texel i is the mean of the source span it covers, [i / scale,
    (i + 1) / scale). Anything past the source edge counts as clear. */
function boxFilter(
  src: Float32Array, s0: number, sStride: number, sLen: number,
  dst: Float32Array, d0: number, dStride: number, dLen: number,
  scale: number,
) {
  for (let i = 0; i < dLen; i++) {
    const a = i / scale;
    const b = Math.min((i + 1) / scale, sLen);
    let sum = 0;
    for (let j = Math.floor(a); j < b; j++) {
      sum += src[s0 + j * sStride] * (Math.min(b, j + 1) - Math.max(a, j));
    }
    dst[d0 + i * dStride] = sum * scale;
  }
}

/** Bilinear read, texel centers at +0.5. Clear outside the texture. */
function sample(t: Alpha, x: number, y: number): number {
  x -= 0.5;
  y -= 0.5;
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const { data, w, h } = t;
  const at = (i: number, j: number) => (i < 0 || j < 0 || i >= w || j >= h ? 0 : data[j * w + i]);
  return (
    (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) +
    (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy
  );
}

/** Where along the texture (device px from its left end) to read at distance
    `s` along a stroke of length `len`. */
function along(s: number, len: number, texLen: number): number {
  const cap = texLen * CAP_FRAC;
  if (len < cap * 2) return (s / len) * texLen; // very short: the whole brush, compressed
  if (s < cap) return s; // start cap, as scanned
  if (s > len - cap) return texLen - (len - s); // end cap, as scanned
  const mid = texLen - cap * 2;
  const m = (s - cap) % (mid * 2);
  return cap + (m < mid ? m : mid * 2 - m); // middle, mirror-tiled
}

// ─── Paths ───────────────────────────────────────────────────────────────────

type Path = {
  x: Float64Array; y: Float64Array;
  /** Unit tangent. */
  tx: Float64Array; ty: Float64Array;
  /** Distance along the path. */
  s: Float64Array;
  n: number;
  len: number;
};

const turn = (ax: number, ay: number, bx: number, by: number) =>
  Math.atan2(ax * by - ay * bx, ax * bx + ay * by);

/** Evenly spaced samples, `step` apart, ending exactly on the last point. */
function resample(points: Point[], step: number): Path {
  const xs: number[] = [], ys: number[] = [], ss: number[] = [];
  let s = 0, next = 0;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1], [x1, y1] = points[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    if (!seg) continue;
    while (next <= s + seg) {
      const t = (next - s) / seg;
      xs.push(x0 + (x1 - x0) * t);
      ys.push(y0 + (y1 - y0) * t);
      ss.push(next);
      next += step;
    }
    s += seg;
  }
  if (!ss.length || s - ss[ss.length - 1] > step / 4) {
    const [x, y] = points[points.length - 1];
    xs.push(x);
    ys.push(y);
    ss.push(s);
  }
  const n = xs.length;
  // Tangent across a few samples either side, so polyline joints don't kink.
  const tx = new Float64Array(n), ty = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 3), b = Math.min(n - 1, i + 3);
    const dx = xs[b] - xs[a], dy = ys[b] - ys[a], d = Math.hypot(dx, dy) || 1;
    tx[i] = dx / d;
    ty[i] = dy / d;
  }
  return {
    x: Float64Array.from(xs), y: Float64Array.from(ys), tx, ty,
    s: Float64Array.from(ss), n, len: s,
  };
}

/**
 * Drawing time to reach each sample. Hands slow into turns and run along
 * straights; the two-thirds power law (speed ∝ curvature^-1/3) is the standard
 * model of it. Curvature is taken relative to the stroke's own size, so a
 * straight line draws at constant speed and a bigger circle keeps the same
 * rhythm.
 */
function timing(p: Path): Float64Array {
  const t = new Float64Array(p.n);
  const size = p.len / (2 * Math.PI);
  const w = Math.max(2, Math.round(p.n / 60));
  for (let i = 1; i < p.n; i++) {
    const a = Math.max(0, i - w), b = Math.min(p.n - 1, i + w);
    const k = Math.abs(turn(p.tx[a], p.ty[a], p.tx[b], p.ty[b])) / Math.max(1e-6, p.s[b] - p.s[a]);
    t[i] = t[i - 1] + (p.s[i] - p.s[i - 1]) * Math.cbrt(1 + k * size);
  }
  return t;
}

/** Round off sharp corners (an arrowhead's tip, a paren's hook) over about
    `radius` samples. A marker's chisel pivots through a corner and leaves it
    filled; mapping the texture onto a true corner would leave a notch on its
    outside. Two box-blur passes; the window shrinks near the ends so they
    stay put. Curves much wider than the radius are untouched in effect. */
function softenCorners(p: Path, radius: number): Point[] {
  let xs = Array.from(p.x), ys = Array.from(p.y);
  for (let pass = 0; pass < 2; pass++) {
    const sx = [0], sy = [0];
    for (let i = 0; i < p.n; i++) {
      sx.push(sx[i] + xs[i]);
      sy.push(sy[i] + ys[i]);
    }
    const nx: number[] = [], ny: number[] = [];
    for (let i = 0; i < p.n; i++) {
      const r = Math.min(radius, i, p.n - 1 - i), a = i - r, b = i + r + 1;
      nx.push((sx[b] - sx[a]) / (b - a));
      ny.push((sy[b] - sy[a]) / (b - a));
    }
    xs = nx;
    ys = ny;
  }
  return xs.map((x, i) => [x, ys[i]]);
}

/** Split a path wherever it has turned through ~120°, so no piece can come
    back near itself, and overlap neighbours so seams are covered from both
    sides. Pieces are then painted as a union, which is also what lets a
    circle's tail cross its own start. */
function pieces(p: Path, overlap: number): [number, number][] {
  const cuts: [number, number][] = [];
  let start = 0, turned = 0;
  for (let i = 1; i < p.n; i++) {
    turned += Math.abs(turn(p.tx[i - 1], p.ty[i - 1], p.tx[i], p.ty[i]));
    if (turned > 2.1) {
      cuts.push([start, i]);
      start = i;
      turned = 0;
    }
  }
  cuts.push([start, p.n - 1]);
  return cuts.map(([a, b]) => [Math.max(0, a - overlap), Math.min(p.n - 1, b + overlap)]);
}

// ─── Marks ───────────────────────────────────────────────────────────────────

export type Mark = {
  /** Total stroke length, CSS px. */
  length: number;
  /** Drawing time at a hand's pace, ms: each stroke's time plus the lifts
      between strokes. */
  duration: number;
  /** Where the pen lands and lifts, in the strokes' coordinates. */
  start: Point;
  end: Point;
  /** Paint the mark drawn up to `progress`, a 0..1 share of its drawing time
      (linear in time: the hand's easing is already in it). Cheap to call
      every frame: only newly reached pixels are touched. */
  paint(progress: number): void;
};

type MarkOptions = {
  /** Body thickness, CSS px. The same for every mark: see --marker-pen. */
  pen: number;
  /** Any CSS color. */
  color: string;
  dpr: number;
};

/** One stroke's drawing time, ms. A bigger gesture takes a little longer but
    moves faster, as a hand does: ~550ms for the hero underline, ~800ms round
    a heading word, ~170ms for a tick a few px long. */
export const strokeMs = (length: number) => Math.round(110 * Math.pow(length, 0.3));

/** Between strokes the pen lifts, moves through the air and sets down again:
    a beat to reposition plus the move itself, ms for a move of `distance`
    CSS px. This is what makes a drawing of several strokes read as a hand
    rather than a plotter. */
const liftMs = (distance: number) => 140 + 0.6 * distance;

/** Within a stroke: quick off the mark, fastest mid-stroke, and still moving
    at the lift (speed 0.65 → 1.35 → 0.65 of the mean). Never eases to a stop:
    a marker that decelerates to rest reads as a cursor. Maps time share to
    distance share. */
const handEase = (t: number) => t - (0.35 / (2 * Math.PI)) * Math.sin(2 * Math.PI * t);

/** The time share at which handEase reaches distance share `d`. */
function handEaseInverse(d: number): number {
  let t = d;
  for (let i = 0; i < 5; i++) t -= (handEase(t) - d) / (1 - 0.35 * Math.cos(2 * Math.PI * t));
  return Math.min(1, Math.max(0, t));
}

/**
 * Fit `canvas` (absolutely positioned in the element the strokes were built
 * against) to the strokes, and prepare them for painting. Strokes are in that
 * element's CSS px and draw in order, as one hand.
 */
export function buildMark(canvas: HTMLCanvasElement, brush: Brush, strokes: Stroke[], { pen, color, dpr }: MarkOptions): Mark {
  const scale = (pen * dpr) / CORE; // device px per texture px
  const lev = level(brush, scale);
  const texLen = brush.tex.w * scale;
  const mid = (brush.tex.h / 2) * (scale / lev.px);
  const reach = (brush.tex.h * scale) / 2; // half the texture's height, device px

  // The canvas covers the strokes plus the brush's reach, on whole CSS px.
  const pad = reach / dpr + 2;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const st of strokes) for (const [x, y] of st) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y);
    x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  const left = Math.floor(x0 - pad), top = Math.floor(y0 - pad);
  const cssW = Math.ceil(x1 + pad) - left, cssH = Math.ceil(y1 + pad) - top;
  const W = Math.round(cssW * dpr), H = Math.round(cssH * dpr);
  Object.assign(canvas.style, { left: `${left}px`, top: `${top}px`, width: `${cssW}px`, height: `${cssH}px` });
  canvas.width = W;
  canvas.height = H;

  // Every covered pixel becomes an entry: where it is, how opaque, and when
  // (ms) the pen reaches it.
  const idx: number[] = [], alpha: number[] = [], when: number[] = [];
  let clock = 0, length = 0;
  strokes.forEach((st, si) => {
    if (si > 0) {
      const [ax, ay] = strokes[si - 1][strokes[si - 1].length - 1], [bx, by] = st[0];
      clock += liftMs(Math.hypot(bx - ax, by - ay));
    }
    const raw = resample(st.map(([x, y]) => [(x - left) * dpr, (y - top) * dpr] as Point), 1);
    const p = resample(softenCorners(raw, Math.max(1, Math.round(reach / 2))), 1);
    const time = timing(p);
    const span = time[p.n - 1] || 1;
    const ms = strokeMs(p.len / dpr);
    // Where along its own timing the pen is at arc length s, then when
    // that is in ms once the stroke is eased.
    const timeAt = (s: number) => {
      const i = Math.min(p.n - 2, Math.max(0, Math.floor(s)));
      const f = Math.min(1, Math.max(0, (s - p.s[i]) / Math.max(1e-6, p.s[i + 1] - p.s[i])));
      return ms * handEaseInverse((time[i] + (time[i + 1] - time[i]) * f) / span);
    };
    for (const [a, b] of pieces(p, Math.ceil(reach + 2))) {
      rasterize(p, a, b, reach, W, H, (k, s, n) => {
        const v = sample(lev.tex, along(s, p.len, texLen) / lev.px, mid + n / lev.px);
        if (v < 1 / 255) return;
        idx.push(k);
        alpha.push(Math.round(v * 255));
        when.push(clock + (p.n > 1 ? timeAt(s) : 0));
      });
    }
    clock += ms;
    length += p.len / dpr;
  });

  const total = clock || 1;
  const order = Uint32Array.from(idx.keys()).sort((a, b) => when[a] - when[b]);
  const ctx = canvas.getContext("2d");
  const img = ctx?.createImageData(W, H);
  const rgb = toRgb(color);
  if (img) for (let i = 0; i < img.data.length; i += 4) img.data.set(rgb, i);
  let done = 0, last = 0;

  const lastStroke = strokes[strokes.length - 1];
  return {
    length,
    duration: total,
    start: strokes[0][0],
    end: lastStroke[lastStroke.length - 1],
    paint(progress) {
      if (!ctx || !img) return;
      if (progress < last) {
        for (let i = 3; i < img.data.length; i += 4) img.data[i] = 0;
        done = 0;
      }
      last = progress;
      const until = progress >= 1 ? Infinity : progress * total;
      for (; done < order.length && when[order[done]] <= until; done++) {
        const j = order[done], o = idx[j] * 4 + 3;
        if (alpha[j] > img.data[o]) img.data[o] = alpha[j]; // union of passes
      }
      ctx.putImageData(img, 0, 0);
    },
  };
}

/** For each pixel within `reach` of samples a..b, find its nearest sample and
    report (pixel index, distance along the path, signed distance across it). */
function rasterize(
  p: Path, a: number, b: number, reach: number, W: number, H: number,
  emit: (k: number, s: number, n: number) => void,
) {
  const R = reach + 1.5;
  let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
  for (let i = a; i <= b; i++) {
    bx0 = Math.min(bx0, p.x[i]); by0 = Math.min(by0, p.y[i]);
    bx1 = Math.max(bx1, p.x[i]); by1 = Math.max(by1, p.y[i]);
  }
  bx0 = Math.max(0, Math.floor(bx0 - R)); by0 = Math.max(0, Math.floor(by0 - R));
  bx1 = Math.min(W, Math.ceil(bx1 + R)); by1 = Math.min(H, Math.ceil(by1 + R));
  const bw = bx1 - bx0, bh = by1 - by0;
  if (bw <= 0 || bh <= 0) return;
  const best = new Float32Array(bw * bh).fill(Infinity);
  const sAt = new Float32Array(bw * bh), nAt = new Float32Array(bw * bh);
  for (let i = a; i <= b; i++) {
    const cx = p.x[i], cy = p.y[i], tx = p.tx[i], ty = p.ty[i], s = p.s[i];
    const xa = Math.max(bx0, Math.floor(cx - R)), xb = Math.min(bx1 - 1, Math.ceil(cx + R));
    const ya = Math.max(by0, Math.floor(cy - R)), yb = Math.min(by1 - 1, Math.ceil(cy + R));
    for (let y = ya; y <= yb; y++) {
      const dy = y + 0.5 - cy;
      for (let x = xa; x <= xb; x++) {
        const dx = x + 0.5 - cx, d2 = dx * dx + dy * dy, k = (y - by0) * bw + (x - bx0);
        if (d2 >= best[k]) continue;
        best[k] = d2;
        sAt[k] = s + dx * tx + dy * ty;
        nAt[k] = dy * tx - dx * ty; // + is the right of travel: the texture's lower edge
      }
    }
  }
  // Only pixels that project inside this piece (and inside the stroke).
  const sa = Math.max(0, p.s[a] - 1), sb = Math.min(p.len, p.s[b] + 1);
  for (let k = 0; k < best.length; k++) {
    if (best[k] > R * R || sAt[k] < sa || sAt[k] > sb || Math.abs(nAt[k]) > reach) continue;
    emit((by0 + Math.floor(k / bw)) * W + bx0 + (k % bw), sAt[k], nAt[k]);
  }
}

function toRgb(color: string): [number, number, number] {
  const g = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!g) return [255, 107, 90];
  g.fillStyle = color;
  g.fillRect(0, 0, 1, 1);
  const [r, gr, b] = g.getImageData(0, 0, 1, 1).data;
  return [r, gr, b];
}

// ─── Measuring the target ────────────────────────────────────────────────────

export type Metrics = {
  /** The target's box, CSS px. Shapes are built in its coordinates. */
  w: number;
  h: number;
  /** Baseline of the target's (last) line, from its top. */
  baseline: number;
  /** Height of the lowercase letters. */
  xHeight: number;
  /** Font size. */
  em: number;
};

/** Measure after web fonts have loaded: fallbacks are wider and sit
    differently, and would misplace the mark. */
export function measure(el: HTMLElement): Metrics {
  const cs = getComputedStyle(el);
  const em = parseFloat(cs.fontSize);
  const box = el.getBoundingClientRect();
  // A zero-size inline-block sits on the baseline.
  const probe = document.createElement("span");
  probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
  el.appendChild(probe);
  const baseline = probe.getBoundingClientRect().top - box.top;
  probe.remove();
  let xHeight = em * 0.5;
  const g = document.createElement("canvas").getContext("2d");
  if (g) {
    g.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    xHeight = g.measureText("x").actualBoundingBoxAscent || xHeight;
  }
  return { w: box.width, h: box.height, baseline, xHeight, em };
}

// ─── Traced art ──────────────────────────────────────────────────────────────
// Hand-drawn marks (parens, arrows, a speech bubble) keep their traced
// centerlines and get the brush laid along them.

/** Flatten SVG path data (M L H V C S Q Z, absolute or relative) into strokes,
    one per subpath. Enough for centerlines drawn in Inkscape. */
export function parsePath(d: string): Stroke[] {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) ?? [];
  const strokes: Stroke[] = [];
  let i = 0, cmd = "", x = 0, y = 0, sx = 0, sy = 0;
  let cx = 0, cy = 0; // last control point, for S
  let cur: Stroke = [];
  const num = () => parseFloat(tokens[i++]);
  const curve = (pts: Point[]) => {
    const [p0, ...ctrl] = [[x, y] as Point, ...pts];
    for (let k = 1; k <= 24; k++) {
      const t = k / 24, u = 1 - t;
      cur.push(
        ctrl.length === 3
          ? [0, 1].map((a) => u * u * u * p0[a] + 3 * u * u * t * ctrl[0][a] + 3 * u * t * t * ctrl[1][a] + t * t * t * ctrl[2][a]) as Point
          : [0, 1].map((a) => u * u * p0[a] + 2 * u * t * ctrl[0][a] + t * t * ctrl[1][a]) as Point,
      );
    }
  };
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase(), ox = rel ? x : 0, oy = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case "M":
        if (cur.length > 1) strokes.push(cur);
        x = sx = ox + num(); y = sy = oy + num();
        cur = [[x, y]];
        cmd = rel ? "l" : "L"; // further pairs are line-tos
        break;
      case "L": x = ox + num(); y = oy + num(); cur.push([x, y]); break;
      case "H": x = ox + num(); cur.push([x, y]); break;
      case "V": y = oy + num(); cur.push([x, y]); break;
      case "C": {
        const c1: Point = [ox + num(), oy + num()], c2: Point = [ox + num(), oy + num()], e: Point = [ox + num(), oy + num()];
        curve([c1, c2, e]);
        [cx, cy] = c2; [x, y] = e;
        break;
      }
      case "S": {
        const c1: Point = [2 * x - cx, 2 * y - cy], c2: Point = [ox + num(), oy + num()], e: Point = [ox + num(), oy + num()];
        curve([c1, c2, e]);
        [cx, cy] = c2; [x, y] = e;
        break;
      }
      case "Q": {
        const c: Point = [ox + num(), oy + num()], e: Point = [ox + num(), oy + num()];
        curve([c, e]);
        [x, y] = e;
        break;
      }
      case "Z":
        cur.push([sx, sy]);
        x = sx; y = sy;
        cmd = ""; // takes no numbers; a stray one falls to default and is skipped
        break;
      default:
        i++; // unsupported command: skip a token rather than loop forever
    }
    if (cmd.toUpperCase() !== "C" && cmd.toUpperCase() !== "S") [cx, cy] = [x, y];
  }
  if (cur.length > 1) strokes.push(cur);
  return strokes;
}

/** Traced art scaled into a w × h box the way an <svg viewBox> would be
    (uniform, centred), in that box's CSS px. */
export function fitPath(d: string, viewBox: string, w: number, h: number): Stroke[] {
  const [vx, vy, vw, vh] = viewBox.trim().split(/[\s,]+/).map(Number);
  const k = Math.min(w / vw, h / vh), ox = (w - vw * k) / 2, oy = (h - vh * k) / 2;
  return parsePath(d).map((st) => st.map(([x, y]) => [ox + (x - vx) * k, oy + (y - vy) * k] as Point));
}

// ─── Shapes ──────────────────────────────────────────────────────────────────
// Each builds strokes around a measured target. Geometry adapts to the target;
// thickness never does (the pen is passed in only to keep clear of the text).

/** A seeded random source, so a given mark looks the same on every load. */
export function seeded(key: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function catmullRom(pts: Point[], per: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < per; j++) {
      const t = j / per, t2 = t * t, t3 = t2 * t;
      const at = (d: 0 | 1) =>
        0.5 * (2 * p1[d] + (p2[d] - p0[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (3 * p1[d] - p0[d] - 3 * p2[d] + p3[d]) * t3);
      out.push([at(0), at(1)]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

const GESTURE_MID = GESTURE[6][1]; // the offset at u = 0.5

/** The scanned underline's own path from x0 to x1, its middle at y: the
    original rise and end flick, at the original slope whatever the length. */
function gestureLine(x0: number, x1: number, y: number): Stroke {
  const rise = (CORE * (x1 - x0)) / 1981; // texture px → this length
  return catmullRom(GESTURE.map(([u, v]) => [x0 + u * (x1 - x0), y + (v - GESTURE_MID) * rise]), 8);
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export const shapes: Record<MarkKind, (m: Metrics, pen: number, rand: () => number) => Stroke[]> = {
  underline(m, pen) {
    return [gestureLine(0, m.w, m.baseline + 0.17 * m.em + pen / 2)];
  },

  /** Through the middle of the lowercase letters, with the underline's rise. */
  strike(m) {
    const over = 0.06 * m.em;
    return [gestureLine(-over, m.w + over, m.baseline - 0.52 * m.xHeight)];
  },

  /** One loop by hand: started near the top left, carried round clockwise past
      the start, and landed outside it so the ends don't meet. */
  circle(m, pen, rand) {
    const between = (a: number, b: number) => a + (b - a) * rand();
    // Centred between the line box and the lowercase letters, which is where
    // the ink of a word sits whether or not it has capitals or descenders.
    const cx = m.w / 2, cy = (m.h / 2 + m.baseline - m.xHeight / 2) / 2;
    const rx = (m.w / 2) * 1.08 + 0.2 * m.em + pen;
    const ry = (m.h / 2) * 1.05 + pen;
    const lean = (between(-7, -4) * Math.PI) / 180;
    const start = between(-2.5, -2.2); // near the top left; y runs down
    const over = between(0.15, 0.25); // past the start, in laps
    const spiral = between(0.05, 0.08); // how far outside the start the tail lands
    const egg = between(0.04, 0.07); // wider at the top
    const flat = 0.25; // flatter along the bottom, where the hand pulls through
    // Low-frequency wobble: 2 and 3 lobes, about ±4% between them.
    const wobble = [2, 3].map((k) => [k, between(0.012, 0.022), between(0, 2 * Math.PI)]);
    const cos = Math.cos(lean), sin = Math.sin(lean);
    const pts: Stroke = [];
    const N = 240;
    for (let i = 0; i <= N; i++) {
      const u = ((1 + over) * i) / N, th = start + 2 * Math.PI * u;
      let r = 1;
      for (const [k, a, ph] of wobble) r += a * Math.sin(k * th + ph);
      r *= 1 + spiral * smoothstep(0.5, 1 + over, u);
      const c = Math.cos(th), s = Math.sin(th);
      const x = c * rx * r * (1 - egg * s);
      const y = (s > 0 ? s + flat * s * s * (1 - s * s) : s) * ry * r;
      pts.push([cx + x * cos - y * sin, cy + x * sin + y * cos]);
    }
    return [pts];
  },

  /** A loose rectangle round a block (a form field), in one stroke: set down
      just right of the top left corner, carried round clockwise, and run on
      past the start so the ends overlap rather than meet. Edges bow a little
      and corners land a little off, as a quick hand does. */
  box(m, pen, rand) {
    const between = (a: number, b: number) => a + (b - a) * rand();
    // Wide of the text sideways; vertically the pen rides the block's own
    // edges, where line-height leaves air round the glyphs, so it stays off
    // the text and clear of the block above or below.
    const px = 0.4 * m.em + pen, py = 0.1 * pen;
    const jx = () => between(-0.6, 0.6) * pen, jy = () => between(-0.3, 0.3) * pen;
    const corners: Point[] = [
      [-px + jx(), -py + jy()],
      [m.w + px + jx(), -py + jy()],
      [m.w + px + jx(), m.h + py + jy()],
      [-px + jx(), m.h + py + jy()],
    ];
    const startAt = between(0.04, 0.1); // along the top edge
    const over = between(0.12, 0.2); // past the start, along the top edge
    const lift = between(0.6, 1.2) * pen; // the tail rides out above the start
    const edge = (a: Point, b: Point, t0: number, t1: number, rise = 0): Stroke => {
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      const nx = dy / len, ny = -dx / len; // outward for clockwise travel
      const bow = between(-0.3, 0.6) * pen;
      const out: Stroke = [];
      const steps = Math.max(4, Math.round(((t1 - t0) * len) / 6));
      for (let i = 0; i <= steps; i++) {
        const t = t0 + ((t1 - t0) * i) / steps;
        const b2 = bow * Math.sin(Math.PI * t) + rise * smoothstep(t0, t1, t);
        out.push([a[0] + dx * t + nx * b2, a[1] + dy * t + ny * b2]);
      }
      return out;
    };
    const [tl, tr, br, bl] = corners;
    return [[
      ...edge(tl, tr, startAt, 1),
      ...edge(tr, br, 0, 1).slice(1),
      ...edge(br, bl, 0, 1).slice(1),
      ...edge(bl, tl, 0, 1).slice(1),
      ...edge(tl, tr, 0, startAt + over, lift).slice(1),
    ]];
  },
};
