const logoBar        = document.getElementById('logo-bar');
const logoPlate      = document.getElementById('logo-plate');
const titleBar       = document.getElementById('title-bar');
const tabBar         = document.getElementById('tab-bar');
const pagesContainer = document.getElementById('pages-container');

const config    = window.api.getSites();
const logosPath = window.api.getLogosPath();

// ── Background ──
document.body.style.background = config.background || '#1A1A2E';

// ── App title bar ──
const titleCfg = config.title || {};
if (titleCfg.text) {
  titleBar.textContent    = titleCfg.text;
  titleBar.style.display  = 'flex';
  titleBar.style.color    = titleCfg.color || '#ffffff';
  titleBar.style.fontSize = (titleCfg.size || 20) + 'px';
  titleBar.style.height   = ((titleCfg.size || 20) * 2.4) + 'px';
}

// ── Logo bar ──
const barPos     = (config.logoBar && config.logoBar.position)   || 'bottom';
const plateColor = (config.logoBar && config.logoBar.plateColor) || 'rgba(255,255,255,0.06)';
const barHeight  = (config.logoBar && config.logoBar.height)     || 64;

const logoFiles = ['logo1.png','logo2.png','logo3.png','logo4.png','logo5.png'];
logoBar.style.height     = barHeight + 'px';
logoBar.style.order      = barPos === 'top' ? '-1' : '1';
logoPlate.style.background = plateColor;

const imgHeight = Math.round(barHeight - 30);
logoFiles.forEach(name => {
  const img = document.createElement('img');
  img.src = `file:///${logosPath}/${name}`;
  img.alt = name.replace(/\.[^.]+$/, '');
  img.style.height = imgHeight + 'px';
  logoPlate.appendChild(img);
});

// ── Fullscreen (CSS-only — webview never moves in DOM, so map never reloads) ──
let activeTile = null;
let savedRect  = null;

const DURATION = '320ms';
const EASING   = 'cubic-bezier(0.4, 0, 0.2, 1)';

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFullscreen(); });

function openFullscreen(tile, site) {
  if (activeTile) return;
  savedRect = tile.getBoundingClientRect();
  tile.style.position     = 'fixed';
  tile.style.left         = savedRect.left   + 'px';
  tile.style.top          = savedRect.top    + 'px';
  tile.style.width        = savedRect.width  + 'px';
  tile.style.height       = savedRect.height + 'px';
  tile.style.zIndex       = '999';
  tile.style.borderRadius = '6px';
  tile.style.overflow     = 'hidden';
  tile.querySelector('.tile-bar').classList.add('fs-active');
  tile.querySelector('.tile-bar span').textContent = site.title;
  requestAnimationFrame(() => {
    tile.style.transition    = `left ${DURATION} ${EASING}, top ${DURATION} ${EASING}, width ${DURATION} ${EASING}, height ${DURATION} ${EASING}, border-radius ${DURATION} ${EASING}`;
    tile.style.left          = '0';
    tile.style.top           = '0';
    tile.style.width         = '100vw';
    tile.style.height        = '100vh';
    tile.style.borderRadius  = '0';
  });
  activeTile = tile;
}

function closeFullscreen() {
  if (!activeTile) return;
  activeTile.style.left         = savedRect.left   + 'px';
  activeTile.style.top          = savedRect.top    + 'px';
  activeTile.style.width        = savedRect.width  + 'px';
  activeTile.style.height       = savedRect.height + 'px';
  activeTile.style.borderRadius = '6px';
  activeTile.addEventListener('transitionend', () => {
    ['position','left','top','width','height','zIndex','borderRadius','overflow','transition'].forEach(p => {
      activeTile.style[p] = '';
    });
    activeTile.querySelector('.tile-bar').classList.remove('fs-active');
    activeTile = null;
    savedRect  = null;
  }, { once: true });
}

// ── Pages & tabs ──
// Backward compat: if no pages array, treat root sites as a single unnamed page
const pages = config.pages || [{
  name: '',
  gridCols: config.gridCols || 10,
  gridRows: config.gridRows || 6,
  sites: config.sites || [],
}];

const pageGrids = [];
let activePageIndex = 0;

function buildTile(parentGrid, site) {
  const g = site.grid || {};

  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.style.gridColumn = `${g.col} / span ${g.colSpan || 1}`;
  tile.style.gridRow    = `${g.row} / span ${g.rowSpan || 1}`;

  const bar = document.createElement('div');
  bar.className = 'tile-bar';

  const leftGroup = document.createElement('div');
  leftGroup.className = 'tile-bar-left';

  const fsBtn = document.createElement('button');
  fsBtn.textContent = '⛶';
  fsBtn.title = 'Fullscreen';
  fsBtn.addEventListener('click', () => openFullscreen(tile, site));

  const reloadBtn = document.createElement('button');
  reloadBtn.textContent = '⟳';
  reloadBtn.title = 'Reload';
  reloadBtn.addEventListener('click', () => wv.reload());

  const fsCloseBtn = document.createElement('button');
  fsCloseBtn.className = 'fs-close-btn';
  fsCloseBtn.textContent = '✕';
  fsCloseBtn.title = 'Exit fullscreen';
  fsCloseBtn.addEventListener('click', closeFullscreen);

  leftGroup.appendChild(fsBtn);
  leftGroup.appendChild(reloadBtn);
  leftGroup.appendChild(fsCloseBtn);

  const label = document.createElement('span');
  label.textContent = site.title;

  bar.appendChild(label);
  bar.appendChild(leftGroup);

  const wv = document.createElement('webview');
  wv.src = site.url;
  wv.setAttribute('allowpopups', '');
  wv.setAttribute('partition', 'persist:multiview');

  const noScroll = site.hideScrollbars !== undefined ? site.hideScrollbars : (config.hideScrollbars || false);
  wv.addEventListener('dom-ready', () => {
    if (site.zoom) wv.setZoomFactor(site.zoom);
    if (noScroll) wv.insertCSS('::-webkit-scrollbar { display: none !important; }');
  });

  tile.appendChild(wv);
  tile.appendChild(bar);
  parentGrid.appendChild(tile);
}

function switchPage(index) {
  if (index === activePageIndex) return;
  closeFullscreen();
  pageGrids[activePageIndex].classList.add('hidden');
  pageGrids[index].classList.remove('hidden');
  tabBar.querySelectorAll('.tab-btn').forEach((btn, i) => btn.classList.toggle('active', i === index));
  activePageIndex = index;
}

// Build all page grids upfront — all stay in DOM and keep GPU textures; only opacity toggles on switch
pages.forEach((page, i) => {
  const grid = document.createElement('div');
  grid.className = 'page-grid' + (i === 0 ? '' : ' hidden');
  grid.style.gridTemplateColumns = `repeat(${page.gridCols || 10}, 1fr)`;
  grid.style.gridTemplateRows   = `repeat(${page.gridRows || 6}, 1fr)`;

  (page.sites || []).forEach(site => buildTile(grid, site));

  pagesContainer.appendChild(grid);
  pageGrids.push(grid);
});

// ── Corner controls ──
document.getElementById('btn-reload-all').addEventListener('click', () => {
  document.querySelectorAll('webview').forEach(wv => wv.reload());
});
document.getElementById('btn-fullscreen').addEventListener('click', () => {
  window.api.toggleFullscreen();
});

// Show tab bar only when there are multiple pages
if (pages.length > 1) {
  tabBar.style.display = 'flex';
  pages.forEach((page, i) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (i === 0 ? ' active' : '');
    btn.textContent = page.name || `Page ${i + 1}`;
    btn.addEventListener('click', () => switchPage(i));
    tabBar.appendChild(btn);
  });
}
