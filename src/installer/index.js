const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const nodeModulePath = path.join(__dirname, '..', '..', 'node_modules');

function installDeps() {
  console.log('Installing dependencies...');
  execSync('npm install --production', { cwd: path.join(__dirname, '..', '..') });
  console.log('Dependencies installed.');
}

function getAppPath() {
  const appPath = path.join(process.env.LOCALAPPDATA, 'TIDAL');
  const folders = fs.readdirSync(appPath);
  const [build] = folders.filter(p => !p.indexOf('app-')).sort((a, b) => b.split('-')[1] - a.split('-')[1]).reverse();
  if (!build) return null;
  return path.join(appPath, build);
}

(() => {
    if (process.argv[2] === 'wave') {
      console.log('Installing Wave...');
      if (!fs.existsSync(nodeModulePath)) installDeps();
      let tidalRPath = path.join(getAppPath(), 'resources');
      let tidalAppPath = path.join(tidalRPath, 'app');


      if (!fs.existsSync(tidalAppPath)) {
        fs.mkdirSync(tidalAppPath);
      }
      if (!fs.existsSync(path.join(tidalAppPath, 'index.js'))) {
        var wavePath = path.join(__dirname, '..', 'injector').replace(/\\/g, '/');
        fs.writeFileSync(path.join(tidalAppPath, 'index.js'),`
const { join, dirname } = require('path');
const electron = require('electron');
const Module = require('module');
require(\`${wavePath}\`);
const tidalPath = join(dirname(require.main.filename), '..', 'app.asar');
const tidalPackage = require(join(tidalPath, 'package.json'));
electron.app.setAppPath(tidalPath);
electron.app.name = tidalPackage.name;
Module._load(join(tidalPath, tidalPackage.main), null, true);`);
      }
      if (!fs.existsSync(path.join(tidalAppPath, 'package.json'))) {
        fs.writeFileSync(path.join(tidalAppPath, 'package.json'), JSON.stringify({name:'Tidal',main:'index.js',version:'0.0.1'}))
      }
      console.log('Wave installed.');
      return;
    } else if (process.argv[2] === 'unwave') {
      let tidalRPath = path.join(getAppPath(), 'resources');
      let tidalAppPath = path.join(tidalRPath, 'app');
      if (fs.existsSync(tidalRPath)) {
        fs.rmSync(tidalAppPath, { recursive: true, force: true });
      }
      console.log('Wave uninstalled.');
      return;
    }
  }
)();