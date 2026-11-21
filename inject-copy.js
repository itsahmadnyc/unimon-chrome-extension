
// Optional: websites ki copy / paste / right-click / select ki rukawat hatao.
(() => {
  const BLOCKED = new Set(['copy', 'cut', 'paste', 'contextmenu', 'selectstart', 'dragstart']);

  // Ye event preventDefault() se cancel nahi hone chahiye.
  const mustNotCancel = (e) => {
    if (BLOCKED.has(e.type)) return true;
    if ((e.type === 'mousedown' || e.type === 'mouseup') && e.button === 2) return true;
    if (e.type === 'keydown' && (e.ctrlKey || e.metaKey) && /^[cxvau]$/i.test(e.key)) return true;
    return false;
  };

  // Listeners chalne dete hain (editors kharab nahi hote), sirf cancel karna rokte hain.
  const origPreventDefault = Event.prototype.preventDefault;
  Event.prototype.preventDefault = function () {
    if (mustNotCancel(this)) return;
    return origPreventDefault.apply(this, arguments);
  };

  try {
    const rv = Object.getOwnPropertyDescriptor(Event.prototype, 'returnValue');
    if (rv && rv.set) {
      Object.defineProperty(Event.prototype, 'returnValue', {
        get: rv.get,
        set(v) { if (mustNotCancel(this)) return; rv.set.call(this, v); },
        configurable: true,
      });
    }
  } catch (e) {}

  // Inline handlers (oncopy="return false") aur on* properties
  const ATTRS = ['oncopy', 'oncut', 'onpaste', 'oncontextmenu', 'onselectstart', 'ondragstart'];
  const noopProp = (obj, prop) => {
    try {
      Object.defineProperty(obj, prop, { get: () => null, set() {}, configurable: true });
    } catch (e) {}
  };
  ATTRS.forEach((p) => {
    [HTMLElement.prototype, Document.prototype, window].forEach((o) => noopProp(o, p));
  });

  const selector = ATTRS.map((a) => `[${a}]`).join(',');
  let scheduled = false;
  const strip = () => {
    scheduled = false;
    document.querySelectorAll(selector).forEach((el) => ATTRS.forEach((a) => el.removeAttribute(a)));
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(strip);
  };
  new MutationObserver(schedule).observe(document, {
    subtree: true, childList: true, attributes: true, attributeFilter: ATTRS,
  });
  document.addEventListener('DOMContentLoaded', strip);
})();
