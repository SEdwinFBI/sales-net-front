export type CreatePatternPayload = {
  current_password: string
  /** Puntos de la cuadrícula (1–9); el servicio los convierte a índices 0–8. */
  patron: number[]
  /** Confirmación en la misma numeración 1–9. */
  confirmar_patron: number[]
}

export type PatternLoginCredentials = {
  username: string
  /** Puntos de la cuadrícula 1–9; el servicio envía índices 0–8. */
  patron: number[]
}
