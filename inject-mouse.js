
// Optional: cursor page se bahar jaye to website ko pata na chale.
(() => {
  const isRoot = (t) => t === window || t === document || t === document.documentElement || t === document.body;

  // mouseleave: sirf page-level elements par block
  window.addEventListener('mouseleave', (e) => { if (isRoot(e.target)) e.stopImmediatePropagation(); }, true);
  document.addEventListener('mouseleave', (e) => { if (isRoot(e.target)) e.stopImmediatePropagation(); }, true);

  // mouseout/mouseover jab cursor window se bahar jaye (relatedTarget null hota hai)
  const outOfWindow = (e) => { if (e.relatedTarget === null) e.stopImmediatePropagation(); };
  window.addEventListener('mouseout', outOfWindow, true);
  document.addEventListener('mouseout', outOfWindow, true);
})();
