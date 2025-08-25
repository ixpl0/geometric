<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
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
let isInitialized = false

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
  mediaExporter = new MediaExporter(synthConfig)
  sceneManager = new SceneManager(sceneSettings.value)

  isInitialized = true
  updateScene()
})

const updateScene = () => {
  if (!renderer || !sceneManager || !isInitialized) {
    return
  }

  const config = getCurrentSimConfig()
  if (!config) return

  const { frames } = simulateWithFrames(config)

  if (frames[0] && frames[0].length > 0) {
    renderer.render(frames[0])
  }
}

watch([selectedSceneId, seed, fps, duration], () => {
  if (isInitialized) {
    updateScene()
  }
}, { flush: 'post' })

const togglePlay = async () => {
  const config = getCurrentSimConfig()
  if (!audioSynth || !config) return

  if (isPlaying.value) {
    console.log('🛑 Stopping playback')
    audioSynth.stop()
    isPlaying.value = false
  } else {
    console.log('▶️ Starting playback')

    // Инициализируем аудио при первом нажатии
    if (!audioSynth.isInitialized) {
      console.log('🎛️ Initializing audio for first time...')
      try {
        await audioSynth.init()
        console.log('✅ Audio initialized successfully')
      } catch (error) {
        console.warn('❌ Could not initialize audio:', error)
        return
      }
    }

    console.log('🎬 Starting live physics simulation...')

    audioSynth.start()
    isPlaying.value = true
    await animate()
  }
}

const animate = async () => {
  const config = getCurrentSimConfig()
  if (!renderer || !config || !audioSynth) return

  // Создаём новый физический движок для живой симуляции
  const { PhysicsEngine } = await import('./core/physics')
  const { mulberry32 } = await import('./core/prng')

  const engine = new PhysicsEngine(config.physics)
  const rand = mulberry32(config.seed)
  const dt = 1 / config.fps
  const startTime = performance.now()
  const maxDuration = config.duration * 1000 // в миллисекундах

  // Добавляем объекты в движок
  config.objects.forEach(objConfig => {
    switch (objConfig.type) {
      case 'circle':
        engine.addCircle(
          objConfig.id,
          objConfig.position.x,
          objConfig.position.y,
          objConfig.radius || 20,
          {
            mass: objConfig.mass || 1,
            color: objConfig.color || 0xffffff,
            isStatic: objConfig.isStatic || false,
            restitution: objConfig.restitution || 0.8,
            friction: objConfig.friction || 0.1
          }
        )
        break
        
      case 'rectangle':
      case 'platform':
        engine.addRectangle(
          objConfig.id,
          objConfig.position.x,
          objConfig.position.y,
          objConfig.width || 100,
          objConfig.height || 20,
          {
            mass: objConfig.mass || 1,
            color: objConfig.color || 0x888888,
            isStatic: objConfig.isStatic || true,
            restitution: objConfig.restitution || 0.8,
            friction: objConfig.friction || 0.5,
            angle: objConfig.angle || 0
          }
        )
        break
    }
  })

  const NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5']
  const pickNote = (): string => {
    const index = Math.floor(rand() * NOTES.length)
    return NOTES[index]
  }

  const calculateVelocity = (collision: { force: number }): number => {
    const velocity = Math.min(collision.force * 0.5, 1) // force обычно больше penetration
    const minVelocity = 0.3 // минимальная громкость для слышимости
    return Math.max(velocity, minVelocity)
  }

  const loop = () => {
    if (!renderer || !isPlaying.value || !audioSynth) return

    const elapsed = performance.now() - startTime

    // Остановиться по таймауту
    if (elapsed >= maxDuration) {
      console.log('🏁 Animation complete')
      audioSynth.stop()
      isPlaying.value = false
      return
    }

    // Выполняем шаг физической симуляции
    const collisions = engine.step(dt, rand)
    const currentTime = elapsed / 1000

    if (collisions.length > 0) {
      console.log(`🎬 Time: ${currentTime.toFixed(3)}s, collisions: ${collisions.length}`)
      collisions.forEach(collision => {
        console.log(`  - Object ${collision.objectId} vs ${collision.otherObjectId}: force=${collision.force.toFixed(3)}, normal=(${collision.normal.x.toFixed(2)}, ${collision.normal.y.toFixed(2)})`)
      })
    }

    // Рендерим текущее состояние объектов
    renderer.render(engine.getObjects())

    // Обрабатываем столкновения в реальном времени
    for (const collision of collisions) {
      // В Matter.js столкновения всегда между объектами, нет "wall collisions"
      if (collision.force > 0.05) { // Минимальная сила столкновения
        const velocity = calculateVelocity(collision)
        const note = pickNote()
        console.log(`💥 Collision! Objects ${collision.objectId} vs ${collision.otherObjectId}, force: ${collision.force.toFixed(3)}, velocity: ${velocity.toFixed(3)}, note: ${note}`)
        
        // Проигрываем звук для каждого участника столкновения
        const circleId = collision.objectId.includes('ball') ? parseInt(collision.objectId.split('-')[1]) : 0
        audioSynth.playNote(circleId, note, velocity)
      } else {
        console.log(`⚪ Small collision (skipped): Objects ${collision.objectId} vs ${collision.otherObjectId}, force: ${collision.force.toFixed(3)}`)
      }
    }

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
          timestamp: (i / config.fps) * 1000000
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
        <select v-model="selectedSceneId" :disabled="isPlaying || isExporting">
          <option value="bouncing-balls">Прыгающие шарики</option>
          <option value="orbital-chaos">Орбитальный хаос</option>
          <option value="gravity-well">Гравитационный колодец</option>
          <option value="chain-reaction">Цепная реакция</option>
          <option value="washing-machine">Стиральная машина</option>
          <option value="pinball-machine">Пинбол-машина</option>
          <option value="gear-factory">Фабрика шестерёнок</option>
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
