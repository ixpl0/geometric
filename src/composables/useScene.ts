import { ref, shallowRef, onUnmounted } from 'vue'
import Matter from 'matter-js'
import type { SceneConfig } from '../types/scene'

export interface SceneSetupContext {
  world: Matter.World
  engine: Matter.Engine
  render: Matter.Render
  config: SceneConfig
  addElement: (element: Matter.Body | Matter.Composite | Matter.MouseConstraint) => void
  removeElement: (element: Matter.Body | Matter.Composite | Matter.MouseConstraint) => void
}

export interface SceneHooks {
  setupScene?: (context: SceneSetupContext) => void
  setupEventHandlers?: (context: SceneSetupContext) => void
  animate?: (context: SceneSetupContext) => void
  onBeforeUpdate?: (delta: number) => void
  onAfterUpdate?: (delta: number) => void
}

export const useScene = (config: SceneConfig, hooks: SceneHooks = {}) => {
  const engine = shallowRef<Matter.Engine | null>(null)
  const render = shallowRef<Matter.Render | null>(null)
  const runner = shallowRef<Matter.Runner | null>(null)
  const world = shallowRef<Matter.World | null>(null)
  const container = shallowRef<HTMLElement | null>(null)
  
  const isRunning = ref(false)
  const isInitialized = ref(false)
  let animationId = 0
  
  const defaultConfig: SceneConfig = {
    name: 'Default Scene',
    width: 800,
    height: 800,
    gravity: { x: 0, y: 1 },
    airFriction: 0.01,
    backgroundColor: '#000',
    wireframes: false
  }
  
  const mergedConfig: SceneConfig = {
    ...defaultConfig,
    ...config
  }
  
  const addElement = (element: Matter.Body | Matter.Composite | Matter.MouseConstraint) => {
    if (world.value) {
      Matter.Composite.add(world.value, element)
    }
  }
  
  const removeElement = (element: Matter.Body | Matter.Composite | Matter.MouseConstraint) => {
    if (world.value) {
      Matter.Composite.remove(world.value, element)
    }
  }
  
  const init = (containerEl: HTMLElement) => {
    if (isInitialized.value) return
    
    container.value = containerEl
    container.value.innerHTML = ''
    
    const newEngine = Matter.Engine.create()
    engine.value = newEngine
    world.value = newEngine.world
    
    if (mergedConfig.gravity) {
      newEngine.world.gravity.x = mergedConfig.gravity.x
      newEngine.world.gravity.y = mergedConfig.gravity.y
    }
    
    const canvas = document.createElement('canvas')
    container.value.appendChild(canvas)
    
    const newRender = Matter.Render.create({
      canvas,
      engine: newEngine,
      options: {
        width: mergedConfig.width,
        height: mergedConfig.height,
        wireframes: mergedConfig.wireframes,
        background: mergedConfig.backgroundColor
      }
    })
    render.value = newRender
    
    Matter.Render.run(newRender)
    
    runner.value = Matter.Runner.create({
      delta: 1000 / 240
    })
    
    const context: SceneSetupContext = {
      world: world.value,
      engine: newEngine,
      render: newRender,
      config: mergedConfig,
      addElement,
      removeElement
    }
    
    hooks.setupScene?.(context)
    hooks.setupEventHandlers?.(context)
    
    isInitialized.value = true
  }
  
  const animate = () => {
    if (!isRunning.value || !engine.value || !render.value || !world.value) return
    
    hooks.animate?.({
      world: world.value,
      engine: engine.value,
      render: render.value,
      config: mergedConfig,
      addElement,
      removeElement
    })
    
    animationId = requestAnimationFrame(animate)
  }
  
  const start = () => {
    if (!engine.value || !runner.value || isRunning.value) return
    
    Matter.Runner.run(runner.value, engine.value)
    isRunning.value = true
    animate()
  }
  
  const stop = () => {
    if (!runner.value || !isRunning.value) return
    
    Matter.Runner.stop(runner.value)
    isRunning.value = false
    
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = 0
    }
  }
  
  const reset = () => {
    destroy()
    if (container.value) {
      init(container.value)
    }
  }
  
  const destroy = () => {
    stop()
    
    if (render.value) {
      Matter.Render.stop(render.value)
      render.value.canvas.remove()
      render.value = null
    }
    
    if (runner.value) {
      Matter.Runner.stop(runner.value)
      runner.value = null
    }
    
    if (engine.value) {
      Matter.Engine.clear(engine.value)
      engine.value = null
    }
    
    world.value = null
    isRunning.value = false
    isInitialized.value = false
  }
  
  onUnmounted(() => {
    destroy()
  })
  
  return {
    init,
    start,
    stop,
    reset,
    destroy,
    addElement,
    removeElement,
    isRunning,
    isInitialized,
    engine,
    render,
    world,
    config: mergedConfig
  }
}