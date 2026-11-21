
// Optional: devtools khulne par window ka outer/inner size farq normal dikhao.
(() => {
  const grab = (prop) => {
    const d = Object.getOwnPropertyDescriptor(window, prop)
      || Object.getOwnPropertyDescriptor(Window.prototype, prop);
    return d && d.get ? () => d.get.call(window) : () => 0;
  };
  const outerW = grab('outerWidth');
  const outerH = grab('outerHeight');
  const innerW = grab('innerWidth');
  const innerH = grab('innerHeight');

  // Docked devtools inner size chhota kar deta hai, outer wahi rehta hai.
  // Farq hadd se zyada ho to normal browser jaisa farq dikhao.
  const WIDTH_LIMIT = 100;   // normal: ~16
  const HEIGHT_LIMIT = 160;  // normal: ~85 se ~140
  const NORMAL_W = 16;
  const NORMAL_H = 100;

  const def = (prop, getter) => {
    try { Object.defineProperty(window, prop, { get: getter, set() {}, configurable: true }); } catch (e) {}
  };
  def('outerWidth', () => {
    const o = outerW();
    const i = innerW();
    return o - i > WIDTH_LIMIT ? i + NORMAL_W : o;
  });
  def('outerHeight', () => {
    const o = outerH();
    const i = innerH();
    return o - i > HEIGHT_LIMIT ? i + NORMAL_H : o;
  });
})();
