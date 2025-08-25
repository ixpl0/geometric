import { PixiRenderer, type RenderConfig } from './renderer'
import { simulateWithFrames, type SimConfig } from '../core/simulation'

interface WorkerMessage {
  type: 'init' | 'render' | 'export'
  payload: InitPayload | RenderPayload | ExportPayload
}

interface InitPayload {
  canvas: OffscreenCanvas
  renderConfig: RenderConfig
}

interface RenderPayload {
  simConfig: SimConfig
}

interface ExportPayload {
  simConfig: SimConfig
  exportConfig: {
    codec: string
    bitrate: number
    framerate: number
  }
}

let renderer: PixiRenderer | null = null

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data

  try {
    switch (type) {
      case 'init': {
        const { canvas, renderConfig } = payload as InitPayload
        renderer = new PixiRenderer(canvas, renderConfig)
        await renderer.init(renderConfig)
        self.postMessage({ type: 'init', success: true })
        break
      }

      case 'render': {
        if (!renderer) {
          throw new Error('Renderer not initialized')
        }

        const { simConfig } = payload as RenderPayload
        const { frames } = simulateWithFrames(simConfig)
        
        for (let i = 0; i < frames.length; i++) {
          renderer.render(frames[i])
          
          if (i % 60 === 0) {
            self.postMessage({
              type: 'progress',
              frame: i,
              total: frames.length
            })
          }
        }

        self.postMessage({ type: 'render', success: true })
        break
      }

      case 'export': {
        if (!renderer) {
          throw new Error('Renderer not initialized')
        }

        const { simConfig, exportConfig } = payload as ExportPayload
        const { frames, events } = simulateWithFrames(simConfig)
        
        const videoFrames: VideoFrame[] = []

        for (let i = 0; i < frames.length; i++) {
          renderer.render(frames[i])
          
          const blob = await renderer.getBlob('image/png')
          if (blob) {
            const bitmap = await createImageBitmap(blob)
            const videoFrame = new VideoFrame(bitmap, {
              timestamp: (i / exportConfig.framerate) * 1000000
            })
            videoFrames.push(videoFrame)
            bitmap.close()
          }

          if (i % 10 === 0) {
            self.postMessage({
              type: 'export-progress',
              frame: i,
              total: frames.length
            })
          }
        }

        self.postMessage({
          type: 'export',
          success: true,
          videoFrames,
          events,
          config: exportConfig
        })
        break
      }
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}