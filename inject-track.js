
// Optional: selectionchange / copy / cut events website ke listeners tak na pohanchein.
// Default action (selection aur copy) normal chalta rehta hai, sirf page ko khabar nahi hoti.
// paste ko chhoda hai kyunke editors usi par chalte hain.
(() => {
  const swallow = (e) => e.stopImmediatePropagation();
  ['selectionchange', 'copy', 'cut'].forEach((n) => {
    window.addEventListener(n, swallow, true);
    document.addEventListener(n, swallow, true);
  });
  try {
    ['onselectionchange', 'oncopy', 'oncut'].forEach((p) => {
      [Document.prototype, HTMLElement.prototype, window].forEach((o) => {
        Object.defineProperty(o, p, { get: () => null, set() {}, configurable: true });
      });
    });
  } catch (e) {}
})();
