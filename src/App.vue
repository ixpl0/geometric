<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Matter from 'matter-js'
import * as Tone from 'tone'

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

onMounted(() => {
  if (!canvasContainer.value) {
    return
  }

  const engine = Engine.create()
  const world = engine.world

  // Настройки для более стабильной физики
  engine.timing.timeScale = 1
  engine.positionIterations = 10  // больше итераций для точности позиций
  engine.velocityIterations = 8   // больше итераций для скоростей
  engine.constraintIterations = 4 // точность ограничений

  const canvas = document.createElement('canvas')
  canvasContainer.value.appendChild(canvas)

  const render = Render.create({
    canvas,
    engine,
    options: {
      width: 800,
      height: 800,
      wireframes: false,
      background: '#333',
    },
  })

  Render.run(render)

  const runner = Runner.create({
    delta: 1,   // 240 FPS (1000ms / 240)
    isFixed: true   // стабильный временной шаг
  })
  Runner.run(runner, engine)

  const letterP = Body.create({
    parts: [
      Bodies.rectangle(-95, 100, 10, 400, { friction: 0, frictionStatic: 0 }),  // толще стенки
      Bodies.rectangle(100, -95, 400, 10, { friction: 0, frictionStatic: 0 }),  // толще стенки
      Bodies.rectangle(295, 100, 10, 400, { friction: 0, frictionStatic: 0 }),  // толще стенки
      Bodies.rectangle(100, 295, 400, 10, { friction: 0, frictionStatic: 0 }),  // толще стенки
    ],
    render: { fillStyle: '#e74c3c' },
    isStatic: true,
  })

  Body.setPosition(letterP, { x: 400, y: 400 })

  const ball = Bodies.circle(400, 400, 30, {
    density: 1,
    restitution: 1.1,
    friction: 0,
    frictionAir: 0.005,
  })

  Composite.add(world, [
    letterP,
    ball,
  ])

  // Ограничиваем скорость на каждом шаге
  const maxSpeed = 50
  // Создаём лёгкий усилитель
  const gain = new Tone.Gain(1.3)  // лёгкое усиление

  // Создаём синтезатор для звуков ударов
  const synth = new Tone.Synth({
    oscillator: {
      type: 'sine'
    },
    envelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0,
      release: 0.1
    }
  }).chain(gain, Tone.Destination)

  const playBounceSound = async (intensity: number) => {
    // Инициализируем Tone.js при первом звуке
    if (Tone.context.state !== 'running') {
      await Tone.start()
    }

    // Частота зависит от силы удара
    const frequency = 200 + (intensity * 400)

    // Клипующий громкий звук, как просили! 🔊💥
    synth.triggerAttackRelease(frequency, '0.2', undefined, intensity * 10)
  }

  // Отслеживаем столкновения
  let lastCollisionTime = 0
  const onCollision = (event: Matter.IEventCollision<Matter.Engine>) => {
    const now = Date.now()
    if (now - lastCollisionTime < 50) return // дебаунс

    const pairs = event.pairs
    for (const pair of pairs) {
      const { bodyA, bodyB } = pair
      if (bodyA === ball || bodyB === ball) {
        // Вычисляем силу столкновения по скорости
        const speed = Math.sqrt(ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y)
        const intensity = Math.min(speed / maxSpeed, 1)

        playBounceSound(intensity)
        lastCollisionTime = now
        break
      }
    }
  }

  // Подписываемся на события столкновений Matter.js
  Events.on(engine, 'collisionStart', onCollision)

  const limitVelocity = () => {
    const speed = Math.sqrt(ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y)
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed
      Body.setVelocity(ball, {
        x: ball.velocity.x * scale,
        y: ball.velocity.y * scale
      })
    }
    requestAnimationFrame(limitVelocity)
  }
  limitVelocity()

  // Добавляем мышиное взаимодействие
  const mouse = Mouse.create(render.canvas)
  const mouseConstraint = MouseConstraint.create(engine, {
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
})
</script>

<template>
  <div class="app">
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
  background-color: #444;
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 20px;
  box-sizing: border-box;
  height: 100vh;
  width: 100vw;
}

.canvas-container {
  display: inline-block;
  border: 2px solid #333;
  margin: 20px 0;
}
</style>
