<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Matter from 'matter-js'
import { useScene } from '../composables/useScene'
import { useRainbowColors } from '../composables/useRainbowColors'
import { useCollisionSounds } from '../composables/useCollisionSounds'
import { ElementFactory } from '../utils/elementFactory'
import type { SceneSetupContext } from '../composables/useScene'
import type { ColorableBody } from '../composables/useRainbowColors'

const canvasContainer = ref<HTMLDivElement>()

const balls: Matter.Body[] = []
const boundary = ref<Matter.Body>()

const { startRainbowAnimation } = useRainbowColors()
const { createCollisionHandler } = useCollisionSounds()

const scene = useScene(
  {
    name: 'Rainbow Bouncing Balls',
    width: 800,
    height: 800,
    gravity: { x: 0, y: 1 },
    backgroundColor: '#111'
  },
  {
    setupScene: (context: SceneSetupContext) => {
      // Создаём границы
      boundary.value = ElementFactory.createBoundaryBox(
        400,
        400,
        400,
        400,
        10
      )
      context.addElement(boundary.value)

      // Создаём шары с начальной скоростью
      const ball1 = ElementFactory.createBall(380, 400, 30)
      const ball2 = ElementFactory.createBall(420, 430, 30)

      ElementFactory.setVelocity(ball1, 5, 3)
      ElementFactory.setVelocity(ball2, -3, 5)

      balls.push(ball1, ball2)

      context.addElement(ball1)
      context.addElement(ball2)
    },

    setupEventHandlers: (context: SceneSetupContext) => {
      // Добавляем обработчик столкновений со звуками
      const collisionHandler = createCollisionHandler(balls)
      Matter.Events.on(context.engine, 'collisionStart', collisionHandler)

      // Добавляем мышиное взаимодействие
      const mouse = Matter.Mouse.create(context.render.canvas)
      const mouseConstraint = Matter.MouseConstraint.create(context.engine, {
        mouse,
        constraint: {
          stiffness: 0.5,
          render: { visible: false }
        }
      })
      context.addElement(mouseConstraint)
      context.render.mouse = mouse
    },

    animate: () => {
      // Ограничиваем скорость шаров
      const maxSpeed = 50
      balls.forEach(ball => {
        const speed = Math.sqrt(
          ball.velocity.x ** 2 + ball.velocity.y ** 2
        )
        if (speed > maxSpeed) {
          const scale = maxSpeed / speed
          Matter.Body.setVelocity(ball, {
            x: ball.velocity.x * scale,
            y: ball.velocity.y * scale
          })
        }
      })
    }
  }
)

// Запускаем радужную анимацию
startRainbowAnimation(() => {
  const bodies = [...balls]
  if (boundary.value) {
    bodies.push(...boundary.value.parts.filter(p => p.id !== boundary.value!.id))
  }
  return bodies.filter(body => body.render && typeof body.render.fillStyle === 'string') as ColorableBody[]
})

const toggleScene = () => {
  if (scene.isRunning.value) {
    scene.stop()
  } else {
    scene.start()
  }
}

onMounted(() => {
  if (canvasContainer.value) {
    scene.init(canvasContainer.value)
  }
})
</script>

<template>
  <div class="scene-container">
    <div class="controls">
      <button
        @click="toggleScene"
        class="control-button"
        :class="{ active: scene.isRunning }"
      >
        {{ scene.isRunning ? 'Остановить' : 'Запустить' }}
      </button>
    </div>
    <div ref="canvasContainer" class="canvas-container"></div>
  </div>
</template>

<style scoped>
.scene-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #222;
  min-height: 100vh;
}

.controls {
  margin-bottom: 20px;
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
}

.control-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.control-button.active {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
}

.canvas-container {
  border: 2px solid #333;
  border-radius: 8px;
  overflow: hidden;
}
</style>
