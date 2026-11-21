const btn = document.getElementById('toggle');
const pill = document.getElementById('pill');
const statusEl = document.getElementById('status');
const note = document.getElementById('note');
const testBtn = document.getElementById('test');
const resultsEl = document.getElementById('results');
const hasChrome = typeof chrome !== 'undefined' && chrome.storage;

const OPTIONS = ['mouse', 'select', 'copy', 'leave', 'track', 'devtools'];
const optBtn = Object.fromEntries(OPTIONS.map((k) => [k, document.getElementById(k)]));

const allBtn = document.getElementById('all');
const allLabel = document.getElementById('all-label');

let on = false;
const opt = { mouse: false, select: false, copy: false, leave: false, track: false, devtools: false };

function render() {
  document.body.dataset.on = String(on);
  btn.setAttribute('aria-checked', String(on));
  OPTIONS.forEach((k) => optBtn[k].setAttribute('aria-checked', String(opt[k])));
  const count = OPTIONS.filter((k) => opt[k]).length;
  allBtn.setAttribute('aria-checked', String(count === OPTIONS.length));
  allBtn.dataset.partial = String(count > 0 && count < OPTIONS.length);
  allLabel.textContent = count === OPTIONS.length ? 'All on' : count === 0 ? 'All off' : `${count} of ${OPTIONS.length} on`;
  pill.textContent = on ? 'On' : 'Off';
  statusEl.textContent = on
    ? 'Chrome sees only 1 screen'
    : 'Chrome sees 2 screens';
}

function bump() {
  document.body.classList.remove('bump');
  void document.body.offsetWidth;
  document.body.classList.add('bump');
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function init() {
  document.body.classList.add('no-anim');
  if (hasChrome) {
    const saved = await chrome.storage.local.get(['on', ...OPTIONS]);
    on = !!saved.on;
    OPTIONS.forEach((k) => { opt[k] = !!saved[k]; });
    const tab = await activeTab();

    if (!tab || !/^https?:\/\//.test(tab.url || '')) {
      note.textContent = 'This tab is not a website, so it will have no effect here';
      note.classList.add('warn');
    }
  }
  render();
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('no-anim')));
}

async function save() {
  if (!hasChrome) return;
  const res = await chrome.runtime.sendMessage({ type: 'set', on, ...opt });
  if (res && res.reloaded) note.textContent = 'Tab reloaded, new setting applied';
}

btn.addEventListener('click', () => {
  on = !on;
  render();
  bump();
  save();
});

// Master switch: sab on hon to sab off, warna sab on
allBtn.addEventListener('click', () => {
  const next = !OPTIONS.every((k) => opt[k]);
  OPTIONS.forEach((k) => { opt[k] = next; });
  render();
  save();
});

OPTIONS.forEach((k) => {
  optBtn[k].addEventListener('click', () => {
    opt[k] = !opt[k];
    render();
    save();
  });
});

// ---------- self-test ----------
// Ye function page ke MAIN world mein chalta hai, isliye bilkul self-contained hai.
async function pageTests(o) {
  const out = [];
  const add = (name, pass, detail = '') => out.push({ name, status: pass ? 'pass' : 'fail', detail });
  const skip = (name, why) => out.push({ name, status: 'skip', detail: why });
  const safe = async (name, fn) => {
    try { await fn(); } catch (e) { add(name, false, String(e && e.message || e)); }
  };

  await safe('screen.isExtended is false', () => add('screen.isExtended is false', window.screen.isExtended === false, String(window.screen.isExtended)));

  await safe('getScreenDetails shows 1 screen', async () => {
    if (typeof window.getScreenDetails !== 'function') return skip('getScreenDetails shows 1 screen', 'API not available');
    const d = await window.getScreenDetails();
    add('getScreenDetails shows 1 screen', d.screens.length === 1, `${d.screens.length} screen(s)`);
  });

  await safe('Window position inside primary screen', () => {
    const inside = window.screenX >= 0 && window.screenY >= 0
      && window.screenX + window.outerWidth <= window.screen.width + 1
      && window.screenY + window.outerHeight <= window.screen.height + 1;
    add('Window position inside primary screen', inside, `x=${window.screenX} y=${window.screenY}`);
  });

  await safe('availLeft / availTop are 0', () => add('availLeft / availTop are 0', window.screen.availLeft === 0 && window.screen.availTop === 0, `${window.screen.availLeft}, ${window.screen.availTop}`));

  await safe('Page reports focus and visible', () => add('Page reports focus and visible', document.hasFocus() && document.visibilityState === 'visible' && !document.hidden, `${document.visibilityState}`));

  await safe('Fullscreen state is consistent', () => add('Fullscreen state is consistent', document.fullscreen === !!document.fullscreenElement, `fullscreen=${document.fullscreen}`));

  await safe('matchMedia compound query works', () => {
    const ok = window.matchMedia('screen and (min-resolution: 0.01dppx)').matches === true
      && window.matchMedia('(min-resolution: 9999dppx)').matches === false;
    add('matchMedia compound query works', ok);
  });

  await safe('Mouse-leave hidden', () => {
    if (!o.mouse) return skip('Mouse-leave hidden', 'switch is off');
    let seen = false;
    const h = () => { seen = true; };
    const el = document.documentElement;
    el.addEventListener('mouseleave', h);
    el.dispatchEvent(new MouseEvent('mouseleave', { relatedTarget: null }));
    el.removeEventListener('mouseleave', h);
    add('Mouse-leave hidden', !seen);
  });

  await safe('Selection highlight hidden', () => {
    if (!o.select) return skip('Selection highlight hidden', 'switch is off');
    const s = document.createElement('span');
    s.textContent = 'x';
    document.documentElement.appendChild(s);
    const bg = getComputedStyle(s, '::selection').backgroundColor;
    s.remove();
    add('Selection highlight hidden', bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent', bg);
  });

  await safe('Copy/paste blocks removed', () => {
    if (!o.copy) return skip('Copy/paste blocks removed', 'switch is off');
    const el = document.createElement('div');
    el.textContent = 'x';
    el.style.userSelect = 'none';
    document.documentElement.appendChild(el);
    const sel = getComputedStyle(el).userSelect;
    el.remove();

    const block = (e) => e.preventDefault();
    document.addEventListener('copy', block);
    const ev = new Event('copy', { bubbles: true, cancelable: true });
    document.dispatchEvent(ev);
    document.removeEventListener('copy', block);
    add('Copy/paste blocks removed', sel === 'text' && !ev.defaultPrevented, `user-select=${sel}, copy cancelled=${ev.defaultPrevented}`);
  });

  await safe('Leave-page prompt skipped', () => {
    if (!o.leave) return skip('Leave-page prompt skipped', 'switch is off');
    let seen = false;
    const h = () => { seen = true; };
    window.addEventListener('beforeunload', h);
    window.dispatchEvent(new Event('beforeunload', { cancelable: true }));
    window.removeEventListener('beforeunload', h);
    add('Leave-page prompt skipped', !seen);
  });

  await safe('Selection/copy events hidden', () => {
    if (!o.track) return skip('Selection/copy events hidden', 'switch is off');
    let seen = false;
    const h = () => { seen = true; };
    ['selectionchange', 'copy'].forEach((n) => document.addEventListener(n, h));
    document.dispatchEvent(new Event('selectionchange'));
    document.dispatchEvent(new Event('copy', { bubbles: true, cancelable: true }));
    ['selectionchange', 'copy'].forEach((n) => document.removeEventListener(n, h));
    add('Selection/copy events hidden', !seen);
  });

  await safe('No DevTools size gap', () => {
    if (!o.devtools) return skip('No DevTools size gap', 'switch is off');
    const dw = window.outerWidth - window.innerWidth;
    const dh = window.outerHeight - window.innerHeight;
    add('No DevTools size gap', dw <= 100 && dh <= 160, `width gap=${dw}, height gap=${dh}`);
  });

  return out;
}

function showResults(list) {
  resultsEl.textContent = '';
  list.forEach(({ name, status, detail }) => {
    const li = document.createElement('li');
    li.className = status;
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = status === 'pass' ? 'OK' : status === 'fail' ? 'FAIL' : 'SKIP';
    const text = document.createElement('span');
    text.textContent = name;
    li.append(tag, text);
    if (detail) {
      const d = document.createElement('span');
      d.className = 'detail';
      d.textContent = `(${detail})`;
      li.append(d);
    }
    resultsEl.append(li);
  });
}

testBtn.addEventListener('click', async () => {
  if (!hasChrome) return;
  const tab = await activeTab();
  if (!tab || !tab.id || !/^https?:\/\//.test(tab.url || '')) {
    note.textContent = 'Open a website tab first, then run the test';
    note.classList.add('warn');
    return;
  }
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: pageTests,
      args: [{ ...opt }],
    });
    showResults(result);
    note.classList.remove('warn');
    note.textContent = on
      ? 'FAIL means this tab was opened before the setting was applied. Reload it and test again'
      : 'Unimon is OFF, so FAIL here is expected';
  } catch (e) {
    note.textContent = 'Test could not run on this tab';
    note.classList.add('warn');
  }
});

init();
