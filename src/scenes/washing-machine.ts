import type { Scene, SceneSettings } from './scene-base'
import type { SimConfig, SceneObject } from '../core/simulation'

export class WashingMachineScene implements Scene {
  id = 'washing-machine'
  name = 'Стиральная машина'
  description = 'Барабан стиральной машины с кружащимися шариками внутри - завораживающий механизм!'

  constructor(private settings: SceneSettings) {}

  getConfig(): SimConfig {
    const centerX = 400
    const centerY = 300
    const drumRadius = 250

    const objects: SceneObject[] = [
      // Внешний корпус барабана (статичные стенки по кругу)
      ...this.createDrumWalls(centerX, centerY, drumRadius),
      
      // Шарики внутри барабана
      {
        type: 'circle',
        id: 'ball-1',
        position: { x: centerX - 50, y: centerY - 30 },
        radius: 15,
        mass: 0.5,
        color: 0xff6b6b,
        isStatic: false,
        restitution: 0.7,
        friction: 0.2
      },
      {
        type: 'circle',
        id: 'ball-2',
        position: { x: centerX + 40, y: centerY - 50 },
        radius: 18,
        mass: 0.7,
        color: 0x4ecdc4,
        isStatic: false,
        restitution: 0.7,
        friction: 0.2
      },
      {
        type: 'circle',
        id: 'ball-3',
        position: { x: centerX - 30, y: centerY + 40 },
        radius: 12,
        mass: 0.4,
        color: 0x45b7d1,
        isStatic: false,
        restitution: 0.7,
        friction: 0.2
      },
      {
        type: 'circle',
        id: 'ball-4',
        position: { x: centerX + 60, y: centerY + 20 },
        radius: 20,
        mass: 0.8,
        color: 0xf9ca24,
        isStatic: false,
        restitution: 0.7,
        friction: 0.2
      },
      {
        type: 'circle',
        id: 'ball-5',
        position: { x: centerX - 70, y: centerY + 10 },
        radius: 14,
        mass: 0.6,
        color: 0x6c5ce7,
        isStatic: false,
        restitution: 0.7,
        friction: 0.2
      },

      // Лопатки барабана для перемешивания
      ...this.createDrumPaddles(centerX, centerY, drumRadius * 0.7)
    ]

    return {
      seed: this.settings.seed,
      duration: this.settings.duration,
      fps: this.settings.fps,
      physics: {
        gravity: { x: 0, y: 200 }, // Слабая гравитация для более плавного движения
        bounds: { x: 0, y: 0, width: 800, height: 600 }
      },
      objects
    }
  }

  private createDrumWalls(centerX: number, centerY: number, radius: number): SceneObject[] {
    const walls: SceneObject[] = []
    const segments = 16 // Количество сегментов для имитации круглой стены
    const wallThickness = 20
    const wallLength = (2 * Math.PI * radius) / segments

    for (let i = 0; i < segments; i++) {
      const angle = (i * 2 * Math.PI) / segments
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      walls.push({
        type: 'rectangle',
        id: `drum-wall-${i}`,
        position: { x, y },
        width: wallLength,
        height: wallThickness,
        angle: angle + Math.PI / 2, // Поворачиваем стенку перпендикулярно радиусу
        color: 0x2c3e50,
        isStatic: true,
        restitution: 0.8,
        friction: 0.4
      })
    }

    return walls
  }

  private createDrumPaddles(centerX: number, centerY: number, radius: number): SceneObject[] {
    const paddles: SceneObject[] = []
    const paddleCount = 6
    const paddleLength = 80
    const paddleWidth = 12

    for (let i = 0; i < paddleCount; i++) {
      const angle = (i * 2 * Math.PI) / paddleCount
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      paddles.push({
        type: 'rectangle',
        id: `drum-paddle-${i}`,
        position: { x, y },
        width: paddleLength,
        height: paddleWidth,
        angle: angle,
        color: 0x34495e,
        isStatic: false,
        restitution: 0.9,
        friction: 0.6
      })
    }

    return paddles
  }

  updateSettings(settings: SceneSettings): void {
    this.settings = settings
  }
}