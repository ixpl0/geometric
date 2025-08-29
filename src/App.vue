<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import TwoBallsScene from './scenes/TwoBallsScene.vue'
import Scene2 from './scenes/Scene2.vue'
import RainbowBouncingBalls from './scenes/RainbowBouncingBalls.vue'
import SceneControls from './components/SceneControls.vue'

interface SceneOption {
  id: string
  name: string
  component: object
  hasMute: boolean
}

const scenes: SceneOption[] = [
  {
    id: 'dark',
    name: 'Сцена 1',
    component: TwoBallsScene,
    hasMute: true,
  },
  {
    id: 'light',
    name: 'Сцена 2',
    component: Scene2,
    hasMute: true,
  },
  {
    id: 'rainbow',
    name: 'rainbow',
    component: RainbowBouncingBalls,
    hasMute: false,
  },
]

const selectedSceneId = ref('dark')
const currentScene = shallowRef(scenes[0].component)

// Состояние управления сценой
const isRunning = ref(false)
const isMuted = ref(false)
const restartTrigger = ref(0)

const changeScene = (sceneId: string) => {
  const scene = scenes.find((s) => s.id === sceneId)
  if (scene) {
    selectedSceneId.value = sceneId
    currentScene.value = scene.component
    // Сбрасываем состояние при смене сцены
    isRunning.value = false
    isMuted.value = false
  }
}

const getCurrentScene = () => scenes.find((s) => s.id === selectedSceneId.value)

const handleToggle = () => {
  isRunning.value = !isRunning.value
}

const handleRestart = () => {
  restartTrigger.value++
}

const handleToggleMute = () => {
  isMuted.value = !isMuted.value
}
</script>

<template>
  <div class="app-container">
    <div class="scene-selector">
      <label for="scene-select">Выберите сценку:</label>
      <select
        id="scene-select"
        :value="selectedSceneId"
        @change="changeScene(($event.target as HTMLSelectElement).value)"
        class="scene-select"
      >
        <option v-for="scene in scenes" :key="scene.id" :value="scene.id">
          {{ scene.name }}
        </option>
      </select>
    </div>

    <SceneControls
      :is-running="isRunning"
      :is-muted="isMuted"
      :show-mute-button="getCurrentScene()?.hasMute"
      @toggle="handleToggle"
      @restart="handleRestart"
      @toggle-mute="handleToggleMute"
    />

    <div class="scene-container">
      <component
        :is="currentScene"
        :is-running="isRunning"
        :should-restart="restartTrigger"
        :is-muted="isMuted"
        @update:is-running="isRunning = $event"
        @update:is-muted="isMuted = $event"
      />
    </div>
  </div>
</template>

<style>
* {
  font-family: 'Arial', 'Helvetica', sans-serif;
}

body {
  margin: 0;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #222;
  padding: 20px;
  box-sizing: border-box;
}

.scene-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.scene-selector {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
}

.scene-selector label {
  font-weight: 400;
  color: white;
  font-size: 14px;
}

.scene-select {
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: #2c3e50;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.scene-select:hover {
  background: white;
}

.scene-select:focus {
  background: white;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
}
</style>
