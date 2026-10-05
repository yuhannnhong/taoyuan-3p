import { WorldDO } from './durable-object'
import { resolveActor } from './auth'
import type { Env, ApiResponse, ActorId } from './types'

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

    // --- Step 4: 存檔 CRUD（透傳到 Durable Object）---
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

    // --- Step 5 接口預留：唯讀 API ---
    // GET /world/summary
    // GET /world/farm
    // GET /world/inventory
    // GET /world/animals
    // 實作在 Step 5，會在 Worker 內載入 Pinia store 解析存檔後回傳結構化資料

    // --- Step 6 接口預留：動作 API ---
    // POST /act/water    { plots: [...] }
    // POST /act/harvest  { plots: [...] }
    // POST /act/plant    { plot, seedId }
    // POST /act/feed-animals
    // POST /act/gift     { npcId, itemId }
    // 實作在 Step 6，在 Worker 內用 Pinia store 執行遊戲邏輯後存回 DO

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
