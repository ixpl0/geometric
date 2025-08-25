import type { Scene, SceneSettings } from './scene-base'
import type { SimConfig, SceneObject } from '../core/simulation'

export class BouncingBallsScene implements Scene {
  id = 'bouncing-balls'
  name = 'Прыгающие шарики'
  description = 'Три шарика прыгают на платформах, отскакивая друг от друга'

  constructor(private settings: SceneSettings) {}

  getConfig(): SimConfig {
    const objects: SceneObject[] = [
      // Прыгающие шарики
      {
        type: 'circle',
        id: 'ball-1',
        position: { x: 200, y: 100 },
        radius: 30,
        mass: 1,
        color: 0xff4444,
        isStatic: false,
        restitution: 0.9,
        friction: 0.1
      },
      {
        type: 'circle',
        id: 'ball-2',
        position: { x: 600, y: 100 },
        radius: 25,
        mass: 0.8,
        color: 0x44ff44,
        isStatic: false,
        restitution: 0.9,
        friction: 0.1
      },
      {
        type: 'circle',
        id: 'ball-3',
        position: { x: 400, y: 50 },
        radius: 35,
        mass: 1.2,
        color: 0x4444ff,
        isStatic: false,
        restitution: 0.9,
        friction: 0.1
      },
      
      // Платформы для отскока
      {
        type: 'platform',
        id: 'platform-bottom',
        position: { x: 400, y: 580 },
        width: 600,
        height: 20,
        color: 0x666666,
        isStatic: true,
        restitution: 0.8,
        friction: 0.3
      },
      {
        type: 'platform',
        id: 'platform-left',
        position: { x: 150, y: 300 },
        width: 200,
        height: 20,
        angle: 0.2,
        color: 0x888888,
        isStatic: true,
        restitution: 0.8,
        friction: 0.3
      },
      {
        type: 'platform',
        id: 'platform-right',
        position: { x: 650, y: 400 },
        width: 180,
        height: 20,
        angle: -0.3,
        color: 0x888888,
        isStatic: true,
        restitution: 0.8,
        friction: 0.3
      }
    ]

    return {
      seed: this.settings.seed,
      duration: this.settings.duration,
      fps: this.settings.fps,
      physics: {
        gravity: { x: 0, y: 980 },
        bounds: { x: 0, y: 0, width: 800, height: 600 }
      },
      objects
    }
  }

  updateSettings(settings: SceneSettings): void {
    this.settings = settings
  }
}