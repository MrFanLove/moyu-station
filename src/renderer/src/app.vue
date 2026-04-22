<template>
  <div class="moyu-container">
    <component :is="currentModuleComponent" />

    <div v-if="showMenu" class="switch-menu no-drag">
      <div 
        v-for="(mod, index) in modules" 
        :key="mod.id"
        :class="['menu-item', { active: selectedIndex === index }]"
      >
        {{ mod.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ReaderModule from './components/ReaderModule.vue'
import PlayerModule from './components/PlayerModule.vue'
import BrowserModule from './components/BrowserModule.vue'

const modules = [
  { id: 'reader', name: '📖 阅读器', comp: ReaderModule },
  { id: 'player', name: '🎵 播放器', comp: PlayerModule },
  { id: 'browser', name: '🌐 浏览器', comp: BrowserModule }
]

const currentModule = ref('reader')
const showMenu = ref(false)
const selectedIndex = ref(0)
const currentOpacity = ref(1.0)

const currentModuleComponent = computed(() => {
  return modules.find(m => m.id === currentModule.value)?.comp
})

// --- 全局交互逻辑 ---

// 1. 调节透明度 (保持通用)
const updateOpacity = (delta: number) => {
  currentOpacity.value = Math.min(Math.max(currentOpacity.value + delta, 0.1), 1.0)
  window.api.setOpacity(currentOpacity.value)
}

const handleKeyDown = (e: KeyboardEvent) => {
  // ✅ 新增：Option + 方向键 调节透明度 (优先级高，且不干扰菜单)
  if (e.altKey) {
    if (e.code === 'ArrowUp') {
      e.preventDefault()
      updateOpacity(0.1)
      return // 拦截，不继续往下走
    } else if (e.code === 'ArrowDown') {
      e.preventDefault()
      updateOpacity(-0.1)
      return // 拦截
    }
  }

  // Cmd + K 切换菜单 (保持原有)
  if (e.metaKey && e.key.toLowerCase() === 'k') {
    showMenu.value = !showMenu.value
    selectedIndex.value = modules.findIndex(m => m.id === currentModule.value)
  }

  // 菜单交互 (保持原有)
  if (showMenu.value) {
    if (e.key === 'ArrowDown') selectedIndex.value = (selectedIndex.value + 1) % modules.length
    if (e.key === 'ArrowUp') selectedIndex.value = (selectedIndex.value - 1 + modules.length) % modules.length
    if (e.key === 'Enter') {
      currentModule.value = modules[selectedIndex.value].id
      showMenu.value = false
    }
  }

  // Cmd 穿透控制 (保持原有)
  if (e.key === 'Meta') {
    window.api.setIgnoreMouseEvents(true)
  }
}

const handleKeyUp = (e: KeyboardEvent) => {
  if (e.key === 'Meta') {
    window.api.setIgnoreMouseEvents(false)
  }
}

const handleWheel = (e: WheelEvent) => {
  if (e.altKey) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    updateOpacity(delta)
  }
}

onMounted(async () => {
  // ✅ 新增：初始化时从配置读取透明度，保持状态一致
  const config = await window.api.getConfig()
  if (config?.opacity) {
    currentOpacity.value = config.opacity
  }

  // ✅ 新增：监听主进程发来的透明度更新（解决 WebContentsView 滚轮导致的同步问题）
  if (window.api.onOpacityChanged) {
    window.api.onOpacityChanged((val: number) => {
      currentOpacity.value = val
    })
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('wheel', handleWheel, { passive: false })
  window.addEventListener('blur', () => window.api.setIgnoreMouseEvents(false))
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('wheel', handleWheel)
})
</script>

<style>
/* 核心：确保没有背景色干扰透明度 */
body, html {
  margin: 0; padding: 0;
  background: transparent !important;
}

.moyu-container {
  width: 100vw; height: 100vh;
  display: flex; justify-content: center; align-items: center;
  /* 整个容器开启拖拽 */
  -webkit-app-region: drag; 
}

.switch-menu {
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #00ff00;
  padding: 10px;
  border-radius: 8px;
  z-index: 999;
}

/* 必须让子组件可点击，否则无法响应滚轮 */
.no-drag { -webkit-app-region: no-drag; }

.menu-item {
  color: #666; padding: 5px 20px; font-family: monospace;
}
.menu-item.active { color: #00ff00; }
</style>