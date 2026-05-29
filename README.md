# MultiView — Electron Dashboard

A multi-page dashboard that displays multiple websites simultaneously in a configurable CSS grid. Each tile runs in its own real Chromium process via Electron `<webview>`, bypassing `X-Frame-Options` restrictions.

---

## Requirements

- **Node.js** 18 or later — https://nodejs.org
- **npm** (bundled with Node.js)
- **Windows** or **Linux** (x64)

---

## Installation

```bash
npm install
```

---

## Run (development)

```bash
npm start
```

The app reads `assets/sites.json` in development mode.

---

## Build (packaged executable)

### Windows

```bash
node_modules/.bin/electron-packager . MultiView --platform=win32 --arch=x64 --out=dist --overwrite --ignore=node_modules/electron-builder --ignore=node_modules/@electron/packager --ignore=dist --ignore=assets
xcopy /E /I /Y assets dist\MultiView-win32-x64\config\
```

Output: `dist\MultiView-win32-x64\MultiView.exe`

### Linux

```bash
node_modules/.bin/electron-packager . MultiView --platform=linux --arch=x64 --out=dist-linux --ignore=node_modules/electron-builder --ignore=node_modules/@electron/packager --ignore=dist-linux --ignore=assets
cp -r assets/. dist-linux/MultiView-linux-x64/config/
```

Output: `dist-linux/MultiView-linux-x64/MultiView`

```bash
chmod +x dist-linux/MultiView-linux-x64/MultiView
./dist-linux/MultiView-linux-x64/MultiView
```

#### Linux system dependencies (Ubuntu/Debian)

```bash
sudo apt install libgtk-3-0 libnss3 libxss1 libasound2
```

---

## Distribution layout

After building, the output folder contains:

```
MultiView-win32-x64/
  MultiView.exe
  config/              ← edit these without recompiling
    sites.json
    logos/
      logo1.png … logo5.png
  resources/
  ...
```

Only the `config/` folder needs to be edited to reconfigure the dashboard. The executable does not need to be rebuilt.

---

## Configuration — `config/sites.json`

All settings are in `sites.json`. In development this file lives at `assets/sites.json`; in a packaged build it lives at `config/sites.json` next to the executable.

### Top-level options

| Key | Type | Description |
|---|---|---|
| `background` | string | CSS background of the app (hex, rgb, gradient…) |
| `hideScrollbars` | boolean | Hide scrollbars globally in all webviews |
| `title` | object | Optional title bar at the top |
| `logoBar` | object | Logo bar configuration |
| `pages` | array | One or more dashboard pages (tabs) |

### `title`

```json
"title": {
  "text": "My Dashboard",
  "color": "#ffffff",
  "size": 20,
  "position": "top"
}
```

Leave `text` empty (`""`) to hide the title bar entirely.

### `logoBar`

```json
"logoBar": {
  "position": "bottom",
  "plateColor": "rgb(238, 241, 245)",
  "height": 64
}
```

- `position`: `"top"` or `"bottom"`
- `plateColor`: any CSS color for the plate behind the logos
- `height`: bar height in px; logo images scale automatically (`height - 30`)

### `pages`

Each page becomes a tab. The tab bar is only shown when there are two or more pages.

```json
"pages": [
  {
    "name": "Overview",
    "gridCols": 10,
    "gridRows": 6,
    "sites": [ ... ]
  },
  {
    "name": "Energy",
    "gridCols": 10,
    "gridRows": 6,
    "sites": [ ... ]
  }
]
```

### `sites` — per tile

```json
{
  "title": "Site label",
  "url": "https://example.com/",
  "grid": { "col": 1, "row": 1, "colSpan": 3, "rowSpan": 2 },
  "zoom": 1.0,
  "hideScrollbars": true
}
```

| Key | Description |
|---|---|
| `title` | Label shown in the tile header |
| `url` | Full URL to load |
| `grid.col` | Starting grid column (1-based) |
| `grid.row` | Starting grid row (1-based) |
| `grid.colSpan` | Number of columns to span |
| `grid.rowSpan` | Number of rows to span |
| `zoom` | Webview zoom factor (`1.0` = 100%, `0.8` = 80%) |
| `hideScrollbars` | Override global `hideScrollbars` for this tile |

#### Grid sizing

The grid uses a 10-column × 6-row base by default (`gridCols`, `gridRows`). To place tiles at half-unit positions, double the resolution (e.g. 20 × 12) and use `colSpan: 3` for 1.5 units.

---

## Logos

Replace the files in `config/logos/` with your own images:

```
logo1.png … logo5.png
```

Images are displayed in order (1 → 5) in the logo bar. Use PNG with transparency for best results. Height is controlled by `logoBar.height`.

---

## UI controls

| Control | Action |
|---|---|
| **⛶** (tile) | Expand tile to fullscreen with animation |
| **⟳** (tile) | Reload that tile only |
| **✕** (tile, fullscreen) | Exit fullscreen |
| **Esc** | Exit fullscreen |
| **⟳** (bottom-right) | Reload all tiles across all pages |
| **⛶** (bottom-right) | Toggle application fullscreen (F11-style) |
| Tab bar | Switch between pages (all pages stay loaded in background) |

---

## Source layout

```
electron_impl/
  src/
    main.js          — Electron main process, window creation, IPC
    preload.js       — Reads sites.json, exposes API to renderer
    renderer/
      index.html
      app.js         — Grid, tabs, fullscreen, logo bar logic
      style.css
  assets/            — Used in development
    sites.json
    logos/
  package.json
```
