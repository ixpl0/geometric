export interface VideoEncoderConfig {
  width: number
  height: number
  framerate: number
  bitrate: number
  codec: string
}

export interface AudioEncoderConfig {
  sampleRate: number
  numberOfChannels: number
  bitrate: number
  codec: string
}

export class VideoExporter {
  private videoEncoder: VideoEncoder | null = null
  private audioEncoder: AudioEncoder | null = null
  private videoFrames: EncodedVideoChunk[] = []
  private audioFrames: EncodedAudioChunk[] = []
  private isVideoEncoderReady = false
  private isAudioEncoderReady = false

  async initVideoEncoder(config: VideoEncoderConfig): Promise<void> {
    const videoEncoderConfig: VideoEncoderConfig = {
      codec: config.codec,
      width: config.width,
      height: config.height,
      bitrate: config.bitrate,
      framerate: config.framerate
    }

    this.videoEncoder = new VideoEncoder({
      output: (chunk: EncodedVideoChunk) => {
        this.videoFrames.push(chunk)
      },
      error: (error: Error) => {
        console.error('Video encoder error:', error)
      }
    })

    this.videoEncoder.configure(videoEncoderConfig)
    this.isVideoEncoderReady = true
  }

  async initAudioEncoder(config: AudioEncoderConfig): Promise<void> {
    const audioEncoderConfig: AudioEncoderConfig = {
      codec: config.codec,
      sampleRate: config.sampleRate,
      numberOfChannels: config.numberOfChannels,
      bitrate: config.bitrate
    }

    this.audioEncoder = new AudioEncoder({
      output: (chunk: EncodedAudioChunk) => {
        this.audioFrames.push(chunk)
      },
      error: (error: Error) => {
        console.error('Audio encoder error:', error)
      }
    })

    this.audioEncoder.configure(audioEncoderConfig)
    this.isAudioEncoderReady = true
  }

  async encodeVideoFrame(frame: VideoFrame): Promise<void> {
    if (!this.videoEncoder || !this.isVideoEncoderReady) {
      throw new Error('Video encoder not ready')
    }

    this.videoEncoder.encode(frame)
    frame.close()
  }

  async encodeAudioBuffer(buffer: AudioBuffer, timestamp: number): Promise<void> {
    if (!this.audioEncoder || !this.isAudioEncoderReady) {
      throw new Error('Audio encoder not ready')
    }

    const audioData = new AudioData({
      format: 'f32-planar',
      sampleRate: buffer.sampleRate,
      numberOfFrames: buffer.length,
      numberOfChannels: buffer.numberOfChannels,
      timestamp: timestamp * 1000000,
      data: this.audioBufferToFloat32Array(buffer)
    })

    this.audioEncoder.encode(audioData)
    audioData.close()
  }

  private audioBufferToFloat32Array(buffer: AudioBuffer): Float32Array {
    const channels = buffer.numberOfChannels
    const length = buffer.length
    const result = new Float32Array(length * channels)

    for (let channel = 0; channel < channels; channel++) {
      const channelData = buffer.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        result[i * channels + channel] = channelData[i]
      }
    }

    return result
  }

  async finishEncoding(): Promise<{ videoFrames: EncodedVideoChunk[], audioFrames: EncodedAudioChunk[] }> {
    if (this.videoEncoder) {
      await this.videoEncoder.flush()
      this.videoEncoder.close()
    }

    if (this.audioEncoder) {
      await this.audioEncoder.flush()
      this.audioEncoder.close()
    }

    return {
      videoFrames: [...this.videoFrames],
      audioFrames: [...this.audioFrames]
    }
  }

  reset(): void {
    this.videoFrames = []
    this.audioFrames = []
    this.isVideoEncoderReady = false
    this.isAudioEncoderReady = false
  }
}