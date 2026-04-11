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
