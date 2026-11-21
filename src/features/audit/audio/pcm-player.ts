import { TARGET_SAMPLE_RATE } from './pcm-capture'

const INITIAL_JITTER_S = 0.16
const RESYNC_BUFFER_S = 0.12
const MAX_BUFFER_DRIFT_S = 0.6

export function parseAudioFrame(buffer: ArrayBuffer): { sellerId: number; pcm: Int16Array } | null {
  if (buffer.byteLength < 6 || (buffer.byteLength - 4) % 2 !== 0) {
    return null
  }
  const view = new DataView(buffer)
  const sellerId = view.getUint32(0, true)
  const sampleCount = (buffer.byteLength - 4) / 2
  const pcm = new Int16Array(sampleCount)
  for (let i = 0; i < sampleCount; i++) {
    pcm[i] = view.getInt16(4 + i * 2, true)
  }
  return { sellerId, pcm }
}

/** Reproductor Web Audio en vivo con buffer de jitter acotado y medidor VU. */
export class PcmAudioPlayer {
  private ctx: AudioContext | null = null
  private gainNode: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private freqData: Uint8Array<ArrayBuffer> | null = null
  private nextPlayTime = 0
  private volume = 1
  private muted = false

  async start(): Promise<void> {
    if (!this.ctx) {
      const ctx = new AudioContext()
      const gain = ctx.createGain()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.35

      gain.gain.value = this.muted ? 0 : this.volume
      gain.connect(analyser)
      analyser.connect(ctx.destination)

      this.ctx = ctx
      this.gainNode = gain
      this.analyser = analyser
      this.freqData = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount))
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume().catch(() => {})
    }
  }

  enqueue(pcm: Int16Array): void {
    const ctx = this.ctx
    const gain = this.gainNode
    if (!ctx || !gain || pcm.length === 0) return

    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {})
    }

    const floatSamples = new Float32Array(pcm.length)
    for (let i = 0; i < pcm.length; i++) {
      floatSamples[i] = pcm[i] / 32768
    }

    const audioBuffer = ctx.createBuffer(1, floatSamples.length, TARGET_SAMPLE_RATE)
    audioBuffer.copyToChannel(floatSamples, 0)

    const now = ctx.currentTime
    if (this.nextPlayTime === 0 || this.nextPlayTime < now - 0.05) {
      this.nextPlayTime = now + INITIAL_JITTER_S
    } else if (this.nextPlayTime - now > MAX_BUFFER_DRIFT_S) {
      // Descarta cola vieja si acumuló retraso de red para volver al directo.
      this.nextPlayTime = now + RESYNC_BUFFER_S
    }

    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(gain)
    source.start(this.nextPlayTime)
    this.nextPlayTime += audioBuffer.duration
  }

  setVolume(nextVolume: number): void {
    this.volume = Math.max(0, Math.min(1, nextVolume))
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime)
    }
  }

  setMuted(nextMuted: boolean): void {
    this.muted = nextMuted
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime)
    }
  }

  resetBuffer(): void {
    this.nextPlayTime = 0
  }

  getLevel(): number {
    if (!this.analyser || !this.freqData || !this.ctx || this.ctx.state !== 'running') {
      return 0
    }
    this.analyser.getByteFrequencyData(this.freqData)
    let sum = 0
    for (let i = 0; i < this.freqData.length; i++) {
      sum += this.freqData[i]
    }
    return Math.min(100, Math.round((sum / this.freqData.length / 180) * 100))
  }

  async stop(): Promise<void> {
    this.nextPlayTime = 0
    const ctx = this.ctx
    this.ctx = null
    this.gainNode = null
    this.analyser = null
    this.freqData = null
    if (ctx) {
      await ctx.close().catch(() => {})
    }
  }
}
