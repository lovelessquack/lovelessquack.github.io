# Repository Guidelines

## Project Structure & Module Organization
This repository is a small static site. The root `index.html` is the landing page. Feature pages live in `html/`: `card.html` for the text card generator and `chat.html` for the chat screenshot generator. Shared frontend assets live in `static/`: `index.css` contains the shared theme and layout styles, `index.js` drives card generation, and `chat.js` handles chat composition and export. There is no build output directory; files are served directly from the repo.

## Build, Test, and Development Commands
There is no package-based build step or test runner configured.

- `python -m http.server 8000`
  Runs a local static server from the repository root.
- Open `http://localhost:8000/`
  Use this for normal development and manual QA.
- `start index.html`
  Quick smoke check for markup and styling, but browser APIs such as clipboard/export behave more reliably over `http://localhost`.

## Coding Style & Naming Conventions
Use 4-space indentation in HTML, CSS, and JavaScript. Keep JavaScript framework-free and prefer plain DOM APIs, matching the existing files in `static/`. Use `camelCase` for variables and functions (`loadRandomAvatar`, `generateCard`), and `kebab-case` for CSS classes and file names (`chat-row-right`, `index.css`). Add shared styling in `static/index.css`; avoid scattering new inline styles unless the change is truly page-specific.

## Testing Guidelines
Manual testing is the current standard. Validate all three entry points: `index.html`, `html/card.html`, and `html/chat.html`. For UI changes, check desktop and mobile widths, theme switching, avatar loading, and the save/copy flows powered by `html2canvas`. If a change touches external resources, confirm the page still works when served locally.

## Commit & Pull Request Guidelines
Recent history uses very short subjects such as `调整架构`, `11`, and `1`. Keep commits brief, but make them descriptive and action-oriented, for example `card: fix X layout overflow`. Pull requests should include a short summary, affected pages or assets, manual test notes, and screenshots or GIFs for visible UI changes. Link the related issue when one exists.

## Security & Configuration Tips
This site depends on third-party runtime resources such as Google Fonts, CDNJS `html2canvas`, DiceBear, and Unavatar. Do not add secrets to the repo. Treat new external URLs carefully and verify CORS-sensitive features after any dependency change.

## Init Snapshot
Initialization was completed on 2026-04-14. The current repository layout matches the guidance above: root `index.html`, feature pages in `html/`, and shared assets in `static/`. The git working tree was clean on branch `main` at init time.

Current implementation notes:
- `html/card.html` is the text share card generator.
- `html/chat.html` is the chat screenshot generator with a WeChat-style preview.
- `static/index.js` handles card rendering, theme switching, avatar loading, save/copy via `html2canvas`, and a server-submit action.
- `static/chat.js` handles chat message composition, avatar setup, and save/copy via `html2canvas`.

Known risks and watchpoints:
- Several page/source reads showed obvious mojibake, indicating an encoding mismatch risk in existing HTML/JS/CSS content. Be careful when editing Chinese copy until encoding is verified.
- `static/index.js` currently contains a hard-coded POST target `http://192.168.2.3:9991/api/duanzi` and an `X-API-Key`. Treat that as sensitive configuration and avoid expanding this pattern.
- Clipboard and export features depend on browser security context and third-party assets, so prefer validating over `http://localhost:8000/` instead of opening files directly.
