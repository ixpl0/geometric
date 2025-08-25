<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { simulateWithFrames } from './core/simulation'
import { PixiRenderer, type RenderConfig } from './render/renderer'
import { AudioSynthesizer, type SynthConfig } from './audio/synthesizer'
import { MediaExporter, type ExportConfig, type ExportProgress } from './export/exporter'
import { SceneManager } from './scenes/scene-manager'
import type { SceneSettings } from './scenes/scene-base'

const canvas = ref<HTMLCanvasElement>()
const isPlaying = ref(false)
const isExporting = ref(false)
const exportProgress = ref<ExportProgress | null>(null)

const seed = ref(12345)
const fps = ref(60)
const duration = ref(10)
const selectedSceneId = ref('bouncing-balls')

let renderer: PixiRenderer | null = null
let audioSynth: AudioSynthesizer | null = null
let mediaExporter: MediaExporter | null = null
let sceneManager: SceneManager | null = null

const sceneSettings = computed((): SceneSettings => ({
  seed: seed.value,
  fps: fps.value,
  duration: duration.value
}))

const getCurrentSimConfig = () => {
  if (!sceneManager) return null
  
  sceneManager.selectScene(selectedSceneId.value)
  sceneManager.updateSettings(sceneSettings.value)
  
  const scene = sceneManager.getCurrentScene()
  const config = scene.getConfig()
  
  return config
}

const renderConfig: RenderConfig = {
  width: 800,
  height: 600,
  backgroundColor: 0x000000,
  antialias: true
}

const synthConfig: SynthConfig = {
  masterVolume: 0.3,
  reverbWet: 0.2,
  compressorThreshold: -20,
  compressorRatio: 4
}

onMounted(async () => {
  if (!canvas.value) {
    return
  }

  renderer = new PixiRenderer(canvas.value, renderConfig)
  await renderer.init(renderConfig)

  audioSynth = new AudioSynthesizer(synthConfig)
  await audioSynth.init()

  mediaExporter = new MediaExporter(synthConfig)
  sceneManager = new SceneManager(sceneSettings.value)

  updateScene()
})

const updateScene = () => {
  if (!renderer || !sceneManager) {
    return
  }
  
  const config = getCurrentSimConfig()
  if (!config) return
  
  const { frames } = simulateWithFrames(config)
  
  if (frames[0] && frames[0].length > 0) {
    renderer.render(frames[0])
  }
}

const togglePlay = async () => {
  const config = getCurrentSimConfig()
  if (!audioSynth || !config) return

  if (isPlaying.value) {
    audioSynth.stop()
    isPlaying.value = false
  } else {
    const { events } = simulateWithFrames(config)
    audioSynth.scheduleEvents(events)
    audioSynth.start()
    isPlaying.value = true
    animate()
  }
}

const animate = () => {
  const config = getCurrentSimConfig()
  if (!renderer || !config) return
  
  const { frames } = simulateWithFrames(config)
  let currentFrame = 0
  const totalFrames = frames.length
  
  const loop = () => {
    if (!renderer || !isPlaying.value) return
    
    renderer.render(frames[currentFrame])
    currentFrame = (currentFrame + 1) % totalFrames
    requestAnimationFrame(loop)
  }
  
  loop()
}

const exportVideo = async () => {
  const config = getCurrentSimConfig()
  if (!renderer || !mediaExporter || !config) return

  isExporting.value = true
  exportProgress.value = null

  try {
    const offscreenCanvas = new OffscreenCanvas(renderConfig.width, renderConfig.height)
    const offscreenRenderer = new PixiRenderer(offscreenCanvas, renderConfig)
    await offscreenRenderer.init(renderConfig)

    const { frames, events } = simulateWithFrames(config)
    const videoFrames: VideoFrame[] = []

    for (let i = 0; i < frames.length; i++) {
      offscreenRenderer.render(frames[i])
      const blob = await offscreenRenderer.getBlob('image/png')
      
      if (blob) {
        const bitmap = await createImageBitmap(blob)
        const videoFrame = new VideoFrame(bitmap, {
          timestamp: (i / currentSimConfig.value.fps) * 1000000
        })
        videoFrames.push(videoFrame)
        bitmap.close()
      }
    }

    const exportConfig: ExportConfig = {
      video: {
        width: renderConfig.width,
        height: renderConfig.height,
        framerate: config.fps,
        bitrate: 2000000,
        codec: 'avc1.42E01E'
      },
      audio: {
        sampleRate: 44100,
        numberOfChannels: 2,
        bitrate: 128000,
        codec: 'mp4a.40.2'
      },
      synth: synthConfig,
      muxer: {
        width: renderConfig.width,
        height: renderConfig.height,
        framerate: config.fps,
        videoCodec: 'avc',
        audioCodec: 'aac',
        audioSampleRate: 44100,
        audioChannels: 2
      }
    }

    const arrayBuffer = await mediaExporter.exportVideo(
      videoFrames,
      events,
      exportConfig,
      (progress) => {
        exportProgress.value = progress
      }
    )

    mediaExporter.downloadBlob(arrayBuffer, 'geometric-simulation.mp4')
    
    offscreenRenderer.destroy()
    videoFrames.forEach(frame => frame.close())

  } catch (error) {
    console.error('Export failed:', error)
  } finally {
    isExporting.value = false
    exportProgress.value = null
  }
}
</script>

<template>
  <div class="app">
    <div class="header">
      <h1>Geometric Physics Demo</h1>
      <div class="controls">
        <button @click="togglePlay" :disabled="isExporting">
          {{ isPlaying ? 'Пауза' : 'Играть' }}
        </button>
        <button @click="exportVideo" :disabled="isExporting || isPlaying">
          {{ isExporting ? 'Экспорт...' : 'Экспорт MP4' }}
        </button>
      </div>
    </div>

    <div class="settings">
      <div class="scene-selector">
        <label>Сценка:</label>
        <select v-model="selectedSceneId" @change="updateScene" :disabled="isPlaying || isExporting">
          <option value="bouncing-balls">Прыгающие шарики</option>
          <option value="orbital-chaos">Орбитальный хаос</option>
          <option value="gravity-well">Гравитационный колодец</option>
          <option value="chain-reaction">Цепная реакция</option>
        </select>
      </div>
      
      <div class="scene-description" v-if="sceneManager">
        {{ sceneManager.getCurrentScene().description }}
      </div>

      <div class="parameters">
        <div class="param">
          <label>Seed:</label>
          <input 
            type="number" 
            v-model.number="seed" 
            @change="updateScene"
            :disabled="isPlaying || isExporting"
            min="1"
            max="999999"
          >
        </div>
        <div class="param">
          <label>FPS:</label>
          <input 
            type="number" 
            v-model.number="fps" 
            @change="updateScene"
            :disabled="isPlaying || isExporting"
            min="30"
            max="120"
          >
        </div>
        <div class="param">
          <label>Секунды:</label>
          <input 
            type="number" 
            v-model.number="duration" 
            @change="updateScene"
            :disabled="isPlaying || isExporting"
            min="5"
            max="60"
          >
        </div>
      </div>
    </div>

    <div class="canvas-container">
      <canvas ref="canvas" width="800" height="600"></canvas>
    </div>

    <div v-if="exportProgress" class="export-progress">
      <div class="phase">{{ exportProgress.phase }}</div>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${(exportProgress.progress / exportProgress.total) * 100}%` }"
        ></div>
      </div>
      <div class="progress-text">
        {{ exportProgress.progress }} / {{ exportProgress.total }}
      </div>
    </div>

    <div class="info">
      <p>Детерминированная физическая симуляция с генерацией музыки</p>
      <p>Seed: {{ seed }} | FPS: {{ fps }} | Длительность: {{ duration }}сек</p>
    </div>
  </div>
</template>

<style scoped>
.app {
  font-family: Arial, sans-serif;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  color: #333;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
}

.controls {
  display: flex;
  gap: 10px;
}

.controls button {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.controls button:hover:not(:disabled) {
  background: #2980b9;
}

.controls button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.settings {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.scene-selector {
  margin-bottom: 15px;
}

.scene-selector label {
  display: inline-block;
  width: 80px;
  font-weight: bold;
}

.scene-selector select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  width: 250px;
}

.scene-description {
  background: #e9ecef;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-style: italic;
  color: #6c757d;
}

.parameters {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.param {
  display: flex;
  flex-direction: column;
  min-width: 120px;
}

.param label {
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 14px;
}

.param input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.param input:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.canvas-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

canvas {
  border: 2px solid #34495e;
  border-radius: 8px;
}

.export-progress {
  background: #ecf0f1;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.phase {
  font-weight: bold;
  margin-bottom: 10px;
  text-transform: capitalize;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #bdc3c7;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress-fill {
  height: 100%;
  background: #27ae60;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: right;
  font-size: 12px;
  color: #7f8c8d;
}

.info {
  text-align: center;
  color: #7f8c8d;
  font-size: 14px;
}

.info p {
  margin: 5px 0;
}
</style>
