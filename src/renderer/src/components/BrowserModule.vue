<template>
  <div class="browser-container">
    <div class="header-safe-zone">
      <transition name="slide-down">
        <div v-if="showSearch" class="fake-search-bar no-drag">
          <div class="input-wrapper">
            <span class="icon">🔍</span>
            <input 
              ref="inputRef"
              v-model="urlInput" 
              placeholder="Search files or enter URL..." 
              @keydown.enter="navigateTo"
              @keydown.esc="showSearch = false"
            />
            <div class="nav-hints">
              <span @click="control('back')">←</span>
              <span @click="control('forward')">→</span>
              <span @click="control('reload')">↻</span>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <div ref="viewPlaceholder" class="view-placeholder no-drag">
      <div v-if="!hasInit" class="init-guide">
        /* Command + F to initialize kernel */
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const showSearch = ref(true) // 默认设为 true 方便调试
const urlInput = ref('')
const hasInit = ref(false)
const viewPlaceholder = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

// 1. 同步布局：计算当前占位符在窗口中的精确物理坐标
const syncBounds = () => {
  if (viewPlaceholder.value) {
    const rect = viewPlaceholder.value.getBoundingClientRect()
    
    // 🔍 调试日志：打开控制台 (Cmd+Option+I) 看看这里的 y 是不是 45 或 50 左右
    console.log('Current Bounds:', {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      w: Math.round(rect.width),
      h: Math.round(rect.height)
    })

    window.api.send('sync-browser-bounds', {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    })
  }
}

// 2. 导航与初始化 (原 navigateTo)
const navigateTo = async () => {
  if (!urlInput.value) return
  
  let targetUrl = urlInput.value
  if (!targetUrl.startsWith('http')) {
    targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`
  }
  
  // 确保在请求初始化前，Vue 已经拿到了占位符的坐标
  syncBounds()

  if (!hasInit.value) {
    console.log('🚀 正在初始化浏览器内核...')
    await window.api.invoke('init-browser', { url: targetUrl })
    hasInit.value = true
    
    // 关键：内核创建后，稍微等一下再同步一次坐标，防止位置偏移
    setTimeout(syncBounds, 100) 
  } else {
    window.api.send('browser-control', { action: 'go', url: targetUrl })
  }

  // 🛠️ 关键修改：暂时注释掉下面这一行，不要让搜索框消失
  // showSearch.value = false 
}

const control = (action: string) => {
  window.api.send('browser-control', { action })
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.metaKey && e.key.toLowerCase() === 'f') {
    e.preventDefault()
    showSearch.value = !showSearch.value
    if (showSearch.value) {
      nextTick(() => inputRef.value?.focus())
    }
  }
}

let resizeObserver: ResizeObserver
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  
  resizeObserver = new ResizeObserver(() => {
    // 窗口大小变动时，实时同步浏览器位置
    syncBounds()
  })
  if (viewPlaceholder.value) resizeObserver.observe(viewPlaceholder.value)
  
  // 初始同步
  setTimeout(syncBounds, 500)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  resizeObserver?.disconnect()
  window.api.send('browser-control', { action: 'hide' })
})
</script>

<style scoped>
.browser-container {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  background: transparent;
  position: relative;
}

/* 顶部预留高度，防止搜索框被 native view 盖住 */
.header-safe-zone {
  height: 45px; 
  width: 100%;
  position: relative;
  z-index: 200; /* 确保在 Vue 层的最上方 */
}

.view-placeholder {
  flex: 1;
  margin: 0 5px 5px 5px;
  border: 1px dashed rgba(0, 255, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  /* 关键：允许鼠标穿透到下层的原生 View */
  pointer-events: none; 
}

.fake-search-bar {
  position: absolute;
  top: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  background: #252526;
  border: 1px solid #007acc;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  z-index: 300;
  padding: 6px 10px;
  border-radius: 4px;
  /* 搜索框本身必须响应点击 */
  pointer-events: auto; 
}

.input-wrapper { display: flex; align-items: center; gap: 8px; }
input {
  background: transparent;
  border: none;
  color: #ccc;
  outline: none;
  flex: 1;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}

.nav-hints span {
  cursor: pointer;
  padding: 0 4px;
  color: #555;
  font-size: 14px;
  transition: color 0.2s;
}
.nav-hints span:hover { color: #00ff00; }

.init-guide {
  color: #222;
  font-family: monospace;
  font-size: 10px;
}

/* 搜索框滑出动画 */
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.2s ease-out;
}
.slide-down-enter-from, .slide-down-leave-to {
  transform: translate(-50%, -20px);
  opacity: 0;
}
</style>