
const MATCHES = chrome.runtime.getManifest().host_permissions;
const ICON_SIZES = [16, 32, 48, 128];
const iconPaths = (prefix) => Object.fromEntries(ICON_SIZES.map((s) => [s, `icons/${prefix}${s}.png`]));

async function register(id, script, enabled) {
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
  if (existing.length) await chrome.scripting.unregisterContentScripts({ ids: [id] });
  if (!enabled) return;
  await chrome.scripting.registerContentScripts([{
    id,
    matches: MATCHES,
    runAt: 'document_start',
    allFrames: true,
    ...script,
  }]);
}

async function apply({ on, mouse, select, copy, leave, track, devtools }) {
  await register('unimon-track', { js: ['inject-track.js'], world: 'MAIN' }, on && track);
  await register('unimon-devtools', { js: ['inject-devtools.js'], world: 'MAIN' }, on && devtools);
  await register('unimon-main', { js: ['inject.js'], world: 'MAIN' }, on);
  await register('unimon-mouse', { js: ['inject-mouse.js'], world: 'MAIN' }, on && mouse);
  await register('unimon-select', { css: ['select.css'] }, on && select);
  await register('unimon-copy', { js: ['inject-copy.js'], css: ['copy.css'], world: 'MAIN' }, on && copy);
  await register('unimon-leave', { js: ['inject-leave.js'], world: 'MAIN' }, on && leave);

  await chrome.action.setIcon({ path: iconPaths(on ? 'icon-on' : 'icon') });
  await chrome.action.setBadgeText({ text: on ? 'ON' : '' });
  await chrome.action.setBadgeBackgroundColor({ color: '#ff6b4a' });
  await chrome.action.setTitle({ title: `Unimon: ${on ? 'ON' : 'OFF'}` });
}

async function getState() {
  const { on = false, mouse = false, select = false, copy = false, leave = false, track = false, devtools = false } =
    await chrome.storage.local.get(['on', 'mouse', 'select', 'copy', 'leave', 'track', 'devtools']);
  return { on, mouse, select, copy, leave, track, devtools };
}

chrome.runtime.onInstalled.addListener(async () => {
  // purani script ids hata do (rename se pehle wali)
  for (const id of ['single-screen', 'single-screen-mouse']) {
    try { await chrome.scripting.unregisterContentScripts({ ids: [id] }); } catch (e) {}
  }
  apply(await getState());
});
chrome.runtime.onStartup.addListener(async () => apply(await getState()));

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== 'set') return;
  (async () => {
    const state = {
      on: !!msg.on, mouse: !!msg.mouse, select: !!msg.select, copy: !!msg.copy, leave: !!msg.leave,
      track: !!msg.track, devtools: !!msg.devtools,
    };
    await chrome.storage.local.set(state);
    await apply(state);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let reloaded = false;
    if (tab && tab.id && /^https?:\/\//.test(tab.url || '')) {
      await chrome.tabs.reload(tab.id);
      reloaded = true;
    }
    sendResponse({ ok: true, reloaded });
  })();
  return true;
});
