import type { ActorId } from './types'

type WorldData = Record<string, any>

export function worldSummary(data: WorldData, actor: ActorId) {
  const game = data.game ?? {}
  const player = data.player ?? {}
  const family = data.family ?? {}
  const wallet = data.wallet ?? {}

  return {
    season: game.season,
    year: game.year,
    day: game.day,
    hour: game.hour,
    weather: game.weather,
    money: player.money,
    stamina: player.stamina,
    maxStamina: player.maxStamina,
    hp: player.hp,
    playerName: player.playerName,
    family: {
      spouses: family.spouses ?? [],
      todayActions: (family.actionLog ?? []).filter(
        (e: any) => e.day === game.day
      ),
    },
    wallet: {
      gold: wallet.gold ?? 0,
      silver: wallet.silver ?? 0,
    },
  }
}

export function worldFarm(data: WorldData) {
  const farm = data.farm ?? {}
  const plots: any[] = farm.plots ?? []

  return {
    plots: plots.map((p: any, i: number) => ({
      index: i,
      cropId: p.cropId ?? null,
      growthDay: p.growthDay ?? 0,
      watered: p.watered ?? false,
      quality: p.quality ?? null,
      harvestable: p.cropId
        ? p.growthDay >= (p.growDays ?? 999)
        : false,
      dead: p.dead ?? false,
    })),
    totalPlots: plots.length,
    wateredCount: plots.filter((p: any) => p.watered).length,
    plantedCount: plots.filter((p: any) => p.cropId).length,
  }
}

export function worldInventory(data: WorldData) {
  const inv = data.inventory ?? {}
  return {
    items: inv.items ?? [],
    capacity: inv.capacity ?? 36,
    usedSlots: (inv.items ?? []).length,
  }
}

export function worldAnimals(data: WorldData) {
  const animal = data.animal ?? {}
  const animals: any[] = animal.animals ?? []

  return {
    animals: animals.map((a: any) => ({
      id: a.id,
      type: a.type,
      name: a.name,
      happiness: a.happiness,
      fed: a.fed ?? false,
      product: a.product ?? null,
      daysOwned: a.daysOwned ?? 0,
    })),
    totalAnimals: animals.length,
    fedCount: animals.filter((a: any) => a.fed).length,
  }
}
