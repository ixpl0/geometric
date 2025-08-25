import type { Scene, SceneSettings } from './scene-base'
import type { SimConfig, SceneObject } from '../core/simulation'

export class OrbitalChaosScene implements Scene {
  id = 'orbital-chaos'
  name = 'Орбитальный хаос'
  description = 'Множество маленьких шариков вращаются вокруг центра с разными скоростями'

  constructor(private settings: SceneSettings) {}

  getConfig(): SimConfig {
    const objects: SceneObject[] = []
    const centerX = 400
    const centerY = 300
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const radius = 150 + (i % 3) * 50
      
      objects.push({
        type: 'circle',
        id: `orbiter-${i}`,
        position: {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        },
        radius: 15 + (i % 3) * 5,
        mass: 0.5 + (i % 3) * 0.3,
        color: [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xffeaa7, 0xdda0dd, 0x98d8c8, 0xf7dc6f][i],
        isStatic: false,
        restitution: 1.0,
        friction: 0
      })
    }

    return {
      seed: this.settings.seed,
      duration: this.settings.duration,
      fps: this.settings.fps,
      physics: {
        gravity: { x: 0, y: 0 },
        bounds: { x: 0, y: 0, width: 800, height: 600 }
      },
      objects
    }
  }

  updateSettings(settings: SceneSettings): void {
    this.settings = settings
  }
}