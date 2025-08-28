import { ref, onUnmounted } from 'vue'
import type { Synth, Gain } from 'tone'
import type Matter from 'matter-js'

export interface SoundConfig {
  baseFrequency?: number
  frequencyRange?: number
  gain?: number
  duration?: string
  envelope?: {
    attack?: number
    decay?: number
    sustain?: number
    release?: number
  }
}

export const useCollisionSounds = (config: SoundConfig = {}) => {
  const isInitialized = ref(false)
  const isMuted = ref(false)
  let synth: Synth | null = null
  let gain: Gain | null = null
  let lastCollisionTime = 0
  
  const {
    baseFrequency = 200,
    frequencyRange = 400,
    gain: gainValue = 1.3,
    duration = '0.2',
    envelope = {
      attack: 0.01,
      decay: 0.1,
      sustain: 0,
      release: 0.1
    }
  } = config
  
  const initSound = async () => {
    if (isInitialized.value) return
    
    try {
      const Tone = await import('tone')
      await Tone.start()
      
      gain = new Tone.Gain(gainValue)
      synth = new Tone.Synth({
        oscillator: {
          type: 'sine'
        },
        envelope
      }).chain(gain, Tone.getDestination())
      
      isInitialized.value = true
    } catch (error) {
      console.warn('Failed to initialize sound:', error)
    }
  }
  
  const playCollisionSound = async (intensity: number) => {
    if (isMuted.value) return
    
    if (!isInitialized.value) {
      await initSound()
    }
    
    if (!synth) return
    
    try {
      const frequency = baseFrequency + intensity * frequencyRange
      
      synth.triggerAttackRelease(
        frequency,
        duration,
        '+0.01',
        intensity * 10
      )
    } catch (error) {
      console.warn('Sound playback error:', error)
    }
  }
  
  const createCollisionHandler = (
    bodies: Matter.Body[],
    maxSpeed: number = 50,
    debounceMs: number = 50
  ) => {
    return (event: Matter.IEventCollision<Matter.Engine>) => {
      const now = Date.now()
      if (now - lastCollisionTime < debounceMs) return
      
      const bodyIds = bodies.map(b => b.id)
      
      for (const pair of event.pairs) {
        const { bodyA, bodyB } = pair
        
        if (bodyIds.includes(bodyA.id) || bodyIds.includes(bodyB.id)) {
          const currentBody = bodyIds.includes(bodyA.id) 
            ? bodies.find(b => b.id === bodyA.id)
            : bodies.find(b => b.id === bodyB.id)
          
          if (!currentBody?.velocity) continue
          
          const speed = Math.sqrt(
            currentBody.velocity.x ** 2 + 
            currentBody.velocity.y ** 2
          )
          const intensity = Math.min(speed / maxSpeed, 1)
          
          playCollisionSound(intensity)
          lastCollisionTime = now
          break
        }
      }
    }
  }
  
  const toggleMute = () => {
    isMuted.value = !isMuted.value
  }

  const destroy = () => {
    if (synth) {
      synth.dispose()
      synth = null
    }
    if (gain) {
      gain.dispose()
      gain = null
    }
    isInitialized.value = false
  }
  
  onUnmounted(() => {
    destroy()
  })
  
  return {
    initSound,
    playCollisionSound,
    createCollisionHandler,
    toggleMute,
    destroy,
    isInitialized,
    isMuted
  }
}