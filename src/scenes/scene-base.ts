import type { SimConfig } from '../core/simulation'

export interface Scene {
  id: string
  name: string
  description: string
  getConfig(): SimConfig
}

export interface SceneSettings {
  seed: number
  fps: number
  duration: number
}