<template>
  <div class="player-container">
    
    <div class="drag-bar"></div>

    <video 
      ref="videoRef"
      class="clear-video no-drag" 
      :src="videoSrc"
      @loadedmetadata="onMetadataLoaded"
      @click="togglePlay"
      loop
    ></video>

    <div v-if="!videoSrc" class="upload-guide no-drag" @click="selectVideo">
      <span>/* Cmd + Shift + O 载入视频 */</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// ... 此处逻辑部分（script）保持不变，无需修改 ...
import { ref, onMounted, onUnmounted } from 'vue'

const videoRef = ref<HTMLVideoElement | null>(null)
const videoSrc = ref('')
const isPlaying = ref(false)
const volume = ref(0.5)

const selectVideo = async () => {
  const result = await window.api.openFile('video')
  if (result && result.filePath) {
    videoSrc.value = result.filePath
    setTimeout(() => {
      if (videoRef.value) {
        videoRef.value.load()
        videoRef.value.play()
        isPlaying.value = true
      }
    }, 100)
  }
}

const onMetadataLoaded = () => {
  if (videoRef.value) {
    const ratio = videoRef.value.videoWidth / videoRef.value.videoHeight
    window.api.setAspectRatio(ratio)
  }
}

const togglePlay = () => {
  if (!videoRef.value || !videoSrc.value) return
  isPlaying.value ? videoRef.value.pause() : videoRef.value.play()
  isPlaying.value = !isPlaying.value
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    volume.value = Math.min(volume.value + 0.1, 1);
    if (videoRef.value) videoRef.value.volume = volume.value;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    volume.value = Math.max(volume.value - 0.1, 0);
    if (videoRef.value) videoRef.value.volume = volume.value;
  }
  if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 'o') {
    e.preventDefault();
    selectVideo();
  }
}

onMounted(() => window.addEventListener('keydown', handleKeyDown))
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.api.setAspectRatio(0)
})
</script>

<style scoped>
.player-container {
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  flex-direction: column; /* 纵向排列，让 drag-bar 占位 */
  overflow: hidden;
}

/* 顶部隐藏的拖拽柄 */
.drag-bar {
  width: 100%;
  height: 10px; /* 这 10 像素是纯拖拽区 */
  flex-shrink: 0;
  background: transparent;
  z-index: 10;
}

.clear-video {
  width: 100%;
  flex: 1; /* 占据剩余所有空间 */
  object-fit: contain;
  background: #000;
}

.upload-guide {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #333;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  cursor: pointer;
}

/* 关键：确保视频和文字是不可拖拽的，这样它们才能点击 */
.no-drag {
  -webkit-app-region: no-drag;
}
</style>