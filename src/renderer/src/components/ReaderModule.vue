<template>
  <div 
    class="reader-container" 
    :style="{ backgroundColor: currentTheme, fontSize: fontSize + 'px' }"
  >
    <div v-if="textContent" class="text-content no-drag">
      {{ textContent }}
    </div>

    <div v-else class="empty-state">
      <p>📭 尚未加载书籍</p>
      <p class="sub">
        <span>Cmd + O</span> 选书 | <span>Cmd + L</span> 换色 | <span>← →</span> 翻页
      </p>
    </div>

    <div v-if="textContent" class="page-info">
      {{ currentPage + 1 }} / {{ totalPages }}
    </div>

    <transition name="fade">
      <div v-if="showHint" class="floating-hint">{{ hintText }}</div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// --- 1. 响应式状态 ---
const fontSize = ref(14)
const textContent = ref('')
const currentPage = ref(0)
const totalPages = ref(0)
const showHint = ref(false)
const hintText = ref('')
let hintTimer: any = null

// --- 2. 主题换色配置 (Cmd + L) ---
const themes = [
  'transparent',           // 全透明
  'rgba(0, 0, 0, 0.5)',    // 半透深色
  'rgba(255, 255, 255, 0.1)', // 极淡浅色
  '#1a1a1a',               // 纯黑
  '#f4f4f4'                // 纸张色
]
const themeIndex = ref(0)
const currentTheme = ref(themes[0])

// --- 3. 核心业务逻辑 ---

// 加载指定页码并持久化
const goToPage = async (index: number) => {
  if (index < 0 || (totalPages.value > 0 && index >= totalPages.value)) return
  
  const content = await window.api.readPage(index)
  if (content) {
    textContent.value = content
    currentPage.value = index
    window.api.saveConfig('readerLastPage', index)
    // 翻页时也给个提示
    showTemporaryHint(`Page: ${index + 1}`)
  }
}

// 打开新文件
const handleOpenFile = async () => {
  const res = await window.api.openFile('text')
  if (res) {
    totalPages.value = res.totalPages
    await goToPage(0)
    showTemporaryHint('书籍装载成功')
  }
}

// 字号调节
const adjustFontSize = (delta: number | 'reset') => {
  if (delta === 'reset') fontSize.value = 14
  else fontSize.value = Math.min(Math.max(fontSize.value + delta, 10), 32)
  
  window.api.saveConfig('readerFontSize', fontSize.value)
  showTemporaryHint(`Font Size: ${fontSize.value}px`)
}

// 主题切换
const toggleTheme = () => {
  themeIndex.value = (themeIndex.value + 1) % themes.length
  currentTheme.value = themes[themeIndex.value]
  window.api.saveConfig('readerThemeIndex', themeIndex.value)
  showTemporaryHint(`Theme: ${themeIndex.value + 1}/${themes.length}`)
}

// 统一提示函数
const showTemporaryHint = (text: string) => {
  hintText.value = text
  showHint.value = true
  if (hintTimer) clearTimeout(hintTimer)
  hintTimer = setTimeout(() => showHint.value = false, 2000)
}

// --- 4. 快捷键中控台 ---
const onKeyDown = (e: KeyboardEvent) => {
  const isCmd = e.metaKey || e.ctrlKey

  if (isCmd) {
    // 使用 e.code 进行物理按键匹配
    switch (e.code) {
      case 'KeyL': 
        e.preventDefault(); toggleTheme(); break
      case 'KeyO': 
        e.preventDefault(); handleOpenFile(); break
      
      // ✅ 兼容主键盘和数字键盘的加号
      case 'Equal':
      case 'NumpadAdd':
        e.preventDefault(); adjustFontSize(1); break
      
      // ✅ 兼容主键盘和数字键盘的减号
      case 'Minus':
      case 'NumpadSubtract':
        e.preventDefault(); adjustFontSize(-1); break
      
      // ✅ 数字 0 重置
      case 'Digit0':
      case 'Numpad0':
        e.preventDefault(); adjustFontSize('reset'); break
    }
  } else {
    // 左右方向键保持不变
    if (e.code === 'ArrowRight') goToPage(currentPage.value + 1)
    if (e.code === 'ArrowLeft') goToPage(currentPage.value - 1)
  }
}

// --- 5. 生命周期与初始化恢复 ---
onMounted(async () => {
  const config = await window.api.getConfig()
  
  // 1. 恢复字号
  fontSize.value = config?.readerFontSize || 14
  
  // 2. 恢复主题
  if (config?.readerThemeIndex !== undefined) {
    themeIndex.value = config.readerThemeIndex
    currentTheme.value = themes[themeIndex.value]
  }

  // 3. 恢复页码进度
  if (config?.readerLastPage !== undefined) {
    currentPage.value = config.readerLastPage
  }

  window.addEventListener('keydown', onKeyDown)
  
  // 初始加载当前进度页
  goToPage(currentPage.value)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  if (hintTimer) clearTimeout(hintTimer)
})
</script>

<style scoped>
.reader-container {
  width: 100%; height: 100%;
  padding: 25px;
  color: #888; /* 默认摸鱼灰 */
  position: relative;
  overflow: hidden;
  transition: background-color 0.3s ease, font-size 0.2s ease;
}

.text-content {
  white-space: pre-wrap;
  line-height: 1.6;
  text-align: justify;
}

.page-info {
  position: absolute; bottom: 8px; left: 50%;
  transform: translateX(-50%);
  font-size: 9px; color: rgba(128, 128, 128, 0.2);
  pointer-events: none;
}

.empty-state {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  height: 90%; color: #555; font-size: 12px;
}

.empty-state span {
  color: #777; border: 1px solid #333;
  padding: 1px 4px; border-radius: 3px; margin: 0 2px;
}

.floating-hint {
  position: absolute; bottom: 20px; right: 20px;
  background: rgba(0, 255, 0, 0.1); color: #0f0;
  padding: 3px 10px; border-radius: 4px;
  font-size: 10px; border: 1px solid rgba(0, 255, 0, 0.2);
  pointer-events: none;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>