import type { ActorId, Env } from './types'

const TOKEN_MAP: Record<string, ActorId> = {}

export function resolveActor(env: Env, request: Request): ActorId | null {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)

  const map: Record<string, ActorId> = {
    [env.TOKEN_HAN]: 'han',
    [env.TOKEN_CENXU]: 'cenxu',
    [env.TOKEN_SHENYUAN]: 'shenyuan',
  }
  return map[token] ?? null
}
