import type { Scene, SceneSettings } from './scene-base'
import type { SimConfig } from '../core/simulation'

export class GravityWellScene implements Scene {
  id = 'gravity-well'
  name = 'Гравитационный колодец'
  description = 'Один большой шар в центре притягивает множество маленьких шариков'

  constructor(private settings: SceneSettings) {}

  getConfig(): SimConfig {
    const circles = []
    
    circles.push({
      position: { x: 400, y: 300 },
      velocity: { x: 0, y: 0 },
      radius: 50,
      mass: 10,
      color: 0xff6b35
    })
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const distance = 200 + Math.random() * 150
      
      circles.push({
        position: {
          x: 400 + Math.cos(angle) * distance,
          y: 300 + Math.sin(angle) * distance
        },
        velocity: {
          x: Math.random() * 40 - 20,
          y: Math.random() * 40 - 20
        },
        radius: 8 + Math.random() * 7,
        mass: 0.3 + Math.random() * 0.4,
        color: [0x74b9ff, 0x0984e3, 0x6c5ce7, 0xa29bfe, 0xfd79a8, 0xe84393][i % 6]
      })
    }

    return {
      seed: this.settings.seed,
      duration: this.settings.duration,
      fps: this.settings.fps,
      physics: {
        gravity: { x: 0, y: 200 },
        damping: 0.995,
        restitution: 0.7,
        bounds: { x: 0, y: 0, width: 800, height: 600 }
      },
      circles
    }
  }

  updateSettings(settings: SceneSettings): void {
    this.settings = settings
  }
}