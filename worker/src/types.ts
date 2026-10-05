export type ActorId = 'han' | 'cenxu' | 'shenyuan'

export interface WorldSave {
  version: number
  data: Record<string, any>
  lastActor: ActorId
  updatedAt: string
}

export interface ApiResponse<T = any> {
  ok: boolean
  message: string
  version?: number
  result?: T
  world?: Record<string, any>
}

export interface Env {
  WORLD: DurableObjectNamespace
  TOKEN_HAN: string
  TOKEN_CENXU: string
  TOKEN_SHENYUAN: string
}
