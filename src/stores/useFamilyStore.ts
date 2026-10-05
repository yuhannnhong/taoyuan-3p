import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export type MemberId = 'han' | 'cenxu' | 'shenyuan'

export interface ActionLogEntry {
  actor: MemberId
  action: string
  day: number
  hour: number
}

export const MEMBER_NAMES: Record<MemberId, string> = {
  han: '涵寶',
  cenxu: '岑序',
  shenyuan: '沉淵'
}

export const useFamilyStore = defineStore('family', () => {
  const spouses = ref<MemberId[]>(['cenxu', 'shenyuan'])
  const actionLog = ref<ActionLogEntry[]>([])

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
  }

  const serialize = () => ({
    spouses: spouses.value,
    actionLog: actionLog.value
  })

  const deserialize = (data: any) => {
    if (data.spouses) spouses.value = data.spouses
    actionLog.value = data.actionLog ?? []
  }

  return {
    spouses,
    actionLog,
    hasSpouses,
    getSpouseName,
    addAction,
    getTodayActions,
    clearDailyLog,
    serialize,
    deserialize
  }
})
