import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 API 给渲染进程
const api = {
  // --- 1. 通用通信桥梁 ---
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),

  // --- 2. 基础视窗交互 ---
  // ✅ 已合并：保留一个 setOpacity 即可
  setOpacity: (value: number) => ipcRenderer.send('set-opacity', value),
  setIgnoreMouseEvents: (ignore: boolean) => ipcRenderer.send('set-ignore-mouse-events', ignore),
  setAspectRatio: (ratio: number) => ipcRenderer.send('set-aspect-ratio', ratio),
  
  // ✅ 核心新增：监听主进程发来的透明度更新信号
  onOpacityChanged: (callback: (value: number) => void) => {
    ipcRenderer.removeAllListeners('opacity-updated')
    ipcRenderer.on('opacity-updated', (_event, value) => callback(value))
  },

  // --- 3. 持久化配置管理 ---
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (key: string, value: any) => ipcRenderer.invoke('save-config', { key, value }),
  
  // --- 4. 业务功能接口 ---
  openFile: (type?: string) => ipcRenderer.invoke('open-file', type),
  readPage: (index: number) => ipcRenderer.invoke('read-page', index),
  
  // 浏览器控制
  initBrowser: (url: string) => ipcRenderer.invoke('init-browser', { url }),
  browserControl: (action: string, url?: string) => ipcRenderer.send('browser-control', { action, url }),
  
  // 媒体进度持久化
  saveMediaProgress: (path: string, time: number) => ipcRenderer.send('save-media-progress', { path, time })
}

// 安全注入逻辑
if (process.contextIsolated) {
  try {
    // 将 api 对象挂载到 window.api 上
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Preload 脚本注入失败:', error)
  }
} else {
  // @ts-ignore
  window.api = api
}