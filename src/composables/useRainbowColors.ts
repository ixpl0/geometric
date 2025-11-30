import { ref, onUnmounted } from 'vue'
import type Matter from 'matter-js'
import { getBodySpeed } from '../utils/physics'

export interface RainbowOptions {
  baseSpeed?: number
  speedMultiplier?: number
  saturation?: number
  lightness?: number
  phaseShift?: number
}

export interface ColorableBody extends Matter.Body {
  render: {
    fillStyle: string
  } & Matter.IBodyRenderOptions
}

export const useRainbowColors = () => {
  let animationId = 0
  const isAnimating = ref(false)

  const getHSL = (time: number, speed: number = 0, options: RainbowOptions = {}) => {
    const {
      baseSpeed = 50,
      speedMultiplier = 10,
      saturation = 80,
      lightness = 55,
      phaseShift = 0,
    } = options

    const baseHue = (time * baseSpeed + phaseShift) % 360
    const speedHue = (speed * speedMultiplier) % 360
    const hue = (baseHue + speedHue) % 360

    const dynamicSaturation = speed > 0 ? Math.min(saturation + speed * 2, 100) : saturation

    const dynamicLightness = speed > 0 ? Math.min(lightness + speed * 1.5, 70) : lightness

    return `hsl(${hue}, ${dynamicSaturation}%, ${dynamicLightness}%)`
  }

  const applyRainbow = (
    body: ColorableBody,
    time: number,
    speed: number = 0,
    options: RainbowOptions = {},
  ) => {
    body.render.fillStyle = getHSL(time, speed, options)
  }

  const startRainbowAnimation = (
    targets: ColorableBody[] | (() => ColorableBody[]),
    options: RainbowOptions = {},
  ) => {
    isAnimating.value = true

    const animate = () => {
      if (!isAnimating.value) return

      const time = Date.now() * 0.001
      const bodies = typeof targets === 'function' ? targets() : targets

      bodies.forEach((body, index) => {
        const speed = getBodySpeed(body)

        applyRainbow(body, time, speed, {
          ...options,
          phaseShift: (options.phaseShift || 0) + index * 60,
        })
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()
  }

  const stopRainbowAnimation = () => {
    isAnimating.value = false
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = 0
    }
  }

  onUnmounted(() => {
    stopRainbowAnimation()
  })

  return {
    getHSL,
    applyRainbow,
    startRainbowAnimation,
    stopRainbowAnimation,
    isAnimating,
  }
}
