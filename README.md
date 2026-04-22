# MoyuStation | 摸鱼驿站 🐟

**MoyuStation** is a professional-grade stealth productivity assistant for macOS, designed to balance high-intensity development with subtle relaxation. It allows you to browse, read, and listen without breaking your professional flow.

**MoyuStation (摸鱼驿站)** 是一款专为 macOS 设计的专业级隐形办公辅助工具。它在保证极简工程感的同时，提供了极致的隐蔽交互体验，让你在紧张的工作中，也能优雅地忙里偷闲。

---

## ✨ Key Features | 核心特性

* **🌐 Stealth Browser (隐形浏览器):** * Forced "No-Popup" and "No-Fullscreen" logic.
    * 拦截所有弹窗与系统级全屏，始终潜伏于窗口一角。
* **📖 Smart Reader (极简阅读器):** * Customizable themes, dynamic font scaling, and auto-save progress.
    * 内置多档皮肤，支持快捷键缩放字号，自动记录阅读位置。
* **🎵 Integrated Player (媒体播放器):** * Minimalist UI for audio/video with progress persistence.
    * 沉浸式影音体验，支持进度记忆与 stealth 播放模式。
* **👻 Ghost Interaction (幽灵交互):** * **Transparency:** Instant opacity control via shortcuts.
    * **Click-Through:** Quick "Command-key" toggle to ignore mouse events.
    * **透明度控制**：通过快捷键实时调节，实现真正的“视觉消失”。
    * **点击穿透**：按住特定键即可透过窗口操作底层的代码编辑器。

---

## ⌨️ Shortcuts | 快捷交互 (架构师必备)

| Action | Shortcut (Mac) | 功能描述 |
| :--- | :--- | :--- |
| **Switch Module** | `Cmd + K` | 唤起全局模块切换菜单 |
| **Opacity Up** | `Opt + ↑` or `Alt + Scroll Up` | 调亮窗口 (增加不透明度) |
| **Opacity Down** | `Opt + ↓` or `Alt + Scroll Down` | 变暗窗口 (增加隐身程度) |
| **Click Through** | Hold `Cmd` | **点击穿透**：按住时可操作窗口下方的软件 |
| **Boss Key** | `Opt + X` | 紧急避险：瞬间隐藏至托盘 |

---

## 🛠️ Tech Stack | 技术栈

* **Core:** [Electron](https://www.electronjs.org/) (High Performance)
* **Frontend:** [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** CSS3 (Variable-based themes)

---

## 🚀 Getting Started | 快速开始

### Prerequisites
- Node.js (Latest LTS)
- npm or yarn

### Installation
```bash
# Clone the repository
$ git clone https://github.com/MrFanLove/moyu-station.git

# Install dependencies
$ npm install
```

### Development
```bash
# Start development mode
$ npm run dev
```

### Build (Release)
```bash
# Build for macOS (Universal/ARM64)
$ npm run build:mac

# Build for Windows
$ npm run build:win
```

---

## 📄 License | 许可证

Distributed under the **MIT License**. See `LICENSE` for more information.
本项目基于 **MIT 协议** 开源。

---

### 💡 如何应用到你的 GitHub？
1.  在 VS Code 中打开你本地的 `README.md`。
2.  全选，粘贴上面的内容。
3.  **保存并推送：**
    ```bash
    git add README.md
    git commit -m "docs: upgrade README with dual-language and features"
    git push
    ```

**这样修改后，任何人点进你的 GitHub 仓库，都会觉得这是一个架构严谨、交互细腻的成熟工具！**
