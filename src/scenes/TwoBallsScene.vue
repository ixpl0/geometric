<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import Matter from 'matter-js'
import { useScene } from '../composables/useScene'
import { useRainbowColors } from '../composables/useRainbowColors'
import { useCollisionSounds } from '../composables/useCollisionSounds'
import type { SceneSetupContext } from '../composables/useScene'
import type { ColorableBody } from '../composables/useRainbowColors'

interface Props {
  isRunning?: boolean
  shouldRestart?: boolean
  isMuted?: boolean
}

interface Emits {
  'update:isRunning': [value: boolean]
  'update:isMuted': [value: boolean]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const canvasContainer = ref<HTMLDivElement>()

const balls = ref<Matter.Body[]>([])
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
    backgroundColor: '#000',
  },
  {
    setupScene: (context: SceneSetupContext) => {
      // Создаём границы
      const halfWidth = 400 / 2
      const halfHeight = 400 / 2
      const thickness = 50
      
      const parts = [
        Matter.Bodies.rectangle(400 - halfWidth + thickness / 2, 400, thickness, 400, {
          friction: 0,
          frictionStatic: 0,
        }),
        Matter.Bodies.rectangle(400, 400 - halfHeight + thickness / 2, 400, thickness, {
          friction: 0,
          frictionStatic: 0,
        }),
        Matter.Bodies.rectangle(400 + halfWidth - thickness / 2, 400, thickness, 400, {
          friction: 0,
          frictionStatic: 0,
        }),
        Matter.Bodies.rectangle(400, 400 + halfHeight - thickness / 2, 400, thickness, {
          friction: 0,
          frictionStatic: 0,
        }),
      ]
      
      const square = Matter.Body.create({
        parts,
        isStatic: true,
        render: { fillStyle: '#e74c3c' },
      })
      
      Matter.Body.setPosition(square, { x: 400, y: 400 })

      // Создаём два шара
      const ball1 = Matter.Bodies.circle(380, 300, 20, {
        density: 1,
        restitution: 1.1,
        friction: 0,
        frictionAir: 0.005,
        render: { fillStyle: '#ff0000' },
      })

      const ball2 = Matter.Bodies.circle(400, 430, 20, {
        density: 1,
        restitution: 1.1,
        friction: 0,
        frictionAir: 0.005,
        render: { fillStyle: '#ff0000' },
      })

      // Даём начальную скорость
      Matter.Body.setVelocity(ball1, { x: 5, y: 3 })
      Matter.Body.setVelocity(ball2, { x: -3, y: 5 })

      boundary.value = square
      balls.value = [ball1, ball2]

      context.addElement(square)
      context.addElement(ball1)
      context.addElement(ball2)
    },

    setupEventHandlers: (context: SceneSetupContext) => {
      // Добавляем обработчик столкновений со звуками
      const collisionHandler = createCollisionHandler(balls.value, 50, 50)
      Matter.Events.on(context.engine, 'collisionStart', collisionHandler)

      // Добавляем мышиное взаимодействие
      const mouse = Matter.Mouse.create(context.render.canvas)
      const mouseConstraint = Matter.MouseConstraint.create(context.engine, {
        mouse,
        constraint: {
          stiffness: 0.5,
          render: { visible: false },
        },
      })
      context.addElement(mouseConstraint)
      context.render.mouse = mouse
    },

    animate: () => {
      // Ограничиваем скорость шаров
      const maxSpeed = 40

      balls.value.forEach((ball) => {
        const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2)

        if (speed > maxSpeed) {
          const scale = maxSpeed / speed

          Matter.Body.setVelocity(ball, {
            x: ball.velocity.x * scale,
            y: ball.velocity.y * scale,
          })
        }
      })

      frameCounter++
      if (frameCounter % 3 === 0) {
        balls.value.forEach((ball) => {
          const ballId = ball.id
          const trails = trailBodies.get(ballId) || []

          // Создаём новый шар-шлейф
          const trailBall = Matter.Bodies.circle(
            ball.position.x,
            ball.position.y,
            ball.circleRadius || 20,
            {
              density: 1,
              restitution: 1.1,
              friction: 0,
              frictionAir: 0.005,
              render: {
                fillStyle: ball.render.fillStyle || '#ff6b6b',
                strokeStyle: 'transparent',
              },
            },
          )

          // Полностью отключаем физические взаимодействия
          trailBall.collisionFilter = {
            group: -1,
            category: 0x0000,
            mask: 0x0000,
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
        rotationAngle += 0.02
        Matter.Body.setAngle(boundary.value, rotationAngle)
      }
    },
  },
)

// Функция для получения всех тел для радужной анимации
const getRainbowBodies = () => {
  const bodies = [...balls.value]
  if (boundary.value) {
    // Добавляем части рамки (кроме основного тела)
    bodies.push(...boundary.value.parts.filter((p) => p.id !== boundary.value!.id))
  }
  return bodies.filter(
    (body) => body.render && typeof body.render.fillStyle === 'string',
  ) as ColorableBody[]
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
  balls.value.length = 0
  rotationAngle = 0

  // Удаляем все шлейфы из сцены
  trailBodies.forEach((trails) => {
    trails.forEach((trail) => {
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

// Реактивное управление через пропсы
watch(() => props.isRunning, (newValue) => {
  if (newValue !== undefined && newValue !== isRunning.value) {
    toggleScene()
  }
})

watch(() => props.shouldRestart, (shouldRestart) => {
  if (shouldRestart) {
    restartScene()
  }
})

watch(() => props.isMuted, (newValue) => {
  if (newValue !== undefined && newValue !== isMuted.value) {
    toggleMute()
  }
})

// Эмитим изменения состояния
watch(isRunning, (value) => {
  emit('update:isRunning', value)
})

watch(isMuted, (value) => {
  emit('update:isMuted', value)
})
</script>

<template>
  <div ref="canvasContainer"></div>
</template>

