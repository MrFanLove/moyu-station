import { resolve } from 'path'
import { defineConfig } from 'electron-vite' // ✅ 删掉了弃用的 externalizeDepsPlugin 引用
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    // ✅ 按照提示，直接在 build 配置中开启 externalizeDeps
    build: {
      externalizeDeps: true
    }
  },
  preload: {
    // ✅ Preload 同样在 build 中开启
    build: {
      externalizeDeps: true
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    // ✅ 保持 Vue 插件注入，这是渲染层组件化的关键
    plugins: [vue()]
  }
})