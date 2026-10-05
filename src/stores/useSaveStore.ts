import { ref } from 'vue'
import { defineStore } from 'pinia'
import CryptoJS from 'crypto-js'
import { saveAs } from 'file-saver'
import { SEASON_NAMES } from './useGameStore'
import { useSettingsStore } from './useSettingsStore'
import { getAllStores, serializeAll, deserializeAll } from './serializeWorld'

const SAVE_KEY_PREFIX = 'taoyuanxiang_save_'
const MAX_SLOTS = 3
const ENCRYPTION_KEY = 'taoyuanxiang_2024_secret'
const SAVE_FILE_EXT = '.tyx'
const LOCAL_WORLD_KEY = 'taoyuan_world_cache'

/** 加密 JSON 字符串 */
const encrypt = (json: string): string => {
  return CryptoJS.AES.encrypt(json, ENCRYPTION_KEY).toString()
}

/** 解密为 JSON 字符串，失败返回 null */
const decrypt = (cipher: string): string | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, ENCRYPTION_KEY)
    const result = bytes.toString(CryptoJS.enc.Utf8)
    return result || null
  } catch {
    return null
  }
}

/** 解密并解析存档数据 */
export const parseSaveData = (raw: string): Record<string, any> | null => {
  const decrypted = decrypt(raw)
  if (!decrypted) return null
  try {
    return JSON.parse(decrypted) as Record<string, any>
  } catch {
    return null
  }
}

export interface SaveSlotInfo {
  slot: number
  exists: boolean
  year?: number
  season?: string
  day?: number
  money?: number
  playerName?: string
  savedAt?: string
}

export interface WorldApiResult {
  ok: boolean
  message: string
  version?: number
  world?: Record<string, any> | null
}

export const useSaveStore = defineStore('save', () => {
  /** 当前活跃存档槽位（-1 表示未分配） */
  const activeSlot = ref(-1)

  /** 伺服器存檔版本（0 表示無遠端存檔） */
  const worldVersion = ref(0)

  /** API base URL，由前端設定 */
  const apiBase = ref('')

  /** 當前使用者的 Bearer token */
  const apiToken = ref('')

  // ─── localStorage 存檔（原有功能保留）───

  const getSlots = (): SaveSlotInfo[] => {
    const slots: SaveSlotInfo[] = []
    for (let i = 0; i < MAX_SLOTS; i++) {
      try {
        const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${i}`)
        if (raw) {
          const data = parseSaveData(raw)
          if (data) {
            slots.push({
              slot: i,
              exists: true,
              year: data.game?.year,
              season: data.game?.season,
              day: data.game?.day,
              money: data.player?.money,
              playerName: data.player?.playerName,
              savedAt: data.savedAt
            })
          } else {
            slots.push({ slot: i, exists: false })
          }
        } else {
          slots.push({ slot: i, exists: false })
        }
      } catch {
        slots.push({ slot: i, exists: false })
      }
    }
    return slots
  }

  const assignNewSlot = (): number => {
    const slots = getSlots()
    const empty = slots.find(s => !s.exists)
    const slot = empty ? empty.slot : -1
    activeSlot.value = slot
    return slot
  }

  const saveToSlot = (slot: number): boolean => {
    if (slot < 0 || slot >= MAX_SLOTS) return false
    try {
      const stores = getAllStores()
      const settingsStore = useSettingsStore()
      const data = {
        ...serializeAll(stores),
        settings: settingsStore.serialize(),
        savedAt: new Date().toISOString()
      }
      localStorage.setItem(`${SAVE_KEY_PREFIX}${slot}`, encrypt(JSON.stringify(data)))
      activeSlot.value = slot
      return true
    } catch {
      return false
    }
  }

  const autoSave = (): boolean => {
    if (activeSlot.value < 0) return false
    return saveToSlot(activeSlot.value)
  }

  const loadFromSlot = (slot: number): boolean => {
    try {
      const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${slot}`)
      if (!raw) return false
      const data = parseSaveData(raw)
      if (!data) return false

      const stores = getAllStores()
      const settingsStore = useSettingsStore()
      deserializeAll(stores, data)
      if (data.settings) settingsStore.deserialize(data.settings)

      activeSlot.value = slot
      return true
    } catch {
      return false
    }
  }

  const deleteSlot = (slot: number): boolean => {
    if (slot < 0 || slot >= MAX_SLOTS) return false
    localStorage.removeItem(`${SAVE_KEY_PREFIX}${slot}`)
    if (activeSlot.value === slot) activeSlot.value = -1
    return true
  }

  const exportSave = (slot: number): boolean => {
    try {
      const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${slot}`)
      if (!raw) return false
      const blob = new Blob([raw], { type: 'application/octet-stream' })
      const info = getSlots().find(s => s.slot === slot)
      const name = info?.exists
        ? `桃源乡_存档${slot + 1}_第${info.year}年${SEASON_NAMES[info.season as keyof typeof SEASON_NAMES] ?? info.season}第${info.day}天`
        : `桃源乡_存档${slot + 1}`
      saveAs(blob, `${name}${SAVE_FILE_EXT}`)
      return true
    } catch {
      return false
    }
  }

  const importSave = (slot: number, fileContent: string): boolean => {
    if (slot < 0 || slot >= MAX_SLOTS) return false
    try {
      const data = parseSaveData(fileContent)
      if (!data) return false
      localStorage.setItem(`${SAVE_KEY_PREFIX}${slot}`, fileContent)
      return true
    } catch {
      return false
    }
  }

  // ─── 遠端 API 存檔（Step 4 新增）───

  function configureApi(base: string, token: string) {
    apiBase.value = base.replace(/\/$/, '')
    apiToken.value = token
  }

  async function apiFetch(path: string, init?: RequestInit): Promise<any> {
    const res = await fetch(`${apiBase.value}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken.value}`,
        ...(init?.headers ?? {}),
      },
    })
    return res.json()
  }

  async function loadFromServer(): Promise<WorldApiResult> {
    const res = await apiFetch('/world')
    if (res.ok && res.world) {
      worldVersion.value = res.version
      const stores = getAllStores()
      deserializeAll(stores, res.world)
      try {
        localStorage.setItem(LOCAL_WORLD_KEY, JSON.stringify({
          version: res.version,
          data: res.world,
        }))
      } catch { /* 離線快取失敗不影響主流程 */ }
    }
    return res
  }

  async function saveToServer(): Promise<WorldApiResult> {
    const stores = getAllStores()
    const data = serializeAll(stores)
    const res = await apiFetch('/world', {
      method: 'PUT',
      body: JSON.stringify({
        version: worldVersion.value,
        data,
      }),
    })
    if (res.ok) {
      worldVersion.value = res.version
      try {
        localStorage.setItem(LOCAL_WORLD_KEY, JSON.stringify({
          version: res.version,
          data,
        }))
      } catch { /* */ }
    }
    return res
  }

  function loadFromLocalCache(): boolean {
    try {
      const raw = localStorage.getItem(LOCAL_WORLD_KEY)
      if (!raw) return false
      const cached = JSON.parse(raw)
      if (!cached?.data) return false
      worldVersion.value = cached.version ?? 0
      const stores = getAllStores()
      deserializeAll(stores, cached.data)
      return true
    } catch {
      return false
    }
  }

  return {
    activeSlot,
    worldVersion,
    apiBase,
    apiToken,
    getSlots,
    assignNewSlot,
    saveToSlot,
    autoSave,
    loadFromSlot,
    deleteSlot,
    exportSave,
    importSave,
    configureApi,
    loadFromServer,
    saveToServer,
    loadFromLocalCache,
  }
})
