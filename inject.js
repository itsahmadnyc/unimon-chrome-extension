
(() => {
  const def = (obj, prop, getter) => {
    try {
      Object.defineProperty(obj, prop, { get: getter, set() {}, configurable: true });
    } catch (e) {}
  };

  // ---- 1. Multi-screen API: sirf 1 screen dikhao ----
  def(Screen.prototype, 'isExtended', () => false);

  const makeOnlyScreen = () => {
    const s = window.screen;
    const only = new EventTarget();
    Object.assign(only, {
      left: 0, top: 0, availLeft: 0, availTop: 0,
      width: s.width, height: s.height,
      availWidth: s.availWidth, availHeight: s.availHeight,
      colorDepth: s.colorDepth, pixelDepth: s.pixelDepth,
      orientation: s.orientation,
      isExtended: false, isPrimary: true, isInternal: true,
      devicePixelRatio: window.devicePixelRatio,
      label: 'Single test screen',
      onchange: null,
    });
    return only;
  };

  window.getScreenDetails = async () => {
    const only = makeOnlyScreen();
    const details = new EventTarget();
    Object.defineProperty(details, 'screens', { get: () => [only] });
    Object.defineProperty(details, 'currentScreen', { get: () => only });
    details.onscreenschange = null;
    details.oncurrentscreenchange = null;
    return details;
  };

  // ---- 2. Window position: dusri screen pe ja kar bhi position primary ke andar dikhao ----
  const clamp = (v, max) => Math.min(Math.max(v, 0), Math.max(0, max));
  const maxX = () => window.screen.width - window.outerWidth;
  const maxY = () => window.screen.height - window.outerHeight;

  const origGetter = (prop) => {
    const d = Object.getOwnPropertyDescriptor(window, prop)
      || Object.getOwnPropertyDescriptor(Window.prototype, prop);
    return d && d.get ? () => d.get.call(window) : () => 0;
  };
  const realX = origGetter('screenX');
  const realY = origGetter('screenY');
  def(window, 'screenX', () => clamp(realX(), maxX()));
  def(window, 'screenY', () => clamp(realY(), maxY()));
  def(window, 'screenLeft', () => window.screenX);
  def(window, 'screenTop', () => window.screenY);
  def(Screen.prototype, 'availLeft', () => 0);
  def(Screen.prototype, 'availTop', () => 0);

  // ---- 3. Focus / visibility: dusri screen pe click karne se blur wagaira na dikhe ----
  const isRoot = (t) => t === window || t === document;
  const swallow = (e) => { if (isRoot(e.target)) e.stopImmediatePropagation(); };
  ['blur', 'focusout'].forEach((n) => window.addEventListener(n, swallow, true));
  ['visibilitychange', 'webkitvisibilitychange', 'pagehide', 'freeze'].forEach((n) => {
    window.addEventListener(n, swallow, true);
    document.addEventListener(n, swallow, true);
  });

  try { Document.prototype.hasFocus = () => true; } catch (e) {}
  def(Document.prototype, 'visibilityState', () => 'visible');
  def(Document.prototype, 'hidden', () => false);
  def(Document.prototype, 'webkitVisibilityState', () => 'visible');
  def(Document.prototype, 'webkitHidden', () => false);

  // ---- 4. Fullscreen: user bahar nikle to bhi website ko fullscreen hi dikhao ----
  const realFs = (prop) => {
    const d = Object.getOwnPropertyDescriptor(Document.prototype, prop);
    return d && d.get ? () => d.get.call(document) : () => null;
  };
  const realFsEl = realFs('fullscreenElement');
  const realWebkitFsEl = realFs('webkitFullscreenElement');
  let fakeFsEl = null; // element jo website ne fullscreen mangi thi

  const wrapRequest = (name) => {
    const orig = Element.prototype[name];
    if (typeof orig !== 'function') return;
    Element.prototype[name] = function (...args) {
      const el = this;
      const p = orig.apply(this, args);
      Promise.resolve(p).then(() => { fakeFsEl = el; }, () => {});
      return p;
    };
  };
  ['requestFullscreen', 'webkitRequestFullscreen', 'webkitRequestFullScreen'].forEach(wrapRequest);

  const wrapExit = (name) => {
    const orig = Document.prototype[name];
    if (typeof orig !== 'function') return;
    Document.prototype[name] = function (...args) {
      fakeFsEl = null; // website ne khud exit manga hai, to asli state dikhao
      return realFsEl() ? orig.apply(this, args) : Promise.resolve();
    };
  };
  ['exitFullscreen', 'webkitExitFullscreen', 'webkitCancelFullScreen'].forEach(wrapExit);

  def(Document.prototype, 'fullscreenElement', () => realFsEl() || fakeFsEl);
  def(Document.prototype, 'webkitFullscreenElement', () => realWebkitFsEl() || fakeFsEl);
  def(Document.prototype, 'webkitCurrentFullScreenElement', () => realWebkitFsEl() || fakeFsEl);
  def(Document.prototype, 'fullscreen', () => !!(realFsEl() || fakeFsEl));
  def(Document.prototype, 'webkitIsFullScreen', () => !!(realFsEl() || fakeFsEl));

  // bahar nikalne wala fullscreenchange (real fullscreen nahi hai, magar fake hai) block karo
  ['fullscreenchange', 'webkitfullscreenchange'].forEach((n) => {
    const block = (e) => { if (!realFsEl() && fakeFsEl) e.stopImmediatePropagation(); };
    document.addEventListener(n, block, true);
    window.addEventListener(n, block, true);
  });

  // ---- 5. Window size: fake fullscreen mein size bhi screen ke barabar dikhao ----
  const fsActive = () => !realFsEl() && !!fakeFsEl;
  ['innerWidth', 'innerHeight', 'outerWidth', 'outerHeight'].forEach((prop) => {
    const real = origGetter(prop);
    const isWidth = /Width$/.test(prop);
    def(window, prop, () => (fsActive() ? (isWidth ? window.screen.width : window.screen.height) : real()));
  });

  // ---- 6. Resize / orientation events ----
  // resize sirf tab block karo jab fake fullscreen chal raha ho (warna page layout toot jayega)
  window.addEventListener('resize', (e) => { if (e.target === window && fsActive()) e.stopImmediatePropagation(); }, true);
  window.addEventListener('orientationchange', (e) => e.stopImmediatePropagation(), true);

  // ---- 7. matchMedia: display-mode aur resolution queries ----
  const startDpr = window.devicePixelRatio || 1;
  const compare = (kind, actual, wanted) =>
    kind === 'min' ? actual >= wanted : kind === 'max' ? actual <= wanted : Math.abs(actual - wanted) < 0.001;

  const spoofCond = (q) => {
    const s = String(q).trim();
    let m = s.match(/^\(\s*display-mode\s*:\s*([\w-]+)\s*\)$/i);
    if (m) {
      if (!fsActive()) return null;
      return m[1].toLowerCase() === 'fullscreen';
    }
    m = s.match(/^\(\s*(?:(min|max)-)?resolution\s*:\s*([\d.]+)\s*(dppx|x|dpi|dpcm)\s*\)$/i);
    if (m) {
      const n = parseFloat(m[2]);
      const unit = m[3].toLowerCase();
      const wanted = unit === 'dpi' ? n / 96 : unit === 'dpcm' ? n / 37.795 : n;
      return compare(m[1] && m[1].toLowerCase(), startDpr, wanted);
    }
    m = s.match(/^\(\s*(?:-webkit-)?(?:(min|max)-)?(?:-webkit-)?device-pixel-ratio\s*:\s*([\d.]+)\s*\)$/i);
    if (m) return compare(m[1] && m[1].toLowerCase(), startDpr, parseFloat(m[2]));
    // range syntax: (resolution >= 2dppx) / (2dppx <= resolution)
    m = s.match(/^\(\s*resolution\s*(>=|<=|>|<|=)\s*([\d.]+)\s*(dppx|x|dpi|dpcm)\s*\)$/i);
    if (m) {
      const n = parseFloat(m[2]);
      const unit = m[3].toLowerCase();
      const w = unit === 'dpi' ? n / 96 : unit === 'dpcm' ? n / 37.795 : n;
      const op = m[1];
      return op === '>=' ? startDpr >= w : op === '<=' ? startDpr <= w : op === '>' ? startDpr > w : op === '<' ? startDpr < w : Math.abs(startDpr - w) < 0.001;
    }
    return null;
  };

  const origMatchMedia = window.matchMedia.bind(window);

  // Lambi query ko tukdon mein todo: "a, b" (OR) aur "type and (x) and (y)" (AND).
  // Jo tukde spoof ho sakte hain wo spoof, baaqi asli browser se poochho.
  const evalQuery = (q) => {
    const s = String(q).trim();
    if (!s) return origMatchMedia(s).matches;
    // nested brackets / "or" / "not (" wali naye syntax ki queries asli browser par chhod do
    if (/\(\s*\(|\bor\b|\bnot\s*\(/i.test(s)) return null;
    let any = false;
    for (const alt of s.split(',')) {
      let part = alt.trim();
      let negate = false;
      if (/^not\s+/i.test(part)) { negate = true; part = part.replace(/^not\s+/i, ''); }
      part = part.replace(/^only\s+/i, '');
      let ok = true;
      for (const tok of part.split(/\s+and\s+/i)) {
        const t = tok.trim();
        if (!t) continue;
        let v = t.startsWith('(') ? spoofCond(t) : null;
        if (v === null) v = origMatchMedia(t).matches;
        if (!v) { ok = false; break; }
      }
      if (negate ? !ok : ok) { any = true; break; }
    }
    return any;
  };

  window.matchMedia = function (q) {
    const mql = origMatchMedia(q);
    const isTarget = /display-mode|resolution|device-pixel-ratio/i.test(String(q));
    if (!isTarget) return mql;
    try {
      Object.defineProperty(mql, 'matches', {
        get: () => { const v = evalQuery(q); return v === null ? origMatchMedia(q).matches : v; },
        configurable: true,
      });
      // change events (jaise dusri screen par jaane se) website tak na pohanchein
      mql.addEventListener = () => {};
      mql.addListener = () => {};
      Object.defineProperty(mql, 'onchange', { get: () => null, set() {}, configurable: true });
    } catch (e) {}
    return mql;
  };
})();
