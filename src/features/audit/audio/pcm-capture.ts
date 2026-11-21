export const TARGET_SAMPLE_RATE = 16000
export const PCM_FRAME_SAMPLES = 2048

const SPEAKING_LEVEL_THRESHOLD = 6
const SPEAKING_HANGOVER_MS = 1200

const WORKLET_PROCESSOR_SOURCE = `
class PcmCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input[0] && input[0].length > 0) {
      this.port.postMessage(new Float32Array(input[0]));
    }
    return true;
  }
}
registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
`

/** Remuestrea audio Float32 [-1, 1] desde `inputRate` a Int16 PCM mono de `targetRate` (16 kHz). */
export function downsampleToInt16(
  input: Float32Array,
  inputRate: number,
  targetRate: number = TARGET_SAMPLE_RATE,
): Int16Array {
  if (input.length === 0) return new Int16Array(0)

  if (!Number.isFinite(inputRate) || inputRate <= 0 || Math.abs(inputRate - targetRate) < 1) {
    const out = new Int16Array(input.length)
    for (let i = 0; i < input.length; i++) {
      const clamped = Math.max(-1, Math.min(1, input[i]))
      out[i] = clamped < 0 ? Math.round(clamped * 32768) : Math.round(clamped * 32767)
    }
    return out
  }

  const ratio = inputRate / targetRate
  const outputLength = Math.max(1, Math.floor(input.length / ratio))
  const out = new Int16Array(outputLength)

  for (let i = 0; i < outputLength; i++) {
    const srcPos = i * ratio
    const idx0 = Math.floor(srcPos)
    const idx1 = Math.min(idx0 + 1, input.length - 1)
    const frac = srcPos - idx0
    const sample = input[idx0] + (input[idx1] - input[idx0]) * frac
    const clamped = Math.max(-1, Math.min(1, sample))
    out[i] = clamped < 0 ? Math.round(clamped * 32768) : Math.round(clamped * 32767)
  }

  return out
}

function computeRmsLevel(samples: Float32Array): number {
  if (samples.length === 0) return 0
  let sumSq = 0
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i]
    sumSq += s * s
  }
  const rms = Math.sqrt(sumSq / samples.length)
  return Math.min(100, Math.round(rms * 350))
}

export type PcmCaptureController = {
  setStreaming: (enabled: boolean) => void
  resume: () => Promise<void>
  stop: () => Promise<void>
}

export async function createPcmCapture(
  stream: MediaStream,
  callbacks: {
    onChunk: (buffer: ArrayBuffer, level: number) => void
    onSpeakingChange?: (speaking: boolean) => void
  },
): Promise<PcmCaptureController> {
  const ctx = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE })
  if (ctx.state === 'suspended') {
    await ctx.resume().catch(() => {})
  }

  const source = ctx.createMediaStreamSource(stream)
  const silentSink = ctx.createGain()
  silentSink.gain.value = 0

  let streaming = false
  let stopped = false
  let speaking = false
  let lastSpeechAt = 0
  let accumulator = new Int16Array(PCM_FRAME_SAMPLES)
  let accOffset = 0
  let workletNode: AudioWorkletNode | null = null
  let scriptNode: ScriptProcessorNode | null = null
  let workletUrl: string | null = null

  const updateSpeaking = (level: number) => {
    const now = Date.now()
    if (level >= SPEAKING_LEVEL_THRESHOLD) {
      lastSpeechAt = now
      if (!speaking) {
        speaking = true
        callbacks.onSpeakingChange?.(true)
      }
      return
    }
    if (speaking && now - lastSpeechAt >= SPEAKING_HANGOVER_MS) {
      speaking = false
      callbacks.onSpeakingChange?.(false)
    }
  }

  const handleFloatSamples = (floatData: Float32Array) => {
    if (stopped) return
    const level = computeRmsLevel(floatData)
    updateSpeaking(level)

    if (!streaming) return

    const pcm = downsampleToInt16(floatData, ctx.sampleRate, TARGET_SAMPLE_RATE)
    let readOffset = 0
    while (readOffset < pcm.length) {
      const copyCount = Math.min(PCM_FRAME_SAMPLES - accOffset, pcm.length - readOffset)
      accumulator.set(pcm.subarray(readOffset, readOffset + copyCount), accOffset)
      accOffset += copyCount
      readOffset += copyCount

      if (accOffset === PCM_FRAME_SAMPLES) {
        const chunk = accumulator
        accumulator = new Int16Array(PCM_FRAME_SAMPLES)
        accOffset = 0
        callbacks.onChunk(chunk.buffer, level)
      }
    }
  }

  if (ctx.audioWorklet && typeof Blob !== 'undefined' && typeof URL.createObjectURL === 'function') {
    try {
      const blob = new Blob([WORKLET_PROCESSOR_SOURCE], { type: 'application/javascript' })
      workletUrl = URL.createObjectURL(blob)
      await ctx.audioWorklet.addModule(workletUrl)
      if (!stopped) {
        workletNode = new AudioWorkletNode(ctx, 'pcm-capture-processor')
        workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
          if (event.data) handleFloatSamples(event.data)
        }
        source.connect(workletNode)
        workletNode.connect(silentSink)
        silentSink.connect(ctx.destination)
      }
    } catch {
      if (workletUrl) {
        URL.revokeObjectURL(workletUrl)
        workletUrl = null
      }
      workletNode = null
    }
  }

  // Fallback para navegadores/entornos donde AudioWorklet falla o está restringido.
  if (!workletNode && !stopped) {
    scriptNode = ctx.createScriptProcessor(2048, 1, 1)
    scriptNode.onaudioprocess = (event) => {
      handleFloatSamples(event.inputBuffer.getChannelData(0))
    }
    source.connect(scriptNode)
    scriptNode.connect(silentSink)
    silentSink.connect(ctx.destination)
  }

  return {
    setStreaming: (enabled: boolean) => {
      streaming = enabled
      if (!enabled) {
        accOffset = 0
      } else if (ctx.state === 'suspended') {
        void ctx.resume().catch(() => {})
      }
    },
    resume: async () => {
      if (stopped) return
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {})
      }
    },
    stop: async () => {
      if (stopped) return
      stopped = true
      streaming = false
      if (speaking) {
        speaking = false
        callbacks.onSpeakingChange?.(false)
      }
      if (workletNode) {
        workletNode.port.onmessage = null
        workletNode.disconnect()
        workletNode = null
      }
      if (scriptNode) {
        scriptNode.onaudioprocess = null
        scriptNode.disconnect()
        scriptNode = null
      }
      source.disconnect()
      silentSink.disconnect()
      if (workletUrl) {
        URL.revokeObjectURL(workletUrl)
        workletUrl = null
      }
      stream.getTracks().forEach((track) => track.stop())
      await ctx.close().catch(() => {})
    },
  }
}
