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
}

interface Emits {
  'update:isRunning': [value: boolean]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

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
    backgroundColor: '#111',
  },
  {
    setupScene: (context: SceneSetupContext) => {
      // Создаём границы
      const halfWidth = 400 / 2
      const halfHeight = 400 / 2
      const thickness = 10
      
      const parts = [
        Matter.Bodies.rectangle(400 - halfWidth + thickness / 2, 400, thickness, 400),
        Matter.Bodies.rectangle(400, 400 - halfHeight + thickness / 2, 400, thickness),
        Matter.Bodies.rectangle(400 + halfWidth - thickness / 2, 400, thickness, 400),
        Matter.Bodies.rectangle(400, 400 + halfHeight - thickness / 2, 400, thickness),
      ]
      
      boundary.value = Matter.Body.create({
        parts,
        isStatic: true,
        render: { fillStyle: '#e74c3c' },
      })
      
      Matter.Body.setPosition(boundary.value, { x: 400, y: 400 })
      context.addElement(boundary.value)

      // Создаём шары с начальной скоростью
      const ball1 = Matter.Bodies.circle(380, 400, 30, {
        density: 1,
        restitution: 1.1,
        friction: 0,
        frictionAir: 0.005,
        render: { fillStyle: '#ff0000' },
      })
      const ball2 = Matter.Bodies.circle(420, 430, 30, {
        density: 1,
        restitution: 1.1,
        friction: 0,
        frictionAir: 0.005,
        render: { fillStyle: '#ff0000' },
      })

      Matter.Body.setVelocity(ball1, { x: 5, y: 3 })
      Matter.Body.setVelocity(ball2, { x: -3, y: 5 })

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
          render: { visible: false },
        },
      })
      context.addElement(mouseConstraint)
      context.render.mouse = mouse
    },

    animate: () => {
      // Ограничиваем скорость шаров
      const maxSpeed = 50
      balls.forEach((ball) => {
        const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2)
        if (speed > maxSpeed) {
          const scale = maxSpeed / speed
          Matter.Body.setVelocity(ball, {
            x: ball.velocity.x * scale,
            y: ball.velocity.y * scale,
          })
        }
      })
    },
  },
)

// Запускаем радужную анимацию
startRainbowAnimation(() => {
  const bodies = [...balls]
  if (boundary.value) {
    bodies.push(...boundary.value.parts.filter((p) => p.id !== boundary.value!.id))
  }
  return bodies.filter(
    (body) => body.render && typeof body.render.fillStyle === 'string',
  ) as ColorableBody[]
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

// Реактивное управление через пропсы
watch(() => props.isRunning, (newValue) => {
  if (newValue !== undefined && newValue !== scene.isRunning.value) {
    toggleScene()
  }
})

watch(() => props.shouldRestart, (shouldRestart) => {
  if (shouldRestart) {
    scene.reset()
  }
})

// Эмитим изменения состояния
watch(scene.isRunning, (value) => {
  emit('update:isRunning', value)
})
</script>

<template>
  <div ref="canvasContainer"></div>
</template>

