import { Application, Graphics, Container } from 'pixi.js'
import type { PhysicsObject } from '../core/physics'

export interface RenderConfig {
  width: number
  height: number
  backgroundColor: number
  antialias: boolean
}

export class PixiRenderer {
  private app: Application
  private container: Container
  private objectGraphics: Map<string, Graphics> = new Map()
  private canvas: HTMLCanvasElement | OffscreenCanvas

  constructor(canvas: HTMLCanvasElement | OffscreenCanvas, _config: RenderConfig) {
    this.canvas = canvas
    this.app = new Application()
    this.container = new Container()
  }

  async init(config: RenderConfig): Promise<void> {
    await this.app.init({
      canvas: this.canvas,
      width: config.width,
      height: config.height,
      backgroundColor: config.backgroundColor,
      antialias: config.antialias,
      preference: 'webgl'
    })

    this.app.stage.addChild(this.container)
  }

  render(objects: PhysicsObject[]): void {
    // Удаляем графику для объектов, которых больше нет
    for (const [id, graphics] of this.objectGraphics) {
      if (!objects.some(obj => obj.id === id)) {
        this.container.removeChild(graphics)
        this.objectGraphics.delete(id)
        graphics.destroy()
      }
    }

    // Обновляем или создаём графику для всех объектов
    for (const obj of objects) {
      let graphics = this.objectGraphics.get(obj.id)
      
      if (!graphics) {
        graphics = new Graphics()
        this.objectGraphics.set(obj.id, graphics)
        this.container.addChild(graphics)
      }
      
      // Очищаем предыдущую графику
      graphics.clear()
      
      // Рисуем в зависимости от типа объекта
      this.renderObject(graphics, obj)
      
      // Устанавливаем позицию и поворот
      graphics.x = obj.body.position.x
      graphics.y = obj.body.position.y
      graphics.rotation = obj.body.angle
    }

    this.app.renderer.render(this.app.stage)
  }

  private renderObject(graphics: Graphics, obj: PhysicsObject): void {
    switch (obj.type) {
      case 'circle':
        this.renderCircle(graphics, obj)
        break
      case 'rectangle':
        this.renderRectangle(graphics, obj)
        break
      default:
        // Заглушка для неизвестных типов
        graphics.circle(0, 0, 10)
        graphics.fill(0xff0000) // Красный для отладки
    }
  }

  private renderCircle(graphics: Graphics, obj: PhysicsObject): void {
    const radius = obj.body.circleRadius || 20
    
    // Основной круг
    graphics.circle(0, 0, radius)
    graphics.fill(obj.color)
    
    // Линия для показа вращения
    if (!obj.isStatic) {
      graphics.moveTo(0, 0)
      graphics.lineTo(radius * 0.8, 0)
      graphics.stroke({ width: 2, color: 0x000000, alpha: 0.5 })
    }
  }

  private renderRectangle(graphics: Graphics, obj: PhysicsObject): void {
    // Получаем размеры из vertices Matter.js объекта
    const vertices = obj.body.vertices
    if (vertices && vertices.length >= 4) {
      // Для прямоугольника берём первые 4 вершины
      const minX = Math.min(...vertices.map(v => v.x))
      const maxX = Math.max(...vertices.map(v => v.x))
      const minY = Math.min(...vertices.map(v => v.y))
      const maxY = Math.max(...vertices.map(v => v.y))
      
      const width = maxX - minX
      const height = maxY - minY
      
      // Рисуем прямоугольник с центром в (0, 0)
      graphics.rect(-width / 2, -height / 2, width, height)
      graphics.fill(obj.color)
      
      // Рамка
      graphics.rect(-width / 2, -height / 2, width, height)
      graphics.stroke({ width: 1, color: 0x000000, alpha: 0.3 })
    }
  }


  getImageData(): ImageData | null {
    if (this.canvas instanceof HTMLCanvasElement) {
      const ctx = this.canvas.getContext('2d')
      if (!ctx) {
        return null
      }
      return ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    }
    
    if (this.canvas instanceof OffscreenCanvas) {
      const ctx = this.canvas.getContext('2d')
      if (!ctx) {
        return null
      }
      return ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    }
    
    return null
  }

  async getBlob(type = 'image/png'): Promise<Blob | null> {
    if (this.canvas instanceof OffscreenCanvas) {
      return this.canvas.convertToBlob({ type })
    }
    
    if (this.canvas instanceof HTMLCanvasElement) {
      return new Promise(resolve => {
        this.canvas.toBlob(resolve, type)
      })
    }
    
    return null
  }

  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height)
  }

  destroy(): void {
    this.objectGraphics.forEach(graphics => graphics.destroy())
    this.objectGraphics.clear()
    this.container.destroy()
    this.app.destroy()
  }
}