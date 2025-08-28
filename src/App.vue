<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Matter from 'matter-js'
import type { Synth, Gain } from 'tone'

const {
  Engine,
  Render,
  Runner,
  MouseConstraint,
  Mouse,
  Composite,
  Bodies,
  Body,
  Events,
  // Composites,
  // Constraint,
  // Vector,
} = Matter

const canvasContainer = ref<HTMLDivElement>()
const isRunning = ref(false)
const engine = ref<Matter.Engine>()
const runner = ref<Matter.Runner>()
let animationId = 0

const initScene = () => {
  if (!canvasContainer.value) {
    return
  }

  // Очищаем предыдущий canvas
  canvasContainer.value.innerHTML = ''

  const newEngine = Engine.create()
  const world = newEngine.world
  engine.value = newEngine

  // Настройки для более стабильной физики
  newEngine.timing.timeScale = 1
  newEngine.positionIterations = 10 // больше итераций для точности позиций
  newEngine.velocityIterations = 8 // больше итераций для скоростей
  newEngine.constraintIterations = 4 // точность ограничений

  const canvas = document.createElement('canvas')
  canvasContainer.value.appendChild(canvas)

  const render = Render.create({
    canvas,
    engine: newEngine,
    options: {
      width: 800,
      height: 800,
      wireframes: false,
      background: '#000',
    },
  })

  Render.run(render)

  runner.value = Runner.create({
    delta: 1, // 240 FPS (1000ms / 240)
  })

  const mainSquare = Body.create({
    parts: [
      Bodies.rectangle(-95, 100, 10, 400, { friction: 0, frictionStatic: 0 }),
      Bodies.rectangle(100, -95, 400, 10, { friction: 0, frictionStatic: 0 }),
      Bodies.rectangle(295, 100, 10, 400, { friction: 0, frictionStatic: 0 }),
      Bodies.rectangle(100, 295, 400, 10, { friction: 0, frictionStatic: 0 }),
    ],
    isStatic: true,
  })

  Body.setPosition(mainSquare, { x: 400, y: 400 })

  const ball = Bodies.circle(380, 400, 30, {
    density: 1,
    restitution: 1.1,
    friction: 0,
    frictionAir: 0.005,
    render: { fillStyle: '#ff0000' },
  })

  const ball2 = Bodies.circle(400, 430, 30, {
    density: 1,
    restitution: 1.1,
    friction: 0,
    frictionAir: 0.005,
    render: { fillStyle: '#ff0000' },
  })

  // SCENE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  Composite.add(world, [mainSquare, ball, ball2])
  
  // Даём шарам начальную скорость
  Body.setVelocity(ball, { x: 5, y: 3 })
  Body.setVelocity(ball2, { x: -3, y: 5 })
  // SCENE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  // Ограничиваем скорость на каждом шаге
  const maxSpeed = 50

  // Создаём синтезатор только при запуске
  let synth: Synth | null = null
  let gain: Gain | null = null

  const playBounceSound = async (intensity: number) => {
    try {
      // Создаём синтезатор при первом звуке
      if (!synth) {
        const Tone = await import('tone')
        await Tone.start()
        gain = new Tone.Gain(1.3)
        synth = new Tone.Synth({
          oscillator: {
            type: 'sine',
          },
          envelope: {
            attack: 0.01,
            decay: 0.1,
            sustain: 0,
            release: 0.1,
          },
        }).chain(gain, Tone.getDestination())
      }

      // Частота зависит от силы удара
      const frequency = 200 + intensity * 400

      // Используем текущее время + небольшая задержка для избежания конфликтов
      const now = synth.context.currentTime + 0.01

      // Клипующий громкий звук, как просили! 🔊💥
      synth.triggerAttackRelease(frequency, '0.2', now, intensity * 10)
    } catch (error) {
      console.warn('Sound playback error:', error)
    }
  }

  // Отслеживаем столкновения
  let lastCollisionTime = 0
  const onCollision = (event: Matter.IEventCollision<Matter.Engine>) => {
    const now = Date.now()
    if (now - lastCollisionTime < 50) return // дебаунс

    const pairs = event.pairs
    for (const pair of pairs) {
      const { bodyA, bodyB } = pair
      
      if (bodyA.id === ball.id || bodyB.id === ball.id || bodyA.id === ball2.id || bodyB.id === ball2.id) {
        // Определяем какой шар столкнулся
        const currentBall = bodyA.id === ball.id || bodyB.id === ball.id ? ball : ball2

        // Вычисляем силу столкновения по скорости
        const speed = Math.sqrt(
          currentBall.velocity.x * currentBall.velocity.x +
            currentBall.velocity.y * currentBall.velocity.y,
        )
        const intensity = Math.min(speed / maxSpeed, 1)

        playBounceSound(intensity)
        lastCollisionTime = now
        break
      }
    }
  }

  // Подписываемся на события столкновений Matter.js
  Events.on(newEngine, 'collisionStart', onCollision)

  const updateColors = () => {
    const time = Date.now() * 0.001

    // Первый шар
    const speed = Math.sqrt(ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y)
    const baseHue = (time * 50) % 360
    const speedHue = (speed * 10) % 360
    const hue = (baseHue + speedHue) % 360
    const saturation = Math.min(70 + speed * 2, 100)
    const lightness = Math.min(40 + speed * 1.5, 70)
    ball.render.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`

    // Второй шар с противоположными цветами
    const speed2 = Math.sqrt(
      ball2.velocity.x * ball2.velocity.x + ball2.velocity.y * ball2.velocity.y,
    )
    const baseHue2 = (time * 60 + 180) % 360
    const speedHue2 = (speed2 * 10) % 360
    const hue2 = (baseHue2 + speedHue2) % 360
    const saturation2 = Math.min(70 + speed2 * 2, 100)
    const lightness2 = Math.min(40 + speed2 * 1.5, 70)
    ball2.render.fillStyle = `hsl(${hue2}, ${saturation2}%, ${lightness2}%)`

    // Красим каждую часть mainSquare отдельно
    mainSquare.parts.forEach((part) => {
      const partHue = (time * 100) % 360
      part.render.fillStyle = `hsl(${partHue}, 80%, 55%)`
    })
  }

  const limitVelocity = () => {
    if (isRunning.value) {
      // Ограничение для первого шара
      const speed = Math.sqrt(ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y)
      if (speed > maxSpeed) {
        const scale = maxSpeed / speed
        Body.setVelocity(ball, {
          x: ball.velocity.x * scale,
          y: ball.velocity.y * scale,
        })
      }

      // Ограничение для второго шара
      const speed2 = Math.sqrt(
        ball2.velocity.x * ball2.velocity.x + ball2.velocity.y * ball2.velocity.y,
      )
      if (speed2 > maxSpeed) {
        const scale2 = maxSpeed / speed2
        Body.setVelocity(ball2, {
          x: ball2.velocity.x * scale2,
          y: ball2.velocity.y * scale2,
        })
      }
    }

    // Цвета обновляем всегда, когда сцена существует
    updateColors()
    animationId = requestAnimationFrame(limitVelocity)
  }

  // Добавляем мышиное взаимодействие
  const mouse = Mouse.create(render.canvas)
  const mouseConstraint = MouseConstraint.create(newEngine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.5,
      render: {
        visible: false,
      },
    },
  })

  Composite.add(world, mouseConstraint)
  render.mouse = mouse

  return { limitVelocity }
}

const toggleScene = () => {
  if (isRunning.value) {
    // Останавливаем физику
    isRunning.value = false
    if (runner.value) {
      Runner.stop(runner.value)
    }
  } else {
    // Запускаем/перезапускаем
    cancelAnimationFrame(animationId)
    const result = initScene()
    if (runner.value && engine.value && result) {
      Runner.run(runner.value, engine.value)
      result.limitVelocity()
      isRunning.value = true
    }
  }
}

onMounted(() => {
  // Изначально сценка не запущена
})
</script>

<template>
  <div class="app">
    <button @click="toggleScene" class="control-button" :class="{ active: isRunning }">
      {{ isRunning ? 'Остановить' : 'Запустить' }}
    </button>
    <div ref="canvasContainer" class="canvas-container"></div>
  </div>
</template>

<style>
body {
  margin: 0;
}
</style>

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
}

.control-button.active {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
}
</style>
