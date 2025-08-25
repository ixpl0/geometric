import type { Scene, SceneSettings } from './scene-base'
import type { SimConfig, SceneObject } from '../core/simulation'

export class ChainReactionScene implements Scene {
  id = 'chain-reaction'
  name = 'Цепная реакция'
  description = 'Один быстрый шарик врезается в группу медленных, создавая цепную реакцию'

  constructor(private settings: SceneSettings) {}

  getConfig(): SimConfig {
    const objects: SceneObject[] = []
    
    // Быстрый шарик-инициатор
    objects.push({
      type: 'circle',
      id: 'initiator',
      position: { x: 100, y: 300 },
      radius: 25,
      mass: 1,
      color: 0xe17055,
      isStatic: false,
      restitution: 0.9,
      friction: 0.1
    })
    
    // Пирамида из шариков
    let ballId = 1
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6 - row; col++) {
        const x = 500 + col * 60 + row * 30
        const y = 200 + row * 52
        
        objects.push({
          type: 'circle',
          id: `ball-${ballId}`,
          position: { x, y },
          radius: 20,
          mass: 0.8,
          color: [0x00b894, 0x00cec9, 0x6c5ce7, 0xa29bfe, 0xfd79a8, 0xe84393][col % 6],
          isStatic: false,
          restitution: 0.9,
          friction: 0.1
        })
        ballId++
      }
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