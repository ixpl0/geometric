<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import TwoBallsScene from './scenes/TwoBallsScene.vue'
import Scene2 from './scenes/Scene2.vue'

interface SceneOption {
  id: string
  name: string
  component: object
}

const scenes: SceneOption[] = [
  {
    id: 'dark',
    name: 'Сцена 1',
    component: TwoBallsScene
  },
  {
    id: 'light',
    name: 'Сцена 2',
    component: Scene2
  }
]

const selectedSceneId = ref('dark')
const currentScene = shallowRef(scenes[0].component)

const changeScene = (sceneId: string) => {
  const scene = scenes.find(s => s.id === sceneId)
  if (scene) {
    selectedSceneId.value = sceneId
    currentScene.value = scene.component
  }
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
        <option
          v-for="scene in scenes"
          :key="scene.id"
          :value="scene.id"
        >
          {{ scene.name }}
        </option>
      </select>
    </div>

    <component :is="currentScene" />
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
