const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true, corsEnabled: true } }
]);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL('app://-/index.html');
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    let requestUrl = request.url.replace('app://-', '');
    requestUrl = requestUrl.split('?')[0].split('#')[0];
    requestUrl = decodeURIComponent(requestUrl);
    
    if (requestUrl === '/' || requestUrl === '') {
      requestUrl = '/index.html';
    }
    
    const filePath = path.join(__dirname, 'app', requestUrl);
    
    try {
      if (!fs.existsSync(filePath)) {
        return new Response('Not Found', { status: 404 });
      }
      
      const buffer = fs.readFileSync(filePath);
      
      let mimeType = 'text/plain';
      if (filePath.endsWith('.html')) mimeType = 'text/html';
      else if (filePath.endsWith('.js')) mimeType = 'application/javascript';
      else if (filePath.endsWith('.css')) mimeType = 'text/css';
      else if (filePath.endsWith('.png')) mimeType = 'image/png';
      else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) mimeType = 'image/jpeg';
      else if (filePath.endsWith('.svg')) mimeType = 'image/svg+xml';
      else if (filePath.endsWith('.json')) mimeType = 'application/json';
      else if (filePath.endsWith('.ttf')) mimeType = 'font/ttf';
      else if (filePath.endsWith('.woff')) mimeType = 'font/woff';
      else if (filePath.endsWith('.woff2')) mimeType = 'font/woff2';
      else if (filePath.endsWith('.eot')) mimeType = 'application/vnd.ms-fontobject';
      else if (filePath.endsWith('.otf')) mimeType = 'font/otf';

      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 });
    }
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
