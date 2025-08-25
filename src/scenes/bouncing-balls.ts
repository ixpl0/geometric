import type { Scene, SceneSettings } from './scene-base'
import type { SimConfig } from '../core/simulation'

export class BouncingBallsScene implements Scene {
  id = 'bouncing-balls'
  name = 'Прыгающие шарики'
  description = 'Классическая сцена с тремя шариками, отскакивающими от стен и друг от друга'

  constructor(private settings: SceneSettings) {}

  getConfig(): SimConfig {
    return {
      seed: this.settings.seed,
      duration: this.settings.duration,
      fps: this.settings.fps,
      physics: {
        gravity: { x: 0, y: 980 },
        damping: 0.99,
        restitution: 0.8,
        bounds: { x: 0, y: 0, width: 800, height: 600 }
      },
      circles: [
        {
          position: { x: 200, y: 100 },
          velocity: { x: 100, y: 0 },
          radius: 30,
          mass: 1,
          color: 0xff4444
        },
        {
          position: { x: 600, y: 100 },
          velocity: { x: -80, y: 0 },
          radius: 25,
          mass: 0.8,
          color: 0x44ff44
        },
        {
          position: { x: 400, y: 50 },
          velocity: { x: 0, y: 50 },
          radius: 35,
          mass: 1.2,
          color: 0x4444ff
        }
      ]
    }
  }

  updateSettings(settings: SceneSettings): void {
    this.settings = settings
  }
}