// preload.js - تعريض واجهة آمنة للواجهة الأمامية

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // استعلام قاعدة البيانات (آمن)
  query: (sql, params) => ipcRenderer.invoke('db-query', sql, params),

  // إرسال إشعارات
  send: (channel, data) => ipcRenderer.send(channel, data),

  // استقبال أحداث
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  }
});
