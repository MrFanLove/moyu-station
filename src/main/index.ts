import { app, BrowserWindow, globalShortcut, ipcMain, dialog, WebContentsView } from 'electron'
import fs from 'node:fs' // ✅ 切换为基础 fs 模块，确保 existsSync 可用
import { join } from 'path'
import { pathToFileURL } from 'url'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// --- 1. 持久化基建与全局变量 ---
const configPath = join(app.getPath('userData'), 'moyu-config.json');
let globalNovelContent = '';
const PAGE_SIZE = 500;

// ✅ 规格要求：定义默认配置
const DEFAULT_CONFIG = {
  readerFontSize: 14,
  opacity: 0.8,
  lastModule: 'reader',
  mediaProgress: {}
}

// 浏览器视图实例
let browserView: WebContentsView | null = null;

/**
 * ✅ 配置读取助手：支持默认值合并
 * 解决用户提到的“如果配置不存在则默认为 14”的需求
 */
function loadConfigSync() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('配置读取失败:', err);
  }
  return DEFAULT_CONFIG;
}

/**
 * ✅ 配置保存助手：局部更新逻辑
 */
function saveConfigSync(newFields: Record<string, any>) {
  try {
    const current = loadConfigSync();
    const next = { ...current, ...newFields };
    fs.writeFileSync(configPath, JSON.stringify(next, null, 2));
  } catch (err) {
    console.error('配置保存失败:', err);
  }
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 320,
    height: 480,
    show: false,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // --- 2. 基础窗口交互 IPC ---
  // ✅ 已清理原有的重复 set-opacity 监听器
  ipcMain.on('set-opacity', (_, value: number) => {
    if (!mainWindow.isDestroyed()) mainWindow.setOpacity(value)
  })

  ipcMain.on('set-ignore-mouse-events', (_, ignore: boolean) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.setIgnoreMouseEvents(ignore, { forward: true })
    }
  })

  ipcMain.on('set-aspect-ratio', (_, ratio: number) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.setAspectRatio(ratio);
    }
  });

  // --- 3. 微型浏览器内核逻辑 (WebContentsView) ---
  ipcMain.handle('init-browser', (_, { url }) => {
    if (!browserView) {
      browserView = new WebContentsView({
        webPreferences: { sandbox: true, contextIsolation: true }
      })
      mainWindow.contentView.addChildView(browserView)
      browserView.setBackgroundColor('#00000000')

      // 禁止系统级全屏
      browserView.webContents.on('enter-html-full-screen', () => {
        mainWindow.setFullScreen(false);
        setTimeout(() => {
          if (mainWindow.isFullScreen()) mainWindow.setFullScreen(false);
        }, 50);
      });

      // 拦截并强制在当前视图打开新窗口
      browserView.webContents.setWindowOpenHandler(({ url }) => {
        browserView?.webContents.loadURL(url)
        return { action: 'deny' }
      })

      // Alt + 滚轮调节不透明度 (上帝视角监听)
      browserView.webContents.on('input-event', (_, input: any) => {
        if (input.type === 'mouseWheel' && input.modifiers.includes('alt')) {
          const currentOpacity = mainWindow.getOpacity()
          const delta = input.deltaY > 0 ? -0.05 : 0.05
          const newOpacity = Math.min(Math.max(currentOpacity + delta, 0.05), 1)
          mainWindow.setOpacity(newOpacity)
          mainWindow.webContents.send('opacity-updated', newOpacity)
          saveConfigSync({ opacity: newOpacity })
        }
      })
    }
    
    browserView.webContents.loadURL(url)
    return true
  })

  ipcMain.on('sync-browser-bounds', (_, bounds) => {
    if (browserView && !mainWindow.isDestroyed()) {
      browserView.setBounds(bounds)
    }
  })

  ipcMain.on('browser-control', (_, { action, url }) => {
    if (!browserView) return
    const { webContents } = browserView
    switch (action) {
      case 'back': webContents.goBack(); break
      case 'forward': webContents.goForward(); break
      case 'reload': webContents.reload(); break
      case 'go': webContents.loadURL(url); break
      case 'hide': 
        mainWindow.contentView.removeChildView(browserView)
        browserView = null 
        break
    }
  })

  // --- 4. 增强持久化 IPC ---
  // ✅ 此时 getConfig 已经包含了 readerFontSize: 14 的默认值
  ipcMain.handle('get-config', () => loadConfigSync());
  
  ipcMain.handle('save-config', (_, { key, value }) => {
    saveConfigSync({ [key]: value });
  });

  ipcMain.on('save-media-progress', (_, { path, time }) => {
    const config = loadConfigSync();
    const mediaProgress = config.mediaProgress || {};
    mediaProgress[path] = time;
    saveConfigSync({ mediaProgress });
  });

  // --- 5. 业务读取逻辑 ---
  ipcMain.handle('open-file', async (_, type: 'text' | 'video' = 'text') => {
    const filters = type === 'video' 
      ? [{ name: 'Movies', extensions: ['mp4', 'webm', 'ogg'] }]
      : [{ name: 'Text', extensions: ['txt'] }];

    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: filters
    });

    if (canceled || filePaths.length === 0) return null;
    const filePath = filePaths[0];

    if (type === 'text') {
      const content = fs.readFileSync(filePath, 'utf-8'); // ✅ 同步读取简化逻辑
      globalNovelContent = content;
      return {
        totalPages: Math.ceil(content.length / PAGE_SIZE),
        filePath
      };
    } else {
      const fileUrl = pathToFileURL(filePath).href;
      const config = loadConfigSync();
      const progress = config.mediaProgress?.[fileUrl] || 0;
      return { filePath: fileUrl, progress };
    }
  });

  ipcMain.handle('read-page', (_event, pageIndex) => {
    const index = Number(pageIndex) || 0;
    const start = index * PAGE_SIZE;
    return globalNovelContent.substring(start, start + PAGE_SIZE);
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// --- 6. 生命周期管理 ---
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.moyustation.app')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  
  globalShortcut.register('Option+X', () => {
    const windows = BrowserWindow.getAllWindows()
    if (windows.length > 0) {
      const win = windows[0]
      win.isVisible() ? win.hide() : win.show()
    }
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})