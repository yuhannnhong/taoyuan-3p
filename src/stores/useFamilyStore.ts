import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export type MemberId = 'han' | 'cenxu' | 'shenyuan'

export interface ActionLogEntry {
  actor: MemberId
  action: string
  day: number
  hour: number
}

export interface KissRecord {
  from: MemberId
  to: MemberId
  day: number
}

export const MEMBER_NAMES: Record<MemberId, string> = {
  han: '涵寶',
  cenxu: '岑序',
  shenyuan: '沉淵'
}

const ALLOWED_KISS_PAIRS = new Set([
  'han:cenxu', 'cenxu:han',
  'han:shenyuan', 'shenyuan:han',
])

export const useFamilyStore = defineStore('family', () => {
  const spouses = ref<MemberId[]>(['cenxu', 'shenyuan'])
  const actionLog = ref<ActionLogEntry[]>([])
  const kissLog = ref<KissRecord[]>([])

  const hasSpouses = computed(() => spouses.value.length > 0)

  const getSpouseName = (idx: number): string => {
    const id = spouses.value[idx]
    return id ? MEMBER_NAMES[id] : ''
  }

  const addAction = (actor: MemberId, action: string, day: number, hour: number) => {
    actionLog.value.push({ actor, action, day, hour })
  }

  const getTodayActions = (day: number): ActionLogEntry[] => {
    return actionLog.value.filter(e => e.day === day)
  }

  const clearDailyLog = () => {
    actionLog.value = []
    kissLog.value = []
  }

  function canKiss(from: MemberId, to: MemberId): { ok: boolean; reason?: string } {
    const pair = `${from}:${to}`
    if (!ALLOWED_KISS_PAIRS.has(pair)) {
      return { ok: false, reason: 'interaction_not_allowed' }
    }
    return { ok: true }
  }

  function hasKissedToday(from: MemberId, to: MemberId, day: number): boolean {
    return kissLog.value.some(k => k.from === from && k.to === to && k.day === day)
  }

  function recordKiss(from: MemberId, to: MemberId, day: number): void {
    kissLog.value.push({ from, to, day })
  }

  function getTodayKisses(day: number): KissRecord[] {
    return kissLog.value.filter(k => k.day === day)
  }

  const serialize = () => ({
    spouses: spouses.value,
    actionLog: actionLog.value,
    kissLog: kissLog.value,
  })

  const deserialize = (data: any) => {
    if (data.spouses) spouses.value = data.spouses
    actionLog.value = data.actionLog ?? []
    kissLog.value = data.kissLog ?? []
  }

  return {
    spouses,
    actionLog,
    kissLog,
    hasSpouses,
    getSpouseName,
    addAction,
    getTodayActions,
    clearDailyLog,
    canKiss,
    hasKissedToday,
    recordKiss,
    getTodayKisses,
    serialize,
    deserialize,
  }
})
