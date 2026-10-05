import { WorldDO } from './durable-object'
import { resolveActor } from './auth'
import { worldSummary, worldFarm, worldInventory, worldAnimals } from './read-api'
import type { Env, ApiResponse } from './types'

export { WorldDO }

const WORLD_ID = 'taoyuan-main'

function json(body: ApiResponse, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
  })
}

async function loadWorldData(env: Env): Promise<Record<string, any> | null> {
  const res = await forwardToDO(env, new Request(doUrl('/load'), { method: 'GET' }))
  const body = await res.json() as any
  return body.ok ? (body.world ?? null) : null
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return json({ ok: true, message: 'ok' })
    }

    const actor = resolveActor(env, request)
    if (!actor) {
      return json({ ok: false, message: '未授權' }, 401)
    }

    const url = new URL(request.url)
    const path = url.pathname

    // --- Step 4: 存檔 CRUD ---
    if (path === '/world' && request.method === 'GET') {
      return forwardToDO(env, new Request(doUrl('/load'), { method: 'GET' }))
    }

    if (path === '/world' && request.method === 'PUT') {
      const body = await request.json() as { version: number; data: Record<string, any> }
      return forwardToDO(env, new Request(doUrl('/save'), {
        method: 'PUT',
        body: JSON.stringify({ actor, version: body.version, data: body.data }),
      }))
    }

    // --- Step 5: 唯讀 API ---
    if (request.method === 'GET' && path.startsWith('/world/')) {
      const data = await loadWorldData(env)
      if (!data) {
        return json({ ok: false, message: '尚無存檔' }, 404)
      }

      const sub = path.slice('/world/'.length)
      switch (sub) {
        case 'summary':
          return json({ ok: true, message: '世界摘要', result: worldSummary(data, actor) })
        case 'farm':
          return json({ ok: true, message: '農場狀態', result: worldFarm(data) })
        case 'inventory':
          return json({ ok: true, message: '背包內容', result: worldInventory(data) })
        case 'animals':
          return json({ ok: true, message: '動物狀態', result: worldAnimals(data) })
        default:
          return json({ ok: false, message: `未知子路徑: ${sub}` }, 404)
      }
    }

    // --- Step 6 接口預留：動作 API ---
    // POST /act/water    { plots: [...] }
    // POST /act/harvest  { plots: [...] }
    // POST /act/plant    { plot, seedId }
    // POST /act/feed-animals
    // POST /act/gift     { npcId, itemId }

    return json({ ok: false, message: `未知路徑: ${path}` }, 404)
  },
}

function doUrl(path: string): string {
  return `https://do-internal${path}`
}

async function forwardToDO(env: Env, request: Request): Promise<Response> {
  const id = env.WORLD.idFromName(WORLD_ID)
  const stub = env.WORLD.get(id)
  return stub.fetch(request)
}
