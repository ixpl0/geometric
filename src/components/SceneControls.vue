<script setup lang="ts">
interface Props {
  isRunning?: boolean
  isMuted?: boolean
  showMuteButton?: boolean
}

interface Emits {
  toggle: []
  restart: []
  toggleMute: []
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <div class="controls">
    <button @click="$emit('toggle')" class="control-button" :class="{ active: isRunning }">
      {{ isRunning ? 'Остановить' : 'Запустить' }}
    </button>
    <button @click="$emit('restart')" class="control-button restart">
      Рестарт
    </button>
    <button
      v-if="showMuteButton"
      @click="$emit('toggleMute')"
      class="control-button mute"
      :class="{ active: isMuted }"
    >
      {{ isMuted ? '🔇 Выкл' : '🔊 Звук' }}
    </button>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  justify-content: center;
}

.control-button {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
  border: none;
  color: white;
  padding: 15px 30px;
  font-size: 18px;
  font-weight: bold;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  width: fit-content;
}

.control-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  background: linear-gradient(45deg, #4ecdc4, #45b7d1, #96ceb4, #ff6b6b);
}

.control-button.active {
  background: linear-gradient(45deg, #e74c3c, #c0392b, #e67e22, #d35400);
}

.control-button.active:hover {
  background: linear-gradient(45deg, #c0392b, #e67e22, #d35400, #e74c3c);
}

.control-button.restart {
  background: linear-gradient(45deg, #9b59b6, #8e44ad, #3498db, #2ecc71);
}

.control-button.restart:hover {
  background: linear-gradient(45deg, #8e44ad, #9b59b6, #2ecc71, #3498db);
}

.control-button.mute {
  background: linear-gradient(45deg, #f39c12, #e67e22, #d35400, #e74c3c);
}

.control-button.mute:hover {
  background: linear-gradient(45deg, #e67e22, #f39c12, #e74c3c, #d35400);
}

.control-button.mute.active {
  background: linear-gradient(45deg, #7f8c8d, #95a5a6, #bdc3c7, #ecf0f1);
  color: #2c3e50;
}

.control-button.mute.active:hover {
  background: linear-gradient(45deg, #95a5a6, #bdc3c7, #ecf0f1, #7f8c8d);
}
</style>