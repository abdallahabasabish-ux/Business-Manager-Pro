// main.js - العملية الرئيسية لتطبيق Electron

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { initDatabase } = require('./js/database');

let mainWindow;

// تحميل المتغيرات البيئية (اختياري)
const isDev = process.argv.includes('--dev');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, 'assets/images/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'js/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: false
    },
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#111827'
  });

  // تحميل شاشة تسجيل الدخول
  mainWindow.loadFile(path.join(__dirname, 'pages/login.html'));

  // فتح أدوات المطور في وضع التطوير
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// تهيئة قاعدة البيانات عند بدء التطبيق
app.whenReady().then(() => {
  initDatabase()
    .then(() => {
      console.log('✅ قاعدة البيانات جاهزة');
      createWindow();
    })
    .catch(err => {
      console.error('❌ فشل تهيئة قاعدة البيانات:', err);
      dialog.showErrorBox('خطأ', 'فشل تهيئة قاعدة البيانات. تأكد من صلاحيات الكتابة.');
      app.quit();
    });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// التعامل مع رسائل IPC من الواجهة
ipcMain.handle('db-query', async (event, sql, params) => {
  // سيتم تنفيذها في database.js
  const { runQuery } = require('./js/database');
  return await runQuery(sql, params);
});
