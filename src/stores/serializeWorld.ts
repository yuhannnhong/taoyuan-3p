import { useGameStore } from './useGameStore'
import { usePlayerStore } from './usePlayerStore'
import { useInventoryStore } from './useInventoryStore'
import { useFarmStore } from './useFarmStore'
import { useSkillStore } from './useSkillStore'
import { useNpcStore } from './useNpcStore'
import { useMiningStore } from './useMiningStore'
import { useCookingStore } from './useCookingStore'
import { useProcessingStore } from './useProcessingStore'
import { useAchievementStore } from './useAchievementStore'
import { useAnimalStore } from './useAnimalStore'
import { useHomeStore } from './useHomeStore'
import { useFishingStore } from './useFishingStore'
import { useWalletStore } from './useWalletStore'
import { useQuestStore } from './useQuestStore'
import { useShopStore } from './useShopStore'
import { useWarehouseStore } from './useWarehouseStore'
import { useBreedingStore } from './useBreedingStore'
import { useMuseumStore } from './useMuseumStore'
import { useGuildStore } from './useGuildStore'
import { useSecretNoteStore } from './useSecretNoteStore'
import { useHanhaiStore } from './useHanhaiStore'
import { useFishPondStore } from './useFishPondStore'
import { useTutorialStore } from './useTutorialStore'
import { useHiddenNpcStore } from './useHiddenNpcStore'
import { useTradeStore } from './useTradeStore'
import { useFamilyStore } from './useFamilyStore'
import { useCheatsStore } from './useCheatsStore'

export interface StoreInstances {
  game: ReturnType<typeof useGameStore>
  player: ReturnType<typeof usePlayerStore>
  inventory: ReturnType<typeof useInventoryStore>
  farm: ReturnType<typeof useFarmStore>
  skill: ReturnType<typeof useSkillStore>
  npc: ReturnType<typeof useNpcStore>
  mining: ReturnType<typeof useMiningStore>
  cooking: ReturnType<typeof useCookingStore>
  processing: ReturnType<typeof useProcessingStore>
  achievement: ReturnType<typeof useAchievementStore>
  animal: ReturnType<typeof useAnimalStore>
  home: ReturnType<typeof useHomeStore>
  fishing: ReturnType<typeof useFishingStore>
  wallet: ReturnType<typeof useWalletStore>
  quest: ReturnType<typeof useQuestStore>
  shop: ReturnType<typeof useShopStore>
  warehouse: ReturnType<typeof useWarehouseStore>
  breeding: ReturnType<typeof useBreedingStore>
  museum: ReturnType<typeof useMuseumStore>
  guild: ReturnType<typeof useGuildStore>
  secretNote: ReturnType<typeof useSecretNoteStore>
  hanhai: ReturnType<typeof useHanhaiStore>
  fishPond: ReturnType<typeof useFishPondStore>
  tutorial: ReturnType<typeof useTutorialStore>
  hiddenNpc: ReturnType<typeof useHiddenNpcStore>
  trade: ReturnType<typeof useTradeStore>
  family: ReturnType<typeof useFamilyStore>
  cheats: ReturnType<typeof useCheatsStore>
}

export function getAllStores(): StoreInstances {
  return {
    game: useGameStore(),
    player: usePlayerStore(),
    inventory: useInventoryStore(),
    farm: useFarmStore(),
    skill: useSkillStore(),
    npc: useNpcStore(),
    mining: useMiningStore(),
    cooking: useCookingStore(),
    processing: useProcessingStore(),
    achievement: useAchievementStore(),
    animal: useAnimalStore(),
    home: useHomeStore(),
    fishing: useFishingStore(),
    wallet: useWalletStore(),
    quest: useQuestStore(),
    shop: useShopStore(),
    warehouse: useWarehouseStore(),
    breeding: useBreedingStore(),
    museum: useMuseumStore(),
    guild: useGuildStore(),
    secretNote: useSecretNoteStore(),
    hanhai: useHanhaiStore(),
    fishPond: useFishPondStore(),
    tutorial: useTutorialStore(),
    hiddenNpc: useHiddenNpcStore(),
    trade: useTradeStore(),
    family: useFamilyStore(),
    cheats: useCheatsStore(),
  }
}

export function serializeAll(stores: StoreInstances): Record<string, any> {
  return {
    game: stores.game.serialize(),
    player: stores.player.serialize(),
    inventory: stores.inventory.serialize(),
    farm: stores.farm.serialize(),
    skill: stores.skill.serialize(),
    npc: stores.npc.serialize(),
    mining: stores.mining.serialize(),
    cooking: stores.cooking.serialize(),
    processing: stores.processing.serialize(),
    achievement: stores.achievement.serialize(),
    animal: stores.animal.serialize(),
    home: stores.home.serialize(),
    fishing: stores.fishing.serialize(),
    wallet: stores.wallet.serialize(),
    quest: stores.quest.serialize(),
    shop: stores.shop.serialize(),
    warehouse: stores.warehouse.serialize(),
    breeding: stores.breeding.serialize(),
    museum: stores.museum.serialize(),
    guild: stores.guild.serialize(),
    secretNote: stores.secretNote.serialize(),
    hanhai: stores.hanhai.serialize(),
    fishPond: stores.fishPond.serialize(),
    tutorial: stores.tutorial.serialize(),
    hiddenNpc: stores.hiddenNpc.serialize(),
    trade: stores.trade.serialize(),
    family: stores.family.serialize(),
    cheats: stores.cheats.serialize(),
  }
}

export function deserializeAll(stores: StoreInstances, data: Record<string, any>): void {
  stores.game.deserialize(data.game)
  stores.player.deserialize(data.player)
  stores.inventory.deserialize(data.inventory)
  stores.farm.deserialize(data.farm)
  if (data.skill) stores.skill.deserialize(data.skill)
  if (data.npc) stores.npc.deserialize(data.npc)
  if (data.mining) stores.mining.deserialize(data.mining)
  if (data.cooking) stores.cooking.deserialize(data.cooking)
  if (data.processing) stores.processing.deserialize(data.processing)
  if (data.achievement) stores.achievement.deserialize(data.achievement)
  if (data.animal) stores.animal.deserialize(data.animal)
  if (data.home) stores.home.deserialize(data.home)
  if (data.fishing) stores.fishing.deserialize(data.fishing)
  if (data.wallet) stores.wallet.deserialize(data.wallet)
  if (data.quest) stores.quest.deserialize(data.quest)
  if (data.shop) stores.shop.deserialize(data.shop)
  if (data.warehouse) stores.warehouse.deserialize(data.warehouse)
  if (data.breeding) stores.breeding.deserialize(data.breeding)
  if (data.museum) stores.museum.deserialize(data.museum)
  if (data.guild) stores.guild.deserialize(data.guild)
  if (data.secretNote) stores.secretNote.deserialize(data.secretNote)
  if (data.hanhai) stores.hanhai.deserialize(data.hanhai)
  if (data.fishPond) stores.fishPond.deserialize(data.fishPond)
  if (data.tutorial) stores.tutorial.deserialize(data.tutorial)
  if (data.hiddenNpc) stores.hiddenNpc.deserialize(data.hiddenNpc)
  stores.trade.deserialize(data.trade)
  if (data.family) stores.family.deserialize(data.family)
  if (data.cheats) stores.cheats.deserialize(data.cheats)
}
