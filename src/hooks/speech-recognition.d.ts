/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Type declarations for the Web Speech API (SpeechRecognition).
 *
 * The standard TypeScript lib.dom.d.ts does not include these interfaces
 * because they are vendor-prefixed (webkitSpeechRecognition) or still
 * in the "W3C Community Draft" stage. This file augments the global scope
 * with the subset we use for voice-to-text transcription.
 *
 * Spec: https://wicg.github.io/speech-api/
 */

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  grammars: SpeechGrammarList

  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onstart: (() => void) | null
  onend: (() => void) | null
  onspeechstart: (() => void) | null
  onspeechend: (() => void) | null
  onnomatch: (() => void) | null
  onaudiostart: (() => void) | null
  onaudioend: (() => void) | null
  onsoundstart: (() => void) | null
  onsoundend: (() => void) | null

  start(): void
  stop(): void
  abort(): void
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error:
    | 'no-speech'
    | 'aborted'
    | 'audio-capture'
    | 'network'
    | 'not-allowed'
    | 'service-not-allowed'
    | 'bad-grammar'
    | 'language-not-supported'
  readonly message: string
}

interface SpeechGrammar {
  src: string
  weight: number
}

interface SpeechGrammarList {
  readonly length: number
  item(index: number): SpeechGrammar
  [index: number]: SpeechGrammar
  addFromURI(src: string, weight?: number): void
  addFromString(string: string, weight?: number): void
}

interface SpeechGrammarListStatic {
  new (): SpeechGrammarList
}

interface Window {
  SpeechRecognition: SpeechRecognitionStatic | undefined
  webkitSpeechRecognition: SpeechRecognitionStatic | undefined
  SpeechGrammarList: SpeechGrammarListStatic | undefined
  webkitSpeechGrammarList: SpeechGrammarListStatic | undefined
}
