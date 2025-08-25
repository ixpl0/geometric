import { VideoExporter, type VideoEncoderConfig, type AudioEncoderConfig } from './video-encoder'
import { MP4Exporter, type MuxerConfig } from './mp4-muxer'
import { AudioSynthesizer, type SynthConfig } from '../audio/synthesizer'
import type { SimEvent } from '../core/simulation'

export interface ExportConfig {
  video: VideoEncoderConfig
  audio: AudioEncoderConfig
  synth: SynthConfig
  muxer: MuxerConfig
}

export interface ExportProgress {
  phase: 'video' | 'audio' | 'muxing'
  progress: number
  total: number
}

export class MediaExporter {
  private videoExporter = new VideoExporter()
  private mp4Exporter = new MP4Exporter()
  private audioSynth: AudioSynthesizer

  constructor(synthConfig: SynthConfig) {
    this.audioSynth = new AudioSynthesizer(synthConfig)
  }

  async exportVideo(
    videoFrames: VideoFrame[],
    audioEvents: SimEvent[],
    config: ExportConfig,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ArrayBuffer> {
    await this.videoExporter.initVideoEncoder(config.video)
    await this.videoExporter.initAudioEncoder(config.audio)
    this.mp4Exporter.init(config.muxer)

    onProgress?.({ phase: 'video', progress: 0, total: videoFrames.length })

    for (let i = 0; i < videoFrames.length; i++) {
      await this.videoExporter.encodeVideoFrame(videoFrames[i])
      
      if (i % 10 === 0) {
        onProgress?.({ phase: 'video', progress: i, total: videoFrames.length })
      }
    }

    onProgress?.({ phase: 'audio', progress: 0, total: 1 })

    const duration = videoFrames.length / config.video.framerate
    const audioBuffer = await this.audioSynth.renderOffline(audioEvents, duration)
    await this.videoExporter.encodeAudioBuffer(audioBuffer, 0)

    onProgress?.({ phase: 'audio', progress: 1, total: 1 })

    const { videoFrames: encodedVideoFrames, audioFrames: encodedAudioFrames } = 
      await this.videoExporter.finishEncoding()

    onProgress?.({ phase: 'muxing', progress: 0, total: encodedVideoFrames.length + encodedAudioFrames.length })

    for (let i = 0; i < encodedVideoFrames.length; i++) {
      this.mp4Exporter.addVideoChunk(encodedVideoFrames[i])
      
      if (i % 10 === 0) {
        onProgress?.({ 
          phase: 'muxing', 
          progress: i, 
          total: encodedVideoFrames.length + encodedAudioFrames.length 
        })
      }
    }

    for (let i = 0; i < encodedAudioFrames.length; i++) {
      this.mp4Exporter.addAudioChunk(encodedAudioFrames[i])
      
      onProgress?.({ 
        phase: 'muxing', 
        progress: encodedVideoFrames.length + i, 
        total: encodedVideoFrames.length + encodedAudioFrames.length 
      })
    }

    const arrayBuffer = await this.mp4Exporter.finalize()

    this.videoExporter.reset()
    this.mp4Exporter.reset()

    return arrayBuffer
  }

  downloadBlob(arrayBuffer: ArrayBuffer, filename: string): void {
    const blob = new Blob([arrayBuffer], { type: 'video/mp4' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    URL.revokeObjectURL(url)
  }

  dispose(): void {
    this.audioSynth.dispose()
  }
}