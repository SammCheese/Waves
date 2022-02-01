const { session, app, globalShortcut,  } = require('electron');
const electron = require('electron');
const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');

let settings = {
  reactDevtools: true
}

// React DevTools
if (settings.reactDevtools) {
  app.once('ready', () => {
    installExtension(REACT_DEVELOPER_TOOLS )
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err));
  });
}

// PartialTelemetry Blocking
app.once('ready', () => {
  let sentryBlocked = false;

  if (!sentryBlocked) {
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
      const url = details.url;
      const isAnalytics = url.match(/(google(?:-analytics)|(?:apis)|(?:tagmanager))|(?:trackjs)/i)
      const isEventAnalytics = details.method === 'POST' && url === 'https://et.tidal.com/api/events'
      if (isAnalytics || isEventAnalytics) {
        sentryBlocked = true;
        return callback({ cancel: true });
      }
      callback({ cancel: false });
    })
  }
})


// enable DevTools and nodeIntegration
class PatchedBrowserWindow extends electron.BrowserWindow {
  constructor(options) {
    if (!options.webPreferences) options.webPreferences = {};
    options.webPreferences.nodeIntegration = true;
    options.webPreferences.devTools = true;
    
    const win = super(options);
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      win.webContents.toggleDevTools();
    })

    return win;
  }
}

Object.assign(PatchedBrowserWindow, electron.BrowserWindow);
const electronPath = require.resolve('electron');
delete require.cache[electronPath].exports;
require.cache[electronPath].exports = { ...electron, BrowserWindow: PatchedBrowserWindow };
