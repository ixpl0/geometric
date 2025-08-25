import type { Scene, SceneSettings } from './scene-base'
import { BouncingBallsScene } from './bouncing-balls'
import { OrbitalChaosScene } from './orbital-chaos'
import { GravityWellScene } from './gravity-well'
import { ChainReactionScene } from './chain-reaction'

export class SceneManager {
  private scenes: Scene[] = []
  private currentSceneIndex = 0

  constructor(private settings: SceneSettings) {
    this.initializeScenes()
  }

  private initializeScenes(): void {
    this.scenes = [
      new BouncingBallsScene(this.settings),
      new OrbitalChaosScene(this.settings),
      new GravityWellScene(this.settings),
      new ChainReactionScene(this.settings)
    ]
  }

  getCurrentScene(): Scene {
    return this.scenes[this.currentSceneIndex]
  }

  getScenes(): Scene[] {
    return [...this.scenes]
  }

  selectScene(sceneId: string): void {
    const index = this.scenes.findIndex(scene => scene.id === sceneId)
    if (index !== -1) {
      this.currentSceneIndex = index
    }
  }

  nextScene(): void {
    this.currentSceneIndex = (this.currentSceneIndex + 1) % this.scenes.length
  }

  previousScene(): void {
    this.currentSceneIndex = this.currentSceneIndex === 0 
      ? this.scenes.length - 1 
      : this.currentSceneIndex - 1
  }

  updateSettings(settings: SceneSettings): void {
    this.settings = settings
    this.scenes.forEach(scene => {
      if ('updateSettings' in scene) {
        (scene as Scene & { updateSettings: (settings: SceneSettings) => void }).updateSettings(settings)
      }
    })
  }
}