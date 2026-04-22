// 1. ✅ 必须添加这一行，让 TS 认为这是一个模块，从而允许全局扩展
export {} 

// 2. ✅ 定义 api 的类型接口，确保编译器认识这些方法
declare global {
  interface Window {
    api: {
      readPage: (index: number) => Promise<string>;
      setIgnoreMouseEvents: (ignore: boolean) => void;
      setOpacity: (value: number) => void;
      openFile: (type?: string) => Promise<any>;
      // 如果你的 renderer.ts 还用了其他 api，也在这里补充定义：
      saveConfig: (key: string, value: any) => Promise<void>;
      getConfig: () => Promise<any>;
      setAspectRatio: (ratio: number) => void;
    }
  }
}

// --- 2. 状态管理 ---
let currentOpacity = 1.0;
let currentPage = 0;
let totalPages = 0;
let isLightMode = false;

// 获取 DOM 元素 (确保 ID 与 index.html 一致)
const contentEl = document.getElementById('reader-content')!;
const timeEl = document.getElementById('time-display')!;
const infoEl = document.getElementById('page-info')!;
const containerEl = document.getElementById('widget-container')!;

// --- 3. 基础功能：时钟逻辑 ---
function updateTime(): void {
  if (timeEl) {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
  }
}
setInterval(updateTime, 1000);
updateTime();

// --- 4. 阅读器功能：加载页面 ---
async function loadPage(index: number) {
  if (index < 0 || index >= totalPages) return;
  currentPage = index;
  const text = await window.api.readPage(currentPage);
  
  // 渲染文本：将原本的时钟区域替换为小说内容
  if (contentEl) {
    contentEl.textContent = text;
    // 隐藏时钟（或者保持时钟在 header 显示，看你喜好）
    // timeEl.style.display = 'none'; 
  }
  
  if (infoEl) {
    infoEl.textContent = `${currentPage + 1} / ${totalPages}`;
  }
}

// --- 5. 核心交互：键盘监听 (Unified Listener) ---
window.addEventListener('keydown', async (e) => {
  // A. 鼠标穿透：按住 Command (Meta) 开启
  if (e.key === 'Meta') {
    window.api.setIgnoreMouseEvents(true);
    document.body.style.pointerEvents = 'none';
  }

  // B. 导入文件：Command + O
  if (e.metaKey && e.key.toLowerCase() === 'o') {
    const pages = await window.api.openFile();
    if (pages) {
      totalPages = pages;
      loadPage(0);
    }
  }

  // C. 翻页控制：Command + 左右方向键
  if (e.metaKey) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      loadPage(currentPage + 1);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      loadPage(currentPage - 1);
    }
  }

  // D. 伪装模式切换：Command + L
  if (e.metaKey && e.key.toLowerCase() === 'l') {
    isLightMode = !isLightMode;
    containerEl.classList.toggle('light-mode', isLightMode);
  }

  // E. 备用透明度调节：Option + 上下键
  if (e.altKey) {
    if (e.key === 'ArrowUp') updateOpacity(0.05);
    if (e.key === 'ArrowDown') updateOpacity(-0.05);
  }
});

// 监听鼠标穿透取消：松开 Command
window.addEventListener('keyup', (e) => {
  if (e.key === 'Meta') {
    resetInteraction();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Meta') {
    window.api.setIgnoreMouseEvents(true);
    // 视觉反馈：稍微变透明一点，提示现在是穿透模式
    containerEl.style.opacity = '0.6';
    document.body.style.pointerEvents = 'none';
  }
});

// --- 6. 核心交互：滚轮调节透明度 ---
function updateOpacity(delta: number): void {
  currentOpacity = Math.min(Math.max(currentOpacity + delta, 0.1), 1.0);
  window.api.setOpacity(currentOpacity);
}

window.addEventListener('blur', () => {
  resetInteraction();
});

function resetInteraction() {
  window.api.setIgnoreMouseEvents(false);
  if (containerEl) containerEl.style.opacity = '1';
  document.body.style.pointerEvents = 'auto';
  console.log('交互已重置：窗口恢复可点击状态');
}

window.addEventListener('wheel', (e) => {
  if (e.altKey) { // 按住 Option 滚轮
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    updateOpacity(delta);
  }
}, { passive: false });