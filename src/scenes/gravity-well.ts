import type { Scene, SceneSettings } from './scene-base'
import type { SimConfig, SceneObject } from '../core/simulation'

export class GravityWellScene implements Scene {
  id = 'gravity-well'
  name = 'Гравитационный колодец'
  description = 'Один большой шар в центре притягивает множество маленьких шариков'

  constructor(private settings: SceneSettings) {}

  getConfig(): SimConfig {
    const objects: SceneObject[] = []
    
    // Центральный большой шар-аттрактор
    objects.push({
      type: 'circle',
      id: 'attractor',
      position: { x: 400, y: 300 },
      radius: 50,
      mass: 10,
      color: 0xff6b35,
      isStatic: true,
      restitution: 0.8,
      friction: 0.3
    })
    
    // Маленькие орбитальные шарики
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const distance = 200 + (i % 3) * 50
      
      objects.push({
        type: 'circle',
        id: `orbiter-${i}`,
        position: {
          x: 400 + Math.cos(angle) * distance,
          y: 300 + Math.sin(angle) * distance
        },
        radius: 8 + (i % 3) * 3,
        mass: 0.3 + (i % 3) * 0.2,
        color: [0x74b9ff, 0x0984e3, 0x6c5ce7, 0xa29bfe, 0xfd79a8, 0xe84393][i % 6],
        isStatic: false,
        restitution: 0.7,
        friction: 0.1
      })
    }

    return {
      seed: this.settings.seed,
      duration: this.settings.duration,
      fps: this.settings.fps,
      physics: {
        gravity: { x: 0, y: 200 },
        bounds: { x: 0, y: 0, width: 800, height: 600 }
      },
      objects
    }
  }

  updateSettings(settings: SceneSettings): void {
    this.settings = settings
  }
}