import type Matter from 'matter-js'

export interface SceneConfig {
  name: string
  width: number
  height: number
  gravity?: { x: number; y: number }
  airFriction?: number
  backgroundColor?: string
  wireframes?: boolean
}

export interface SceneControls {
  start: () => void
  stop: () => void
  reset: () => void
  isRunning: boolean
}

export interface BaseScene {
  config: SceneConfig
  engine: Matter.Engine | null
  render: Matter.Render | null
  runner: Matter.Runner | null
  world: Matter.World | null
  
  init: (container: HTMLElement) => void
  start: () => void
  stop: () => void
  reset: () => void
  destroy: () => void
  
  addElement: (element: Matter.Body) => void
  removeElement: (element: Matter.Body) => void
  
  onBeforeUpdate?: (delta: number) => void
  onAfterUpdate?: (delta: number) => void
}