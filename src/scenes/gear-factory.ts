import type { Scene, SceneSettings } from './scene-base'
import type { SimConfig, SceneObject } from '../core/simulation'

export class GearFactoryScene implements Scene {
  id = 'gear-factory'
  name = 'Фабрика шестерёнок'
  description = 'Сложный механизм из вращающихся шестерёнок, конвейеров и падающих деталей'

  constructor(private settings: SceneSettings) {}

  getConfig(): SimConfig {
    const objects: SceneObject[] = [
      // Падающие детали разных размеров
      {
        type: 'circle',
        id: 'part-1',
        position: { x: 100, y: 50 },
        radius: 12,
        mass: 0.5,
        color: 0xff6b6b,
        isStatic: false,
        restitution: 0.4,
        friction: 0.3
      },
      {
        type: 'rectangle',
        id: 'part-2',
        position: { x: 200, y: 30 },
        width: 20,
        height: 20,
        mass: 0.3,
        color: 0x4ecdc4,
        isStatic: false,
        restitution: 0.5,
        friction: 0.4
      },
      {
        type: 'circle',
        id: 'part-3',
        position: { x: 300, y: 40 },
        radius: 8,
        mass: 0.2,
        color: 0x45b7d1,
        isStatic: false,
        restitution: 0.6,
        friction: 0.2
      },
      {
        type: 'rectangle',
        id: 'part-4',
        position: { x: 400, y: 35 },
        width: 15,
        height: 25,
        mass: 0.4,
        color: 0xf9ca24,
        isStatic: false,
        restitution: 0.5,
        friction: 0.3
      },

      // Большие вращающиеся шестерёнки (имитация зубчатыми прямоугольниками)
      ...this.createGear(150, 200, 60, 12, 0x8b4513),
      ...this.createGear(350, 250, 80, 16, 0x654321),
      ...this.createGear(550, 180, 50, 10, 0xa0522d),

      // Конвейерные ленты
      {
        type: 'rectangle',
        id: 'conveyor-1',
        position: { x: 200, y: 400 },
        width: 300,
        height: 15,
        angle: -0.1,
        color: 0x2c3e50,
        isStatic: true,
        restitution: 0.3,
        friction: 0.9
      },
      {
        type: 'rectangle',
        id: 'conveyor-2',
        position: { x: 600, y: 450 },
        width: 250,
        height: 15,
        angle: 0.15,
        color: 0x2c3e50,
        isStatic: true,
        restitution: 0.3,
        friction: 0.9
      },

      // Воронки и направляющие
      {
        type: 'rectangle',
        id: 'funnel-left',
        position: { x: 120, y: 150 },
        width: 80,
        height: 8,
        angle: 0.5,
        color: 0x34495e,
        isStatic: true,
        restitution: 0.7,
        friction: 0.4
      },
      {
        type: 'rectangle',
        id: 'funnel-right',
        position: { x: 180, y: 150 },
        width: 80,
        height: 8,
        angle: -0.5,
        color: 0x34495e,
        isStatic: true,
        restitution: 0.7,
        friction: 0.4
      },

      // Молотки и толкатели
      {
        type: 'rectangle',
        id: 'hammer-1',
        position: { x: 400, y: 350 },
        width: 60,
        height: 12,
        angle: 0.8,
        mass: 1,
        color: 0x7f8c8d,
        isStatic: false,
        restitution: 0.8,
        friction: 0.6
      },
      {
        type: 'rectangle',
        id: 'hammer-2',
        position: { x: 500, y: 380 },
        width: 50,
        height: 10,
        angle: -0.6,
        mass: 0.8,
        color: 0x7f8c8d,
        isStatic: false,
        restitution: 0.9,
        friction: 0.5
      },

      // Стенки и ограничители
      {
        type: 'rectangle',
        id: 'wall-bottom',
        position: { x: 400, y: 580 },
        width: 800,
        height: 40,
        color: 0x2c3e50,
        isStatic: true,
        restitution: 0.6,
        friction: 0.8
      },
      {
        type: 'rectangle',
        id: 'wall-left',
        position: { x: 10, y: 300 },
        width: 20,
        height: 600,
        color: 0x2c3e50,
        isStatic: true,
        restitution: 0.8,
        friction: 0.5
      },
      {
        type: 'rectangle',
        id: 'wall-right',
        position: { x: 790, y: 300 },
        width: 20,
        height: 600,
        color: 0x2c3e50,
        isStatic: true,
        restitution: 0.8,
        friction: 0.5
      },

      // Вращающиеся роторы
      {
        type: 'rectangle',
        id: 'rotor-1',
        position: { x: 650, y: 300 },
        width: 120,
        height: 8,
        mass: 0.3,
        color: 0xe74c3c,
        isStatic: false,
        restitution: 1.1,
        friction: 0.2
      },
      {
        type: 'rectangle',
        id: 'rotor-2',
        position: { x: 650, y: 300 },
        width: 8,
        height: 120,
        mass: 0.3,
        color: 0xe74c3c,
        isStatic: false,
        restitution: 1.1,
        friction: 0.2
      }
    ]

    return {
      seed: this.settings.seed,
      duration: this.settings.duration,
      fps: this.settings.fps,
      physics: {
        gravity: { x: 0, y: 400 },
        bounds: { x: 0, y: 0, width: 800, height: 600 }
      },
      objects
    }
  }

  private createGear(centerX: number, centerY: number, radius: number, teethCount: number, color: number): SceneObject[] {
    const gear: SceneObject[] = []
    const toothLength = 15
    const toothWidth = 8

    // Центральный круг шестерёнки
    gear.push({
      type: 'circle',
      id: `gear-center-${centerX}-${centerY}`,
      position: { x: centerX, y: centerY },
      radius: radius * 0.6,
      mass: 2,
      color: color,
      isStatic: false,
      restitution: 0.3,
      friction: 0.8
    })

    // Зубья шестерёнки
    for (let i = 0; i < teethCount; i++) {
      const angle = (i * 2 * Math.PI) / teethCount
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      gear.push({
        type: 'rectangle',
        id: `gear-tooth-${centerX}-${centerY}-${i}`,
        position: { x, y },
        width: toothLength,
        height: toothWidth,
        angle: angle,
        mass: 0.1,
        color: color,
        isStatic: false,
        restitution: 0.4,
        friction: 0.7
      })
    }

    return gear
  }

  updateSettings(settings: SceneSettings): void {
    this.settings = settings
  }
}