# Contributing to Unimon

Thanks for wanting to help! Bug reports, ideas and pull requests are all welcome. 🧡

## Ways to contribute

- **Report a bug**: open an [issue](../../issues/new/choose) and tell us what happened.
- **Suggest a feature**: open an issue and describe the problem it would solve.
- **Send a pull request**: fixes, new options, better docs, nicer UI.

## Run it locally

No build step, it is plain JavaScript.

1. Fork and clone the repo.
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and pick the repo folder.
3. After editing a file, press **Reload** on the extension card and refresh the tab you are testing.
4. Open any website and press **Run self-test on this tab** in the popup to check your change.

## Pull request checklist

- [ ] One focused change per pull request
- [ ] Works with the popup's **self-test** (add a new check there if you add a new option)
- [ ] New options are **off by default** and appear in the popup under *Extra options*
- [ ] Scripts that change the page live in their own `inject-*.js` file and are registered in `background.js`
- [ ] No new permissions in `manifest.json` unless really needed, and explain why in the PR
- [ ] README is updated if behaviour changes
- [ ] Code and comments are in English

## Code style

- Plain modern JavaScript (no frameworks, no dependencies)
- 2-space indent, semicolons, single quotes
- Wrap risky browser-API overrides in `try / catch` so one failure can't break a page
- Match the look of the popup: colours come from the CSS variables in `popup.css`

## What we won't merge

Unimon is a **developer and testing tool**. Pull requests that are aimed at beating a specific exam, proctoring or anti-cheat service, or that add data collection or tracking, will be declined.

## Questions

Not sure about something? Open an issue and ask, there are no silly questions.
