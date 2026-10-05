import type { ActorId, WorldSave } from './types'

export interface ActionResult {
  ok: boolean
  message: string
  changes?: Record<string, any>
}

export type ActionHandler = (
  data: Record<string, any>,
  actor: ActorId,
  body: any,
) => ActionResult

export const actWater: ActionHandler = (data, actor, body) => {
  const plots: number[] = body.plots ?? []
  if (!plots.length) return { ok: false, message: '未指定田地' }

  const farm = data.farm ?? {}
  const farmPlots: any[] = farm.plots ?? []
  let watered = 0
  const skipped: number[] = []

  for (const idx of plots) {
    const plot = farmPlots[idx]
    if (!plot) { skipped.push(idx); continue }
    if (plot.state !== 'planted' && plot.state !== 'growing') { skipped.push(idx); continue }
    if (plot.watered) { skipped.push(idx); continue }
    plot.watered = true
    plot.unwateredDays = 0
    watered++
  }

  logAction(data, actor, `澆了 ${watered} 格田`)
  return {
    ok: true,
    message: `${actorName(actor)}澆了 ${watered} 格${skipped.length ? `，${skipped.length} 格跳過` : ''}`,
    changes: { watered, skipped },
  }
}

export const actHarvest: ActionHandler = (data, actor, body) => {
  const plots: number[] = body.plots ?? []
  if (!plots.length) return { ok: false, message: '未指定田地' }

  const farm = data.farm ?? {}
  const farmPlots: any[] = farm.plots ?? []
  const inv = data.inventory ?? {}
  const items: any[] = inv.items ?? []
  let harvested = 0
  const yields: { cropId: string; plot: number }[] = []

  for (const idx of plots) {
    const plot = farmPlots[idx]
    if (!plot || plot.state !== 'harvestable') continue
    const cropId = plot.cropId
    if (!cropId) continue

    items.push({ id: cropId, count: 1, quality: plot.quality ?? 'normal' })
    plot.state = 'empty'
    plot.cropId = null
    plot.growthDays = 0
    plot.watered = false
    harvested++
    yields.push({ cropId, plot: idx })
  }

  inv.items = items
  data.inventory = inv
  logAction(data, actor, `收成了 ${harvested} 格作物`)
  return {
    ok: true,
    message: `${actorName(actor)}收成了 ${harvested} 格`,
    changes: { harvested, yields },
  }
}

export const actPlant: ActionHandler = (data, actor, body) => {
  const { plot: plotIdx, seedId } = body
  if (plotIdx == null || !seedId) return { ok: false, message: '缺少 plot 或 seedId' }

  const farm = data.farm ?? {}
  const farmPlots: any[] = farm.plots ?? []
  const plot = farmPlots[plotIdx]
  if (!plot) return { ok: false, message: `田地 ${plotIdx} 不存在` }
  if (plot.state !== 'tilled') return { ok: false, message: `田地 ${plotIdx} 狀態為 ${plot.state}，需要翻土` }

  const inv = data.inventory ?? {}
  const items: any[] = inv.items ?? []
  const seedIdx = items.findIndex((it: any) => it.id === seedId && (it.count ?? 1) > 0)
  if (seedIdx < 0) return { ok: false, message: `背包沒有 ${seedId}` }

  if (items[seedIdx].count > 1) {
    items[seedIdx].count--
  } else {
    items.splice(seedIdx, 1)
  }

  plot.state = 'planted'
  plot.cropId = seedId.replace(/_seed$/, '')
  plot.growthDays = 0
  plot.watered = false

  inv.items = items
  data.inventory = inv
  logAction(data, actor, `在第 ${plotIdx} 格種了 ${seedId}`)
  return {
    ok: true,
    message: `${actorName(actor)}在第 ${plotIdx} 格種了 ${seedId}`,
    changes: { plot: plotIdx, seedId },
  }
}

export const actFeedAnimals: ActionHandler = (data, actor) => {
  const animal = data.animal ?? {}
  const animals: any[] = animal.animals ?? []
  const inv = data.inventory ?? {}
  const items: any[] = inv.items ?? []
  let fed = 0
  let noFeed = 0

  const unfed = animals.filter((a: any) => !a.wasFed)
  for (const a of unfed) {
    const hayIdx = items.findIndex((it: any) => it.id === 'hay' && (it.count ?? 1) > 0)
    if (hayIdx >= 0) {
      if (items[hayIdx].count > 1) items[hayIdx].count--
      else items.splice(hayIdx, 1)
      a.wasFed = true
      a.hunger = 0
      fed++
    } else {
      noFeed++
    }
  }

  inv.items = items
  data.inventory = inv
  logAction(data, actor, `餵了 ${fed} 隻動物`)
  return {
    ok: true,
    message: `${actorName(actor)}餵了 ${fed} 隻${noFeed > 0 ? `，${noFeed} 隻缺飼料` : ''}`,
    changes: { fed, noFeed },
  }
}

export const actGift: ActionHandler = (data, actor, body) => {
  const { npcId, itemId } = body
  if (!npcId || !itemId) return { ok: false, message: '缺少 npcId 或 itemId' }

  const inv = data.inventory ?? {}
  const items: any[] = inv.items ?? []
  const itemIdx = items.findIndex((it: any) => it.id === itemId && (it.count ?? 1) > 0)
  if (itemIdx < 0) return { ok: false, message: `背包沒有 ${itemId}` }

  if (items[itemIdx].count > 1) items[itemIdx].count--
  else items.splice(itemIdx, 1)

  const npc = data.npc ?? {}
  const states: any[] = npc.npcStates ?? []
  const npcState = states.find((s: any) => s.npcId === npcId)
  if (!npcState) return { ok: false, message: `找不到 NPC ${npcId}` }

  npcState.friendship = (npcState.friendship ?? 0) + 10
  npcState.giftedToday = true

  inv.items = items
  data.inventory = inv
  logAction(data, actor, `送了 ${itemId} 給 ${npcId}`)
  return {
    ok: true,
    message: `${actorName(actor)}送了禮物給 ${npcId}`,
    changes: { npcId, itemId, friendship: npcState.friendship },
  }
}

const ACTOR_NAMES: Record<ActorId, string> = {
  han: '涵寶',
  cenxu: '岑序',
  shenyuan: '沉淵',
}

function actorName(actor: ActorId): string {
  return ACTOR_NAMES[actor] ?? actor
}

function logAction(data: Record<string, any>, actor: ActorId, action: string): void {
  const family = data.family ?? { spouses: ['cenxu', 'shenyuan'], actionLog: [] }
  const game = data.game ?? {}
  family.actionLog = family.actionLog ?? []
  family.actionLog.push({
    actor,
    action,
    day: game.day ?? 0,
    hour: game.hour ?? 0,
  })
  data.family = family
}

export const ACTION_HANDLERS: Record<string, ActionHandler> = {
  water: actWater,
  harvest: actHarvest,
  plant: actPlant,
  'feed-animals': actFeedAnimals,
  gift: actGift,
}
