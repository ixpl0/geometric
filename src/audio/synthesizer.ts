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
  private isInitialized = false

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
    if (this.isInitialized) {
      return
    }

    await Tone.start()
    await this.reverb.generate()

    this.masterGain.chain(this.compressor, this.reverb, Tone.getDestination())
    this.isInitialized = true
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
    if (!this.isInitialized) {
      return
    }

    let synth = this.synths.get(circleId)
    if (!synth) {
      this.createSynth(circleId)
      synth = this.synths.get(circleId)!
    }

    synth.volume.value = Tone.gainToDb(velocity * 0.5)
    synth.triggerAttackRelease(note, duration)
  }

  scheduleEvents(events: SimEvent[]): void {
    if (!this.isInitialized) {
      return
    }

    Tone.Transport.clear()
    Tone.Transport.cancel()
    Tone.Transport.position = 0

    events.forEach(event => {
      if (event.type === 'collision') {
        Tone.Transport.schedule((time) => {
          this.playNote(
            event.payload.circleId,
            event.payload.note,
            event.payload.velocity
          )
        }, event.time)
      }
    })
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
    if (this.isInitialized) {
      Tone.Transport.start()
    }
  }

  stop(): void {
    if (this.isInitialized) {
      Tone.Transport.stop()
      Tone.Transport.cancel()
    }
  }

  pause(): void {
    if (this.isInitialized) {
      Tone.Transport.pause()
    }
  }

  setMasterVolume(volume: number): void {
    this.config.masterVolume = volume
    this.masterGain.gain.value = volume
  }

  dispose(): void {
    this.synths.forEach(synth => synth.dispose())
    this.synths.clear()
    this.masterGain.dispose()
    this.compressor.dispose()
    this.reverb.dispose()
    Tone.Transport.clear()
    this.isInitialized = false
  }
}