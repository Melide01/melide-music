# AGENTS.md

## Project overview

This repository is a static front-end website for a music/media brand. It uses plain HTML, CSS, and vanilla JavaScript with ES modules. There is no package manager, build step, framework, or test runner in the repo, so keep changes lightweight and browser-native unless the user explicitly asks for more tooling.

## Key conventions

- Prefer browser-native DOM APIs over frameworks or libraries.
- Keep app structure simple: root-level pages and section-specific folders such as `books/`, `moodboard/`, and `merch/`.
- Use ES module imports and keep script files small and focused.
- Preserve the existing multilingual pattern and naming style, especially navigation labels like `MENU/ACCUEIL`, `MENU/MUSIQUE`, and similar translated strings.
- Prefer minimal, targeted edits that match the current code patterns instead of refactoring the whole app.
- Avoid adding Node-based tooling, bundlers, or package installation unless the task explicitly requires it.

## Important files

- [index.html](index.html): main entry page; loads the app stylesheet and `script.js`.
- [script.js](script.js): top-level application shell, navigation setup, and routing-like section switching.
- [js/tracks.js](js/Tracks.js): track list rendering and media-link formatting.
- [js/local.js](js/Local.js): localization hook; currently empty and likely intended for translation logic.
- [books/books.js](books/books.js): book model and renderer.
- [moodboard/script.js](moodboard/script.js): moodboard gallery logic.

## Working expectations

- Keep changes compatible with modern browsers and plain static hosting.
- When a page or feature depends on external APIs, preserve the current fetch pattern and avoid unnecessary abstraction.
- Treat this as a static site project: prefer direct DOM manipulation and simple utilities over architectural complexity.
- Before making broad changes, inspect the surrounding files for the same pattern so the fix stays consistent with the rest of the project.

## Validation

There is no automated build/test pipeline in this repository. Validate by checking that the edited script remains syntactically valid in the browser and that the behavior matches the surrounding code patterns.
