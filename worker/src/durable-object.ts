import { ACTION_HANDLERS } from './act-api'
import type { ActorId, WorldSave } from './types'

export class WorldDO {
  private state: DurableObjectState

  constructor(state: DurableObjectState) {
    this.state = state
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    if (request.method === 'GET' && path === '/load') {
      return this.handleLoad()
    }
    if (request.method === 'PUT' && path === '/save') {
      return this.handleSave(request)
    }
    if (request.method === 'POST' && path === '/act') {
      return this.handleAct(request)
    }
    if (request.method === 'DELETE' && path === '/reset') {
      return this.handleReset()
    }

    return json({ ok: false, message: 'not found' }, 404)
  }

  private async handleLoad(): Promise<Response> {
    const save = await this.state.storage.get<WorldSave>('world')
    if (!save) {
      return json({ ok: true, message: '尚無存檔', version: 0, world: null })
    }
    return json({
      ok: true,
      message: '載入成功',
      version: save.version,
      world: save.data,
      lastActor: save.lastActor,
      updatedAt: save.updatedAt,
    })
  }

  private async handleSave(request: Request): Promise<Response> {
    const body = await request.json() as {
      actor: ActorId
      version: number
      data: Record<string, any>
    }

    const current = await this.state.storage.get<WorldSave>('world')
    const currentVersion = current?.version ?? 0

    if (body.version !== currentVersion) {
      return json({
        ok: false,
        message: `版本衝突：你的版本 ${body.version}，目前版本 ${currentVersion}。請重新載入。`,
        version: currentVersion,
        world: current?.data ?? null,
      }, 409)
    }

    const newSave: WorldSave = {
      version: currentVersion + 1,
      data: body.data,
      lastActor: body.actor,
      updatedAt: new Date().toISOString(),
    }

    await this.state.storage.put('world', newSave)

    return json({
      ok: true,
      message: '存檔成功',
      version: newSave.version,
    })
  }

  private async handleAct(request: Request): Promise<Response> {
    const body = await request.json() as {
      actor: ActorId
      action: string
      params: any
    }

    const handler = ACTION_HANDLERS[body.action]
    if (!handler) {
      return json({ ok: false, message: `未知動作: ${body.action}` }, 400)
    }

    const current = await this.state.storage.get<WorldSave>('world')
    if (!current) {
      return json({ ok: false, message: '尚無存檔，無法執行動作' }, 404)
    }

    const data = structuredClone(current.data)
    const result = handler(data, body.actor, body.params)

    if (!result.ok) {
      return json({ ok: false, message: result.message }, 400)
    }

    const newSave: WorldSave = {
      version: current.version + 1,
      data,
      lastActor: body.actor,
      updatedAt: new Date().toISOString(),
    }
    await this.state.storage.put('world', newSave)

    return json({
      ok: true,
      message: result.message,
      version: newSave.version,
      result: result.changes,
    })
  }

  private async handleReset(): Promise<Response> {
    await this.state.storage.delete('world')
    return json({ ok: true, message: '存檔已清除', version: 0 })
  }
}

function json(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
