import { describe, expect, it } from 'vitest'
import { downsampleToInt16 } from './pcm-capture'
import { parseAudioFrame } from './pcm-player'

describe('pcm-capture / pcm-player', () => {
  it('convierte Float32 16 kHz a Int16 PCM aplicando clamp seguro', () => {
    const input = new Float32Array([-1.5, -0.5, 0, 0.5, 1.5])
    const pcm = downsampleToInt16(input, 16000, 16000)

    expect(Array.from(pcm)).toEqual([-32768, -16384, 0, 16384, 32767])
  })

  it('remuestrea 48 kHz a 16 kHz reduciendo 3:1 las muestras', () => {
    const input = new Float32Array(480)
    for (let i = 0; i < input.length; i++) {
      input[i] = Math.sin((i / input.length) * Math.PI * 2) * 0.5
    }

    const pcm = downsampleToInt16(input, 48000, 16000)
    expect(pcm.length).toBe(160)
  })

  it('decodifica paquetes binarios [sellerId uint32 LE][Int16 PCM] y rechaza tramas inválidas', () => {
    const buffer = new ArrayBuffer(4 + 6)
    const view = new DataView(buffer)
    view.setUint32(0, 42, true)
    view.setInt16(4, 1200, true)
    view.setInt16(6, -3400, true)
    view.setInt16(8, 500, true)

    const parsed = parseAudioFrame(buffer)
    expect(parsed).not.toBeNull()
    expect(parsed!.sellerId).toBe(42)
    expect(Array.from(parsed!.pcm)).toEqual([1200, -3400, 500])

    expect(parseAudioFrame(new ArrayBuffer(3))).toBeNull()
    expect(parseAudioFrame(new ArrayBuffer(5))).toBeNull()
  })
})
