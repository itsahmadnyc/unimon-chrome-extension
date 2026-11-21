
// Optional: "Leave site? Changes may not be saved" wala prompt na aaye.
(() => {
  window.addEventListener('beforeunload', (e) => e.stopImmediatePropagation(), true);
  try {
    Object.defineProperty(window, 'onbeforeunload', { get: () => null, set() {}, configurable: true });
  } catch (e) {}
})();
