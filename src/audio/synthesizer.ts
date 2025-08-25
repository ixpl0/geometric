import * as Tone from 'tone'
import type { SimEvent } from '../core/simulation'

export interface SynthConfig {
  masterVolume: number
  reverbWet: number
  compressorThreshold: number
  compressorRatio: number
}

export class AudioSynthesizer {
  private synths: Map<number, Tone.Synth> = new Map()
  private reverb: Tone.Reverb
  private compressor: Tone.Compressor
  private masterGain: Tone.Gain
  private _isInitialized = false
  private startTime = 0
  private isPlaying = false
  private lastNoteTime: Map<number, number> = new Map()

  get isInitialized(): boolean {
    return this._isInitialized
  }

  constructor(private config: SynthConfig) {
    this.masterGain = new Tone.Gain(config.masterVolume)
    this.compressor = new Tone.Compressor({
      threshold: config.compressorThreshold,
      ratio: config.compressorRatio
    })
    this.reverb = new Tone.Reverb({
      decay: 2,
      wet: config.reverbWet
    })
  }

  async init(): Promise<void> {
    if (this._isInitialized) {
      return
    }

    await Tone.start()
    await this.reverb.generate()

    this.masterGain.chain(this.compressor, this.reverb, Tone.getDestination())
    this._isInitialized = true
  }

  createSynth(id: number): void {
    if (this.synths.has(id)) {
      return
    }

    const synth = new Tone.Synth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.1,
        release: 0.5
      }
    })

    synth.connect(this.masterGain)
    this.synths.set(id, synth)
  }

  playNote(circleId: number, note: string, velocity: number, duration = 0.1): void {
    console.log(`🎵 Playing note: ${note} for circle ${circleId}, velocity: ${velocity.toFixed(3)}`)
    if (!this._isInitialized) {
      console.log('❌ Audio not initialized, skipping note')
      return
    }

    const currentTime = Tone.now()
    const lastTime = this.lastNoteTime.get(circleId) || 0
    const minInterval = 0.05 // минимум 50мс между нотами для одного шарика
    
    if (currentTime - lastTime < minInterval) {
      console.log(`⏸️ Skipping note - too soon after last note for circle ${circleId}`)
      return
    }

    let synth = this.synths.get(circleId)
    if (!synth) {
      this.createSynth(circleId)
      synth = this.synths.get(circleId)!
      console.log(`🎛️ Created new synth for circle ${circleId}`)
    }

    try {
      synth.volume.value = Tone.gainToDb(velocity * 0.5)
      synth.triggerAttackRelease(note, duration)
      this.lastNoteTime.set(circleId, currentTime)
      console.log(`✅ Note triggered successfully`)
    } catch (error) {
      console.warn(`❌ Failed to trigger note for circle ${circleId}:`, error)
    }
  }

  playNoteAtTime(circleId: number, note: string, velocity: number, time: number, duration = 0.1): void {
    if (!this._isInitialized) {
      return
    }

    let synth = this.synths.get(circleId)
    if (!synth) {
      this.createSynth(circleId)
      synth = this.synths.get(circleId)!
    }

    synth.volume.value = Tone.gainToDb(velocity * 0.5)
    synth.triggerAttackRelease(note, duration, time)
  }


  async renderOffline(events: SimEvent[], duration: number): Promise<AudioBuffer> {
    const offlineContext = new Tone.OfflineContext(2, duration, 44100)
    const previousContext = Tone.getContext()

    Tone.setContext(offlineContext)

    const masterGain = new Tone.Gain(this.config.masterVolume)
    const compressor = new Tone.Compressor({
      threshold: this.config.compressorThreshold,
      ratio: this.config.compressorRatio
    })
    const reverb = new Tone.Reverb({
      decay: 2,
      wet: this.config.reverbWet
    })

    await reverb.generate()
    masterGain.chain(compressor, reverb, offlineContext.destination)

    const synthMap = new Map<number, Tone.Synth>()

    events.forEach(event => {
      if (event.type === 'collision') {
        let synth = synthMap.get(event.payload.circleId)
        if (!synth) {
          synth = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: {
              attack: 0.01,
              decay: 0.2,
              sustain: 0.1,
              release: 0.5
            }
          })
          synth.connect(masterGain)
          synthMap.set(event.payload.circleId, synth)
        }

        synth.volume.value = Tone.gainToDb(event.payload.velocity * 0.5)
        synth.triggerAttackRelease(event.payload.note, 0.1, event.time)
      }
    })

    const buffer = await offlineContext.render()
    
    synthMap.forEach(synth => synth.dispose())
    masterGain.dispose()
    compressor.dispose()
    reverb.dispose()
    
    Tone.setContext(previousContext)
    return buffer
  }

  start(): void {
    if (this._isInitialized) {
      this.isPlaying = true
      this.startTime = Tone.now()
    }
  }

  stop(): void {
    if (this._isInitialized) {
      this.isPlaying = false
      this.startTime = 0
    }
  }

  pause(): void {
    if (this._isInitialized) {
      this.isPlaying = false
    }
  }

  setMasterVolume(volume: number): void {
    this.config.masterVolume = volume
    this.masterGain.gain.value = volume
  }

  dispose(): void {
    this.synths.forEach(synth => synth.dispose())
    this.synths.clear()
    this.lastNoteTime.clear()
    this.masterGain.dispose()
    this.compressor.dispose()
    this.reverb.dispose()
    this._isInitialized = false
    this.isPlaying = false
  }
}