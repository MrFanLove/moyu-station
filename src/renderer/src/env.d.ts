// src/renderer/src/env.d.ts

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // 告诉 TS，所有的 .vue 文件都是 DefineComponent 类型
  const component: DefineComponent<{}, {}, any>
  export default component
}