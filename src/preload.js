const { contextBridge, ipcRenderer } = require('electron');
const fs   = require('fs');
const path = require('path');

// Production: config/ lives next to MultiView.exe
// Development: assets/ lives inside the repo
const prodConfigDir = path.join(path.dirname(process.execPath), 'config');
const devConfigDir  = path.join(__dirname, '..', 'assets');

const configDir = fs.existsSync(path.join(prodConfigDir, 'sites.json'))
  ? prodConfigDir
  : devConfigDir;

const config = JSON.parse(fs.readFileSync(path.join(configDir, 'sites.json'), 'utf8'));

contextBridge.exposeInMainWorld('api', {
  getSites:        () => config,
  getLogosPath:    () => path.join(configDir, 'logos').replace(/\\/g, '/'),
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
});
