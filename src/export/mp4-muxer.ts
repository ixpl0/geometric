import { Muxer, ArrayBufferTarget } from 'mp4-muxer'

export interface MuxerConfig {
  width: number
  height: number
  framerate: number
  videoCodec: string
  audioCodec: string
  audioSampleRate: number
  audioChannels: number
}

export class MP4Exporter {
  private muxer: Muxer<ArrayBufferTarget> | null = null
  private videoTrackId: number | null = null
  private audioTrackId: number | null = null

  init(config: MuxerConfig): void {
    const target = new ArrayBufferTarget()

    this.muxer = new Muxer({
      target,
      video: {
        codec: config.videoCodec,
        width: config.width,
        height: config.height,
        frameRate: config.framerate
      },
      audio: {
        codec: config.audioCodec,
        numberOfChannels: config.audioChannels,
        sampleRate: config.audioSampleRate
      },
      firstTimestampBehavior: 'offset'
    })

    const videoTrack = this.muxer.addVideoTrack({
      codec: config.videoCodec,
      width: config.width,
      height: config.height,
      frameRate: config.framerate
    })

    const audioTrack = this.muxer.addAudioTrack({
      codec: config.audioCodec,
      numberOfChannels: config.audioChannels,
      sampleRate: config.audioSampleRate
    })

    this.videoTrackId = videoTrack
    this.audioTrackId = audioTrack
  }

  addVideoChunk(chunk: EncodedVideoChunk): void {
    if (!this.muxer || this.videoTrackId === null) {
      throw new Error('Muxer not initialized')
    }

    const data = new Uint8Array(chunk.byteLength)
    chunk.copyTo(data)

    this.muxer.addVideoChunk(data, {
      type: chunk.type,
      timestamp: chunk.timestamp,
      duration: chunk.duration ?? undefined
    }, this.videoTrackId)
  }

  addAudioChunk(chunk: EncodedAudioChunk): void {
    if (!this.muxer || this.audioTrackId === null) {
      throw new Error('Muxer not initialized')
    }

    const data = new Uint8Array(chunk.byteLength)
    chunk.copyTo(data)

    this.muxer.addAudioChunk(data, {
      type: chunk.type,
      timestamp: chunk.timestamp,
      duration: chunk.duration ?? undefined
    }, this.audioTrackId)
  }

  async finalize(): Promise<ArrayBuffer> {
    if (!this.muxer) {
      throw new Error('Muxer not initialized')
    }

    this.muxer.finalize()
    return (this.muxer.target as ArrayBufferTarget).buffer
  }

  reset(): void {
    this.muxer = null
    this.videoTrackId = null
    this.audioTrackId = null
  }
}