import { mulberry32, type PRNG } from './prng'
import { PhysicsEngine, type PhysicsConfig, type PhysicsObject, type Collision } from './physics'

export interface SimEvent {
  time: number
  type: 'collision'
  payload: {
    objectId: string
    otherObjectId: string
    note: string
    velocity: number
  }
}

export interface SceneObject {
  type: 'circle' | 'rectangle' | 'platform'
  id: string
  position: { x: number; y: number }
  // Для кругов
  radius?: number
  // Для прямоугольников
  width?: number
  height?: number
  angle?: number
  // Общие свойства
  mass?: number
  color?: number
  isStatic?: boolean
  restitution?: number
  friction?: number
}

export interface SimConfig {
  seed: number
  duration: number
  fps: number
  physics: PhysicsConfig
  objects: SceneObject[]
}

export interface SimResult {
  events: SimEvent[]
  frames: PhysicsObject[][]
  duration: number
  frameCount: number
}

const NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5']

const pickNote = (rand: PRNG): string => {
  const index = Math.floor(rand() * NOTES.length)
  return NOTES[index]
}

const calculateVelocity = (collision: Collision): number => {
  return Math.min(collision.force * 0.5, 1)
}

export const simulateWithFrames = (config: SimConfig): SimResult => {
  const { seed, duration, fps, physics, objects } = config
  const rand = mulberry32(seed)
  const dt = 1 / fps
  const frameCount = Math.floor(duration * fps)
  const events: SimEvent[] = []
  const frames: PhysicsObject[][] = []

  const engine = new PhysicsEngine(physics)

  // Добавляем объекты в физический движок
  objects.forEach(objConfig => {
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

  // Симулируем физику кадр за кадром
  for (let frame = 0; frame < frameCount; frame++) {
    const collisions = engine.step(dt, rand)

    // Сохраняем состояние всех объектов
    frames.push([...engine.getObjects()])

    // Обрабатываем события столкновений
    for (const collision of collisions) {
      if (collision.force > 0.05) {
        events.push({
          time: collision.timestamp,
          type: 'collision',
          payload: {
            objectId: collision.objectId,
            otherObjectId: collision.otherObjectId,
            note: pickNote(rand),
            velocity: calculateVelocity(collision)
          }
        })
      }
    }
  }

  return {
    events,
    frames,
    duration,
    frameCount
  }
}

// Упрощённая функция для быстрой симуляции без кадров
export const simulate = (config: SimConfig): { events: SimEvent[] } => {
  const result = simulateWithFrames(config)
  return { events: result.events }
}