import type { PRNG } from './prng'

export interface Vec2 {
  x: number
  y: number
}

export interface Circle {
  id: number
  position: Vec2
  velocity: Vec2
  radius: number
  mass: number
  color: number
}

export interface Collision {
  circleId: number
  normal: Vec2
  penetration: number
  timestamp: number
}

export interface PhysicsConfig {
  gravity: Vec2
  damping: number
  restitution: number
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
}

export class PhysicsEngine {
  private circles: Circle[] = []
  private collisions: Collision[] = []
  private config: PhysicsConfig
  private time = 0

  constructor(config: PhysicsConfig) {
    this.config = config
  }

  addCircle(circle: Circle): void {
    this.circles.push({
      ...circle,
      position: { ...circle.position },
      velocity: { ...circle.velocity }
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  step(dt: number, _rand: PRNG): Collision[] {
    this.time += dt
    this.collisions = []

    for (const circle of this.circles) {
      circle.velocity.x += this.config.gravity.x * dt
      circle.velocity.y += this.config.gravity.y * dt

      circle.velocity.x *= this.config.damping
      circle.velocity.y *= this.config.damping

      circle.position.x += circle.velocity.x * dt
      circle.position.y += circle.velocity.y * dt
    }

    this.handleBoundsCollisions()
    this.handleCircleCollisions()

    return [...this.collisions].sort((a, b) => a.circleId - b.circleId)
  }

  private handleBoundsCollisions(): void {
    const { bounds, restitution } = this.config

    for (const circle of this.circles) {
      const { position, velocity, radius } = circle

      if (position.x - radius < bounds.x) {
        position.x = bounds.x + radius
        velocity.x = -velocity.x * restitution
        this.addCollision(circle.id, { x: 1, y: 0 }, radius - (position.x - bounds.x))
      } else if (position.x + radius > bounds.x + bounds.width) {
        position.x = bounds.x + bounds.width - radius
        velocity.x = -velocity.x * restitution
        this.addCollision(circle.id, { x: -1, y: 0 }, radius - (bounds.x + bounds.width - position.x))
      }

      if (position.y - radius < bounds.y) {
        position.y = bounds.y + radius
        velocity.y = -velocity.y * restitution
        this.addCollision(circle.id, { x: 0, y: 1 }, radius - (position.y - bounds.y))
      } else if (position.y + radius > bounds.y + bounds.height) {
        position.y = bounds.y + bounds.height - radius
        velocity.y = -velocity.y * restitution
        this.addCollision(circle.id, { x: 0, y: -1 }, radius - (bounds.y + bounds.height - position.y))
      }
    }
  }

  private handleCircleCollisions(): void {
    for (let i = 0; i < this.circles.length; i++) {
      for (let j = i + 1; j < this.circles.length; j++) {
        const a = this.circles[i]
        const b = this.circles[j]

        const dx = b.position.x - a.position.x
        const dy = b.position.y - a.position.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const minDistance = a.radius + b.radius

        if (distance < minDistance && distance > 0) {
          const nx = dx / distance
          const ny = dy / distance
          const penetration = minDistance - distance

          const totalMass = a.mass + b.mass
          const aRatio = b.mass / totalMass
          const bRatio = a.mass / totalMass

          a.position.x -= nx * penetration * aRatio
          a.position.y -= ny * penetration * aRatio
          b.position.x += nx * penetration * bRatio
          b.position.y += ny * penetration * bRatio

          const relativeVelocityX = b.velocity.x - a.velocity.x
          const relativeVelocityY = b.velocity.y - a.velocity.y
          const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny

          if (velocityAlongNormal > 0) {
            continue
          }

          const impulse = -2 * velocityAlongNormal / totalMass * this.config.restitution
          const impulseX = impulse * nx
          const impulseY = impulse * ny

          a.velocity.x -= impulseX * b.mass
          a.velocity.y -= impulseY * b.mass
          b.velocity.x += impulseX * a.mass
          b.velocity.y += impulseY * a.mass

          this.addCollision(a.id, { x: nx, y: ny }, penetration)
          this.addCollision(b.id, { x: -nx, y: -ny }, penetration)
        }
      }
    }
  }

  private addCollision(circleId: number, normal: Vec2, penetration: number): void {
    this.collisions.push({
      circleId,
      normal: { ...normal },
      penetration,
      timestamp: this.time
    })
  }

  getCircles(): Circle[] {
    return this.circles.map(c => ({
      ...c,
      position: { ...c.position },
      velocity: { ...c.velocity }
    }))
  }

  getTime(): number {
    return this.time
  }

  reset(): void {
    this.circles = []
    this.collisions = []
    this.time = 0
  }
}