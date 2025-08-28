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
const isRunning = ref(false)
let rotationAngle = 0
let frameCounter = 0

// Массивы для хранения шлейфов каждого шара
const trailBodies: Map<number, Matter.Body[]> = new Map()

const { startRainbowAnimation, stopRainbowAnimation } = useRainbowColors()
const { createCollisionHandler, toggleMute, isMuted } = useCollisionSounds()

const scene = useScene(
  {
    name: 'Two Balls Demo',
    width: 800,
    height: 800,
    gravity: { x: 0, y: 1 },
    backgroundColor: '#000'
  },
  {
    setupScene: (context: SceneSetupContext) => {
      // Создаём границы
      boundary.value = ElementFactory.createBoundaryBox(
        400,
        400,
        400,
        400,
        10,
        { friction: 0, frictionStatic: 0 }
      )
      context.addElement(boundary.value)

      // Создаём два шара
      const ball1 = ElementFactory.createBall(380, 300, 20, {
        density: 1,
        restitution: 1.3,
        friction: 0,
        frictionAir: 0.005
      })

      const ball2 = ElementFactory.createBall(400, 430, 20, {
        density: 1,
        restitution: 1.3,
        friction: 0,
        frictionAir: 0.005
      })

      // Даём начальную скорость
      ElementFactory.setVelocity(ball1, 5, 3)
      ElementFactory.setVelocity(ball2, -3, 5)

      balls.push(ball1, ball2)

      context.addElement(ball1)
      context.addElement(ball2)
    },

    setupEventHandlers: (context: SceneSetupContext) => {
      // Добавляем обработчик столкновений со звуками
      const collisionHandler = createCollisionHandler(balls, 50, 50)
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
      const maxSpeed = 40
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

      // Обновляем шлейфы для шаров каждые 5 кадров
      frameCounter++
      if (frameCounter % 2 === 0) {
        balls.forEach(ball => {
        const ballId = ball.id
        const trails = trailBodies.get(ballId) || []

        // Создаём новый шар-шлейф
        const trailBall = ElementFactory.createBall(
          ball.position.x,
          ball.position.y,
          ball.circleRadius || 20,
          {
            render: {
              fillStyle: ball.render.fillStyle || '#ff6b6b',
              strokeStyle: 'transparent'
            }
          }
        )

        // Полностью отключаем физические взаимодействия
        trailBall.collisionFilter = {
          group: -1,
          category: 0x0000,
          mask: 0x0000
        }

        // Устанавливаем начальную прозрачность
        if (trailBall.render) {
          trailBall.render.opacity = 0.5
        }

        // Добавляем в начало массива
        trails.unshift(trailBall)

        // Обновляем прозрачность всех шлейфов
        trails.forEach((trail, index) => {
          if (trail.render) {
            trail.render.opacity = Math.max(0.1, 0.5 - index * 0.05)
          }
        })

        // Ограничиваем до 10 шлейфов
        if (trails.length > 10) {
          const oldTrail = trails.pop()
          if (oldTrail) {
            scene.removeElement(oldTrail)
          }
        }

        // Добавляем новый шлейф в сцену
        scene.addElement(trailBall)

        // Сохраняем обновленный массив
        trailBodies.set(ballId, trails)
        })
      }

      // Медленное вращение границ через изменение угла
      if (boundary.value) {
        rotationAngle += 0.05
        Matter.Body.setAngle(boundary.value, rotationAngle)
      }
    }
  }
)

// Функция для получения всех тел для радужной анимации
const getRainbowBodies = () => {
  const bodies = [...balls]
  if (boundary.value) {
    // Добавляем части рамки (кроме основного тела)
    bodies.push(...boundary.value.parts.filter(p => p.id !== boundary.value!.id))
  }
  return bodies.filter(body => body.render && typeof body.render.fillStyle === 'string') as ColorableBody[]
}

const toggleScene = () => {
  if (isRunning.value) {
    scene.stop()
    stopRainbowAnimation()
    isRunning.value = false
  } else {
    scene.start()
    startRainbowAnimation(getRainbowBodies)
    isRunning.value = true
  }
}

const restartScene = () => {
  const wasRunning = isRunning.value
  stopRainbowAnimation()

  // Очищаем массивы, сбрасываем угол и шлейфы
  balls.length = 0
  rotationAngle = 0

  // Удаляем все шлейфы из сцены
  trailBodies.forEach(trails => {
    trails.forEach(trail => {
      scene.removeElement(trail)
    })
  })
  trailBodies.clear()

  // Используем встроенную функцию reset
  scene.reset()

  if (wasRunning) {
    scene.start()
    isRunning.value = true
  } else {
    isRunning.value = false
  }

  startRainbowAnimation(getRainbowBodies)
}

onMounted(() => {
  if (canvasContainer.value) {
    scene.init(canvasContainer.value)
    // Запускаем радужную анимацию сразу
    startRainbowAnimation(getRainbowBodies)
  }
})
</script>

<template>
  <div class="app">
    <div class="controls">
      <button
        @click="toggleScene"
        class="control-button"
        :class="{ active: isRunning }"
      >
        {{ isRunning ? 'Остановить' : 'Запустить' }}
      </button>
      <button
        @click="restartScene"
        class="control-button restart"
      >
        Рестарт
      </button>
      <button
        @click="toggleMute"
        class="control-button mute"
        :class="{ active: isMuted }"
      >
        {{ isMuted ? '🔇 Выкл' : '🔊 Звук' }}
      </button>
    </div>
    <div ref="canvasContainer" class="canvas-container"></div>
  </div>
</template>

<style scoped>
.app {
  display: grid;
  grid-template-rows: auto 1fr;
  justify-items: center;
  background-color: #222;
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 20px;
  box-sizing: border-box;
  height: 100vh;
  width: 100vw;
}

.canvas-container {
  display: inline-block;
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
  margin-bottom: 20px;
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

.controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
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
