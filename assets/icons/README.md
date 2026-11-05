# Custom site icons

Add each icon's class name to `manifest.json` and place its SVG in this folder with the matching filename. For example, to enable `solid-project`, include it in the manifest and add `solid-project.svg`.

The planned icon names are:

- `solid-project.svg`
- `solid-merch.svg`
- `solid-cart.svg`
- `solid-account.svg`
- `solid-music.svg`
- `solid-book.svg`
- `solid-game.svg`
- `brand-melide.svg`

Use the same class on the icon element as the Font Awesome-style name, such as `solid-project`. Until the icon is listed in the manifest and its SVG exists, the current Font Awesome icon remains as a fallback. Icons are displayed at the surrounding text size, so use a square `viewBox` (for example `0 0 24 24`) and let the SVG preserve its own aspect ratio.
