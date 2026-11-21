<div align="center">

<img src="icons/icon128.png" alt="Unimon icon" width="96" height="96">

# Unimon

**One monitor. Zero second-screen signals.**

A tiny Chrome extension that makes the browser look like it only has a single screen, so you can see how your own website behaves when it can't detect a second display.

![Manifest V3](https://img.shields.io/badge/Manifest-V3-ff6b4a?style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-3a332d?style=flat-square)
![Works on](https://img.shields.io/badge/Works%20on-http%20%26%20https%20sites-d6eee2?style=flat-square&labelColor=3a332d)

</div>

---

## What it does

Turn the main switch on and Unimon tells every website you visit that:

- there is only **one** screen (`screen.isExtended`, `getScreenDetails()`)
- the window is always **inside the primary screen** (`screenX`, `screenY`, `availLeft`, `availTop`)
- the tab is always **focused and visible** (`blur`, `visibilitychange`, `document.hasFocus()`)
- fullscreen is still **fullscreen**, even if you step out (`fullscreenElement`, `fullscreenchange`)
- the window **size looks consistent** (`innerWidth`, `outerHeight`, `resize`, `orientationchange`)
- `matchMedia` agrees with all of the above (`display-mode`, `resolution`, compound queries)

## Extra options

Everything below is optional and off by default. There is also an **All on / All off** master switch.

| Option | What it does |
| --- | --- |
| Hide mouse leaving page | Blocks `mouseleave` / `mouseout` when the cursor exits the window |
| Hide selection highlight | Removes the blue selection colour. Text still selects and copies normally |
| Allow copy & paste | Removes `user-select: none`, and stops pages from cancelling copy, cut, paste, right-click and select |
| Hide selection & copy events | Stops pages from listening to `selectionchange`, `copy` and `cut` |
| Skip leave-page prompt | No "Leave site?" dialog |
| Hide DevTools size gap | Keeps `outerWidth` / `outerHeight` looking normal when DevTools is docked |

## Self-test

Open any website, click **Run self-test on this tab** in the popup, and Unimon checks each feature and shows **OK**, **FAIL** or **SKIP** (when its switch is off). If something fails while Unimon is on, reload the tab and run it again.

## Install

Unimon isn't on the Chrome Web Store, so load it as an unpacked extension:

1. Download or clone this repo.
2. Open `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select this folder.
5. Pin the icon, open the popup and flip the switch.

```bash
git clone https://github.com/itsahmadnyc/unimon-chrome-extension.git
```

After changing any file, hit **Reload** on the extension's card and refresh the tab you are testing.

## How it works

Unimon registers small content scripts that run in the page's own JavaScript world (`world: "MAIN"`) at `document_start`, so they can override browser APIs before the website's code runs. Settings live in `chrome.storage.local`, and the toolbar icon changes to a sleeping monitor while Unimon is on.

```
manifest.json        extension config (Manifest V3)
background.js        registers / unregisters the scripts, icon and badge
popup.html/css/js    the popup UI and the self-test
inject.js            main spoofing: screens, position, focus, fullscreen, size, matchMedia
inject-mouse.js      mouse-leave option
inject-copy.js       copy / paste option   (+ copy.css)
inject-track.js      selection and copy events option
inject-leave.js      leave-page prompt option
inject-devtools.js   DevTools size gap option
select.css           selection highlight option
icons/               toolbar icons (off and on)
```

## Limits

- It only changes what **JavaScript on the page** can see. It cannot hide anything from the operating system, other software on your computer, or a server that checks things on its side.
- Not covered: console-getter tricks and `debugger` timing for DevTools detection.
- `matchMedia` spoofing covers simple and `and` / comma queries. Newer nested or `or` syntax falls back to the real answer.
- Browser zoom and a different monitor scale both change `devicePixelRatio`, and a page can't tell them apart. Set your zoom before loading the page.
- It does nothing on `chrome://` pages, the Web Store, or other pages Chrome doesn't let extensions touch.

## Responsible use

Unimon is meant as a **developer and testing tool**: use it on your own websites and apps, or where you have permission, to check how they behave with a single screen. Please don't use it to break the rules of an exam, assessment or any service you don't control. The software is provided as is (see the license), and you are responsible for how you use it.

## License

[MIT](LICENSE)
