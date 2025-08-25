import { mulberry32, type PRNG } from './prng'
import { PhysicsEngine, type PhysicsConfig, type Circle, type Collision } from './physics'

export interface SimEvent {
  time: number
  type: 'collision'
  payload: {
    circleId: number
    note: string
    velocity: number
  }
}

export interface SimConfig {
  seed: number
  duration: number
  fps: number
  physics: PhysicsConfig
  circles: Omit<Circle, 'id'>[]
}

export interface SimResult {
  events: SimEvent[]
  duration: number
  frameCount: number
}

const NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5']

const pickNote = (rand: PRNG): string => {
  const index = Math.floor(rand() * NOTES.length)
  return NOTES[index]
}

const calculateVelocity = (collision: Collision): number => {
  return Math.min(collision.penetration * 10, 1)
}

export const simulate = (config: SimConfig): SimResult => {
  const { seed, duration, fps, physics, circles } = config
  const rand = mulberry32(seed)
  const dt = 1 / fps
  const frameCount = Math.floor(duration * fps)
  const events: SimEvent[] = []

  const engine = new PhysicsEngine(physics)

  circles.forEach((circleConfig, index) => {
    engine.addCircle({
      id: index,
      ...circleConfig
    })
  })

  for (let frame = 0; frame < frameCount; frame++) {
    const collisions = engine.step(dt, rand)

    for (const collision of collisions) {
      if (collision.penetration > 0.1) {
        events.push({
          time: collision.timestamp,
          type: 'collision',
          payload: {
            circleId: collision.circleId,
            note: pickNote(rand),
            velocity: calculateVelocity(collision)
          }
        })
      }
    }
  }

  return {
    events,
    duration,
    frameCount
  }
}

export const simulateWithFrames = (config: SimConfig): {
  events: SimEvent[]
  frames: Circle[][]
  duration: number
  frameCount: number
} => {
  const { seed, duration, fps, physics, circles } = config
  const rand = mulberry32(seed)
  const dt = 1 / fps
  const frameCount = Math.floor(duration * fps)
  const events: SimEvent[] = []
  const frames: Circle[][] = []

  const engine = new PhysicsEngine(physics)

  circles.forEach((circleConfig, index) => {
    const circle = {
      id: index,
      ...circleConfig
    }
    engine.addCircle(circle)
  })

  for (let frame = 0; frame < frameCount; frame++) {
    const collisions = engine.step(dt, rand)

    frames.push(engine.getCircles())

    for (const collision of collisions) {
      if (collision.penetration > 0.1) {
        events.push({
          time: collision.timestamp,
          type: 'collision',
          payload: {
            circleId: collision.circleId,
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