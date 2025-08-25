import { Engine, World, Bodies, Body, Events, Constraint, Render } from 'matter-js'
import type { PRNG } from './prng'

export interface Vec2 {
  x: number
  y: number
}

export interface PhysicsObject {
  id: string
  body: Body
  type: 'circle' | 'rectangle' | 'line' | 'polygon'
  color: number
  isStatic?: boolean
}

export interface Collision {
  objectId: string
  otherObjectId: string
  normal: Vec2
  penetration: number
  force: number
  timestamp: number
}

export interface PhysicsConfig {
  gravity: Vec2
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  enableSleeping?: boolean
  airFriction?: number
}

export class PhysicsEngine {
  private engine: Engine
  private world: World
  private objects: Map<string, PhysicsObject> = new Map()
  private collisions: Collision[] = []
  private time = 0
  private config: PhysicsConfig

  constructor(config: PhysicsConfig) {
    this.config = config
    this.engine = Engine.create()
    this.world = this.engine.world
    
    // Настраиваем физику
    this.engine.world.gravity.x = config.gravity.x / 1000 // Matter.js использует меньшие значения
    this.engine.world.gravity.y = config.gravity.y / 1000
    
    // Настраиваем границы мира
    this.createBounds()
    
    // Подписываемся на события столкновений
    Events.on(this.engine, 'collisionStart', this.handleCollisionStart.bind(this))
  }

  private createBounds(): void {
    const { bounds } = this.config
    const thickness = 50

    // Создаём невидимые стены
    const walls = [
      // Верх
      Bodies.rectangle(bounds.width / 2, -thickness / 2, bounds.width, thickness, { isStatic: true }),
      // Низ  
      Bodies.rectangle(bounds.width / 2, bounds.height + thickness / 2, bounds.width, thickness, { isStatic: true }),
      // Лево
      Bodies.rectangle(-thickness / 2, bounds.height / 2, thickness, bounds.height, { isStatic: true }),
      // Право
      Bodies.rectangle(bounds.width + thickness / 2, bounds.height / 2, thickness, bounds.height, { isStatic: true })
    ]

    walls.forEach((wall, index) => {
      wall.label = `wall-${index}`
      World.add(this.world, wall)
    })
  }

  addCircle(id: string, x: number, y: number, radius: number, options: {
    mass?: number
    color?: number
    isStatic?: boolean
    restitution?: number
    friction?: number
    frictionAir?: number
  } = {}): void {
    const body = Bodies.circle(x, y, radius, {
      mass: options.mass || 1,
      restitution: options.restitution || 0.8,
      friction: options.friction || 0.1,
      frictionAir: options.frictionAir || 0.01,
      isStatic: options.isStatic || false
    })
    
    body.label = id
    
    const physicsObject: PhysicsObject = {
      id,
      body,
      type: 'circle',
      color: options.color || 0xffffff,
      isStatic: options.isStatic
    }
    
    this.objects.set(id, physicsObject)
    World.add(this.world, body)
  }

  addRectangle(id: string, x: number, y: number, width: number, height: number, options: {
    mass?: number
    color?: number
    isStatic?: boolean
    restitution?: number
    friction?: number
    angle?: number
  } = {}): void {
    const body = Bodies.rectangle(x, y, width, height, {
      mass: options.mass || 1,
      restitution: options.restitution || 0.8,
      friction: options.friction || 0.1,
      isStatic: options.isStatic || false,
      angle: options.angle || 0
    })
    
    body.label = id
    
    const physicsObject: PhysicsObject = {
      id,
      body,
      type: 'rectangle',
      color: options.color || 0xffffff,
      isStatic: options.isStatic
    }
    
    this.objects.set(id, physicsObject)
    World.add(this.world, body)
  }

  addConstraint(bodyA: string, bodyB: string, options: {
    length?: number
    stiffness?: number
    damping?: number
  } = {}): void {
    const objA = this.objects.get(bodyA)
    const objB = this.objects.get(bodyB)
    
    if (!objA || !objB) return
    
    const constraint = Constraint.create({
      bodyA: objA.body,
      bodyB: objB.body,
      length: options.length,
      stiffness: options.stiffness || 0.8,
      damping: options.damping || 0.1
    })
    
    World.add(this.world, constraint)
  }

  // Мотор для вращения объектов
  addRotationMotor(bodyId: string, speed: number): void {
    const obj = this.objects.get(bodyId)
    if (!obj) return
    
    // Применяем постоянный момент вращения
    Body.setAngularVelocity(obj.body, speed)
  }

  private handleCollisionStart(event: any): void {
    const pairs = event.pairs
    
    for (const pair of pairs) {
      const { bodyA, bodyB } = pair
      
      // Пропускаем столкновения со стенами
      if (bodyA.label.startsWith('wall-') || bodyB.label.startsWith('wall-')) {
        continue
      }
      
      const objA = this.objects.get(bodyA.label)
      const objB = this.objects.get(bodyB.label)
      
      if (objA && objB) {
        // Вычисляем силу столкновения
        const force = Math.sqrt(
          Math.pow(bodyA.velocity.x - bodyB.velocity.x, 2) +
          Math.pow(bodyA.velocity.y - bodyB.velocity.y, 2)
        )
        
        // Нормаль столкновения
        const dx = bodyB.position.x - bodyA.position.x
        const dy = bodyB.position.y - bodyA.position.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const normal = distance > 0 ? { x: dx / distance, y: dy / distance } : { x: 1, y: 0 }
        
        this.collisions.push({
          objectId: objA.id,
          otherObjectId: objB.id,
          normal,
          penetration: pair.separation || 0,
          force,
          timestamp: this.time
        })
      }
    }
  }

  step(dt: number, _rand: PRNG): Collision[] {
    this.time += dt
    this.collisions = []
    
    // Обновляем физику Matter.js
    Engine.update(this.engine, dt * 1000) // Matter.js ожидает миллисекунды
    
    return [...this.collisions]
  }

  getObjects(): PhysicsObject[] {
    return Array.from(this.objects.values())
  }

  getObject(id: string): PhysicsObject | undefined {
    return this.objects.get(id)
  }

  removeObject(id: string): void {
    const obj = this.objects.get(id)
    if (obj) {
      World.remove(this.world, obj.body)
      this.objects.delete(id)
    }
  }

  getTime(): number {
    return this.time
  }

  reset(): void {
    // Удаляем все объекты кроме стен
    Array.from(this.objects.values()).forEach(obj => {
      World.remove(this.world, obj.body)
    })
    this.objects.clear()
    this.collisions = []
    this.time = 0
  }

}