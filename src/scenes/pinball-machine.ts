import type { Scene, SceneSettings } from './scene-base'
import type { SimConfig, SceneObject } from '../core/simulation'

export class PinballMachineScene implements Scene {
  id = 'pinball-machine'
  name = 'Пинбол-машина'
  description = 'Классическая пинбол-машина с флипперами, бамперами и металлическим шариком'

  constructor(private settings: SceneSettings) {}

  getConfig(): SimConfig {
    const objects: SceneObject[] = [
      // Металлический шарик
      {
        type: 'circle',
        id: 'pinball',
        position: { x: 750, y: 100 },
        radius: 8,
        mass: 2,
        color: 0xc0c0c0,
        isStatic: false,
        restitution: 0.8,
        friction: 0.1
      },

      // Флипперы (левый)
      {
        type: 'rectangle',
        id: 'flipper-left',
        position: { x: 250, y: 500 },
        width: 80,
        height: 12,
        angle: 0.3,
        mass: 0.5,
        color: 0xff4444,
        isStatic: false,
        restitution: 1.2,
        friction: 0.8
      },

      // Флипперы (правый)
      {
        type: 'rectangle',
        id: 'flipper-right',
        position: { x: 550, y: 500 },
        width: 80,
        height: 12,
        angle: -0.3,
        mass: 0.5,
        color: 0xff4444,
        isStatic: false,
        restitution: 1.2,
        friction: 0.8
      },

      // Бамперы (круглые отбойники)
      {
        type: 'circle',
        id: 'bumper-1',
        position: { x: 200, y: 250 },
        radius: 25,
        color: 0x00ff00,
        isStatic: true,
        restitution: 2.0,
        friction: 0.1
      },
      {
        type: 'circle',
        id: 'bumper-2',
        position: { x: 400, y: 200 },
        radius: 25,
        color: 0x00ff00,
        isStatic: true,
        restitution: 2.0,
        friction: 0.1
      },
      {
        type: 'circle',
        id: 'bumper-3',
        position: { x: 600, y: 280 },
        radius: 25,
        color: 0x00ff00,
        isStatic: true,
        restitution: 2.0,
        friction: 0.1
      },

      // Стенки машины
      {
        type: 'rectangle',
        id: 'wall-left',
        position: { x: 10, y: 300 },
        width: 20,
        height: 600,
        color: 0x333333,
        isStatic: true,
        restitution: 0.9,
        friction: 0.3
      },
      {
        type: 'rectangle',
        id: 'wall-right',
        position: { x: 790, y: 300 },
        width: 20,
        height: 600,
        color: 0x333333,
        isStatic: true,
        restitution: 0.9,
        friction: 0.3
      },
      {
        type: 'rectangle',
        id: 'wall-top',
        position: { x: 400, y: 10 },
        width: 800,
        height: 20,
        color: 0x333333,
        isStatic: true,
        restitution: 0.9,
        friction: 0.3
      },

      // Дно с дыркой посередине
      {
        type: 'rectangle',
        id: 'bottom-left',
        position: { x: 150, y: 590 },
        width: 300,
        height: 20,
        color: 0x666666,
        isStatic: true,
        restitution: 0.8,
        friction: 0.3
      },
      {
        type: 'rectangle',
        id: 'bottom-right',
        position: { x: 650, y: 590 },
        width: 300,
        height: 20,
        color: 0x666666,
        isStatic: true,
        restitution: 0.8,
        friction: 0.3
      },

      // Рампы и препятствия
      {
        type: 'rectangle',
        id: 'ramp-1',
        position: { x: 150, y: 400 },
        width: 120,
        height: 15,
        angle: -0.4,
        color: 0x8888ff,
        isStatic: true,
        restitution: 0.6,
        friction: 0.2
      },
      {
        type: 'rectangle',
        id: 'ramp-2',
        position: { x: 650, y: 400 },
        width: 120,
        height: 15,
        angle: 0.4,
        color: 0x8888ff,
        isStatic: true,
        restitution: 0.6,
        friction: 0.2
      },

      // Вращающиеся препятствия
      {
        type: 'rectangle',
        id: 'spinner-1',
        position: { x: 300, y: 350 },
        width: 100,
        height: 8,
        mass: 0.1,
        color: 0xffaa00,
        isStatic: false,
        restitution: 0.9,
        friction: 0.1
      },
      {
        type: 'rectangle',
        id: 'spinner-2',
        position: { x: 500, y: 350 },
        width: 100,
        height: 8,
        mass: 0.1,
        color: 0xffaa00,
        isStatic: false,
        restitution: 0.9,
        friction: 0.1
      }
    ]

    return {
      seed: this.settings.seed,
      duration: this.settings.duration,
      fps: this.settings.fps,
      physics: {
        gravity: { x: 0, y: 600 },
        bounds: { x: 0, y: 0, width: 800, height: 600 }
      },
      objects
    }
  }

  updateSettings(settings: SceneSettings): void {
    this.settings = settings
  }
}