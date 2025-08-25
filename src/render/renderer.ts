import { Application, Graphics, Container } from 'pixi.js'
import type { Circle } from '../core/physics'

export interface RenderConfig {
  width: number
  height: number
  backgroundColor: number
  antialias: boolean
}

export class PixiRenderer {
  private app: Application
  private container: Container
  private circles: Graphics[] = []
  private canvas: HTMLCanvasElement | OffscreenCanvas

  constructor(canvas: HTMLCanvasElement | OffscreenCanvas, config: RenderConfig) {
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

  render(circles: Circle[]): void {
    while (this.circles.length < circles.length) {
      const circle = new Graphics()
      this.circles.push(circle)
      this.container.addChild(circle)
    }

    while (this.circles.length > circles.length) {
      const circle = this.circles.pop()
      if (circle) {
        this.container.removeChild(circle)
        circle.destroy()
      }
    }

    circles.forEach((circleData, index) => {
      const circle = this.circles[index]
      circle.clear()
      circle.circle(0, 0, circleData.radius)
      circle.fill(circleData.color)
      circle.x = circleData.position.x
      circle.y = circleData.position.y
    })

    this.app.renderer.render(this.app.stage)
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
    this.circles.forEach(circle => circle.destroy())
    this.circles = []
    this.container.destroy()
    this.app.destroy()
  }
}