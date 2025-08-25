import type { Scene, SceneSettings } from './scene-base'
import type { SimConfig } from '../core/simulation'

export class ChainReactionScene implements Scene {
  id = 'chain-reaction'
  name = 'Цепная реакция'
  description = 'Один быстрый шарик врезается в группу медленных, создавая цепную реакцию'

  constructor(private settings: SceneSettings) {}

  getConfig(): SimConfig {
    const circles = []
    
    circles.push({
      position: { x: 100, y: 300 },
      velocity: { x: 300, y: 0 },
      radius: 25,
      mass: 1,
      color: 0xe17055
    })
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6 - row; col++) {
        const x = 500 + col * 60 + row * 30
        const y = 200 + row * 52
        
        circles.push({
          position: { x, y },
          velocity: { x: 0, y: 0 },
          radius: 20,
          mass: 0.8,
          color: [0x00b894, 0x00cec9, 0x6c5ce7, 0xa29bfe, 0xfd79a8, 0xe84393][col % 6]
        })
      }
    }

    return {
      seed: this.settings.seed,
      duration: this.settings.duration,
      fps: this.settings.fps,
      physics: {
        gravity: { x: 0, y: 0 },
        damping: 0.98,
        restitution: 0.9,
        bounds: { x: 0, y: 0, width: 800, height: 600 }
      },
      circles
    }
  }

  updateSettings(settings: SceneSettings): void {
    this.settings = settings
  }
}